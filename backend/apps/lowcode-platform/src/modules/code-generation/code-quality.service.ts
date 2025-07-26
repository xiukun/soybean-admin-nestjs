import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@lib/shared-auth';
import { BusinessException } from '@lib/shared-errors';

export interface QualityRule {
  id: string;
  name: string;
  description: string;
  category: 'syntax' | 'style' | 'performance' | 'security' | 'maintainability';
  severity: 'error' | 'warning' | 'info';
  framework: string[];
  enabled: boolean;
  pattern?: string;
  message: string;
  suggestion?: string;
  autoFix?: boolean;
}

export interface QualityCheck {
  rule: QualityRule;
  file: string;
  line: number;
  column: number;
  message: string;
  suggestion?: string;
  canAutoFix: boolean;
}

export interface QualityReport {
  summary: {
    totalFiles: number;
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    score: number;
  };
  issues: QualityCheck[];
  metrics: QualityMetrics;
  suggestions: string[];
}

export interface QualityMetrics {
  complexity: {
    average: number;
    max: number;
    files: { file: string; complexity: number }[];
  };
  maintainability: {
    index: number;
    factors: Record<string, number>;
  };
  testCoverage: {
    percentage: number;
    lines: number;
    functions: number;
    branches: number;
  };
  duplication: {
    percentage: number;
    blocks: { file1: string; file2: string; lines: number }[];
  };
  dependencies: {
    count: number;
    circular: string[];
    unused: string[];
  };
}

export interface CodeOptimization {
  type: 'import' | 'unused' | 'performance' | 'style' | 'structure';
  description: string;
  before: string;
  after: string;
  impact: 'low' | 'medium' | 'high';
}

@Injectable()
export class CodeQualityService {
  private readonly logger = new Logger(CodeQualityService.name);
  private qualityRules: Map<string, QualityRule> = new Map();

  constructor() {
    this.initializeQualityRules();
  }

  async analyzeCode(files: any[], framework: string, user: AuthenticatedUser): Promise<QualityReport> {
    this.logger.log(`Analyzing code quality for ${files.length} files with framework: ${framework}`);

    const report: QualityReport = {
      summary: {
        totalFiles: files.length,
        totalIssues: 0,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        score: 0
      },
      issues: [],
      metrics: {
        complexity: { average: 0, max: 0, files: [] },
        maintainability: { index: 0, factors: {} },
        testCoverage: { percentage: 0, lines: 0, functions: 0, branches: 0 },
        duplication: { percentage: 0, blocks: [] },
        dependencies: { count: 0, circular: [], unused: [] }
      },
      suggestions: []
    };

    try {
      // 分析每个文件
      for (const file of files) {
        const fileIssues = await this.analyzeFile(file, framework);
        report.issues.push(...fileIssues);
      }

      // 计算指标
      report.metrics = await this.calculateMetrics(files, framework);

      // 生成摘要
      report.summary = this.generateSummary(report.issues, files.length);

      // 生成建议
      report.suggestions = this.generateSuggestions(report);

      this.logger.log(`Code analysis completed. Found ${report.summary.totalIssues} issues with score: ${report.summary.score}`);
      return report;

    } catch (error) {
      this.logger.error(`Code analysis failed: ${error.message}`);
      throw BusinessException.internalServerError('Code analysis failed', error.message);
    }
  }

  async optimizeCode(files: any[], framework: string, user: AuthenticatedUser): Promise<CodeOptimization[]> {
    this.logger.log(`Optimizing code for ${files.length} files with framework: ${framework}`);

    const optimizations: CodeOptimization[] = [];

    try {
      for (const file of files) {
        const fileOptimizations = await this.optimizeFile(file, framework);
        optimizations.push(...fileOptimizations);
      }

      this.logger.log(`Code optimization completed. Generated ${optimizations.length} optimizations`);
      return optimizations;

    } catch (error) {
      this.logger.error(`Code optimization failed: ${error.message}`);
      throw BusinessException.internalServerError('Code optimization failed', error.message);
    }
  }

  async applyAutoFixes(files: any[], issues: QualityCheck[], user: AuthenticatedUser): Promise<any[]> {
    this.logger.log(`Applying auto fixes for ${issues.length} issues`);

    const fixedFiles = [...files];

    try {
      for (const issue of issues) {
        if (issue.canAutoFix) {
          const file = fixedFiles.find(f => f.path === issue.file);
          if (file) {
            file.content = await this.applyFix(file.content, issue);
          }
        }
      }

      this.logger.log('Auto fixes applied successfully');
      return fixedFiles;

    } catch (error) {
      this.logger.error(`Auto fix failed: ${error.message}`);
      throw BusinessException.internalServerError('Auto fix failed', error.message);
    }
  }

  private initializeQualityRules(): void {
    const rules: QualityRule[] = [
      // TypeScript/JavaScript 规则
      {
        id: 'ts-unused-import',
        name: 'Unused Import',
        description: 'Detect unused import statements',
        category: 'maintainability',
        severity: 'warning',
        framework: ['nestjs', 'express', 'react'],
        enabled: true,
        pattern: 'import\\s+.*?\\s+from\\s+[\'"][^\'"]+[\'"]',
        message: 'Unused import detected',
        suggestion: 'Remove unused import to reduce bundle size',
        autoFix: true
      },
      {
        id: 'ts-no-any',
        name: 'No Any Type',
        description: 'Avoid using any type',
        category: 'maintainability',
        severity: 'warning',
        framework: ['nestjs', 'express', 'react'],
        enabled: true,
        pattern: ':\\s*any\\b',
        message: 'Avoid using any type',
        suggestion: 'Use specific types for better type safety',
        autoFix: false
      },
      {
        id: 'ts-prefer-const',
        name: 'Prefer Const',
        description: 'Use const for variables that are never reassigned',
        category: 'style',
        severity: 'info',
        framework: ['nestjs', 'express', 'react'],
        enabled: true,
        pattern: 'let\\s+\\w+\\s*=',
        message: 'Use const instead of let for variables that are never reassigned',
        suggestion: 'Replace let with const',
        autoFix: true
      },
      {
        id: 'ts-no-console',
        name: 'No Console',
        description: 'Avoid console statements in production code',
        category: 'performance',
        severity: 'warning',
        framework: ['nestjs', 'express', 'react'],
        enabled: true,
        pattern: 'console\\.(log|error|warn|info)',
        message: 'Console statement found',
        suggestion: 'Use proper logging framework instead of console',
        autoFix: false
      },
      {
        id: 'ts-async-await',
        name: 'Prefer Async/Await',
        description: 'Prefer async/await over Promise chains',
        category: 'style',
        severity: 'info',
        framework: ['nestjs', 'express'],
        enabled: true,
        pattern: '\\.then\\(',
        message: 'Consider using async/await instead of Promise chains',
        suggestion: 'Refactor to use async/await for better readability',
        autoFix: false
      },

      // Java 规则
      {
        id: 'java-unused-import',
        name: 'Unused Import',
        description: 'Detect unused import statements',
        category: 'maintainability',
        severity: 'warning',
        framework: ['spring-boot'],
        enabled: true,
        pattern: 'import\\s+[\\w\\.]+;',
        message: 'Unused import detected',
        suggestion: 'Remove unused import',
        autoFix: true
      },
      {
        id: 'java-naming-convention',
        name: 'Naming Convention',
        description: 'Follow Java naming conventions',
        category: 'style',
        severity: 'warning',
        framework: ['spring-boot'],
        enabled: true,
        pattern: 'class\\s+[a-z]',
        message: 'Class names should start with uppercase letter',
        suggestion: 'Use PascalCase for class names',
        autoFix: false
      },
      {
        id: 'java-magic-numbers',
        name: 'Magic Numbers',
        description: 'Avoid magic numbers in code',
        category: 'maintainability',
        severity: 'warning',
        framework: ['spring-boot'],
        enabled: true,
        pattern: '\\b\\d{2,}\\b',
        message: 'Magic number detected',
        suggestion: 'Extract magic numbers to named constants',
        autoFix: false
      },

      // 安全规则
      {
        id: 'security-sql-injection',
        name: 'SQL Injection Risk',
        description: 'Detect potential SQL injection vulnerabilities',
        category: 'security',
        severity: 'error',
        framework: ['nestjs', 'spring-boot', 'express'],
        enabled: true,
        pattern: 'query\\s*\\+\\s*[\'"]',
        message: 'Potential SQL injection vulnerability',
        suggestion: 'Use parameterized queries or ORM methods',
        autoFix: false
      },
      {
        id: 'security-hardcoded-secrets',
        name: 'Hardcoded Secrets',
        description: 'Detect hardcoded secrets in code',
        category: 'security',
        severity: 'error',
        framework: ['nestjs', 'spring-boot', 'express'],
        enabled: true,
        pattern: '(password|secret|key|token)\\s*[=:]\\s*[\'"][^\'"]{8,}[\'"]',
        message: 'Hardcoded secret detected',
        suggestion: 'Move secrets to environment variables or secure configuration',
        autoFix: false
      },

      // 性能规则
      {
        id: 'performance-n-plus-one',
        name: 'N+1 Query Problem',
        description: 'Detect potential N+1 query problems',
        category: 'performance',
        severity: 'warning',
        framework: ['nestjs', 'spring-boot'],
        enabled: true,
        pattern: 'for\\s*\\([^)]+\\)\\s*\\{[^}]*find',
        message: 'Potential N+1 query problem',
        suggestion: 'Use batch loading or eager loading',
        autoFix: false
      },
      {
        id: 'performance-large-objects',
        name: 'Large Object Creation',
        description: 'Detect creation of potentially large objects',
        category: 'performance',
        severity: 'info',
        framework: ['nestjs', 'spring-boot', 'express'],
        enabled: true,
        pattern: 'new\\s+(Array|Object|Map|Set)\\s*\\(',
        message: 'Large object creation detected',
        suggestion: 'Consider object pooling or lazy initialization',
        autoFix: false
      }
    ];

    rules.forEach(rule => {
      this.qualityRules.set(rule.id, rule);
    });
  }

  private async analyzeFile(file: any, framework: string): Promise<QualityCheck[]> {
    const issues: QualityCheck[] = [];
    const content = file.content;
    const lines = content.split('\n');

    // 获取适用于当前框架的规则
    const applicableRules = Array.from(this.qualityRules.values())
      .filter(rule => rule.enabled && rule.framework.includes(framework));

    for (const rule of applicableRules) {
      if (rule.pattern) {
        const regex = new RegExp(rule.pattern, 'g');
        
        lines.forEach((line, lineIndex) => {
          let match;
          while ((match = regex.exec(line)) !== null) {
            issues.push({
              rule,
              file: file.path,
              line: lineIndex + 1,
              column: match.index + 1,
              message: rule.message,
              suggestion: rule.suggestion,
              canAutoFix: rule.autoFix || false
            });
          }
          regex.lastIndex = 0; // 重置正则表达式
        });
      }
    }

    return issues;
  }

  private async calculateMetrics(files: any[], framework: string): Promise<QualityMetrics> {
    const metrics: QualityMetrics = {
      complexity: { average: 0, max: 0, files: [] },
      maintainability: { index: 0, factors: {} },
      testCoverage: { percentage: 0, lines: 0, functions: 0, branches: 0 },
      duplication: { percentage: 0, blocks: [] },
      dependencies: { count: 0, circular: [], unused: [] }
    };

    // 计算复杂度
    const complexityResults = files.map(file => ({
      file: file.path,
      complexity: this.calculateComplexity(file.content)
    }));

    metrics.complexity.files = complexityResults;
    metrics.complexity.average = complexityResults.reduce((sum, r) => sum + r.complexity, 0) / complexityResults.length;
    metrics.complexity.max = Math.max(...complexityResults.map(r => r.complexity));

    // 计算可维护性指数
    metrics.maintainability.index = this.calculateMaintainabilityIndex(files);

    // 分析依赖关系
    metrics.dependencies = this.analyzeDependencies(files);

    // 检测代码重复
    metrics.duplication = this.detectDuplication(files);

    return metrics;
  }

  private calculateComplexity(content: string): number {
    let complexity = 1; // 基础复杂度

    // 计算圈复杂度
    const complexityPatterns = [
      /\bif\b/g,
      /\belse\b/g,
      /\bwhile\b/g,
      /\bfor\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\b&&\b/g,
      /\b\|\|\b/g,
      /\?\s*:/g // 三元操作符
    ];

    complexityPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  private calculateMaintainabilityIndex(files: any[]): number {
    // 简化的可维护性指数计算
    let totalLines = 0;
    let totalComplexity = 0;
    let totalComments = 0;

    files.forEach(file => {
      const lines = file.content.split('\n');
      totalLines += lines.length;
      totalComplexity += this.calculateComplexity(file.content);
      
      // 计算注释行数
      const comments = file.content.match(/\/\/.*|\/\*[\s\S]*?\*\//g);
      totalComments += comments ? comments.length : 0;
    });

    const avgComplexity = totalComplexity / files.length;
    const commentRatio = totalComments / totalLines;
    
    // 简化的可维护性指数公式
    return Math.max(0, 171 - 5.2 * Math.log(avgComplexity) - 0.23 * avgComplexity - 16.2 * Math.log(totalLines) + 50 * Math.sin(Math.sqrt(2.4 * commentRatio)));
  }

  private analyzeDependencies(files: any[]): { count: number; circular: string[]; unused: string[] } {
    const dependencies = new Set<string>();
    const imports = new Map<string, string[]>();
    
    files.forEach(file => {
      const fileImports: string[] = [];
      const importMatches = file.content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
      
      if (importMatches) {
        importMatches.forEach((match: string) => {
          const moduleMatch = match.match(/from\s+['"]([^'"]+)['"]/);
          if (moduleMatch) {
            const module = moduleMatch[1];
            dependencies.add(module);
            fileImports.push(module);
          }
        });
      }
      
      imports.set(file.path, fileImports);
    });

    // 检测循环依赖（简化版）
    const circular: string[] = [];
    // 这里可以实现更复杂的循环依赖检测算法

    // 检测未使用的依赖（简化版）
    const unused: string[] = [];
    // 这里可以实现未使用依赖的检测

    return {
      count: dependencies.size,
      circular,
      unused
    };
  }

  private detectDuplication(files: any[]): { percentage: number; blocks: { file1: string; file2: string; lines: number }[] } {
    const blocks: { file1: string; file2: string; lines: number }[] = [];
    
    // 简化的重复代码检测
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const duplicateLines = this.findDuplicateLines(files[i].content, files[j].content);
        if (duplicateLines > 5) { // 超过5行重复认为是重复代码块
          blocks.push({
            file1: files[i].path,
            file2: files[j].path,
            lines: duplicateLines
          });
        }
      }
    }

    const totalLines = files.reduce((sum, file) => sum + file.content.split('\n').length, 0);
    const duplicateLines = blocks.reduce((sum, block) => sum + block.lines, 0);
    const percentage = totalLines > 0 ? (duplicateLines / totalLines) * 100 : 0;

    return { percentage, blocks };
  }

  private findDuplicateLines(content1: string, content2: string): number {
    const lines1 = content1.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const lines2 = content2.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let maxDuplicate = 0;
    
    for (let i = 0; i < lines1.length; i++) {
      for (let j = 0; j < lines2.length; j++) {
        let duplicate = 0;
        let k = 0;
        
        while (i + k < lines1.length && j + k < lines2.length && lines1[i + k] === lines2[j + k]) {
          duplicate++;
          k++;
        }
        
        maxDuplicate = Math.max(maxDuplicate, duplicate);
      }
    }
    
    return maxDuplicate;
  }

  private generateSummary(issues: QualityCheck[], totalFiles: number): any {
    const errorCount = issues.filter(issue => issue.rule.severity === 'error').length;
    const warningCount = issues.filter(issue => issue.rule.severity === 'warning').length;
    const infoCount = issues.filter(issue => issue.rule.severity === 'info').length;
    const totalIssues = issues.length;

    // 计算质量分数 (0-100)
    const maxPossibleIssues = totalFiles * 10; // 假设每个文件最多10个问题
    const score = Math.max(0, Math.min(100, 100 - (totalIssues / maxPossibleIssues) * 100));

    return {
      totalFiles,
      totalIssues,
      errorCount,
      warningCount,
      infoCount,
      score: Math.round(score)
    };
  }

  private generateSuggestions(report: QualityReport): string[] {
    const suggestions: string[] = [];

    if (report.summary.errorCount > 0) {
      suggestions.push('Fix all error-level issues before deployment');
    }

    if (report.metrics.complexity.average > 10) {
      suggestions.push('Consider refactoring complex functions to improve maintainability');
    }

    if (report.metrics.duplication.percentage > 5) {
      suggestions.push('Extract common code into reusable functions or modules');
    }

    if (report.metrics.dependencies.circular.length > 0) {
      suggestions.push('Resolve circular dependencies to improve code structure');
    }

    if (report.summary.score < 80) {
      suggestions.push('Overall code quality needs improvement. Focus on high-severity issues first');
    }

    return suggestions;
  }

  private async optimizeFile(file: any, framework: string): Promise<CodeOptimization[]> {
    const optimizations: CodeOptimization[] = [];

    // 优化导入语句
    const importOptimization = this.optimizeImports(file.content);
    if (importOptimization) {
      optimizations.push(importOptimization);
    }

    // 移除未使用的变量
    const unusedVarOptimization = this.removeUnusedVariables(file.content);
    if (unusedVarOptimization) {
      optimizations.push(unusedVarOptimization);
    }

    // 性能优化
    const performanceOptimizations = this.optimizePerformance(file.content, framework);
    optimizations.push(...performanceOptimizations);

    return optimizations;
  }

  private optimizeImports(content: string): CodeOptimization | null {
    const lines = content.split('\n');
    const imports: string[] = [];
    const otherLines: string[] = [];

    lines.forEach(line => {
      if (line.trim().startsWith('import ')) {
        imports.push(line);
      } else {
        otherLines.push(line);
      }
    });

    if (imports.length <= 1) return null;

    const sortedImports = imports.sort();
    const optimizedContent = [...sortedImports, '', ...otherLines].join('\n');

    return {
      type: 'import',
      description: 'Sort and organize import statements',
      before: imports.join('\n'),
      after: sortedImports.join('\n'),
      impact: 'low'
    };
  }

  private removeUnusedVariables(content: string): CodeOptimization | null {
    // 简化的未使用变量检测和移除
    const variableDeclarations = content.match(/(?:let|const|var)\s+(\w+)/g);
    if (!variableDeclarations) return null;

    const unusedVars: string[] = [];
    
    variableDeclarations.forEach(declaration => {
      const varMatch = declaration.match(/(?:let|const|var)\s+(\w+)/);
      if (varMatch) {
        const varName = varMatch[1];
        const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
        const usages = content.match(usageRegex);
        
        if (usages && usages.length === 1) { // 只有声明，没有使用
          unusedVars.push(varName);
        }
      }
    });

    if (unusedVars.length === 0) return null;

    return {
      type: 'unused',
      description: `Remove unused variables: ${unusedVars.join(', ')}`,
      before: unusedVars.map(v => `// Variable '${v}' is declared but never used`).join('\n'),
      after: '// Unused variables removed',
      impact: 'medium'
    };
  }

  private optimizePerformance(content: string, framework: string): CodeOptimization[] {
    const optimizations: CodeOptimization[] = [];

    // 检测可以优化的模式
    if (content.includes('.map(').includes('.filter(')) {
      optimizations.push({
        type: 'performance',
        description: 'Combine map and filter operations',
        before: 'array.filter(condition).map(transform)',
        after: 'array.reduce((acc, item) => condition(item) ? [...acc, transform(item)] : acc, [])',
        impact: 'medium'
      });
    }

    return optimizations;
  }

  private async applyFix(content: string, issue: QualityCheck): Promise<string> {
    const lines = content.split('\n');
    const lineIndex = issue.line - 1;

    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      
      switch (issue.rule.id) {
        case 'ts-unused-import':
          // 移除未使用的导入
          if (line.trim().startsWith('import ')) {
            lines.splice(lineIndex, 1);
          }
          break;
          
        case 'ts-prefer-const':
          // 将 let 替换为 const
          lines[lineIndex] = line.replace(/\blet\b/, 'const');
          break;
          
        case 'java-unused-import':
          // 移除未使用的Java导入
          if (line.trim().startsWith('import ')) {
            lines.splice(lineIndex, 1);
          }
          break;
      }
    }

    return lines.join('\n');
  }
}
