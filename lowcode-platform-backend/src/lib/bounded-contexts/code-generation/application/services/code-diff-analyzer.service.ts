/*
 * @Description: 代码差异分析服务
 * @Autor: henry.xiukun
 * @Date: 2025-07-25 22:45:00
 * @LastEditors: henry.xiukun
 */

import { Injectable, Logger } from '@nestjs/common';

export interface CodeDiff {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  lineNumber: number;
  content: string;
  oldContent?: string;
  context: {
    before: string[];
    after: string[];
  };
}

export interface DiffAnalysisResult {
  hasChanges: boolean;
  totalChanges: number;
  addedLines: number;
  removedLines: number;
  modifiedLines: number;
  diffs: CodeDiff[];
  summary: {
    addedMethods: string[];
    removedMethods: string[];
    modifiedMethods: string[];
    addedImports: string[];
    removedImports: string[];
  };
}

export interface ConflictResolution {
  strategy: 'keep_base' | 'keep_biz' | 'merge' | 'manual';
  reason: string;
  confidence: number; // 0-1
}

@Injectable()
export class CodeDiffAnalyzerService {
  private readonly logger = new Logger(CodeDiffAnalyzerService.name);

  /**
   * 分析两个代码文件的差异
   */
  analyzeDiff(baseContent: string, bizContent: string): DiffAnalysisResult {
    const baseLines = baseContent.split('\n');
    const bizLines = bizContent.split('\n');
    
    const diffs = this.computeDiffs(baseLines, bizLines);
    const summary = this.generateSummary(diffs, baseContent, bizContent);

    return {
      hasChanges: diffs.length > 0,
      totalChanges: diffs.filter(d => d.type !== 'unchanged').length,
      addedLines: diffs.filter(d => d.type === 'added').length,
      removedLines: diffs.filter(d => d.type === 'removed').length,
      modifiedLines: diffs.filter(d => d.type === 'modified').length,
      diffs,
      summary,
    };
  }

  /**
   * 建议冲突解决策略
   */
  suggestConflictResolution(
    baseContent: string,
    bizContent: string,
    conflictType: 'method' | 'property' | 'import' | 'custom',
  ): ConflictResolution {
    switch (conflictType) {
      case 'method':
        return this.resolveMethodConflict(baseContent, bizContent);
      case 'property':
        return this.resolvePropertyConflict(baseContent, bizContent);
      case 'import':
        return this.resolveImportConflict(baseContent, bizContent);
      case 'custom':
        return this.resolveCustomConflict(baseContent, bizContent);
      default:
        return {
          strategy: 'manual',
          reason: '未知冲突类型，需要手动解决',
          confidence: 0,
        };
    }
  }

  /**
   * 检测代码中的重要变更
   */
  detectSignificantChanges(diffs: CodeDiff[]): {
    hasBreakingChanges: boolean;
    breakingChanges: string[];
    warnings: string[];
  } {
    const breakingChanges: string[] = [];
    const warnings: string[] = [];

    for (const diff of diffs) {
      // 检测方法签名变更
      if (this.isMethodSignatureChange(diff)) {
        breakingChanges.push(`方法签名变更: ${diff.content}`);
      }

      // 检测接口变更
      if (this.isInterfaceChange(diff)) {
        breakingChanges.push(`接口变更: ${diff.content}`);
      }

      // 检测依赖变更
      if (this.isDependencyChange(diff)) {
        warnings.push(`依赖变更: ${diff.content}`);
      }

      // 检测配置变更
      if (this.isConfigurationChange(diff)) {
        warnings.push(`配置变更: ${diff.content}`);
      }
    }

    return {
      hasBreakingChanges: breakingChanges.length > 0,
      breakingChanges,
      warnings,
    };
  }

  /**
   * 生成代码合并建议
   */
  generateMergeRecommendations(
    analysisResult: DiffAnalysisResult,
  ): Array<{
    section: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    action: string;
  }> {
    const recommendations: Array<{
      section: string;
      recommendation: string;
      priority: 'high' | 'medium' | 'low';
      action: string;
    }> = [];

    // 分析新增方法
    if (analysisResult.summary.addedMethods.length > 0) {
      recommendations.push({
        section: 'methods',
        recommendation: `发现 ${analysisResult.summary.addedMethods.length} 个新增方法，建议保留在Biz层`,
        priority: 'high',
        action: 'keep_biz_methods',
      });
    }

    // 分析修改的方法
    if (analysisResult.summary.modifiedMethods.length > 0) {
      recommendations.push({
        section: 'methods',
        recommendation: `发现 ${analysisResult.summary.modifiedMethods.length} 个修改的方法，需要仔细检查`,
        priority: 'high',
        action: 'review_modified_methods',
      });
    }

    // 分析导入变更
    if (analysisResult.summary.addedImports.length > 0) {
      recommendations.push({
        section: 'imports',
        recommendation: `发现 ${analysisResult.summary.addedImports.length} 个新增导入，建议合并`,
        priority: 'medium',
        action: 'merge_imports',
      });
    }

    return recommendations;
  }

  /**
   * 计算代码差异
   */
  private computeDiffs(baseLines: string[], bizLines: string[]): CodeDiff[] {
    const diffs: CodeDiff[] = [];
    const maxLength = Math.max(baseLines.length, bizLines.length);

    for (let i = 0; i < maxLength; i++) {
      const baseLine = baseLines[i];
      const bizLine = bizLines[i];

      if (baseLine === undefined) {
        // Biz中新增的行
        diffs.push({
          type: 'added',
          lineNumber: i + 1,
          content: bizLine,
          context: this.getContext(bizLines, i),
        });
      } else if (bizLine === undefined) {
        // Base中有但Biz中删除的行
        diffs.push({
          type: 'removed',
          lineNumber: i + 1,
          content: baseLine,
          context: this.getContext(baseLines, i),
        });
      } else if (baseLine !== bizLine) {
        // 修改的行
        diffs.push({
          type: 'modified',
          lineNumber: i + 1,
          content: bizLine,
          oldContent: baseLine,
          context: this.getContext(bizLines, i),
        });
      } else {
        // 未变更的行
        diffs.push({
          type: 'unchanged',
          lineNumber: i + 1,
          content: bizLine,
          context: this.getContext(bizLines, i),
        });
      }
    }

    return diffs;
  }

  /**
   * 获取代码上下文
   */
  private getContext(lines: string[], index: number, contextSize: number = 2): {
    before: string[];
    after: string[];
  } {
    const before = lines.slice(Math.max(0, index - contextSize), index);
    const after = lines.slice(index + 1, Math.min(lines.length, index + 1 + contextSize));

    return { before, after };
  }

  /**
   * 生成差异摘要
   */
  private generateSummary(
    diffs: CodeDiff[],
    baseContent: string,
    bizContent: string,
  ): DiffAnalysisResult['summary'] {
    const baseMethods = this.extractMethods(baseContent);
    const bizMethods = this.extractMethods(bizContent);
    const baseImports = this.extractImports(baseContent);
    const bizImports = this.extractImports(bizContent);

    return {
      addedMethods: bizMethods.filter(m => !baseMethods.includes(m)),
      removedMethods: baseMethods.filter(m => !bizMethods.includes(m)),
      modifiedMethods: this.findModifiedMethods(diffs),
      addedImports: bizImports.filter(i => !baseImports.includes(i)),
      removedImports: baseImports.filter(i => !bizImports.includes(i)),
    };
  }

  /**
   * 提取方法名
   */
  private extractMethods(content: string): string[] {
    const methodPattern = /(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/g;
    const methods: string[] = [];
    let match;

    while ((match = methodPattern.exec(content)) !== null) {
      methods.push(match[1]);
    }

    return methods;
  }

  /**
   * 提取导入语句
   */
  private extractImports(content: string): string[] {
    const importPattern = /^import\s+.*from\s+['"]([^'"]*)['"];?\s*$/gm;
    const imports: string[] = [];
    let match;

    while ((match = importPattern.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * 查找修改的方法
   */
  private findModifiedMethods(diffs: CodeDiff[]): string[] {
    const modifiedMethods: string[] = [];

    for (const diff of diffs) {
      if (diff.type === 'modified') {
        const methodMatch = diff.content.match(/(\w+)\s*\([^)]*\)\s*{/);
        if (methodMatch) {
          modifiedMethods.push(methodMatch[1]);
        }
      }
    }

    return [...new Set(modifiedMethods)]; // 去重
  }

  // 冲突解决策略方法
  private resolveMethodConflict(baseContent: string, bizContent: string): ConflictResolution {
    // 如果Biz中的方法有自定义逻辑，保留Biz版本
    if (this.hasCustomLogic(bizContent)) {
      return {
        strategy: 'keep_biz',
        reason: 'Biz层方法包含自定义业务逻辑',
        confidence: 0.8,
      };
    }

    // 如果Base中的方法更新了，建议合并
    if (this.hasSignificantChanges(baseContent, bizContent)) {
      return {
        strategy: 'merge',
        reason: 'Base层方法有重要更新，建议合并',
        confidence: 0.6,
      };
    }

    return {
      strategy: 'keep_biz',
      reason: '默认保留Biz层实现',
      confidence: 0.5,
    };
  }

  private resolvePropertyConflict(baseContent: string, bizContent: string): ConflictResolution {
    return {
      strategy: 'keep_biz',
      reason: '属性变更通常是自定义需求',
      confidence: 0.7,
    };
  }

  private resolveImportConflict(baseContent: string, bizContent: string): ConflictResolution {
    return {
      strategy: 'merge',
      reason: '导入语句可以安全合并',
      confidence: 0.9,
    };
  }

  private resolveCustomConflict(baseContent: string, bizContent: string): ConflictResolution {
    return {
      strategy: 'keep_biz',
      reason: '自定义代码区域应该保留',
      confidence: 0.95,
    };
  }

  // 检测方法
  private isMethodSignatureChange(diff: CodeDiff): boolean {
    return diff.content.includes('(') && diff.content.includes(')') && 
           (diff.type === 'modified' || diff.type === 'removed');
  }

  private isInterfaceChange(diff: CodeDiff): boolean {
    return diff.content.includes('interface') || diff.content.includes('export');
  }

  private isDependencyChange(diff: CodeDiff): boolean {
    return diff.content.includes('import') || diff.content.includes('from');
  }

  private isConfigurationChange(diff: CodeDiff): boolean {
    return diff.content.includes('@') || diff.content.includes('config');
  }

  private hasCustomLogic(content: string): boolean {
    // 检查是否包含自定义业务逻辑的关键词
    const customKeywords = ['custom', 'business', 'logic', 'TODO', 'FIXME', 'NOTE'];
    return customKeywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()));
  }

  private hasSignificantChanges(baseContent: string, bizContent: string): boolean {
    const baseLines = baseContent.split('\n').length;
    const bizLines = bizContent.split('\n').length;
    const lineDiff = Math.abs(baseLines - bizLines);
    
    // 如果行数差异超过20%，认为有重要变更
    return lineDiff > Math.max(baseLines, bizLines) * 0.2;
  }
}
