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
