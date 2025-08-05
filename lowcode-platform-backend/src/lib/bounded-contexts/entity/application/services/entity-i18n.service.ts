import { Injectable } from '@nestjs/common';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';

export interface I18nText {
  locale: string;
  text: string;
  isDefault?: boolean;
}

export interface EntityI18n {
  entityCode: string;
  locale: string;
  name: string;
  description?: string;
  displayName?: string;
  pluralName?: string;
  shortName?: string;
  keywords?: string[];
  category?: string;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface FieldI18n {
  entityCode: string;
  fieldCode: string;
  locale: string;
  name: string;
  description?: string;
  placeholder?: string;
  helpText?: string;
  errorMessage?: string;
  validationMessage?: string;
  options?: FieldOptionI18n[];
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface FieldOptionI18n {
  value: string;
  label: string;
  description?: string;
}

export interface I18nConfig {
  defaultLocale: string;
  supportedLocales: string[];
  fallbackLocale: string;
  autoTranslate: boolean;
  translationProvider?: 'google' | 'azure' | 'aws' | 'baidu';
  cacheEnabled: boolean;
  cacheTtl: number;
}

export interface TranslationRequest {
  sourceLocale: string;
  targetLocales: string[];
  texts: {
    key: string;
    text: string;
    context?: string;
  }[];
  entityCode?: string;
  fieldCode?: string;
}

export interface TranslationResult {
  requestId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sourceLocale: string;
  targetLocales: string[];
  translations: {
    locale: string;
    results: {
      key: string;
      originalText: string;
      translatedText: string;
      confidence: number;
    }[];
  }[];
  errors: {
    locale: string;
    key: string;
    error: string;
  }[];
  createdAt: Date;
  completedAt?: Date;
}

export interface I18nValidationResult {
  isValid: boolean;
  errors: {
    type: 'missing_translation' | 'invalid_locale' | 'duplicate_key' | 'inconsistent_placeholders';
    entityCode?: string;
    fieldCode?: string;
    locale: string;
    message: string;
  }[];
  warnings: {
    type: 'outdated_translation' | 'low_confidence' | 'missing_context';
    entityCode?: string;
    fieldCode?: string;
    locale: string;
    message: string;
  }[];
  coverage: {
    locale: string;
    entityCoverage: number;
    fieldCoverage: number;
    totalCoverage: number;
  }[];
}

export interface I18nExportData {
  format: 'json' | 'csv' | 'xlsx' | 'po' | 'xliff';
  locales: string[];
  entities: {
    entityCode: string;
    translations: Record<string, EntityI18n>;
    fields: {
      fieldCode: string;
      translations: Record<string, FieldI18n>;
    }[];
  }[];
  metadata: {
    exportedAt: Date;
    exportedBy: string;
    version: string;
    totalEntities: number;
    totalFields: number;
    totalTranslations: number;
  };
}

export interface I18nImportResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalTranslations: number;
  importedTranslations: number;
  updatedTranslations: number;
  skippedTranslations: number;
  errors: {
    row?: number;
    key: string;
    locale: string;
    error: string;
  }[];
  warnings: {
    row?: number;
    key: string;
    locale: string;
    message: string;
  }[];
  startTime: Date;
  endTime?: Date;
}

@Injectable()
export class EntityI18nService {
  private entityTranslations = new Map<string, Map<string, EntityI18n>>();
  private fieldTranslations = new Map<string, Map<string, FieldI18n>>();
  private translationJobs = new Map<string, TranslationResult>();
  private importJobs = new Map<string, I18nImportResult>();
  private config: I18nConfig = {
    defaultLocale: 'zh-CN',
    supportedLocales: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
    fallbackLocale: 'en-US',
    autoTranslate: false,
    cacheEnabled: true,
    cacheTtl: 3600000, // 1 hour
  };

  /**
   * 设置国际化配置
   */
  setConfig(config: Partial<I18nConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取国际化配置
   */
  getConfig(): I18nConfig {
    return { ...this.config };
  }

  /**
   * 创建或更新实体国际化
   */
  async setEntityI18n(
    entityCode: string,
    locale: string,
    data: Omit<EntityI18n, 'entityCode' | 'locale' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<EntityI18n> {
    if (!this.config.supportedLocales.includes(locale)) {
      throw new Error(`不支持的语言: ${locale}`);
    }

    const key = `${entityCode}:${locale}`;
    const existing = this.getEntityTranslations(entityCode).get(locale);
    
    const entityI18n: EntityI18n = {
      entityCode,
      locale,
      ...data,
      createdBy: existing ? existing.createdBy : createdBy,
      createdAt: existing ? existing.createdAt : new Date(),
      updatedBy: existing ? createdBy : undefined,
      updatedAt: existing ? new Date() : undefined,
    };

    if (!this.entityTranslations.has(entityCode)) {
      this.entityTranslations.set(entityCode, new Map());
    }
    
    this.entityTranslations.get(entityCode)!.set(locale, entityI18n);
    
    return entityI18n;
  }

  /**
   * 创建或更新字段国际化
   */
  async setFieldI18n(
    entityCode: string,
    fieldCode: string,
    locale: string,
    data: Omit<FieldI18n, 'entityCode' | 'fieldCode' | 'locale' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<FieldI18n> {
    if (!this.config.supportedLocales.includes(locale)) {
      throw new Error(`不支持的语言: ${locale}`);
    }

    const key = `${entityCode}:${fieldCode}:${locale}`;
    const existing = this.getFieldTranslations(entityCode, fieldCode).get(locale);
    
    const fieldI18n: FieldI18n = {
      entityCode,
      fieldCode,
      locale,
      ...data,
      createdBy: existing ? existing.createdBy : createdBy,
      createdAt: existing ? existing.createdAt : new Date(),
      updatedBy: existing ? createdBy : undefined,
      updatedAt: existing ? new Date() : undefined,
    };

    const entityKey = `${entityCode}:${fieldCode}`;
    if (!this.fieldTranslations.has(entityKey)) {
      this.fieldTranslations.set(entityKey, new Map());
    }
    
    this.fieldTranslations.get(entityKey)!.set(locale, fieldI18n);
    
    return fieldI18n;
  }

  /**
   * 获取实体国际化
   */
  getEntityI18n(entityCode: string, locale?: string): EntityI18n | EntityI18n[] | null {
    const translations = this.getEntityTranslations(entityCode);
    
    if (locale) {
      return translations.get(locale) || 
             translations.get(this.config.fallbackLocale) || 
             translations.get(this.config.defaultLocale) || 
             null;
    }
    
    return Array.from(translations.values());
  }

  /**
   * 获取字段国际化
   */
  getFieldI18n(entityCode: string, fieldCode: string, locale?: string): FieldI18n | FieldI18n[] | null {
    const translations = this.getFieldTranslations(entityCode, fieldCode);
    
    if (locale) {
      return translations.get(locale) || 
             translations.get(this.config.fallbackLocale) || 
             translations.get(this.config.defaultLocale) || 
             null;
    }
    
    return Array.from(translations.values());
  }

  /**
   * 删除实体国际化
   */
  deleteEntityI18n(entityCode: string, locale?: string): boolean {
    const translations = this.getEntityTranslations(entityCode);
    
    if (locale) {
      return translations.delete(locale);
    } else {
      this.entityTranslations.delete(entityCode);
      return true;
    }
  }

  /**
   * 删除字段国际化
   */
  deleteFieldI18n(entityCode: string, fieldCode: string, locale?: string): boolean {
    const entityKey = `${entityCode}:${fieldCode}`;
    const translations = this.fieldTranslations.get(entityKey);
    
    if (!translations) return false;
    
    if (locale) {
      return translations.delete(locale);
    } else {
      this.fieldTranslations.delete(entityKey);
      return true;
    }
  }

  /**
   * 批量设置实体国际化
   */
  async batchSetEntityI18n(
    entityCode: string,
    translations: {
      locale: string;
      data: Omit<EntityI18n, 'entityCode' | 'locale' | 'createdAt' | 'updatedAt'>;
    }[],
    createdBy: string
  ): Promise<EntityI18n[]> {
    const results: EntityI18n[] = [];
    
    for (const translation of translations) {
      const result = await this.setEntityI18n(
        entityCode,
        translation.locale,
        translation.data,
        createdBy
      );
      results.push(result);
    }
    
    return results;
  }

  /**
   * 批量设置字段国际化
   */
  async batchSetFieldI18n(
    entityCode: string,
    fieldCode: string,
    translations: {
      locale: string;
      data: Omit<FieldI18n, 'entityCode' | 'fieldCode' | 'locale' | 'createdAt' | 'updatedAt'>;
    }[],
    createdBy: string
  ): Promise<FieldI18n[]> {
    const results: FieldI18n[] = [];
    
    for (const translation of translations) {
      const result = await this.setFieldI18n(
        entityCode,
        fieldCode,
        translation.locale,
        translation.data,
        createdBy
      );
      results.push(result);
    }
    
    return results;
  }

  /**
   * 自动翻译实体
   */
  async autoTranslateEntity(
    entityCode: string,
    sourceLocale: string,
    targetLocales: string[],
    createdBy: string
  ): Promise<TranslationResult> {
    const sourceTranslation = this.getEntityI18n(entityCode, sourceLocale) as EntityI18n;
    
    if (!sourceTranslation) {
      throw new Error(`未找到实体 ${entityCode} 的 ${sourceLocale} 翻译`);
    }

    const request: TranslationRequest = {
      sourceLocale,
      targetLocales,
      texts: [
        { key: 'name', text: sourceTranslation.name },
        { key: 'description', text: sourceTranslation.description || '' },
        { key: 'displayName', text: sourceTranslation.displayName || '' },
        { key: 'pluralName', text: sourceTranslation.pluralName || '' },
        { key: 'shortName', text: sourceTranslation.shortName || '' },
      ].filter(item => item.text),
      entityCode,
    };

    return this.translateTexts(request, createdBy);
  }

  /**
   * 自动翻译字段
   */
  async autoTranslateField(
    entityCode: string,
    fieldCode: string,
    sourceLocale: string,
    targetLocales: string[],
    createdBy: string
  ): Promise<TranslationResult> {
    const sourceTranslation = this.getFieldI18n(entityCode, fieldCode, sourceLocale) as FieldI18n;
    
    if (!sourceTranslation) {
      throw new Error(`未找到字段 ${entityCode}.${fieldCode} 的 ${sourceLocale} 翻译`);
    }

    const request: TranslationRequest = {
      sourceLocale,
      targetLocales,
      texts: [
        { key: 'name', text: sourceTranslation.name },
        { key: 'description', text: sourceTranslation.description || '' },
        { key: 'placeholder', text: sourceTranslation.placeholder || '' },
        { key: 'helpText', text: sourceTranslation.helpText || '' },
        { key: 'errorMessage', text: sourceTranslation.errorMessage || '' },
        { key: 'validationMessage', text: sourceTranslation.validationMessage || '' },
      ].filter(item => item.text),
      entityCode,
      fieldCode,
    };

    return this.translateTexts(request, createdBy);
  }

  /**
   * 翻译文本
   */
  async translateTexts(request: TranslationRequest, createdBy: string): Promise<TranslationResult> {
    const jobId = this.generateJobId('translate');
    
    const result: TranslationResult = {
      requestId: jobId,
      status: 'pending',
      sourceLocale: request.sourceLocale,
      targetLocales: request.targetLocales,
      translations: [],
      errors: [],
      createdAt: new Date(),
    };
    
    this.translationJobs.set(jobId, result);
    
    // 模拟异步翻译处理
    setTimeout(async () => {
      try {
        result.status = 'processing';
        
        for (const targetLocale of request.targetLocales) {
          const localeResults: TranslationResult['translations'][0] = {
            locale: targetLocale,
            results: [],
          };
          
          for (const text of request.texts) {
            try {
              const translatedText = await this.performTranslation(
                text.text,
                request.sourceLocale,
                targetLocale
              );
              
              localeResults.results.push({
                key: text.key,
                originalText: text.text,
                translatedText,
                confidence: 0.85, // 模拟置信度
              });
            } catch (error) {
              result.errors.push({
                locale: targetLocale,
                key: text.key,
                error: error.message,
              });
            }
          }
          
          result.translations.push(localeResults);
        }
        
        result.status = 'completed';
        result.completedAt = new Date();
      } catch (error) {
        result.status = 'failed';
        result.errors.push({
          locale: 'all',
          key: 'general',
          error: error.message,
        });
      }
    }, 1000);
    
    return result;
  }

  /**
   * 获取翻译任务状态
   */
  getTranslationStatus(jobId: string): TranslationResult | null {
    return this.translationJobs.get(jobId) || null;
  }

  /**
   * 验证国际化完整性
   */
  validateI18nCompleteness(entityCodes?: string[]): I18nValidationResult {
    const errors: I18nValidationResult['errors'] = [];
    const warnings: I18nValidationResult['warnings'] = [];
    const coverage: I18nValidationResult['coverage'] = [];
    
    const entitiesToCheck = entityCodes || Array.from(this.entityTranslations.keys());
    
    // 计算每个语言的覆盖率
    for (const locale of this.config.supportedLocales) {
      let entityCount = 0;
      let entityTranslatedCount = 0;
      let fieldCount = 0;
      let fieldTranslatedCount = 0;
      
      for (const entityCode of entitiesToCheck) {
        entityCount++;
        
        const entityTranslation = this.getEntityI18n(entityCode, locale) as EntityI18n;
        if (entityTranslation) {
          entityTranslatedCount++;
        } else {
          errors.push({
            type: 'missing_translation',
            entityCode,
            locale,
            message: `实体 ${entityCode} 缺少 ${locale} 翻译`,
          });
        }
        
        // 检查字段翻译
        const entityFields = this.getEntityFields(entityCode);
        for (const fieldCode of entityFields) {
          fieldCount++;
          
          const fieldTranslation = this.getFieldI18n(entityCode, fieldCode, locale) as FieldI18n;
          if (fieldTranslation) {
            fieldTranslatedCount++;
          } else {
            errors.push({
              type: 'missing_translation',
              entityCode,
              fieldCode,
              locale,
              message: `字段 ${entityCode}.${fieldCode} 缺少 ${locale} 翻译`,
            });
          }
        }
      }
      
      const entityCoverage = entityCount > 0 ? (entityTranslatedCount / entityCount) * 100 : 100;
      const fieldCoverage = fieldCount > 0 ? (fieldTranslatedCount / fieldCount) * 100 : 100;
      const totalCoverage = (entityCoverage + fieldCoverage) / 2;
      
      coverage.push({
        locale,
        entityCoverage,
        fieldCoverage,
        totalCoverage,
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      coverage,
    };
  }

  /**
   * 导出国际化数据
   */
  exportI18nData(
    format: I18nExportData['format'],
    locales?: string[],
    entityCodes?: string[],
    exportedBy: string = 'system'
  ): I18nExportData {
    const targetLocales = locales || this.config.supportedLocales;
    const targetEntities = entityCodes || Array.from(this.entityTranslations.keys());
    
    const entities: I18nExportData['entities'] = [];
    let totalTranslations = 0;
    
    for (const entityCode of targetEntities) {
      const entityTranslations: Record<string, EntityI18n> = {};
      const fields: I18nExportData['entities'][0]['fields'] = [];
      
      // 导出实体翻译
      for (const locale of targetLocales) {
        const translation = this.getEntityI18n(entityCode, locale) as EntityI18n;
        if (translation) {
          entityTranslations[locale] = translation;
          totalTranslations++;
        }
      }
      
      // 导出字段翻译
      const entityFields = this.getEntityFields(entityCode);
      for (const fieldCode of entityFields) {
        const fieldTranslations: Record<string, FieldI18n> = {};
        
        for (const locale of targetLocales) {
          const translation = this.getFieldI18n(entityCode, fieldCode, locale) as FieldI18n;
          if (translation) {
            fieldTranslations[locale] = translation;
            totalTranslations++;
          }
        }
        
        if (Object.keys(fieldTranslations).length > 0) {
          fields.push({
            fieldCode,
            translations: fieldTranslations,
          });
        }
      }
      
      entities.push({
        entityCode,
        translations: entityTranslations,
        fields,
      });
    }
    
    return {
      format,
      locales: targetLocales,
      entities,
      metadata: {
        exportedAt: new Date(),
        exportedBy,
        version: '1.0.0',
        totalEntities: targetEntities.length,
        totalFields: entities.reduce((sum, entity) => sum + entity.fields.length, 0),
        totalTranslations,
      },
    };
  }

  /**
   * 导入国际化数据
   */
  async importI18nData(
    data: I18nExportData,
    options: {
      overwrite?: boolean;
      validateBeforeImport?: boolean;
      skipErrors?: boolean;
    } = {},
    importedBy: string
  ): Promise<I18nImportResult> {
    const jobId = this.generateJobId('import');
    
    const result: I18nImportResult = {
      jobId,
      status: 'pending',
      totalTranslations: 0,
      importedTranslations: 0,
      updatedTranslations: 0,
      skippedTranslations: 0,
      errors: [],
      warnings: [],
      startTime: new Date(),
    };
    
    this.importJobs.set(jobId, result);
    
    try {
      result.status = 'processing';
      
      // 计算总翻译数
      for (const entity of data.entities) {
        result.totalTranslations += Object.keys(entity.translations).length;
        for (const field of entity.fields) {
          result.totalTranslations += Object.keys(field.translations).length;
        }
      }
      
      // 导入实体翻译
      for (const entity of data.entities) {
        for (const [locale, translation] of Object.entries(entity.translations)) {
          try {
            const existing = this.getEntityI18n(entity.entityCode, locale) as EntityI18n;
            
            if (existing && !options.overwrite) {
              result.skippedTranslations++;
              result.warnings.push({
                key: `${entity.entityCode}:${locale}`,
                locale,
                message: `实体翻译已存在，跳过导入`,
              });
              continue;
            }
            
            await this.setEntityI18n(
              entity.entityCode,
              locale,
              {
                name: translation.name,
                description: translation.description,
                displayName: translation.displayName,
                pluralName: translation.pluralName,
                shortName: translation.shortName,
                keywords: translation.keywords,
                category: translation.category,
                createdBy: translation.createdBy,
              },
              importedBy
            );
            
            if (existing) {
              result.updatedTranslations++;
            } else {
              result.importedTranslations++;
            }
          } catch (error) {
            result.errors.push({
              key: `${entity.entityCode}:${locale}`,
              locale,
              error: error.message,
            });
            
            if (!options.skipErrors) {
              throw error;
            }
          }
        }
        
        // 导入字段翻译
        for (const field of entity.fields) {
          for (const [locale, translation] of Object.entries(field.translations)) {
            try {
              const existing = this.getFieldI18n(entity.entityCode, field.fieldCode, locale) as FieldI18n;
              
              if (existing && !options.overwrite) {
                result.skippedTranslations++;
                result.warnings.push({
                  key: `${entity.entityCode}:${field.fieldCode}:${locale}`,
                  locale,
                  message: `字段翻译已存在，跳过导入`,
                });
                continue;
              }
              
              await this.setFieldI18n(
                entity.entityCode,
                field.fieldCode,
                locale,
                {
                  name: translation.name,
                  description: translation.description,
                  placeholder: translation.placeholder,
                  helpText: translation.helpText,
                  errorMessage: translation.errorMessage,
                  validationMessage: translation.validationMessage,
                  options: translation.options,
                  createdBy: translation.createdBy,
                },
                importedBy
              );
              
              if (existing) {
                result.updatedTranslations++;
              } else {
                result.importedTranslations++;
              }
            } catch (error) {
              result.errors.push({
                key: `${entity.entityCode}:${field.fieldCode}:${locale}`,
                locale,
                error: error.message,
              });
              
              if (!options.skipErrors) {
                throw error;
              }
            }
          }
        }
      }
      
      result.status = 'completed';
    } catch (error) {
      result.status = 'failed';
      result.errors.push({
        key: 'general',
        locale: 'all',
        error: error.message,
      });
    } finally {
      result.endTime = new Date();
    }
    
    return result;
  }

  /**
   * 获取导入任务状态
   */
  getImportStatus(jobId: string): I18nImportResult | null {
    return this.importJobs.get(jobId) || null;
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLocales(): string[] {
    return [...this.config.supportedLocales];
  }

  /**
   * 添加支持的语言
   */
  addSupportedLocale(locale: string): void {
    if (!this.config.supportedLocales.includes(locale)) {
      this.config.supportedLocales.push(locale);
    }
  }

  /**
   * 移除支持的语言
   */
  removeSupportedLocale(locale: string): boolean {
    if (locale === this.config.defaultLocale || locale === this.config.fallbackLocale) {
      throw new Error(`不能移除默认语言或回退语言: ${locale}`);
    }
    
    const index = this.config.supportedLocales.indexOf(locale);
    if (index > -1) {
      this.config.supportedLocales.splice(index, 1);
      
      // 清理该语言的所有翻译
      this.cleanupLocaleTranslations(locale);
      
      return true;
    }
    
    return false;
  }

  /**
   * 获取翻译统计信息
   */
  getTranslationStatistics(entityCode?: string): {
    totalEntities: number;
    totalFields: number;
    translationsByLocale: {
      locale: string;
      entityTranslations: number;
      fieldTranslations: number;
      totalTranslations: number;
      coverage: number;
    }[];
    overallCoverage: number;
  } {
    const entities = entityCode ? [entityCode] : Array.from(this.entityTranslations.keys());
    const totalEntities = entities.length;
    let totalFields = 0;
    
    // 计算总字段数
    for (const entity of entities) {
      totalFields += this.getEntityFields(entity).length;
    }
    
    const translationsByLocale = this.config.supportedLocales.map(locale => {
      let entityTranslations = 0;
      let fieldTranslations = 0;
      
      for (const entity of entities) {
        if (this.getEntityI18n(entity, locale)) {
          entityTranslations++;
        }
        
        const fields = this.getEntityFields(entity);
        for (const fieldCode of fields) {
          if (this.getFieldI18n(entity, fieldCode, locale)) {
            fieldTranslations++;
          }
        }
      }
      
      const totalTranslations = entityTranslations + fieldTranslations;
      const maxPossibleTranslations = totalEntities + totalFields;
      const coverage = maxPossibleTranslations > 0 ? (totalTranslations / maxPossibleTranslations) * 100 : 100;
      
      return {
        locale,
        entityTranslations,
        fieldTranslations,
        totalTranslations,
        coverage,
      };
    });
    
    const overallCoverage = translationsByLocale.reduce((sum, item) => sum + item.coverage, 0) / translationsByLocale.length;
    
    return {
      totalEntities,
      totalFields,
      translationsByLocale,
      overallCoverage,
    };
  }

  /**
   * 清理过期的翻译任务
   */
  cleanupExpiredJobs(olderThanHours: number = 24): {
    deletedTranslationJobs: number;
    deletedImportJobs: number;
  } {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);
    
    let deletedTranslationJobs = 0;
    let deletedImportJobs = 0;
    
    // 清理翻译任务
    for (const [jobId, job] of this.translationJobs) {
      if (job.createdAt < cutoffTime && (job.status === 'completed' || job.status === 'failed')) {
        this.translationJobs.delete(jobId);
        deletedTranslationJobs++;
      }
    }
    
    // 清理导入任务
    for (const [jobId, job] of this.importJobs) {
      if (job.startTime < cutoffTime && (job.status === 'completed' || job.status === 'failed')) {
        this.importJobs.delete(jobId);
        deletedImportJobs++;
      }
    }
    
    return { deletedTranslationJobs, deletedImportJobs };
  }

  /**
   * 获取实体翻译映射
   */
  private getEntityTranslations(entityCode: string): Map<string, EntityI18n> {
    if (!this.entityTranslations.has(entityCode)) {
      this.entityTranslations.set(entityCode, new Map());
    }
    return this.entityTranslations.get(entityCode)!;
  }

  /**
   * 获取字段翻译映射
   */
  private getFieldTranslations(entityCode: string, fieldCode: string): Map<string, FieldI18n> {
    const key = `${entityCode}:${fieldCode}`;
    if (!this.fieldTranslations.has(key)) {
      this.fieldTranslations.set(key, new Map());
    }
    return this.fieldTranslations.get(key)!;
  }

  /**
   * 执行翻译
   */
  private async performTranslation(
    text: string,
    sourceLocale: string,
    targetLocale: string
  ): Promise<string> {
    // 这里应该调用实际的翻译服务
    // 目前返回模拟翻译结果
    if (targetLocale === 'en-US') {
      return `[EN] ${text}`;
    } else if (targetLocale === 'ja-JP') {
      return `[JP] ${text}`;
    } else if (targetLocale === 'ko-KR') {
      return `[KR] ${text}`;
    }
    
    return text;
  }

  /**
   * 获取实体字段列表
   */
  private getEntityFields(entityCode: string): string[] {
    // 这里应该从实际的实体服务获取字段列表
    // 目前返回模拟数据
    return ['id', 'name', 'description', 'createdAt', 'updatedAt'];
  }

  /**
   * 清理语言翻译
   */
  private cleanupLocaleTranslations(locale: string): void {
    // 清理实体翻译
    for (const translations of this.entityTranslations.values()) {
      translations.delete(locale);
    }
    
    // 清理字段翻译
    for (const translations of this.fieldTranslations.values()) {
      translations.delete(locale);
    }
  }

  /**
   * 生成任务ID
   */
  private generateJobId(type: 'translate' | 'import'): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}