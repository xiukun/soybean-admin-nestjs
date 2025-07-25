/*
 * @Description: Biz层代码保护服务
 * @Autor: henry.xiukun
 * @Date: 2025-07-25 22:45:00
 * @LastEditors: henry.xiukun
 */

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface CodeProtectionConfig {
  preserveCustomCode: boolean;
  enableSmartMerge: boolean;
  backupBeforeOverwrite: boolean;
  customCodeMarkers: {
    start: string;
    end: string;
  };
  protectedSections: string[];
}

export interface CodeMergeResult {
  success: boolean;
  merged: boolean;
  conflicts: CodeConflict[];
  warnings: string[];
  finalContent: string;
  backupPath?: string;
}

export interface CodeConflict {
  type: 'method' | 'property' | 'import' | 'custom';
  section: string;
  baseContent: string;
  bizContent: string;
  resolution: 'keep_biz' | 'use_base' | 'manual_merge' | 'skip';
  line: number;
}

export interface CustomCodeSection {
  name: string;
  startLine: number;
  endLine: number;
  content: string;
  protected: boolean;
}

@Injectable()
export class BizCodeProtectionService {
  private readonly logger = new Logger(BizCodeProtectionService.name);

  private readonly defaultConfig: CodeProtectionConfig = {
    preserveCustomCode: true,
    enableSmartMerge: true,
    backupBeforeOverwrite: true,
    customCodeMarkers: {
      start: '// CUSTOM_CODE_START',
      end: '// CUSTOM_CODE_END',
    },
    protectedSections: [
      'constructor',
      'custom methods',
      'private methods',
      'protected methods',
    ],
  };

  /**
   * 检查Biz文件是否需要保护
   */
  async shouldProtectBizFile(
    filePath: string,
    config: CodeProtectionConfig = this.defaultConfig,
  ): Promise<boolean> {
    try {
      if (!await fs.pathExists(filePath)) {
        return false; // 文件不存在，无需保护
      }

      if (!config.preserveCustomCode) {
        return false; // 配置为不保护自定义代码
      }

      // 检查文件是否包含自定义代码
      const content = await fs.readFile(filePath, 'utf8');
      return this.hasCustomCode(content, config);

    } catch (error) {
      this.logger.error(`检查文件保护状态失败: ${error.message}`);
      return true; // 出错时默认保护
    }
  }

  /**
   * 智能合并Base和Biz代码
   */
  async mergeCode(
    baseContent: string,
    bizFilePath: string,
    config: CodeProtectionConfig = this.defaultConfig,
  ): Promise<CodeMergeResult> {
    const result: CodeMergeResult = {
      success: false,
      merged: false,
      conflicts: [],
      warnings: [],
      finalContent: baseContent,
    };

    try {
      // 检查Biz文件是否存在
      if (!await fs.pathExists(bizFilePath)) {
        result.success = true;
        result.finalContent = baseContent;
        return result;
      }

      // 读取现有Biz文件内容
      const bizContent = await fs.readFile(bizFilePath, 'utf8');

      // 创建备份
      if (config.backupBeforeOverwrite) {
        result.backupPath = await this.createBackup(bizFilePath);
      }

      // 提取自定义代码区域
      const customSections = this.extractCustomSections(bizContent, config);

      if (customSections.length === 0) {
        // 没有自定义代码，直接使用Base内容
        result.success = true;
        result.finalContent = baseContent;
        return result;
      }

      // 执行智能合并
      if (config.enableSmartMerge) {
        const mergeResult = await this.performSmartMerge(
          baseContent,
          bizContent,
          customSections,
          config,
        );
        
        result.success = mergeResult.success;
        result.merged = true;
        result.conflicts = mergeResult.conflicts;
        result.warnings = mergeResult.warnings;
        result.finalContent = mergeResult.content;
      } else {
        // 简单保护：保留原Biz文件
        result.success = true;
        result.finalContent = bizContent;
        result.warnings.push('智能合并已禁用，保留原Biz文件内容');
      }

    } catch (error) {
      this.logger.error(`代码合并失败: ${error.message}`);
      result.success = false;
      result.warnings.push(`合并失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 检查代码是否包含自定义内容
   */
  private hasCustomCode(content: string, config: CodeProtectionConfig): boolean {
    // 检查自定义代码标记
    if (content.includes(config.customCodeMarkers.start)) {
      return true;
    }

    // 检查是否有非标准方法（不是从Base继承的）
    const customMethodPattern = /^\s*(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/gm;
    const methods = content.match(customMethodPattern);
    
    if (methods && methods.length > 0) {
      // 排除标准CRUD方法
      const standardMethods = ['findAll', 'findOne', 'create', 'update', 'remove', 'constructor'];
      const customMethods = methods.filter(method => {
        const methodName = method.match(/(\w+)\s*\(/)?.[1];
        return methodName && !standardMethods.includes(methodName);
      });
      
      return customMethods.length > 0;
    }

    // 检查是否有自定义导入
    const importPattern = /^import\s+.*from\s+['"][^'"]*['"];?\s*$/gm;
    const imports = content.match(importPattern);
    if (imports && imports.length > 3) { // 超过基本导入数量
      return true;
    }

    // 检查是否有自定义属性
    const propertyPattern = /^\s*(?:public|private|protected)?\s*(?:readonly\s+)?(\w+):\s*\w+/gm;
    const properties = content.match(propertyPattern);
    if (properties && properties.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * 提取自定义代码区域
   */
  private extractCustomSections(
    content: string,
    config: CodeProtectionConfig,
  ): CustomCodeSection[] {
    const sections: CustomCodeSection[] = [];
    const lines = content.split('\n');

    // 提取标记的自定义代码区域
    let inCustomSection = false;
    let currentSection: Partial<CustomCodeSection> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes(config.customCodeMarkers.start)) {
        inCustomSection = true;
        currentSection = {
          name: this.extractSectionName(line) || `custom_section_${sections.length + 1}`,
          startLine: i,
          content: '',
          protected: true,
        };
      } else if (line.includes(config.customCodeMarkers.end) && inCustomSection) {
        currentSection.endLine = i;
        sections.push(currentSection as CustomCodeSection);
        inCustomSection = false;
        currentSection = {};
      } else if (inCustomSection) {
        currentSection.content += line + '\n';
      }
    }

    // 提取自定义方法
    const customMethods = this.extractCustomMethods(content);
    sections.push(...customMethods);

    // 提取自定义属性
    const customProperties = this.extractCustomProperties(content);
    sections.push(...customProperties);

    return sections;
  }

  /**
   * 提取自定义方法
   */
  private extractCustomMethods(content: string): CustomCodeSection[] {
    const sections: CustomCodeSection[] = [];
    const lines = content.split('\n');
    
    const methodPattern = /^\s*(?:\/\*\*[\s\S]*?\*\/)?\s*(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/;
    const standardMethods = ['constructor', 'findAll', 'findOne', 'create', 'update', 'remove'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(methodPattern);

      if (match) {
        const methodName = match[1];
        if (!standardMethods.includes(methodName)) {
          // 找到方法结束位置
          const endLine = this.findMethodEnd(lines, i);
          const methodContent = lines.slice(i, endLine + 1).join('\n');

          sections.push({
            name: `method_${methodName}`,
            startLine: i,
            endLine,
            content: methodContent,
            protected: true,
          });
        }
      }
    }

    return sections;
  }

  /**
   * 提取自定义属性
   */
  private extractCustomProperties(content: string): CustomCodeSection[] {
    const sections: CustomCodeSection[] = [];
    const lines = content.split('\n');
    
    const propertyPattern = /^\s*(?:public|private|protected)?\s*(?:readonly\s+)?(\w+):\s*[\w<>\[\]|]+(?:\s*=\s*.*)?;?\s*$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(propertyPattern);

      if (match) {
        const propertyName = match[1];
        
        sections.push({
          name: `property_${propertyName}`,
          startLine: i,
          endLine: i,
          content: line,
          protected: true,
        });
      }
    }

    return sections;
  }

  /**
   * 执行智能合并
   */
  private async performSmartMerge(
    baseContent: string,
    bizContent: string,
    customSections: CustomCodeSection[],
    config: CodeProtectionConfig,
  ): Promise<{
    success: boolean;
    content: string;
    conflicts: CodeConflict[];
    warnings: string[];
  }> {
    const conflicts: CodeConflict[] = [];
    const warnings: string[] = [];
    let mergedContent = baseContent;

    try {
      // 在Base内容中插入自定义代码区域
      for (const section of customSections) {
        const insertResult = this.insertCustomSection(mergedContent, section, config);
        
        if (insertResult.success) {
          mergedContent = insertResult.content;
        } else {
          conflicts.push({
            type: 'custom',
            section: section.name,
            baseContent: '',
            bizContent: section.content,
            resolution: 'keep_biz',
            line: section.startLine,
          });
        }
      }

      // 处理导入语句合并
      const importMergeResult = this.mergeImports(baseContent, bizContent);
      if (importMergeResult.conflicts.length > 0) {
        conflicts.push(...importMergeResult.conflicts);
      }
      mergedContent = importMergeResult.content;

      return {
        success: true,
        content: mergedContent,
        conflicts,
        warnings,
      };

    } catch (error) {
      return {
        success: false,
        content: bizContent, // 失败时保留原内容
        conflicts,
        warnings: [...warnings, `智能合并失败: ${error.message}`],
      };
    }
  }

  /**
   * 插入自定义代码区域
   */
  private insertCustomSection(
    baseContent: string,
    section: CustomCodeSection,
    config: CodeProtectionConfig,
  ): { success: boolean; content: string } {
    try {
      const lines = baseContent.split('\n');
      
      // 找到合适的插入位置
      const insertPosition = this.findInsertPosition(lines, section);
      
      if (insertPosition >= 0) {
        // 添加自定义代码标记
        const sectionWithMarkers = [
          `  ${config.customCodeMarkers.start} ${section.name}`,
          section.content,
          `  ${config.customCodeMarkers.end}`,
        ].join('\n');

        lines.splice(insertPosition, 0, sectionWithMarkers);
        
        return {
          success: true,
          content: lines.join('\n'),
        };
      }

      return {
        success: false,
        content: baseContent,
      };

    } catch (error) {
      return {
        success: false,
        content: baseContent,
      };
    }
  }

  /**
   * 合并导入语句
   */
  private mergeImports(
    baseContent: string,
    bizContent: string,
  ): { content: string; conflicts: CodeConflict[] } {
    const baseImports = this.extractImports(baseContent);
    const bizImports = this.extractImports(bizContent);
    const conflicts: CodeConflict[] = [];

    // 合并导入，保留Biz中的自定义导入
    const mergedImports = [...baseImports];
    
    for (const bizImport of bizImports) {
      if (!baseImports.some(baseImport => baseImport.module === bizImport.module)) {
        mergedImports.push(bizImport);
      }
    }

    // 替换Base内容中的导入部分
    const baseLines = baseContent.split('\n');
    const importEndIndex = this.findImportEndIndex(baseLines);
    
    const importLines = mergedImports.map(imp => imp.statement);
    const newLines = [
      ...importLines,
      '',
      ...baseLines.slice(importEndIndex + 1),
    ];

    return {
      content: newLines.join('\n'),
      conflicts,
    };
  }

  /**
   * 创建备份文件
   */
  private async createBackup(filePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;
    
    await fs.copy(filePath, backupPath);
    this.logger.log(`已创建备份文件: ${backupPath}`);
    
    return backupPath;
  }

  // 辅助方法
  private extractSectionName(line: string): string | null {
    const match = line.match(/CUSTOM_CODE_START\s+(\w+)/);
    return match ? match[1] : null;
  }

  private findMethodEnd(lines: string[], startIndex: number): number {
    let braceCount = 0;
    let inMethod = false;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          inMethod = true;
        } else if (char === '}') {
          braceCount--;
          if (inMethod && braceCount === 0) {
            return i;
          }
        }
      }
    }

    return lines.length - 1;
  }

  private findInsertPosition(lines: string[], section: CustomCodeSection): number {
    // 在类的末尾插入（在最后一个}之前）
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === '}') {
        return i;
      }
    }
    return lines.length;
  }

  private extractImports(content: string): Array<{ statement: string; module: string }> {
    const importPattern = /^import\s+.*from\s+['"]([^'"]*)['"];?\s*$/gm;
    const imports: Array<{ statement: string; module: string }> = [];
    let match;

    while ((match = importPattern.exec(content)) !== null) {
      imports.push({
        statement: match[0],
        module: match[1],
      });
    }

    return imports;
  }

  private findImportEndIndex(lines: string[]): number {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('import') && !line.startsWith('//') && !line.startsWith('/*')) {
        return i - 1;
      }
    }
    return 0;
  }
}
