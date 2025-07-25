import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PerformanceMonitorService } from '../services/performance-monitor.service';

/**
 * 性能监控控制器
 * 提供性能监控数据的API接口
 */
@ApiTags('Performance Monitoring')
@Controller('performance')
export class PerformanceMonitorController {
  constructor(private readonly performanceMonitor: PerformanceMonitorService) {}

  /**
   * 获取系统资源使用情况
   */
  @Get('system/resources')
  @ApiOperation({ 
    summary: 'Get system resource usage',
    description: 'Get current system resource usage including memory, CPU, and heap information'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System resource usage retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        memory: {
          type: 'object',
          properties: {
            total: { type: 'number', description: 'Total memory in bytes' },
            used: { type: 'number', description: 'Used memory in bytes' },
            free: { type: 'number', description: 'Free memory in bytes' },
            usagePercent: { type: 'number', description: 'Memory usage percentage' },
          },
        },
        cpu: {
          type: 'object',
          properties: {
            user: { type: 'number', description: 'User CPU time in microseconds' },
            system: { type: 'number', description: 'System CPU time in microseconds' },
            usagePercent: { type: 'number', description: 'CPU usage percentage' },
          },
        },
        heap: {
          type: 'object',
          properties: {
            used: { type: 'number', description: 'Used heap memory in bytes' },
            total: { type: 'number', description: 'Total heap memory in bytes' },
            usagePercent: { type: 'number', description: 'Heap usage percentage' },
          },
        },
        eventLoopDelay: { type: 'number', description: 'Event loop delay in milliseconds' },
        activeHandles: { type: 'number', description: 'Number of active handles' },
        activeRequests: { type: 'number', description: 'Number of active requests' },
      },
    },
  })
  getSystemResources() {
    return this.performanceMonitor.getSystemResourceUsage();
  }

  /**
   * 获取所有操作的性能统计
   */
  @Get('stats')
  @ApiOperation({ 
    summary: 'Get all operation statistics',
    description: 'Get performance statistics for all monitored operations'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Operation statistics retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          operation: { type: 'string', description: 'Operation name' },
          totalRequests: { type: 'number', description: 'Total number of requests' },
          successRequests: { type: 'number', description: 'Number of successful requests' },
          errorRequests: { type: 'number', description: 'Number of failed requests' },
          averageResponseTime: { type: 'number', description: 'Average response time in milliseconds' },
          minResponseTime: { type: 'number', description: 'Minimum response time in milliseconds' },
          maxResponseTime: { type: 'number', description: 'Maximum response time in milliseconds' },
          p95ResponseTime: { type: 'number', description: '95th percentile response time in milliseconds' },
          p99ResponseTime: { type: 'number', description: '99th percentile response time in milliseconds' },
          throughput: { type: 'number', description: 'Throughput (requests per second)' },
          errorRate: { type: 'number', description: 'Error rate percentage' },
          lastUpdated: { type: 'string', format: 'date-time', description: 'Last updated timestamp' },
        },
      },
    },
  })
  getAllStats() {
    return this.performanceMonitor.getAllStats();
  }

  /**
   * 获取特定操作的性能统计
   */
  @Get('stats/:operation')
  @ApiOperation({ 
    summary: 'Get operation statistics',
    description: 'Get performance statistics for a specific operation'
  })
  @ApiParam({ 
    name: 'operation', 
    description: 'Operation name (URL encoded)',
    example: 'UserController.findAll'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Operation statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Operation not found',
  })
  getOperationStats(@Param('operation') operation: string) {
    const decodedOperation = decodeURIComponent(operation);
    const stats = this.performanceMonitor.getOperationStats(decodedOperation);
    
    if (!stats) {
      return {
        status: 1,
        msg: 'Operation not found',
        data: null,
      };
    }

    return {
      status: 0,
      msg: 'success',
      data: stats,
    };
  }

  /**
   * 获取性能报告
   */
  @Get('report')
  @ApiOperation({ 
    summary: 'Get performance report',
    description: 'Get comprehensive performance report including system resources and operation statistics'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance report retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        systemResources: { 
          type: 'object',
          description: 'Current system resource usage'
        },
        operationStats: { 
          type: 'array',
          description: 'Performance statistics for all operations'
        },
        summary: {
          type: 'object',
          properties: {
            totalOperations: { type: 'number', description: 'Total number of monitored operations' },
            totalRequests: { type: 'number', description: 'Total number of requests' },
            averageResponseTime: { type: 'number', description: 'Overall average response time' },
            errorRate: { type: 'number', description: 'Overall error rate percentage' },
          },
        },
      },
    },
  })
  getPerformanceReport() {
    return this.performanceMonitor.getPerformanceReport();
  }

  /**
   * 获取健康检查信息
   */
  @Get('health')
  @ApiOperation({ 
    summary: 'Get health check information',
    description: 'Get application health status based on performance metrics'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health check completed successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'warning', 'critical'], description: 'Overall health status' },
        timestamp: { type: 'string', format: 'date-time', description: 'Health check timestamp' },
        uptime: { type: 'number', description: 'Application uptime in seconds' },
        checks: {
          type: 'object',
          properties: {
            memory: { type: 'object', description: 'Memory health check' },
            cpu: { type: 'object', description: 'CPU health check' },
            responseTime: { type: 'object', description: 'Response time health check' },
            errorRate: { type: 'object', description: 'Error rate health check' },
          },
        },
      },
    },
  })
  getHealthCheck() {
    const systemResources = this.performanceMonitor.getSystemResourceUsage();
    const report = this.performanceMonitor.getPerformanceReport();
    
    // 健康检查逻辑
    const checks = {
      memory: {
        status: systemResources.memory.usagePercent < 80 ? 'healthy' : 
                systemResources.memory.usagePercent < 90 ? 'warning' : 'critical',
        value: systemResources.memory.usagePercent,
        threshold: 80,
        message: `Memory usage: ${systemResources.memory.usagePercent.toFixed(2)}%`,
      },
      cpu: {
        status: systemResources.cpu.usagePercent < 70 ? 'healthy' : 
                systemResources.cpu.usagePercent < 85 ? 'warning' : 'critical',
        value: systemResources.cpu.usagePercent,
        threshold: 70,
        message: `CPU usage: ${systemResources.cpu.usagePercent.toFixed(2)}%`,
      },
      responseTime: {
        status: report.summary.averageResponseTime < 500 ? 'healthy' : 
                report.summary.averageResponseTime < 1000 ? 'warning' : 'critical',
        value: report.summary.averageResponseTime,
        threshold: 500,
        message: `Average response time: ${report.summary.averageResponseTime.toFixed(2)}ms`,
      },
      errorRate: {
        status: report.summary.errorRate < 1 ? 'healthy' : 
                report.summary.errorRate < 5 ? 'warning' : 'critical',
        value: report.summary.errorRate,
        threshold: 1,
        message: `Error rate: ${report.summary.errorRate.toFixed(2)}%`,
      },
    };

    // 计算整体健康状态
    const criticalCount = Object.values(checks).filter(check => check.status === 'critical').length;
    const warningCount = Object.values(checks).filter(check => check.status === 'warning').length;
    
    let overallStatus = 'healthy';
    if (criticalCount > 0) {
      overallStatus = 'critical';
    } else if (warningCount > 0) {
      overallStatus = 'warning';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    };
  }

  /**
   * 获取性能指标（Prometheus格式）
   */
  @Get('metrics')
  @ApiOperation({ 
    summary: 'Get performance metrics',
    description: 'Get performance metrics in Prometheus format'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance metrics retrieved successfully',
    schema: {
      type: 'string',
      description: 'Metrics in Prometheus format',
    },
  })
  getMetrics() {
    const systemResources = this.performanceMonitor.getSystemResourceUsage();
    const stats = this.performanceMonitor.getAllStats();
    
    let metrics = '';
    
    // 系统资源指标
    metrics += `# HELP memory_usage_bytes Memory usage in bytes\n`;
    metrics += `# TYPE memory_usage_bytes gauge\n`;
    metrics += `memory_usage_bytes{type="used"} ${systemResources.memory.used}\n`;
    metrics += `memory_usage_bytes{type="total"} ${systemResources.memory.total}\n`;
    
    metrics += `# HELP cpu_usage_percent CPU usage percentage\n`;
    metrics += `# TYPE cpu_usage_percent gauge\n`;
    metrics += `cpu_usage_percent ${systemResources.cpu.usagePercent}\n`;
    
    metrics += `# HELP heap_usage_bytes Heap memory usage in bytes\n`;
    metrics += `# TYPE heap_usage_bytes gauge\n`;
    metrics += `heap_usage_bytes{type="used"} ${systemResources.heap.used}\n`;
    metrics += `heap_usage_bytes{type="total"} ${systemResources.heap.total}\n`;
    
    // 操作性能指标
    stats.forEach(stat => {
      const operation = stat.operation.replace(/[^a-zA-Z0-9_]/g, '_');
      
      metrics += `# HELP http_requests_total Total number of HTTP requests\n`;
      metrics += `# TYPE http_requests_total counter\n`;
      metrics += `http_requests_total{operation="${stat.operation}",status="success"} ${stat.successRequests}\n`;
      metrics += `http_requests_total{operation="${stat.operation}",status="error"} ${stat.errorRequests}\n`;
      
      metrics += `# HELP http_request_duration_milliseconds HTTP request duration in milliseconds\n`;
      metrics += `# TYPE http_request_duration_milliseconds histogram\n`;
      metrics += `http_request_duration_milliseconds_sum{operation="${stat.operation}"} ${stat.averageResponseTime * stat.totalRequests}\n`;
      metrics += `http_request_duration_milliseconds_count{operation="${stat.operation}"} ${stat.totalRequests}\n`;
    });
    
    return metrics;
  }

  /**
   * 重置性能统计数据
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Reset performance statistics',
    description: 'Reset all performance statistics data'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance statistics reset successfully',
  })
  resetStats() {
    this.performanceMonitor.resetStats();
    return {
      status: 0,
      msg: 'Performance statistics reset successfully',
      data: null,
    };
  }

  /**
   * 清理过期指标
   */
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cleanup expired metrics',
    description: 'Manually trigger cleanup of expired performance metrics'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cleanup completed successfully',
  })
  cleanup() {
    this.performanceMonitor.cleanup();
    return {
      status: 0,
      msg: 'Cleanup completed successfully',
      data: null,
    };
  }
}
