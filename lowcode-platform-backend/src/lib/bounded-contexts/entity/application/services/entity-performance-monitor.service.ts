import { Injectable } from '@nestjs/common';
import { EntityTemplateField } from './entity-template.service';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';

export interface PerformanceMetrics {
  operationType: 'create' | 'read' | 'update' | 'delete' | 'query';
  entityCode: string;
  duration: number;
  timestamp: Date;
  recordCount?: number;
  queryComplexity?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface EntityPerformanceReport {
  entityCode: string;
  totalOperations: number;
  averageResponseTime: number;
  slowestOperation: PerformanceMetrics;
  fastestOperation: PerformanceMetrics;
  operationBreakdown: {
    create: { count: number; avgDuration: number };
    read: { count: number; avgDuration: number };
    update: { count: number; avgDuration: number };
    delete: { count: number; avgDuration: number };
    query: { count: number; avgDuration: number };
  };
  performanceScore: number;
  recommendations: string[];
  trends: {
    period: string;
    avgResponseTime: number;
    operationCount: number;
  }[];
}

export interface PerformanceAlert {
  id: string;
  entityCode: string;
  alertType: 'slow_query' | 'high_memory' | 'frequent_errors' | 'performance_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  actualValue: number;
  timestamp: Date;
  resolved: boolean;
}

export interface PerformanceThresholds {
  maxResponseTime: number; // 毫秒
  maxMemoryUsage: number; // MB
  maxCpuUsage: number; // 百分比
  maxQueryComplexity: number;
  alertOnSlowQueries: boolean;
  alertOnHighMemory: boolean;
  alertOnPerformanceDegradation: boolean;
}

@Injectable()
export class EntityPerformanceMonitorService {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds: PerformanceThresholds = {
    maxResponseTime: 1000, // 1秒
    maxMemoryUsage: 100, // 100MB
    maxCpuUsage: 80, // 80%
    maxQueryComplexity: 10,
    alertOnSlowQueries: true,
    alertOnHighMemory: true,
    alertOnPerformanceDegradation: true,
  };

  /**
   * 记录性能指标
   */
  recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push({
      ...metrics,
      timestamp: new Date(),
    });

    // 检查是否需要触发告警
    this.checkAlerts(metrics);

    // 保持最近1000条记录
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * 开始性能监控
   */
  startMonitoring(entityCode: string, operationType: PerformanceMetrics['operationType']): () => void {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    return () => {
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB
      const duration = endTime - startTime;
      const memoryUsage = endMemory - startMemory;

      this.recordMetrics({
        operationType,
        entityCode,
        duration,
        timestamp: new Date(),
        memoryUsage,
      });
    };
  }

  /**
   * 获取实体性能报告
   */
  getEntityPerformanceReport(entityCode: string, days: number = 7): EntityPerformanceReport {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const entityMetrics = this.metrics.filter(
      m => m.entityCode === entityCode && m.timestamp >= cutoffDate
    );

    if (entityMetrics.length === 0) {
      return this.createEmptyReport(entityCode);
    }

    const totalOperations = entityMetrics.length;
    const averageResponseTime = entityMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations;
    const slowestOperation = entityMetrics.reduce((prev, current) => 
      prev.duration > current.duration ? prev : current
    );
    const fastestOperation = entityMetrics.reduce((prev, current) => 
      prev.duration < current.duration ? prev : current
    );

    const operationBreakdown = this.calculateOperationBreakdown(entityMetrics);
    const performanceScore = this.calculatePerformanceScore(entityMetrics);
    const recommendations = this.generatePerformanceRecommendations(entityMetrics);
    const trends = this.calculateTrends(entityMetrics, days);

    return {
      entityCode,
      totalOperations,
      averageResponseTime,
      slowestOperation,
      fastestOperation,
      operationBreakdown,
      performanceScore,
      recommendations,
      trends,
    };
  }

  /**
   * 获取所有实体的性能概览
   */
  getAllEntitiesPerformanceOverview(days: number = 7): EntityPerformanceReport[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffDate);
    const entityCodes = [...new Set(recentMetrics.map(m => m.entityCode))];

    return entityCodes.map(entityCode => this.getEntityPerformanceReport(entityCode, days));
  }

  /**
   * 获取性能告警
   */
  getPerformanceAlerts(entityCode?: string, resolved?: boolean): PerformanceAlert[] {
    let filteredAlerts = this.alerts;

    if (entityCode) {
      filteredAlerts = filteredAlerts.filter(alert => alert.entityCode === entityCode);
    }

    if (resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === resolved);
    }

    return filteredAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 解决告警
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * 设置性能阈值
   */
  setPerformanceThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * 获取性能阈值
   */
  getPerformanceThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  /**
   * 分析实体字段性能影响
   */
  analyzeFieldPerformanceImpact(fields: EntityTemplateField[]): {
    highImpactFields: string[];
    recommendations: string[];
    estimatedQueryTime: number;
  } {
    const highImpactFields: string[] = [];
    const recommendations: string[] = [];
    let estimatedQueryTime = 50; // 基础查询时间 50ms

    fields.forEach(field => {
      // 分析字段对性能的影响
      switch (field.dataType) {
        case FieldDataType.TEXT:
          highImpactFields.push(field.code);
          estimatedQueryTime += 20;
          recommendations.push(`字段 ${field.name} 使用 TEXT 类型，建议考虑限制长度或使用索引`);
          break;
        case FieldDataType.JSON:
          highImpactFields.push(field.code);
          estimatedQueryTime += 30;
          recommendations.push(`字段 ${field.name} 使用 JSON 类型，查询性能较低，建议优化查询条件`);
          break;
        case FieldDataType.STRING:
          if (field.length && field.length > 1000) {
            highImpactFields.push(field.code);
            estimatedQueryTime += 10;
            recommendations.push(`字段 ${field.name} 长度过长 (${field.length})，建议考虑分表或优化`);
          }
          break;
      }

      // 检查索引字段
      if (field.unique) {
        estimatedQueryTime -= 5; // 索引可以提升查询性能
      }
    });

    // 字段数量对性能的影响
    if (fields.length > 50) {
      estimatedQueryTime += (fields.length - 50) * 2;
      recommendations.push(`实体字段数量过多 (${fields.length})，建议考虑拆分实体`);
    }

    return {
      highImpactFields,
      recommendations,
      estimatedQueryTime,
    };
  }

  /**
   * 获取性能优化建议
   */
  getPerformanceOptimizationSuggestions(entityCode: string): string[] {
    const report = this.getEntityPerformanceReport(entityCode);
    const suggestions: string[] = [];

    // 基于平均响应时间的建议
    if (report.averageResponseTime > 500) {
      suggestions.push('平均响应时间较长，建议优化数据库查询或添加缓存');
    }

    // 基于操作类型分析
    if (report.operationBreakdown.query.avgDuration > 1000) {
      suggestions.push('查询操作耗时较长，建议优化查询条件或添加索引');
    }

    if (report.operationBreakdown.create.avgDuration > 300) {
      suggestions.push('创建操作耗时较长，建议检查字段验证逻辑或数据库约束');
    }

    if (report.operationBreakdown.update.avgDuration > 400) {
      suggestions.push('更新操作耗时较长，建议优化更新逻辑或减少字段数量');
    }

    // 基于性能评分的建议
    if (report.performanceScore < 60) {
      suggestions.push('整体性能评分较低，建议进行全面的性能优化');
    } else if (report.performanceScore < 80) {
      suggestions.push('性能有改进空间，建议关注慢查询优化');
    }

    return suggestions;
  }

  /**
   * 清理历史数据
   */
  cleanupHistoricalData(days: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffDate);
    this.alerts = this.alerts.filter(a => a.timestamp >= cutoffDate);
  }

  /**
   * 检查告警
   */
  private checkAlerts(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // 检查响应时间告警
    if (this.thresholds.alertOnSlowQueries && metrics.duration > this.thresholds.maxResponseTime) {
      alerts.push({
        id: this.generateAlertId(),
        entityCode: metrics.entityCode,
        alertType: 'slow_query',
        severity: this.getSeverity(metrics.duration, this.thresholds.maxResponseTime),
        message: `${metrics.operationType} 操作响应时间过长: ${metrics.duration}ms`,
        threshold: this.thresholds.maxResponseTime,
        actualValue: metrics.duration,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // 检查内存使用告警
    if (this.thresholds.alertOnHighMemory && metrics.memoryUsage && metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      alerts.push({
        id: this.generateAlertId(),
        entityCode: metrics.entityCode,
        alertType: 'high_memory',
        severity: this.getSeverity(metrics.memoryUsage, this.thresholds.maxMemoryUsage),
        message: `${metrics.operationType} 操作内存使用过高: ${metrics.memoryUsage.toFixed(2)}MB`,
        threshold: this.thresholds.maxMemoryUsage,
        actualValue: metrics.memoryUsage,
        timestamp: new Date(),
        resolved: false,
      });
    }

    this.alerts.push(...alerts);
  }

  /**
   * 计算操作类型分解
   */
  private calculateOperationBreakdown(metrics: PerformanceMetrics[]) {
    const breakdown = {
      create: { count: 0, avgDuration: 0 },
      read: { count: 0, avgDuration: 0 },
      update: { count: 0, avgDuration: 0 },
      delete: { count: 0, avgDuration: 0 },
      query: { count: 0, avgDuration: 0 },
    };

    const operationGroups = {
      create: metrics.filter(m => m.operationType === 'create'),
      read: metrics.filter(m => m.operationType === 'read'),
      update: metrics.filter(m => m.operationType === 'update'),
      delete: metrics.filter(m => m.operationType === 'delete'),
      query: metrics.filter(m => m.operationType === 'query'),
    };

    Object.keys(operationGroups).forEach(operation => {
      const ops = operationGroups[operation as keyof typeof operationGroups];
      if (ops.length > 0) {
        breakdown[operation as keyof typeof breakdown] = {
          count: ops.length,
          avgDuration: ops.reduce((sum, op) => sum + op.duration, 0) / ops.length,
        };
      }
    });

    return breakdown;
  }

  /**
   * 计算性能评分
   */
  private calculatePerformanceScore(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 100;

    const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
    const maxDuration = Math.max(...metrics.map(m => m.duration));
    const errorRate = 0; // 暂时设为0，后续可以添加错误统计

    // 基于响应时间的评分 (0-40分)
    let durationScore = 40;
    if (avgDuration > 1000) {
      durationScore = Math.max(0, 40 - (avgDuration - 1000) / 100);
    } else if (avgDuration > 500) {
      durationScore = 40 - (avgDuration - 500) / 25;
    }

    // 基于最大响应时间的评分 (0-30分)
    let maxDurationScore = 30;
    if (maxDuration > 5000) {
      maxDurationScore = Math.max(0, 30 - (maxDuration - 5000) / 500);
    } else if (maxDuration > 2000) {
      maxDurationScore = 30 - (maxDuration - 2000) / 200;
    }

    // 基于错误率的评分 (0-30分)
    const errorScore = Math.max(0, 30 - errorRate * 30);

    return Math.round(durationScore + maxDurationScore + errorScore);
  }

  /**
   * 生成性能建议
   */
  private generatePerformanceRecommendations(metrics: PerformanceMetrics[]): string[] {
    const recommendations: string[] = [];
    const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
    const slowQueries = metrics.filter(m => m.duration > 1000);

    if (avgDuration > 500) {
      recommendations.push('平均响应时间较长，建议优化数据库查询');
    }

    if (slowQueries.length > metrics.length * 0.1) {
      recommendations.push('存在较多慢查询，建议添加数据库索引');
    }

    const memoryMetrics = metrics.filter(m => m.memoryUsage && m.memoryUsage > 50);
    if (memoryMetrics.length > 0) {
      recommendations.push('部分操作内存使用较高，建议优化数据处理逻辑');
    }

    return recommendations;
  }

  /**
   * 计算趋势
   */
  private calculateTrends(metrics: PerformanceMetrics[], days: number) {
    const trends = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayMetrics = metrics.filter(m => m.timestamp >= dayStart && m.timestamp < dayEnd);
      
      if (dayMetrics.length > 0) {
        const avgResponseTime = dayMetrics.reduce((sum, m) => sum + m.duration, 0) / dayMetrics.length;
        trends.push({
          period: dayStart.toISOString().split('T')[0],
          avgResponseTime,
          operationCount: dayMetrics.length,
        });
      } else {
        trends.push({
          period: dayStart.toISOString().split('T')[0],
          avgResponseTime: 0,
          operationCount: 0,
        });
      }
    }

    return trends;
  }

  /**
   * 创建空报告
   */
  private createEmptyReport(entityCode: string): EntityPerformanceReport {
    return {
      entityCode,
      totalOperations: 0,
      averageResponseTime: 0,
      slowestOperation: null as any,
      fastestOperation: null as any,
      operationBreakdown: {
        create: { count: 0, avgDuration: 0 },
        read: { count: 0, avgDuration: 0 },
        update: { count: 0, avgDuration: 0 },
        delete: { count: 0, avgDuration: 0 },
        query: { count: 0, avgDuration: 0 },
      },
      performanceScore: 100,
      recommendations: [],
      trends: [],
    };
  }

  /**
   * 生成告警ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取告警严重程度
   */
  private getSeverity(actualValue: number, threshold: number): PerformanceAlert['severity'] {
    const ratio = actualValue / threshold;
    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }
}