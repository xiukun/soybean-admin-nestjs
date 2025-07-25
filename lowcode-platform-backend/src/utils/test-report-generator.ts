import * as fs from 'fs-extra';
import * as path from 'path';
import { TestResult } from '../services/e2e-test.service';

/**
 * 测试报告生成器
 */
export class TestReportGenerator {
  
  /**
   * 生成HTML测试报告
   */
  static async generateHtmlReport(
    results: TestResult[],
    outputPath: string = './test-reports/e2e-report.html'
  ): Promise<string> {
    const reportData = this.analyzeResults(results);
    const htmlContent = this.generateHtmlContent(reportData);
    
    // 确保输出目录存在
    await fs.ensureDir(path.dirname(outputPath));
    
    // 写入HTML文件
    await fs.writeFile(outputPath, htmlContent, 'utf8');
    
    return outputPath;
  }

  /**
   * 生成JSON测试报告
   */
  static async generateJsonReport(
    results: TestResult[],
    outputPath: string = './test-reports/e2e-report.json'
  ): Promise<string> {
    const reportData = this.analyzeResults(results);
    
    // 确保输出目录存在
    await fs.ensureDir(path.dirname(outputPath));
    
    // 写入JSON文件
    await fs.writeFile(outputPath, JSON.stringify(reportData, null, 2), 'utf8');
    
    return outputPath;
  }

  /**
   * 生成Markdown测试报告
   */
  static async generateMarkdownReport(
    results: TestResult[],
    outputPath: string = './test-reports/e2e-report.md'
  ): Promise<string> {
    const reportData = this.analyzeResults(results);
    const markdownContent = this.generateMarkdownContent(reportData);
    
    // 确保输出目录存在
    await fs.ensureDir(path.dirname(outputPath));
    
    // 写入Markdown文件
    await fs.writeFile(outputPath, markdownContent, 'utf8');
    
    return outputPath;
  }

  /**
   * 分析测试结果
   */
  private static analyzeResults(results: TestResult[]) {
    const totalScenarios = results.length;
    const passedScenarios = results.filter(r => r.status === 'passed').length;
    const failedScenarios = results.filter(r => r.status === 'failed' || r.status === 'error').length;
    const skippedScenarios = results.filter(r => r.status === 'skipped').length;
    
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalScenarios > 0 ? totalDuration / totalScenarios : 0;
    
    const successRate = totalScenarios > 0 ? (passedScenarios / totalScenarios) * 100 : 0;
    
    // 按类型分组
    const scenariosByType = results.reduce((groups, result) => {
      const type = result.scenarioId.split('-')[0] || 'unknown';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(result);
      return groups;
    }, {} as Record<string, TestResult[]>);

    // 分析失败原因
    const failureAnalysis = this.analyzeFailures(results);
    
    // 性能分析
    const performanceAnalysis = this.analyzePerformance(results);
    
    return {
      summary: {
        totalScenarios,
        passedScenarios,
        failedScenarios,
        skippedScenarios,
        successRate: Math.round(successRate * 100) / 100,
        totalDuration,
        averageDuration: Math.round(averageDuration),
        generatedAt: new Date().toISOString(),
      },
      scenarios: results.map(r => ({
        ...r,
        formattedDuration: this.formatDuration(r.duration),
        stepSummary: {
          total: r.stepResults.length,
          passed: r.stepResults.filter(s => s.status === 'passed').length,
          failed: r.stepResults.filter(s => s.status === 'failed' || s.status === 'error').length,
        },
      })),
      scenariosByType,
      failureAnalysis,
      performanceAnalysis,
      metadata: {
        platform: 'Lowcode Platform E2E Test',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 分析失败原因
   */
  private static analyzeFailures(results: TestResult[]) {
    const failures: Array<{ scenario: string; step: string; error: string; count: number }> = [];
    const errorCounts: Record<string, number> = {};

    results.forEach(result => {
      if (result.status === 'failed' || result.status === 'error') {
        if (result.error) {
          errorCounts[result.error] = (errorCounts[result.error] || 0) + 1;
        }
      }

      result.stepResults.forEach(step => {
        if (step.status === 'failed' || step.status === 'error') {
          const key = `${result.scenarioName} - ${step.stepName}`;
          const error = step.error || 'Unknown error';
          
          const existing = failures.find(f => f.scenario === result.scenarioName && f.step === step.stepName && f.error === error);
          if (existing) {
            existing.count++;
          } else {
            failures.push({
              scenario: result.scenarioName,
              step: step.stepName,
              error,
              count: 1,
            });
          }
          
          errorCounts[error] = (errorCounts[error] || 0) + 1;
        }
      });
    });

    const commonErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      failures: failures.sort((a, b) => b.count - a.count),
      commonErrors,
      totalFailures: failures.reduce((sum, f) => sum + f.count, 0),
    };
  }

  /**
   * 分析性能数据
   */
  private static analyzePerformance(results: TestResult[]) {
    const durations = results.map(r => r.duration).sort((a, b) => a - b);
    const stepDurations = results.flatMap(r => r.stepResults.map(s => s.duration)).sort((a, b) => a - b);

    const percentile = (arr: number[], p: number) => {
      const index = Math.ceil(arr.length * p / 100) - 1;
      return arr[index] || 0;
    };

    const slowestScenarios = [...results]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .map(r => ({
        name: r.scenarioName,
        duration: r.duration,
        formattedDuration: this.formatDuration(r.duration),
      }));

    const fastestScenarios = [...results]
      .sort((a, b) => a.duration - b.duration)
      .slice(0, 5)
      .map(r => ({
        name: r.scenarioName,
        duration: r.duration,
        formattedDuration: this.formatDuration(r.duration),
      }));

    return {
      scenarioPerformance: {
        min: durations[0] || 0,
        max: durations[durations.length - 1] || 0,
        median: percentile(durations, 50),
        p95: percentile(durations, 95),
        p99: percentile(durations, 99),
        average: durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0,
      },
      stepPerformance: {
        min: stepDurations[0] || 0,
        max: stepDurations[stepDurations.length - 1] || 0,
        median: percentile(stepDurations, 50),
        p95: percentile(stepDurations, 95),
        average: stepDurations.length > 0 ? stepDurations.reduce((sum, d) => sum + d, 0) / stepDurations.length : 0,
      },
      slowestScenarios,
      fastestScenarios,
    };
  }

  /**
   * 生成HTML内容
   */
  private static generateHtmlContent(reportData: any): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>低代码平台端到端测试报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
        }
        .summary-card .value {
            font-size: 2em;
            font-weight: bold;
            margin: 0;
        }
        .success { color: #28a745; }
        .danger { color: #dc3545; }
        .warning { color: #ffc107; }
        .info { color: #17a2b8; }
        .section {
            background: white;
            margin-bottom: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .section-header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #dee2e6;
        }
        .section-header h2 {
            margin: 0;
            color: #495057;
        }
        .section-content {
            padding: 20px;
        }
        .scenario-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .scenario-item {
            padding: 15px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .scenario-item:last-child {
            border-bottom: none;
        }
        .scenario-name {
            font-weight: 500;
        }
        .scenario-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: 500;
            text-transform: uppercase;
        }
        .status-passed {
            background: #d4edda;
            color: #155724;
        }
        .status-failed {
            background: #f8d7da;
            color: #721c24;
        }
        .status-error {
            background: #f8d7da;
            color: #721c24;
        }
        .status-skipped {
            background: #fff3cd;
            color: #856404;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745, #20c997);
            transition: width 0.3s ease;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .table th,
        .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        .table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #495057;
        }
        .table tr:hover {
            background: #f8f9fa;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>低代码平台端到端测试报告</h1>
        <p>生成时间: ${new Date(reportData.summary.generatedAt).toLocaleString('zh-CN')}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>总场景数</h3>
            <p class="value info">${reportData.summary.totalScenarios}</p>
        </div>
        <div class="summary-card">
            <h3>通过场景</h3>
            <p class="value success">${reportData.summary.passedScenarios}</p>
        </div>
        <div class="summary-card">
            <h3>失败场景</h3>
            <p class="value danger">${reportData.summary.failedScenarios}</p>
        </div>
        <div class="summary-card">
            <h3>成功率</h3>
            <p class="value ${reportData.summary.successRate >= 80 ? 'success' : reportData.summary.successRate >= 60 ? 'warning' : 'danger'}">${reportData.summary.successRate}%</p>
        </div>
        <div class="summary-card">
            <h3>总耗时</h3>
            <p class="value info">${this.formatDuration(reportData.summary.totalDuration)}</p>
        </div>
        <div class="summary-card">
            <h3>平均耗时</h3>
            <p class="value info">${this.formatDuration(reportData.summary.averageDuration)}</p>
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            <h2>整体进度</h2>
        </div>
        <div class="section-content">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${reportData.summary.successRate}%"></div>
            </div>
            <p>成功率: ${reportData.summary.successRate}% (${reportData.summary.passedScenarios}/${reportData.summary.totalScenarios})</p>
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            <h2>测试场景详情</h2>
        </div>
        <div class="section-content">
            <ul class="scenario-list">
                ${reportData.scenarios.map((scenario: any) => `
                    <li class="scenario-item">
                        <div>
                            <div class="scenario-name">${scenario.scenarioName}</div>
                            <small>耗时: ${scenario.formattedDuration} | 步骤: ${scenario.stepSummary.passed}/${scenario.stepSummary.total} 通过</small>
                        </div>
                        <span class="scenario-status status-${scenario.status}">${scenario.status}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    </div>

    ${reportData.failureAnalysis.failures.length > 0 ? `
    <div class="section">
        <div class="section-header">
            <h2>失败分析</h2>
        </div>
        <div class="section-content">
            <h3>常见错误</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>错误信息</th>
                        <th>出现次数</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.failureAnalysis.commonErrors.map((error: any) => `
                        <tr>
                            <td>${error.error}</td>
                            <td>${error.count}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-header">
            <h2>性能分析</h2>
        </div>
        <div class="section-content">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div>
                    <h3>最慢场景</h3>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>场景名称</th>
                                <th>耗时</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.performanceAnalysis.slowestScenarios.map((scenario: any) => `
                                <tr>
                                    <td>${scenario.name}</td>
                                    <td>${scenario.formattedDuration}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div>
                    <h3>最快场景</h3>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>场景名称</th>
                                <th>耗时</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.performanceAnalysis.fastestScenarios.map((scenario: any) => `
                                <tr>
                                    <td>${scenario.name}</td>
                                    <td>${scenario.formattedDuration}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>报告由低代码平台自动生成 | 环境: ${reportData.metadata.environment} | Node.js: ${reportData.metadata.nodeVersion}</p>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * 生成Markdown内容
   */
  private static generateMarkdownContent(reportData: any): string {
    return `
# 低代码平台端到端测试报告

**生成时间:** ${new Date(reportData.summary.generatedAt).toLocaleString('zh-CN')}

## 📊 测试概览

| 指标 | 数值 |
|------|------|
| 总场景数 | ${reportData.summary.totalScenarios} |
| 通过场景 | ${reportData.summary.passedScenarios} |
| 失败场景 | ${reportData.summary.failedScenarios} |
| 跳过场景 | ${reportData.summary.skippedScenarios} |
| 成功率 | ${reportData.summary.successRate}% |
| 总耗时 | ${this.formatDuration(reportData.summary.totalDuration)} |
| 平均耗时 | ${this.formatDuration(reportData.summary.averageDuration)} |

## 🧪 测试场景详情

${reportData.scenarios.map((scenario: any) => `
### ${scenario.scenarioName}

- **状态:** ${scenario.status === 'passed' ? '✅ 通过' : scenario.status === 'failed' ? '❌ 失败' : scenario.status === 'error' ? '💥 错误' : '⏭️ 跳过'}
- **耗时:** ${scenario.formattedDuration}
- **步骤:** ${scenario.stepSummary.passed}/${scenario.stepSummary.total} 通过
${scenario.error ? `- **错误:** ${scenario.error}` : ''}
`).join('')}

${reportData.failureAnalysis.failures.length > 0 ? `
## ❌ 失败分析

### 常见错误

${reportData.failureAnalysis.commonErrors.map((error: any) => `
- **${error.error}** (${error.count} 次)
`).join('')}

### 详细失败信息

${reportData.failureAnalysis.failures.map((failure: any) => `
- **${failure.scenario} - ${failure.step}:** ${failure.error} (${failure.count} 次)
`).join('')}
` : ''}

## ⚡ 性能分析

### 场景性能统计

- **最快:** ${this.formatDuration(reportData.performanceAnalysis.scenarioPerformance.min)}
- **最慢:** ${this.formatDuration(reportData.performanceAnalysis.scenarioPerformance.max)}
- **中位数:** ${this.formatDuration(reportData.performanceAnalysis.scenarioPerformance.median)}
- **95分位:** ${this.formatDuration(reportData.performanceAnalysis.scenarioPerformance.p95)}
- **平均值:** ${this.formatDuration(reportData.performanceAnalysis.scenarioPerformance.average)}

### 最慢场景 Top 5

${reportData.performanceAnalysis.slowestScenarios.map((scenario: any, index: number) => `
${index + 1}. **${scenario.name}** - ${scenario.formattedDuration}
`).join('')}

### 最快场景 Top 5

${reportData.performanceAnalysis.fastestScenarios.map((scenario: any, index: number) => `
${index + 1}. **${scenario.name}** - ${scenario.formattedDuration}
`).join('')}

## 📋 环境信息

- **平台:** ${reportData.metadata.platform}
- **版本:** ${reportData.metadata.version}
- **环境:** ${reportData.metadata.environment}
- **Node.js:** ${reportData.metadata.nodeVersion}
- **生成时间:** ${reportData.metadata.timestamp}

---

*此报告由低代码平台自动生成*
    `.trim();
  }

  /**
   * 格式化持续时间
   */
  private static formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${Math.round(milliseconds / 1000 * 100) / 100}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = Math.round((milliseconds % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }
}
