/*
 * @Description: 代码生成命令
 * @Autor: henry.xiukun
 * @Date: 2025-07-25 22:30:00
 * @LastEditors: henry.xiukun
 */

import { GenerationConfig } from '../services/dual-layer-generator.service';

export class GenerateCodeCommand {
  constructor(
    public readonly config: GenerationConfig,
    public readonly userId?: string,
  ) {}
}

export class ValidateGenerationConfigCommand {
  constructor(
    public readonly config: GenerationConfig,
  ) {}
}

export class PreviewGenerationCommand {
  constructor(
    public readonly config: GenerationConfig,
    public readonly entityId: string,
    public readonly templateId: string,
  ) {}
}

export class CleanupGeneratedFilesCommand {
  constructor(
    public readonly outputPath: string,
    public readonly preserveBizFiles: boolean = true,
  ) {}
}

export class GetGenerationHistoryCommand {
  constructor(
    public readonly projectId: string,
    public readonly page: number = 1,
    public readonly size: number = 10,
  ) {}
}

// 配置管理命令
export class SaveGenerationConfigCommand {
  constructor(
    public readonly projectId: string,
    public readonly config: GenerationConfig,
    public readonly name?: string,
    public readonly description?: string,
    public readonly userId?: string,
  ) {}
}

export class CreateConfigTemplateCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly category: 'web' | 'api' | 'mobile' | 'desktop' | 'custom',
    public readonly framework: string,
    public readonly language: string,
    public readonly config: GenerationConfig,
    public readonly isPublic: boolean = false,
    public readonly userId?: string,
  ) {}
}

export class CloneConfigCommand {
  constructor(
    public readonly configId: string,
    public readonly newName: string,
    public readonly newDescription?: string,
    public readonly userId?: string,
  ) {}
}

export class DeleteConfigCommand {
  constructor(
    public readonly configId: string,
    public readonly userId?: string,
  ) {}
}

// 代码保护和差异分析命令
export class AnalyzeCodeDiffCommand {
  constructor(
    public readonly baseContent: string,
    public readonly bizContent: string,
  ) {}
}

export class CheckFileProtectionCommand {
  constructor(
    public readonly filePath: string,
    public readonly config?: {
      preserveCustomCode?: boolean;
      enableSmartMerge?: boolean;
      backupBeforeOverwrite?: boolean;
    },
  ) {}
}

export class MergeCodeCommand {
  constructor(
    public readonly baseContent: string,
    public readonly bizFilePath: string,
    public readonly config?: {
      preserveCustomCode?: boolean;
      enableSmartMerge?: boolean;
      backupBeforeOverwrite?: boolean;
    },
  ) {}
}

export class SuggestConflictResolutionCommand {
  constructor(
    public readonly baseContent: string,
    public readonly bizContent: string,
    public readonly conflictType: 'method' | 'property' | 'import' | 'custom',
  ) {}
}
