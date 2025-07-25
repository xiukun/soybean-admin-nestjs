import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import { TemplateEngine } from '../modules/template/services/template-engine.service';

/**
 * 代码层级定义
 */
export enum CodeLayer {
  /** 基础层 - 自动生成，不可手动修改 */
  BASE = 'base',
  /** 业务层 - 可手动修改和扩展 */
  BIZ = 'biz',
  /** 共享层 - 公共组件和工具 */
  SHARED = 'shared',
  /** 配置层 - 配置文件和常量 */
  CONFIG = 'config'
}

/**
 * 代码文件类型
 */
export enum CodeFileType {
  CONTROLLER = 'controller',
  SERVICE = 'service',
  REPOSITORY = 'repository',
  DTO = 'dto',
  ENTITY = 'entity',
  MODULE = 'module',
  INTERFACE = 'interface',
  ENUM = 'enum',
  CONSTANT = 'constant',
  UTIL = 'util',
  TEST = 'test'
}

/**
 * 代码生成配置
 */
export interface CodeGenerationConfig {
  /** 项目名称 */
  projectName: string;
  /** 输出目录 */
  outputDir: string;
  /** 是否覆盖现有文件 */
  overwriteExisting: boolean;
  /** 是否生成基础层 */
  generateBase: boolean;
  /** 是否生成业务层 */
  generateBiz: boolean;
  /** 是否生成测试文件 */
  generateTests: boolean;
  /** 是否创建目录结构 */
  createDirectories: boolean;
  /** 自定义配置 */
  customConfig?: Record<string, any>;
}

/**
 * 代码文件信息
 */
export interface CodeFileInfo {
  /** 文件路径 */
  filePath: string;
  /** 文件内容 */
  content: string;
  /** 文件类型 */
  type: CodeFileType;
  /** 所属层级 */
  layer: CodeLayer;
  /** 是否可编辑 */
  editable: boolean;
  /** 依赖的文件 */
  dependencies: string[];
  /** 元数据 */
  metadata: Record<string, any>;
}

/**
 * 实体定义
 */
export interface EntityDefinition {
  /** 实体代码 */
  code: string;
  /** 实体名称 */
  name: string;
  /** 实体描述 */
  description?: string;
  /** 字段定义 */
  fields: FieldDefinition[];
  /** 关系定义 */
  relationships?: RelationshipDefinition[];
  /** 索引定义 */
  indexes?: IndexDefinition[];
  /** 自定义配置 */
  config?: Record<string, any>;
}

/**
 * 字段定义
 */
export interface FieldDefinition {
  /** 字段名 */
  name: string;
  /** 字段类型 */
  type: string;
  /** 是否必填 */
  required: boolean;
  /** 是否唯一 */
  unique?: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 字段长度 */
  length?: number;
  /** 字段描述 */
  description?: string;
  /** 验证规则 */
  validation?: Record<string, any>;
}

/**
 * 关系定义
 */
export interface RelationshipDefinition {
  /** 关系类型 */
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  /** 目标实体 */
  targetEntity: string;
  /** 关系字段 */
  field: string;
  /** 外键字段 */
  foreignKey?: string;
  /** 是否级联删除 */
  cascade?: boolean;
}

/**
 * 索引定义
 */
export interface IndexDefinition {
  /** 索引名称 */
  name: string;
  /** 索引字段 */
  fields: string[];
  /** 是否唯一索引 */
  unique?: boolean;
  /** 索引类型 */
  type?: string;
}

/**
 * 分层代码生成服务
 */
@Injectable()
export class LayeredCodeGeneratorService {
  private readonly logger = new Logger(LayeredCodeGeneratorService.name);

  constructor(
    private readonly templateEngine: TemplateEngine,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 生成分层代码架构
   */
  async generateLayeredArchitecture(
    entities: EntityDefinition[],
    config: CodeGenerationConfig
  ): Promise<CodeFileInfo[]> {
    this.logger.log(`开始生成分层代码架构: ${config.projectName}`);

    const generatedFiles: CodeFileInfo[] = [];

    try {
      // 1. 创建目录结构
      if (config.createDirectories) {
        await this.createDirectoryStructure(config.outputDir, config.projectName);
      }

      // 2. 生成基础层代码
      if (config.generateBase) {
        const baseFiles = await this.generateBaseLayer(entities, config);
        generatedFiles.push(...baseFiles);
      }

      // 3. 生成业务层代码
      if (config.generateBiz) {
        const bizFiles = await this.generateBizLayer(entities, config);
        generatedFiles.push(...bizFiles);
      }

      // 4. 生成共享层代码
      const sharedFiles = await this.generateSharedLayer(entities, config);
      generatedFiles.push(...sharedFiles);

      // 5. 生成配置层代码
      const configFiles = await this.generateConfigLayer(entities, config);
      generatedFiles.push(...configFiles);

      // 6. 生成测试文件
      if (config.generateTests) {
        const testFiles = await this.generateTestLayer(entities, config);
        generatedFiles.push(...testFiles);
      }

      // 7. 写入文件
      await this.writeGeneratedFiles(generatedFiles, config);

      this.logger.log(`代码生成完成，共生成 ${generatedFiles.length} 个文件`);
      return generatedFiles;

    } catch (error) {
      this.logger.error(`代码生成失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 创建目录结构
   */
  private async createDirectoryStructure(outputDir: string, projectName: string): Promise<void> {
    const directories = [
      // 基础层目录
      `${outputDir}/${projectName}/base/controllers`,
      `${outputDir}/${projectName}/base/services`,
      `${outputDir}/${projectName}/base/repositories`,
      `${outputDir}/${projectName}/base/dto`,
      `${outputDir}/${projectName}/base/entities`,
      `${outputDir}/${projectName}/base/interfaces`,
      
      // 业务层目录
      `${outputDir}/${projectName}/biz/controllers`,
      `${outputDir}/${projectName}/biz/services`,
      `${outputDir}/${projectName}/biz/dto`,
      `${outputDir}/${projectName}/biz/modules`,
      
      // 共享层目录
      `${outputDir}/${projectName}/shared/utils`,
      `${outputDir}/${projectName}/shared/constants`,
      `${outputDir}/${projectName}/shared/decorators`,
      `${outputDir}/${projectName}/shared/interceptors`,
      `${outputDir}/${projectName}/shared/guards`,
      
      // 配置层目录
      `${outputDir}/${projectName}/config`,
      
      // 测试目录
      `${outputDir}/${projectName}/test/unit`,
      `${outputDir}/${projectName}/test/integration`,
      `${outputDir}/${projectName}/test/e2e`,
    ];

    for (const dir of directories) {
      await fs.ensureDir(dir);
    }

    this.logger.debug(`创建了 ${directories.length} 个目录`);
  }

  /**
   * 生成基础层代码
   */
  private async generateBaseLayer(
    entities: EntityDefinition[],
    config: CodeGenerationConfig
  ): Promise<CodeFileInfo[]> {
    const files: CodeFileInfo[] = [];

    for (const entity of entities) {
      // 生成基础控制器
      const baseController = await this.generateBaseController(entity, config);
      files.push(baseController);

      // 生成基础服务
      const baseService = await this.generateBaseService(entity, config);
      files.push(baseService);

      // 生成基础仓储
      const baseRepository = await this.generateBaseRepository(entity, config);
      files.push(baseRepository);

      // 生成基础DTO
      const baseDtos = await this.generateBaseDtos(entity, config);
      files.push(...baseDtos);

      // 生成实体
      const entityFile = await this.generateEntity(entity, config);
      files.push(entityFile);

      // 生成接口
      const interfaces = await this.generateInterfaces(entity, config);
      files.push(...interfaces);
    }

    return files;
  }

  /**
   * 生成业务层代码
   */
  private async generateBizLayer(
    entities: EntityDefinition[],
    config: CodeGenerationConfig
  ): Promise<CodeFileInfo[]> {
    const files: CodeFileInfo[] = [];

    for (const entity of entities) {
      // 生成业务控制器
      const bizController = await this.generateBizController(entity, config);
      files.push(bizController);

      // 生成业务服务
      const bizService = await this.generateBizService(entity, config);
      files.push(bizService);

      // 生成业务DTO
      const bizDtos = await this.generateBizDtos(entity, config);
      files.push(...bizDtos);

      // 生成模块
      const module = await this.generateModule(entity, config);
      files.push(module);
    }

    return files;
  }

  /**
   * 生成共享层代码
   */
  private async generateSharedLayer(
    entities: EntityDefinition[],
    config: CodeGenerationConfig
  ): Promise<CodeFileInfo[]> {
    const files: CodeFileInfo[] = [];

    // 生成工具类
    const utils = await this.generateUtils(config);
    files.push(...utils);

    // 生成常量
    const constants = await this.generateConstants(entities, config);
    files.push(...constants);

    // 生成装饰器
    const decorators = await this.generateDecorators(config);
    files.push(...decorators);

    // 生成拦截器
    const interceptors = await this.generateInterceptors(config);
    files.push(...interceptors);

    return files;
  }

  /**
   * 生成配置层代码
   */
  private async generateConfigLayer(
    entities: EntityDefinition[],
    config: CodeGenerationConfig
  ): Promise<CodeFileInfo[]> {
    const files: CodeFileInfo[] = [];

    // 生成数据库配置
    const dbConfig = await this.generateDatabaseConfig(entities, config);
    files.push(dbConfig);

    // 生成应用配置
    const appConfig = await this.generateAppConfig(config);
    files.push(appConfig);

    return files;
  }

  /**
   * 生成测试层代码
   */
  private async generateTestLayer(
    entities: EntityDefinition[],
    config: CodeGenerationConfig
  ): Promise<CodeFileInfo[]> {
    const files: CodeFileInfo[] = [];

    for (const entity of entities) {
      // 生成单元测试
      const unitTests = await this.generateUnitTests(entity, config);
      files.push(...unitTests);

      // 生成集成测试
      const integrationTests = await this.generateIntegrationTests(entity, config);
      files.push(...integrationTests);
    }

    // 生成E2E测试
    const e2eTests = await this.generateE2ETests(entities, config);
    files.push(...e2eTests);

    return files;
  }

  /**
   * 生成基础控制器
   */
  private async generateBaseController(
    entity: EntityDefinition,
    config: CodeGenerationConfig
  ): Promise<CodeFileInfo> {
    const templateData = {
      entity,
      projectName: config.projectName,
      timestamp: new Date().toISOString(),
    };

    const content = await this.templateEngine.render('base-controller.hbs', templateData);

    return {
      filePath: `${config.projectName}/base/controllers/${entity.code}.base.controller.ts`,
      content,
      type: CodeFileType.CONTROLLER,
      layer: CodeLayer.BASE,
      editable: false,
      dependencies: [
        `${config.projectName}/base/services/${entity.code}.base.service.ts`,
        `${config.projectName}/base/dto/${entity.code}.dto.ts`,
      ],
      metadata: {
        entity: entity.code,
        generated: true,
        warning: '此文件由代码生成器自动生成，请勿手动修改',
      },
    };
  }

  /**
   * 生成基础服务
   */
  private async generateBaseService(
    entity: EntityDefinition,
    config: CodeGenerationConfig
  ): Promise<CodeFileInfo> {
    const templateData = {
      entity,
      projectName: config.projectName,
      timestamp: new Date().toISOString(),
    };

    const content = await this.templateEngine.render('base-service.hbs', templateData);

    return {
      filePath: `${config.projectName}/base/services/${entity.code}.base.service.ts`,
      content,
      type: CodeFileType.SERVICE,
      layer: CodeLayer.BASE,
      editable: false,
      dependencies: [
        `${config.projectName}/base/repositories/${entity.code}.base.repository.ts`,
        `${config.projectName}/base/entities/${entity.code}.entity.ts`,
      ],
      metadata: {
        entity: entity.code,
        generated: true,
        warning: '此文件由代码生成器自动生成，请勿手动修改',
      },
    };
  }

  /**
   * 生成基础仓储
   */
  private async generateBaseRepository(
    entity: EntityDefinition,
    config: CodeGenerationConfig
  ): Promise<CodeFileInfo> {
    const templateData = {
      entity,
      projectName: config.projectName,
      timestamp: new Date().toISOString(),
    };

    const content = await this.templateEngine.render('base-repository.hbs', templateData);

    return {
      filePath: `${config.projectName}/base/repositories/${entity.code}.base.repository.ts`,
      content,
      type: CodeFileType.REPOSITORY,
      layer: CodeLayer.BASE,
      editable: false,
      dependencies: [
        `${config.projectName}/base/entities/${entity.code}.entity.ts`,
      ],
      metadata: {
        entity: entity.code,
        generated: true,
        warning: '此文件由代码生成器自动生成，请勿手动修改',
      },
    };
  }

  /**
   * 生成基础DTO
   */
  private async generateBaseDtos(
    entity: EntityDefinition,
    config: CodeGenerationConfig
  ): Promise<CodeFileInfo[]> {
    const files: CodeFileInfo[] = [];

    // 创建DTO
    const createDto = await this.generateCreateDto(entity, config);
    files.push(createDto);

    // 更新DTO
    const updateDto = await this.generateUpdateDto(entity, config);
    files.push(updateDto);

    // 查询DTO
    const queryDto = await this.generateQueryDto(entity, config);
    files.push(queryDto);

    // 响应DTO
    const responseDto = await this.generateResponseDto(entity, config);
    files.push(responseDto);

    return files;
  }

  /**
   * 写入生成的文件
   */
  private async writeGeneratedFiles(
    files: CodeFileInfo[],
    config: CodeGenerationConfig
  ): Promise<void> {
    for (const file of files) {
      const fullPath = path.join(config.outputDir, file.filePath);
      
      // 检查文件是否存在
      if (await fs.pathExists(fullPath) && !config.overwriteExisting && !file.editable) {
        this.logger.warn(`文件已存在，跳过: ${file.filePath}`);
        continue;
      }

      // 确保目录存在
      await fs.ensureDir(path.dirname(fullPath));

      // 写入文件
      await fs.writeFile(fullPath, file.content, 'utf8');
      
      this.logger.debug(`生成文件: ${file.filePath}`);
    }
  }

  // 以下是具体的代码生成方法，由于篇幅限制，这里只提供方法签名
  // 实际实现中需要根据具体的模板来生成代码

  private async generateEntity(entity: EntityDefinition, config: CodeGenerationConfig): Promise<CodeFileInfo> {
    // 实现实体生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateInterfaces(entity: EntityDefinition, config: CodeGenerationConfig): Promise<CodeFileInfo[]> {
    // 实现接口生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateBizController(entity: EntityDefinition, config: CodeGenerationConfig): Promise<CodeFileInfo> {
    // 实现业务控制器生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateBizService(entity: EntityDefinition, config: CodeGenerationConfig): Promise<CodeFileInfo> {
    // 实现业务服务生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateBizDtos(entity: EntityDefinition, config: CodeGenerationConfig): Promise<CodeFileInfo[]> {
    // 实现业务DTO生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateModule(entity: EntityDefinition, config: CodeGenerationConfig): Promise<CodeFileInfo> {
    // 实现模块生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateUtils(config: CodeGenerationConfig): Promise<CodeFileInfo[]> {
    // 实现工具类生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateConstants(entities: EntityDefinition[], config: CodeGenerationConfig): Promise<CodeFileInfo[]> {
    // 实现常量生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateDecorators(config: CodeGenerationConfig): Promise<CodeFileInfo[]> {
    // 实现装饰器生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateInterceptors(config: CodeGenerationConfig): Promise<CodeFileInfo[]> {
    // 实现拦截器生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateDatabaseConfig(entities: EntityDefinition[], config: CodeGenerationConfig): Promise<CodeFileInfo> {
    // 实现数据库配置生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateAppConfig(config: CodeGenerationConfig): Promise<CodeFileInfo> {
    // 实现应用配置生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateUnitTests(entity: EntityDefinition, config: CodeGenerationConfig): Promise<CodeFileInfo[]> {
    // 实现单元测试生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateIntegrationTests(entity: EntityDefinition, config: CodeGenerationConfig): Promise<CodeFileInfo[]> {
    // 实现集成测试生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateE2ETests(entities: EntityDefinition[], config: CodeGenerationConfig): Promise<CodeFileInfo[]> {
    // 实现E2E测试生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateCreateDto(entity: EntityDefinition, config: CodeGenerationConfig): Promise<CodeFileInfo> {
    // 实现创建DTO生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateUpdateDto(entity: EntityDefinition, config: CodeGenerationConfig): Promise<CodeFileInfo> {
    // 实现更新DTO生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateQueryDto(entity: EntityDefinition, config: CodeGenerationConfig): Promise<CodeFileInfo> {
    // 实现查询DTO生成逻辑
    throw new Error('Method not implemented');
  }

  private async generateResponseDto(entity: EntityDefinition, config: CodeGenerationConfig): Promise<CodeFileInfo> {
    // 实现响应DTO生成逻辑
    throw new Error('Method not implemented');
  }
}
