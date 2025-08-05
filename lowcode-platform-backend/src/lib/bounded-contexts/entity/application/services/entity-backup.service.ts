import { Injectable } from '@nestjs/common';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';

export interface BackupConfiguration {
  id: string;
  name: string;
  description?: string;
  entityCodes: string[];
  backupType: BackupType;
  schedule: BackupSchedule;
  retention: RetentionPolicy;
  storage: StorageConfiguration;
  compression: CompressionSettings;
  encryption: EncryptionSettings;
  verification: VerificationSettings;
  isActive: boolean;
  lastBackupAt?: Date;
  nextBackupAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export type BackupType = 
  | 'full' 
  | 'incremental' 
  | 'differential' 
  | 'snapshot' 
  | 'continuous';

export interface BackupSchedule {
  type: 'manual' | 'cron' | 'interval' | 'event';
  cronExpression?: string;
  intervalHours?: number;
  eventTriggers?: string[];
  timezone: string;
  isActive: boolean;
  maxConcurrentBackups: number;
}

export interface RetentionPolicy {
  keepDaily: number;
  keepWeekly: number;
  keepMonthly: number;
  keepYearly: number;
  maxBackupSize: number; // MB
  autoCleanup: boolean;
  archiveOldBackups: boolean;
  archiveAfterDays: number;
}

export interface StorageConfiguration {
  type: 'local' | 's3' | 'azure' | 'gcp' | 'ftp' | 'sftp';
  path: string;
  credentials: {
    accessKey?: string;
    secretKey?: string;
    region?: string;
    bucket?: string;
    endpoint?: string;
    username?: string;
    password?: string;
    host?: string;
    port?: number;
  };
  redundancy: 'none' | 'local' | 'cross_region';
  storageClass?: string;
}

export interface CompressionSettings {
  enabled: boolean;
  algorithm: 'gzip' | 'bzip2' | 'lz4' | 'zstd';
  level: number; // 1-9
  chunkSize: number; // MB
}

export interface EncryptionSettings {
  enabled: boolean;
  algorithm: 'aes256' | 'aes128' | 'chacha20';
  keySource: 'generated' | 'provided' | 'kms';
  keyId?: string;
  rotationDays?: number;
}

export interface VerificationSettings {
  enabled: boolean;
  checksumAlgorithm: 'md5' | 'sha256' | 'sha512';
  verifyAfterBackup: boolean;
  verifyBeforeRestore: boolean;
  testRestoreFrequency: number; // days
}

export interface BackupJob {
  id: string;
  configurationId: string;
  type: 'scheduled' | 'manual' | 'triggered';
  backupType: BackupType;
  status: BackupJobStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  progress: BackupProgress;
  statistics: BackupStatistics;
  files: BackupFile[];
  errors: BackupError[];
  warnings: BackupWarning[];
  logs: BackupLog[];
  metadata: Record<string, any>;
}

export type BackupJobStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'verifying';

export interface BackupProgress {
  totalEntities: number;
  processedEntities: number;
  totalRecords: number;
  processedRecords: number;
  currentEntity?: string;
  currentOperation?: 'export' | 'compress' | 'encrypt' | 'upload' | 'verify';
  percentage: number;
  estimatedTimeRemaining?: number;
  dataTransferred: number; // bytes
  transferRate: number; // bytes/sec
}

export interface BackupStatistics {
  entitiesBackedUp: number;
  recordsBackedUp: number;
  originalSize: number; // bytes
  compressedSize: number; // bytes
  encryptedSize: number; // bytes
  compressionRatio: number;
  transferTime: number; // ms
  verificationTime: number; // ms
  checksumMatches: number;
  checksumMismatches: number;
}

export interface BackupFile {
  id: string;
  jobId: string;
  entityCode: string;
  fileName: string;
  filePath: string;
  fileSize: number; // bytes
  checksum: string;
  checksumAlgorithm: string;
  isCompressed: boolean;
  isEncrypted: boolean;
  recordCount: number;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface BackupError {
  id: string;
  jobId: string;
  type: 'export' | 'compression' | 'encryption' | 'upload' | 'verification' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: string;
  entityCode?: string;
  fileName?: string;
  timestamp: Date;
  isResolved: boolean;
  resolution?: string;
}

export interface BackupWarning {
  id: string;
  jobId: string;
  type: 'performance' | 'storage' | 'data_quality' | 'configuration';
  message: string;
  details?: string;
  entityCode?: string;
  timestamp: Date;
  isAcknowledged: boolean;
}

export interface BackupLog {
  id: string;
  jobId: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface RestoreJob {
  id: string;
  backupJobId: string;
  type: 'full' | 'partial' | 'point_in_time';
  status: RestoreJobStatus;
  targetEntities: string[];
  restoreOptions: RestoreOptions;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  progress: RestoreProgress;
  statistics: RestoreStatistics;
  errors: RestoreError[];
  warnings: RestoreWarning[];
  logs: RestoreLog[];
  metadata: Record<string, any>;
}

export type RestoreJobStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'validating';

export interface RestoreOptions {
  overwriteExisting: boolean;
  validateBeforeRestore: boolean;
  createMissingEntities: boolean;
  skipConflicts: boolean;
  restoreToTimestamp?: Date;
  targetDatabase?: string;
  fieldMappings?: Record<string, string>;
  transformations?: DataTransformation[];
}

export interface DataTransformation {
  entityCode: string;
  fieldCode: string;
  transformType: 'rename' | 'convert' | 'calculate' | 'lookup' | 'default';
  sourceValue?: string;
  targetValue?: string;
  expression?: string;
  defaultValue?: any;
}

export interface RestoreProgress {
  totalFiles: number;
  processedFiles: number;
  totalRecords: number;
  processedRecords: number;
  currentFile?: string;
  currentOperation?: 'download' | 'decrypt' | 'decompress' | 'validate' | 'import';
  percentage: number;
  estimatedTimeRemaining?: number;
}

export interface RestoreStatistics {
  filesRestored: number;
  recordsRestored: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  conflictsDetected: number;
  conflictsResolved: number;
  validationErrors: number;
  dataTransferred: number; // bytes
  restoreTime: number; // ms
}

export interface RestoreError {
  id: string;
  jobId: string;
  type: 'download' | 'decryption' | 'decompression' | 'validation' | 'import' | 'conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: string;
  entityCode?: string;
  recordId?: string;
  fileName?: string;
  timestamp: Date;
  isResolved: boolean;
  resolution?: string;
}

export interface RestoreWarning {
  id: string;
  jobId: string;
  type: 'data_mismatch' | 'schema_change' | 'performance' | 'conflict';
  message: string;
  details?: string;
  entityCode?: string;
  recordId?: string;
  timestamp: Date;
  isAcknowledged: boolean;
}

export interface RestoreLog {
  id: string;
  jobId: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface BackupMetrics {
  configurationId: string;
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  averageDuration: number;
  averageSize: number;
  totalStorageUsed: number;
  compressionEfficiency: number;
  lastBackupStatus: BackupJobStatus;
  lastBackupAt?: Date;
  nextBackupAt?: Date;
  reliability: number;
  storageEfficiency: number;
  recoveryTimeObjective: number; // RTO in minutes
  recoveryPointObjective: number; // RPO in minutes
}

export interface DisasterRecoveryPlan {
  id: string;
  name: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  triggerConditions: DisasterTrigger[];
  recoverySteps: RecoveryStep[];
  backupConfigurations: string[];
  notificationSettings: NotificationSettings;
  testingSchedule: TestingSchedule;
  isActive: boolean;
  lastTestedAt?: Date;
  lastExecutedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface DisasterTrigger {
  id: string;
  type: 'manual' | 'system_failure' | 'data_corruption' | 'security_breach' | 'natural_disaster';
  conditions: TriggerCondition[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoExecute: boolean;
  cooldownMinutes: number;
}

export interface TriggerCondition {
  metric: string;
  operator: '>' | '<' | '=' | '!=' | '>=' | '<=';
  value: number | string;
  duration?: number; // minutes
}

export interface RecoveryStep {
  id: string;
  name: string;
  description?: string;
  type: 'backup_restore' | 'system_restart' | 'notification' | 'custom_script';
  order: number;
  isRequired: boolean;
  timeout: number; // minutes
  retryCount: number;
  parameters: Record<string, any>;
  dependencies: string[];
}

export interface NotificationSettings {
  enabled: boolean;
  channels: NotificationChannel[];
  templates: NotificationTemplate[];
  escalationRules: EscalationRule[];
}

export interface NotificationChannel {
  id: string;
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams';
  configuration: Record<string, any>;
  isActive: boolean;
}

export interface NotificationTemplate {
  id: string;
  event: 'disaster_detected' | 'recovery_started' | 'recovery_completed' | 'recovery_failed' | 'test_completed';
  subject: string;
  content: string;
  channels: string[];
}

export interface EscalationRule {
  id: string;
  triggerAfterMinutes: number;
  targetChannels: string[];
  targetUsers: string[];
}

export interface TestingSchedule {
  enabled: boolean;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string; // HH:mm format
  timezone: string;
  includeFullRestore: boolean;
}

export interface BackupHealthCheck {
  configurationId: string;
  timestamp: Date;
  status: 'healthy' | 'warning' | 'critical';
  checks: {
    storage: HealthCheckResult;
    encryption: HealthCheckResult;
    compression: HealthCheckResult;
    retention: HealthCheckResult;
    performance: HealthCheckResult;
  };
  recommendations: string[];
}

export interface HealthCheckResult {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  lastChecked: Date;
  details?: Record<string, any>;
}

export interface BackupOptimizationSuggestion {
  type: 'performance' | 'storage' | 'reliability' | 'cost';
  priority: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
  recommendation: string;
  estimatedImprovement: {
    performanceGain?: number; // percentage
    storageReduction?: number; // percentage
    reliabilityIncrease?: number; // percentage
    costSaving?: number; // percentage
  };
  implementationEffort: 'low' | 'medium' | 'high';
  affectedConfigurations: string[];
}

/**
 * 实体备份服务
 * 处理实体数据的备份、恢复、归档和灾难恢复
 */
@Injectable()
export class EntityBackupService {
  private configurations = new Map<string, BackupConfiguration>();
  private backupJobs = new Map<string, BackupJob>();
  private restoreJobs = new Map<string, RestoreJob>();
  private disasterRecoveryPlans = new Map<string, DisasterRecoveryPlan>();
  private scheduledJobs = new Map<string, NodeJS.Timeout>();

  /**
   * 创建备份配置
   */
  async createBackupConfiguration(
    configuration: Omit<BackupConfiguration, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<BackupConfiguration> {
    await this.validateBackupConfiguration(configuration);

    const newConfiguration: BackupConfiguration = {
      ...configuration,
      id: this.generateId('backup_config'),
      createdAt: new Date(),
    };

    this.configurations.set(newConfiguration.id, newConfiguration);

    if (newConfiguration.isActive) {
      await this.scheduleBackup(newConfiguration);
    }

    return newConfiguration;
  }

  /**
   * 更新备份配置
   */
  async updateBackupConfiguration(
    id: string,
    updates: Partial<Omit<BackupConfiguration, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<BackupConfiguration> {
    const configuration = this.configurations.get(id);
    if (!configuration) {
      throw new Error(`备份配置 ${id} 不存在`);
    }

    const updatedConfiguration: BackupConfiguration = {
      ...configuration,
      ...updates,
      updatedAt: new Date(),
    };

    await this.validateBackupConfiguration(updatedConfiguration);
    this.configurations.set(id, updatedConfiguration);

    // 重新调度备份
    this.unscheduleBackup(id);
    if (updatedConfiguration.isActive) {
      await this.scheduleBackup(updatedConfiguration);
    }

    return updatedConfiguration;
  }

  /**
   * 删除备份配置
   */
  async deleteBackupConfiguration(id: string): Promise<void> {
    const configuration = this.configurations.get(id);
    if (!configuration) {
      throw new Error(`备份配置 ${id} 不存在`);
    }

    // 停止调度
    this.unscheduleBackup(id);

    // 删除相关的备份任务
    const relatedJobs = Array.from(this.backupJobs.values())
      .filter(job => job.configurationId === id);
    
    for (const job of relatedJobs) {
      await this.deleteBackupJob(job.id);
    }

    this.configurations.delete(id);
  }

  /**
   * 获取备份配置
   */
  getBackupConfiguration(id: string): BackupConfiguration | undefined {
    return this.configurations.get(id);
  }

  /**
   * 获取所有备份配置
   */
  getAllBackupConfigurations(): BackupConfiguration[] {
    return Array.from(this.configurations.values());
  }

  /**
   * 启动备份任务
   */
  async startBackupJob(
    configurationId: string,
    options: {
      type?: 'manual' | 'scheduled' | 'triggered';
      entityFilter?: string[];
      backupType?: BackupType;
    } = {}
  ): Promise<BackupJob> {
    const configuration = this.configurations.get(configurationId);
    if (!configuration) {
      throw new Error(`备份配置 ${configurationId} 不存在`);
    }

    const job: BackupJob = {
      id: this.generateId('backup_job'),
      configurationId,
      type: options.type || 'manual',
      backupType: options.backupType || configuration.backupType,
      status: 'pending',
      startedAt: new Date(),
      progress: {
        totalEntities: 0,
        processedEntities: 0,
        totalRecords: 0,
        processedRecords: 0,
        percentage: 0,
        dataTransferred: 0,
        transferRate: 0,
      },
      statistics: {
        entitiesBackedUp: 0,
        recordsBackedUp: 0,
        originalSize: 0,
        compressedSize: 0,
        encryptedSize: 0,
        compressionRatio: 0,
        transferTime: 0,
        verificationTime: 0,
        checksumMatches: 0,
        checksumMismatches: 0,
      },
      files: [],
      errors: [],
      warnings: [],
      logs: [],
      metadata: {},
    };

    this.backupJobs.set(job.id, job);

    // 异步执行备份任务
    this.executeBackupJob(job, configuration, options).catch(error => {
      this.handleBackupJobError(job, error);
    });

    return job;
  }

  /**
   * 停止备份任务
   */
  async stopBackupJob(jobId: string): Promise<void> {
    const job = this.backupJobs.get(jobId);
    if (!job) {
      throw new Error(`备份任务 ${jobId} 不存在`);
    }

    if (job.status === 'running') {
      job.status = 'cancelled';
      job.completedAt = new Date();
      job.duration = job.completedAt.getTime() - job.startedAt.getTime();
      this.addBackupJobLog(job, 'info', '备份任务已取消');
    }
  }

  /**
   * 获取备份任务状态
   */
  getBackupJobStatus(jobId: string): BackupJob | undefined {
    return this.backupJobs.get(jobId);
  }

  /**
   * 获取配置的备份任务列表
   */
  getConfigurationBackupJobs(configurationId: string): BackupJob[] {
    return Array.from(this.backupJobs.values())
      .filter(job => job.configurationId === configurationId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  /**
   * 启动恢复任务
   */
  async startRestoreJob(
    backupJobId: string,
    options: {
      type?: 'full' | 'partial' | 'point_in_time';
      targetEntities?: string[];
      restoreOptions?: Partial<RestoreOptions>;
    } = {}
  ): Promise<RestoreJob> {
    const backupJob = this.backupJobs.get(backupJobId);
    if (!backupJob) {
      throw new Error(`备份任务 ${backupJobId} 不存在`);
    }

    if (backupJob.status !== 'completed') {
      throw new Error('只能从已完成的备份任务恢复数据');
    }

    const restoreJob: RestoreJob = {
      id: this.generateId('restore_job'),
      backupJobId,
      type: options.type || 'full',
      status: 'pending',
      targetEntities: options.targetEntities || [],
      restoreOptions: {
        overwriteExisting: false,
        validateBeforeRestore: true,
        createMissingEntities: false,
        skipConflicts: false,
        ...options.restoreOptions,
      },
      startedAt: new Date(),
      progress: {
        totalFiles: 0,
        processedFiles: 0,
        totalRecords: 0,
        processedRecords: 0,
        percentage: 0,
      },
      statistics: {
        filesRestored: 0,
        recordsRestored: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        conflictsDetected: 0,
        conflictsResolved: 0,
        validationErrors: 0,
        dataTransferred: 0,
        restoreTime: 0,
      },
      errors: [],
      warnings: [],
      logs: [],
      metadata: {},
    };

    this.restoreJobs.set(restoreJob.id, restoreJob);

    // 异步执行恢复任务
    this.executeRestoreJob(restoreJob, backupJob).catch(error => {
      this.handleRestoreJobError(restoreJob, error);
    });

    return restoreJob;
  }

  /**
   * 停止恢复任务
   */
  async stopRestoreJob(jobId: string): Promise<void> {
    const job = this.restoreJobs.get(jobId);
    if (!job) {
      throw new Error(`恢复任务 ${jobId} 不存在`);
    }

    if (job.status === 'running') {
      job.status = 'cancelled';
      job.completedAt = new Date();
      job.duration = job.completedAt.getTime() - job.startedAt.getTime();
      this.addRestoreJobLog(job, 'info', '恢复任务已取消');
    }
  }

  /**
   * 获取恢复任务状态
   */
  getRestoreJobStatus(jobId: string): RestoreJob | undefined {
    return this.restoreJobs.get(jobId);
  }

  /**
   * 创建灾难恢复计划
   */
  async createDisasterRecoveryPlan(
    plan: Omit<DisasterRecoveryPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DisasterRecoveryPlan> {
    await this.validateDisasterRecoveryPlan(plan);

    const newPlan: DisasterRecoveryPlan = {
      ...plan,
      id: this.generateId('dr_plan'),
      createdAt: new Date(),
    };

    this.disasterRecoveryPlans.set(newPlan.id, newPlan);
    return newPlan;
  }

  /**
   * 更新灾难恢复计划
   */
  async updateDisasterRecoveryPlan(
    id: string,
    updates: Partial<Omit<DisasterRecoveryPlan, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<DisasterRecoveryPlan> {
    const plan = this.disasterRecoveryPlans.get(id);
    if (!plan) {
      throw new Error(`灾难恢复计划 ${id} 不存在`);
    }

    const updatedPlan: DisasterRecoveryPlan = {
      ...plan,
      ...updates,
      updatedAt: new Date(),
    };

    await this.validateDisasterRecoveryPlan(updatedPlan);
    this.disasterRecoveryPlans.set(id, updatedPlan);

    return updatedPlan;
  }

  /**
   * 删除灾难恢复计划
   */
  async deleteDisasterRecoveryPlan(id: string): Promise<void> {
    const plan = this.disasterRecoveryPlans.get(id);
    if (!plan) {
      throw new Error(`灾难恢复计划 ${id} 不存在`);
    }

    this.disasterRecoveryPlans.delete(id);
  }

  /**
   * 获取灾难恢复计划
   */
  getDisasterRecoveryPlan(id: string): DisasterRecoveryPlan | undefined {
    return this.disasterRecoveryPlans.get(id);
  }

  /**
   * 获取所有灾难恢复计划
   */
  getAllDisasterRecoveryPlans(): DisasterRecoveryPlan[] {
    return Array.from(this.disasterRecoveryPlans.values());
  }

  /**
   * 执行灾难恢复计划
   */
  async executeDisasterRecoveryPlan(
    planId: string,
    triggeredBy: string,
    triggerType: 'manual' | 'automatic' = 'manual'
  ): Promise<{
    executionId: string;
    status: 'started' | 'failed';
    message: string;
  }> {
    const plan = this.disasterRecoveryPlans.get(planId);
    if (!plan) {
      throw new Error(`灾难恢复计划 ${planId} 不存在`);
    }

    if (!plan.isActive) {
      throw new Error('灾难恢复计划未激活');
    }

    const executionId = this.generateId('dr_execution');

    try {
      // 发送开始通知
      await this.sendDisasterNotification(plan, 'recovery_started', {
        planId,
        executionId,
        triggeredBy,
        triggerType,
        timestamp: new Date(),
      });

      // 异步执行恢复步骤
      this.executeRecoverySteps(plan, executionId, triggeredBy).then(() => {
        // 发送完成通知
        this.sendDisasterNotification(plan, 'recovery_completed', {
          planId,
          executionId,
          triggeredBy,
          completedAt: new Date(),
        });
      }).catch(error => {
        // 发送失败通知
        this.sendDisasterNotification(plan, 'recovery_failed', {
          planId,
          executionId,
          triggeredBy,
          error: error.message,
          failedAt: new Date(),
        });
      });

      // 更新最后执行时间
      plan.lastExecutedAt = new Date();
      this.disasterRecoveryPlans.set(planId, plan);

      return {
        executionId,
        status: 'started',
        message: '灾难恢复计划已启动',
      };
    } catch (error) {
      return {
        executionId,
        status: 'failed',
        message: `灾难恢复计划启动失败: ${error.message}`,
      };
    }
  }

  /**
   * 测试灾难恢复计划
   */
  async testDisasterRecoveryPlan(planId: string): Promise<{
    success: boolean;
    duration: number;
    results: Array<{
      stepId: string;
      success: boolean;
      duration: number;
      error?: string;
    }>;
  }> {
    const plan = this.disasterRecoveryPlans.get(planId);
    if (!plan) {
      throw new Error(`灾难恢复计划 ${planId} 不存在`);
    }

    const startTime = Date.now();
    const results: Array<{
      stepId: string;
      success: boolean;
      duration: number;
      error?: string;
    }> = [];
    let overallSuccess = true;

    for (const step of plan.recoverySteps.sort((a, b) => a.order - b.order)) {
      const stepStartTime = Date.now();
      let stepSuccess = true;
      let error: string | undefined;

      try {
        await this.executeRecoveryStep(step, true); // 测试模式
      } catch (err) {
        stepSuccess = false;
        overallSuccess = false;
        error = err.message;
      }

      results.push({
        stepId: step.id,
        success: stepSuccess,
        duration: Date.now() - stepStartTime,
        error,
      });
    }

    // 更新最后测试时间
    plan.lastTestedAt = new Date();
    this.disasterRecoveryPlans.set(planId, plan);

    return {
      success: overallSuccess,
      duration: Date.now() - startTime,
      results,
    };
  }

  /**
   * 获取备份指标
   */
  getBackupMetrics(configurationId: string): BackupMetrics {
    const jobs = this.getConfigurationBackupJobs(configurationId);
    const successfulJobs = jobs.filter(job => job.status === 'completed');
    const failedJobs = jobs.filter(job => job.status === 'failed');
    
    const durations = successfulJobs
      .filter(job => job.duration)
      .map(job => job.duration!);
    
    const averageDuration = durations.length > 0 ? 
      durations.reduce((sum, duration) => sum + duration, 0) / durations.length : 0;
    
    const sizes = successfulJobs
      .map(job => job.statistics.encryptedSize)
      .filter(size => size > 0);
    
    const averageSize = sizes.length > 0 ? 
      sizes.reduce((sum, size) => sum + size, 0) / sizes.length : 0;
    
    const totalStorageUsed = sizes.reduce((sum, size) => sum + size, 0);
    
    const compressionRatios = successfulJobs
      .map(job => job.statistics.compressionRatio)
      .filter(ratio => ratio > 0);
    
    const compressionEfficiency = compressionRatios.length > 0 ? 
      compressionRatios.reduce((sum, ratio) => sum + ratio, 0) / compressionRatios.length : 0;
    
    const lastJob = jobs[0];
    const configuration = this.configurations.get(configurationId);
    
    const reliability = jobs.length > 0 ? (successfulJobs.length / jobs.length) * 100 : 0;
    const storageEfficiency = compressionEfficiency * 100;
    
    return {
      configurationId,
      totalBackups: jobs.length,
      successfulBackups: successfulJobs.length,
      failedBackups: failedJobs.length,
      averageDuration,
      averageSize,
      totalStorageUsed,
      compressionEfficiency,
      lastBackupStatus: lastJob?.status || 'pending',
      lastBackupAt: configuration?.lastBackupAt,
      nextBackupAt: configuration?.nextBackupAt,
      reliability,
      storageEfficiency,
      recoveryTimeObjective: 60, // 默认1小时
      recoveryPointObjective: 15, // 默认15分钟
    };
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck(configurationId: string): Promise<BackupHealthCheck> {
    const configuration = this.configurations.get(configurationId);
    if (!configuration) {
      throw new Error(`备份配置 ${configurationId} 不存在`);
    }

    const timestamp = new Date();
    const checks = {
      storage: await this.checkStorage(configuration),
      encryption: await this.checkEncryption(configuration),
      compression: await this.checkCompression(configuration),
      retention: await this.checkRetention(configuration),
      performance: await this.checkPerformance(configuration),
    };

    const overallStatus = this.determineOverallHealthStatus(checks);
    const recommendations = this.generateHealthRecommendations(checks);

    return {
      configurationId,
      timestamp,
      status: overallStatus,
      checks,
      recommendations,
    };
  }

  /**
   * 获取优化建议
   */
  getOptimizationSuggestions(configurationId?: string): BackupOptimizationSuggestion[] {
    const suggestions: BackupOptimizationSuggestion[] = [];
    const configurations = configurationId ? 
      [this.configurations.get(configurationId)].filter(Boolean) as BackupConfiguration[] :
      Array.from(this.configurations.values());

    for (const config of configurations) {
      const metrics = this.getBackupMetrics(config.id);
      
      // 性能优化建议
      if (metrics.averageDuration > 3600000) { // 超过1小时
        suggestions.push({
          type: 'performance',
          priority: 'high',
          description: '备份时间过长',
          impact: `当前平均备份时间 ${(metrics.averageDuration / 60000).toFixed(1)} 分钟`,
          recommendation: '考虑使用增量备份、提高压缩级别或优化存储配置',
          estimatedImprovement: {
            performanceGain: 50,
          },
          implementationEffort: 'medium',
          affectedConfigurations: [config.id],
        });
      }
      
      // 存储优化建议
      if (metrics.compressionEfficiency < 0.5) {
        suggestions.push({
          type: 'storage',
          priority: 'medium',
          description: '压缩效率较低',
          impact: `当前压缩效率 ${(metrics.compressionEfficiency * 100).toFixed(1)}%`,
          recommendation: '调整压缩算法或压缩级别以提高存储效率',
          estimatedImprovement: {
            storageReduction: 30,
          },
          implementationEffort: 'low',
          affectedConfigurations: [config.id],
        });
      }
      
      // 可靠性优化建议
      if (metrics.reliability < 90) {
        suggestions.push({
          type: 'reliability',
          priority: 'high',
          description: '备份可靠性较低',
          impact: `当前可靠性 ${metrics.reliability.toFixed(1)}%`,
          recommendation: '检查存储连接、增加重试机制或优化网络配置',
          estimatedImprovement: {
            reliabilityIncrease: 20,
          },
          implementationEffort: 'medium',
          affectedConfigurations: [config.id],
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 清理过期备份
   */
  async cleanupExpiredBackups(configurationId?: string): Promise<{
    deletedJobs: number;
    freedSpace: number;
    errors: string[];
  }> {
    const configurations = configurationId ? 
      [this.configurations.get(configurationId)].filter(Boolean) as BackupConfiguration[] :
      Array.from(this.configurations.values());

    let deletedJobs = 0;
    let freedSpace = 0;
    const errors: string[] = [];

    for (const config of configurations) {
      try {
        const jobs = this.getConfigurationBackupJobs(config.id);
        const jobsToDelete = this.identifyJobsForDeletion(jobs, config.retention);
        
        for (const job of jobsToDelete) {
          try {
            const jobSize = job.statistics.encryptedSize;
            await this.deleteBackupJob(job.id);
            deletedJobs++;
            freedSpace += jobSize;
          } catch (error) {
            errors.push(`删除备份任务 ${job.id} 失败: ${error.message}`);
          }
        }
      } catch (error) {
        errors.push(`清理配置 ${config.id} 的备份失败: ${error.message}`);
      }
    }

    return {
      deletedJobs,
      freedSpace,
      errors,
    };
  }

  // 私有方法实现
  private async validateBackupConfiguration(configuration: Omit<BackupConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!configuration.name || configuration.name.trim().length === 0) {
      throw new Error('备份配置名称不能为空');
    }

    if (!configuration.entityCodes || configuration.entityCodes.length === 0) {
      throw new Error('必须指定至少一个实体');
    }

    // 验证实体是否存在
    for (const entityCode of configuration.entityCodes) {
      const exists = await this.entityExists(entityCode);
      if (!exists) {
        throw new Error(`实体 ${entityCode} 不存在`);
      }
    }

    await this.validateStorageConfiguration(configuration.storage);
    this.validateSchedule(configuration.schedule);
    this.validateRetentionPolicy(configuration.retention);
  }

  private async validateStorageConfiguration(storage: StorageConfiguration): Promise<void> {
    if (!storage.path) {
      throw new Error('存储路径不能为空');
    }

    switch (storage.type) {
      case 's3':
        if (!storage.credentials.accessKey || !storage.credentials.secretKey || !storage.credentials.bucket) {
          throw new Error('S3存储配置缺少必要的凭据信息');
        }
        break;
      case 'azure':
        if (!storage.credentials.accessKey || !storage.credentials.secretKey) {
          throw new Error('Azure存储配置缺少必要的凭据信息');
        }
        break;
      case 'ftp':
      case 'sftp':
        if (!storage.credentials.host || !storage.credentials.username) {
          throw new Error('FTP/SFTP存储配置缺少必要的连接信息');
        }
        break;
    }

    // 测试存储连接
    try {
      await this.testStorageConnection(storage);
    } catch (error) {
      throw new Error(`存储连接测试失败: ${error.message}`);
    }
  }

  private validateSchedule(schedule: BackupSchedule): void {
    if (schedule.type === 'cron' && !schedule.cronExpression) {
      throw new Error('Cron调度必须提供cron表达式');
    }

    if (schedule.type === 'interval' && !schedule.intervalHours) {
      throw new Error('间隔调度必须提供间隔小时数');
    }

    if (schedule.maxConcurrentBackups < 1) {
      throw new Error('最大并发备份数必须大于0');
    }
  }

  private validateRetentionPolicy(retention: RetentionPolicy): void {
    if (retention.keepDaily < 0 || retention.keepWeekly < 0 || 
        retention.keepMonthly < 0 || retention.keepYearly < 0) {
      throw new Error('保留策略的保留数量不能为负数');
    }

    if (retention.maxBackupSize <= 0) {
      throw new Error('最大备份大小必须大于0');
    }

    if (retention.archiveAfterDays < 0) {
      throw new Error('归档天数不能为负数');
    }
  }

  private async validateDisasterRecoveryPlan(plan: Omit<DisasterRecoveryPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    if (plan.recoverySteps.length === 0) {
      throw new Error('灾难恢复计划必须包含至少一个恢复步骤');
    }

    // 验证步骤顺序的唯一性
    const orders = plan.recoverySteps.map(step => step.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      throw new Error('恢复步骤的顺序号必须唯一');
    }

    // 验证步骤依赖关系
    for (const step of plan.recoverySteps) {
      for (const depId of step.dependencies) {
        const depStep = plan.recoverySteps.find(s => s.id === depId);
        if (!depStep) {
          throw new Error(`恢复步骤 ${step.id} 依赖的步骤 ${depId} 不存在`);
        }
      }
    }

    // 验证备份配置是否存在
    for (const configId of plan.backupConfigurations) {
      const config = this.configurations.get(configId);
      if (!config) {
        throw new Error(`备份配置 ${configId} 不存在`);
      }
    }
  }

  private async testStorageConnection(storage: StorageConfiguration): Promise<void> {
    // 这里应该实现实际的存储连接测试逻辑
    console.log(`测试存储连接: ${storage.type}`);
  }

  private async scheduleBackup(configuration: BackupConfiguration): Promise<void> {
    if (configuration.schedule.type === 'manual') {
      return;
    }

    let timeout: NodeJS.Timeout;

    switch (configuration.schedule.type) {
      case 'interval':
        if (configuration.schedule.intervalHours) {
          timeout = setInterval(() => {
            this.triggerScheduledBackup(configuration.id);
          }, configuration.schedule.intervalHours * 60 * 60 * 1000);
        }
        break;
      case 'cron':
        // 这里应该实现cron调度逻辑
        console.log(`设置cron调度: ${configuration.schedule.cronExpression}`);
        break;
    }

    if (timeout!) {
      this.scheduledJobs.set(configuration.id, timeout);
    }

    // 计算下次备份时间
    configuration.nextBackupAt = this.calculateNextBackupTime(configuration.schedule);
    this.configurations.set(configuration.id, configuration);
  }

  private unscheduleBackup(configurationId: string): void {
    const timeout = this.scheduledJobs.get(configurationId);
    if (timeout) {
      clearInterval(timeout);
      this.scheduledJobs.delete(configurationId);
    }
  }

  private async triggerScheduledBackup(configurationId: string): Promise<void> {
    try {
      await this.startBackupJob(configurationId, { type: 'scheduled' });
    } catch (error) {
      console.error(`调度备份失败 ${configurationId}:`, error);
    }
  }

  private calculateNextBackupTime(schedule: BackupSchedule): Date {
    const now = new Date();
    
    switch (schedule.type) {
      case 'interval':
        if (schedule.intervalHours) {
          return new Date(now.getTime() + schedule.intervalHours * 60 * 60 * 1000);
        }
        break;
      case 'cron':
        // 这里应该实现cron表达式解析
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 简化为24小时后
    }
    
    return now;
  }

  private async executeBackupJob(
    job: BackupJob,
    configuration: BackupConfiguration,
    options: any
  ): Promise<void> {
    try {
      job.status = 'running';
      this.addBackupJobLog(job, 'info', '开始执行备份任务');

      // 导出数据
      await this.exportData(job, configuration, options);
      
      // 压缩数据
      if (configuration.compression.enabled) {
        await this.compressData(job, configuration);
      }
      
      // 加密数据
      if (configuration.encryption.enabled) {
        await this.encryptData(job, configuration);
      }
      
      // 上传数据
      await this.uploadData(job, configuration);
      
      // 验证备份
      if (configuration.verification.enabled) {
        await this.verifyBackup(job, configuration);
      }

      job.status = 'completed';
      job.completedAt = new Date();
      job.duration = job.completedAt.getTime() - job.startedAt.getTime();
      job.progress.percentage = 100;
      
      // 更新配置的最后备份时间
      configuration.lastBackupAt = job.completedAt;
      configuration.nextBackupAt = this.calculateNextBackupTime(configuration.schedule);
      this.configurations.set(configuration.id, configuration);
      
      this.addBackupJobLog(job, 'info', `备份任务完成，耗时 ${(job.duration / 1000).toFixed(1)} 秒`);
    } catch (error) {
      this.handleBackupJobError(job, error);
    } finally {
      this.backupJobs.set(job.id, job);
    }
  }

  private async exportData(
    job: BackupJob,
    configuration: BackupConfiguration,
    options: any
  ): Promise<void> {
    job.progress.currentOperation = 'export';
    this.addBackupJobLog(job, 'info', '开始导出数据');

    const entityCodes = options.entityFilter || configuration.entityCodes;
    job.progress.totalEntities = entityCodes.length;

    for (const entityCode of entityCodes) {
      job.progress.currentEntity = entityCode;
      
      // 导出实体数据
      const recordCount = await this.exportEntityData(
        entityCode, 
        job.backupType, 
        configuration.lastBackupAt
      );
      
      // 创建备份文件记录
      const backupFile: BackupFile = {
        id: this.generateId('backup_file'),
        jobId: job.id,
        entityCode,
        fileName: `${entityCode}_${Date.now()}.json`,
        filePath: `/backup/${job.id}/${entityCode}.json`,
        fileSize: recordCount * 100, // 简化计算
        checksum: this.generateChecksum(`${entityCode}_${recordCount}`),
        checksumAlgorithm: configuration.verification.checksumAlgorithm,
        isCompressed: false,
        isEncrypted: false,
        recordCount,
        createdAt: new Date(),
        metadata: {},
      };
      
      job.files.push(backupFile);
      job.statistics.entitiesBackedUp++;
      job.statistics.recordsBackedUp += recordCount;
      job.statistics.originalSize += backupFile.fileSize;
      job.progress.processedEntities++;
      job.progress.processedRecords += recordCount;
    }

    job.progress.percentage = 25;
    this.addBackupJobLog(job, 'info', `数据导出完成，共导出 ${job.statistics.recordsBackedUp} 条记录`);
  }

  private async compressData(
    job: BackupJob,
    configuration: BackupConfiguration
  ): Promise<void> {
    job.progress.currentOperation = 'compress';
    this.addBackupJobLog(job, 'info', '开始压缩数据');

    for (const file of job.files) {
      // 这里应该实现实际的压缩逻辑
      file.isCompressed = true;
      const compressedSize = Math.floor(file.fileSize * 0.7); // 简化为70%
      job.statistics.compressedSize += compressedSize;
    }

    job.statistics.compressionRatio = job.statistics.compressedSize / job.statistics.originalSize;
    job.progress.percentage = 50;

    this.addBackupJobLog(job, 'info', `数据压缩完成，压缩率 ${(job.statistics.compressionRatio * 100).toFixed(1)}%`);
  }

  private async encryptData(
    job: BackupJob,
    configuration: BackupConfiguration
  ): Promise<void> {
    job.progress.currentOperation = 'encrypt';
    this.addBackupJobLog(job, 'info', '开始加密数据');

    for (const file of job.files) {
      // 这里应该实现实际的加密逻辑
      file.isEncrypted = true;
      const encryptedSize = job.statistics.compressedSize || file.fileSize;
      job.statistics.encryptedSize += encryptedSize;
    }

    job.progress.percentage = 75;

    this.addBackupJobLog(job, 'info', '数据加密完成');
  }

  private async uploadData(
    job: BackupJob,
    configuration: BackupConfiguration
  ): Promise<void> {
    job.progress.currentOperation = 'upload';
    this.addBackupJobLog(job, 'info', '开始上传数据');

    const startTime = Date.now();
    let totalTransferred = 0;

    for (const file of job.files) {
      await this.uploadFile(file, configuration.storage);
      totalTransferred += file.fileSize;
      job.progress.dataTransferred = totalTransferred;
    }

    job.statistics.transferTime = Date.now() - startTime;
    job.progress.transferRate = totalTransferred / (job.statistics.transferTime / 1000);
    job.progress.percentage = 90;

    this.addBackupJobLog(job, 'info', `数据上传完成，传输速率 ${(job.progress.transferRate / 1024 / 1024).toFixed(2)} MB/s`);
  }

  private async verifyBackup(
    job: BackupJob,
    configuration: BackupConfiguration
  ): Promise<void> {
    job.status = 'verifying';
    job.progress.currentOperation = 'verify';
    this.addBackupJobLog(job, 'info', '开始验证备份');

    const startTime = Date.now();

    for (const file of job.files) {
      const isValid = await this.verifyFile(file, configuration.storage);
      if (isValid) {
        job.statistics.checksumMatches++;
      } else {
        job.statistics.checksumMismatches++;
      }
    }

    job.statistics.verificationTime = Date.now() - startTime;
    job.progress.percentage = 95;

    this.addBackupJobLog(job, 'info', `备份验证完成，${job.statistics.checksumMatches} 个文件通过验证`);
  }

  private async executeRestoreJob(
    restoreJob: RestoreJob,
    backupJob: BackupJob
  ): Promise<void> {
    try {
      restoreJob.status = 'running';
      this.addRestoreJobLog(restoreJob, 'info', '开始执行恢复任务');

      restoreJob.progress.totalFiles = backupJob.files.length;
      restoreJob.progress.totalRecords = backupJob.statistics.recordsBackedUp;

      // 下载备份文件
      await this.downloadData(restoreJob, backupJob);
      
      // 解密数据
      if (backupJob.files.some(f => f.isEncrypted)) {
        await this.decryptData(restoreJob, backupJob);
      }
      
      // 解压数据
      if (backupJob.files.some(f => f.isCompressed)) {
        await this.decompressData(restoreJob, backupJob);
      }
      
      // 验证数据
      if (restoreJob.restoreOptions.validateBeforeRestore) {
        await this.validateRestoreData(restoreJob);
      }
      
      // 导入数据
      await this.importData(restoreJob, backupJob);

      restoreJob.status = 'completed';
      restoreJob.completedAt = new Date();
      restoreJob.duration = restoreJob.completedAt.getTime() - restoreJob.startedAt.getTime();
      restoreJob.progress.percentage = 100;
      
      this.addRestoreJobLog(restoreJob, 'info', `恢复任务完成，耗时 ${(restoreJob.duration / 1000).toFixed(1)} 秒`);
    } catch (error) {
      this.handleRestoreJobError(restoreJob, error);
    } finally {
      this.restoreJobs.set(restoreJob.id, restoreJob);
    }
  }

  private async downloadData(
    restoreJob: RestoreJob,
    backupJob: BackupJob
  ): Promise<void> {
    restoreJob.progress.currentOperation = 'download';
    this.addRestoreJobLog(restoreJob, 'info', '开始下载备份文件');

    for (const file of backupJob.files) {
      if (restoreJob.targetEntities.length > 0 && 
          !restoreJob.targetEntities.includes(file.entityCode)) {
        continue;
      }

      // 这里应该实现实际的文件下载逻辑
      await this.downloadFile(file);
      restoreJob.progress.processedFiles++;
      restoreJob.statistics.dataTransferred += file.fileSize;
    }

    restoreJob.progress.percentage = 25;
    this.addRestoreJobLog(restoreJob, 'info', '备份文件下载完成');
  }

  private async decryptData(
    restoreJob: RestoreJob,
    backupJob: BackupJob
  ): Promise<void> {
    restoreJob.progress.currentOperation = 'decrypt';
    this.addRestoreJobLog(restoreJob, 'info', '开始解密数据');

    for (const file of backupJob.files) {
      if (file.isEncrypted) {
        // 这里应该实现实际的解密逻辑
        await this.decryptFile(file);
      }
    }

    restoreJob.progress.percentage = 50;
    this.addRestoreJobLog(restoreJob, 'info', '数据解密完成');
  }

  private async decompressData(
    restoreJob: RestoreJob,
    backupJob: BackupJob
  ): Promise<void> {
    restoreJob.progress.currentOperation = 'decompress';
    this.addRestoreJobLog(restoreJob, 'info', '开始解压数据');

    for (const file of backupJob.files) {
      if (file.isCompressed) {
        // 这里应该实现实际的解压逻辑
        await this.decompressFile(file);
      }
    }

    restoreJob.progress.percentage = 65;
    this.addRestoreJobLog(restoreJob, 'info', '数据解压完成');
  }

  private async validateRestoreData(restoreJob: RestoreJob): Promise<void> {
    restoreJob.progress.currentOperation = 'validate';
    this.addRestoreJobLog(restoreJob, 'info', '开始验证恢复数据');

    // 这里应该实现数据验证逻辑
    restoreJob.progress.percentage = 80;
    this.addRestoreJobLog(restoreJob, 'info', '数据验证完成');
  }

  private async importData(
    restoreJob: RestoreJob,
    backupJob: BackupJob
  ): Promise<void> {
    restoreJob.progress.currentOperation = 'import';
    this.addRestoreJobLog(restoreJob, 'info', '开始导入数据');

    for (const file of backupJob.files) {
      if (restoreJob.targetEntities.length > 0 && 
          !restoreJob.targetEntities.includes(file.entityCode)) {
        continue;
      }

      const importedCount = await this.importEntityData(
        file.entityCode,
        file.recordCount,
        restoreJob.restoreOptions
      );

      restoreJob.statistics.recordsRestored += importedCount;
      restoreJob.statistics.filesRestored++;
      restoreJob.progress.processedRecords += importedCount;
    }

    restoreJob.progress.percentage = 95;
    this.addRestoreJobLog(restoreJob, 'info', '数据导入完成');
  }

  private async executeRecoverySteps(
    plan: DisasterRecoveryPlan,
    executionId: string,
    triggeredBy: string
  ): Promise<void> {
    const sortedSteps = plan.recoverySteps.sort((a, b) => a.order - b.order);
    
    for (const step of sortedSteps) {
      await this.executeRecoveryStep(step, false);
    }
  }

  private async executeRecoveryStep(
    step: RecoveryStep,
    testMode: boolean = false
  ): Promise<void> {
    switch (step.type) {
      case 'backup_restore':
        if (!testMode) {
          // 执行备份恢复
          const backupJobId = step.parameters.backupJobId;
          if (backupJobId) {
            await this.startRestoreJob(backupJobId);
          }
        }
        break;
      case 'system_restart':
        if (!testMode) {
          // 执行系统重启逻辑
          console.log('执行系统重启');
        }
        break;
      case 'notification':
        // 发送通知
        console.log('发送恢复通知');
        break;
      case 'custom_script':
        if (!testMode) {
          // 执行自定义脚本
          console.log('执行自定义脚本');
        }
        break;
    }
  }

  private async sendDisasterNotification(
    plan: DisasterRecoveryPlan,
    event: 'disaster_detected' | 'recovery_started' | 'recovery_completed' | 'recovery_failed' | 'test_completed',
    data: Record<string, any>
  ): Promise<void> {
    if (!plan.notificationSettings.enabled) {
      return;
    }

    const template = plan.notificationSettings.templates.find(t => t.event === event);
    if (!template) {
      return;
    }

    // 这里应该实现实际的通知发送逻辑
    console.log(`发送通知: ${template.subject}`, data);
  }

  private identifyJobsForDeletion(
    jobs: BackupJob[],
    retention: RetentionPolicy
  ): BackupJob[] {
    const now = new Date();
    const jobsToDelete: BackupJob[] = [];
    
    // 按时间排序，最新的在前
    const sortedJobs = jobs
      .filter(job => job.status === 'completed')
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    
    // 保留策略逻辑
    const dailyJobs = sortedJobs.slice(retention.keepDaily);
    const weeklyJobs = this.filterWeeklyJobs(sortedJobs).slice(retention.keepWeekly);
    const monthlyJobs = this.filterMonthlyJobs(sortedJobs).slice(retention.keepMonthly);
    const yearlyJobs = this.filterYearlyJobs(sortedJobs).slice(retention.keepYearly);
    
    // 合并需要删除的任务
    const toDelete = new Set([...dailyJobs, ...weeklyJobs, ...monthlyJobs, ...yearlyJobs]);
    
    return Array.from(toDelete);
  }

  private filterWeeklyJobs(jobs: BackupJob[]): BackupJob[] {
    const weeklyJobs: BackupJob[] = [];
    const seenWeeks = new Set<string>();
    
    for (const job of jobs) {
      const weekKey = this.getWeekKey(job.startedAt);
      if (!seenWeeks.has(weekKey)) {
        weeklyJobs.push(job);
        seenWeeks.add(weekKey);
      }
    }
    
    return weeklyJobs;
  }

  private filterMonthlyJobs(jobs: BackupJob[]): BackupJob[] {
    const monthlyJobs: BackupJob[] = [];
    const seenMonths = new Set<string>();
    
    for (const job of jobs) {
      const monthKey = this.getMonthKey(job.startedAt);
      if (!seenMonths.has(monthKey)) {
        monthlyJobs.push(job);
        seenMonths.add(monthKey);
      }
    }
    
    return monthlyJobs;
  }

  private filterYearlyJobs(jobs: BackupJob[]): BackupJob[] {
    const yearlyJobs: BackupJob[] = [];
    const seenYears = new Set<number>();
    
    for (const job of jobs) {
      const year = job.startedAt.getFullYear();
      if (!seenYears.has(year)) {
        yearlyJobs.push(job);
        seenYears.add(year);
      }
    }
    
    return yearlyJobs;
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
  }

  private getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }

  private async deleteBackupJob(jobId: string): Promise<void> {
    const job = this.backupJobs.get(jobId);
    if (!job) {
      return;
    }

    // 删除备份文件
    for (const file of job.files) {
      await this.deleteBackupFile(file);
    }

    this.backupJobs.delete(jobId);
  }

  private async deleteBackupFile(file: BackupFile): Promise<void> {
    // 这里应该实现实际的文件删除逻辑
    console.log(`删除备份文件: ${file.filePath}`);
  }

  private async exportEntityData(
    entityCode: string,
    backupType: BackupType,
    lastBackupAt?: Date
  ): Promise<number> {
    // 这里应该实现实际的实体数据导出逻辑
    console.log(`导出实体数据: ${entityCode}, 类型: ${backupType}`);
    return Math.floor(Math.random() * 1000) + 100; // 模拟记录数
  }

  private async importEntityData(
    entityCode: string,
    recordCount: number,
    options: RestoreOptions
  ): Promise<number> {
    // 这里应该实现实际的实体数据导入逻辑
    console.log(`导入实体数据: ${entityCode}, 记录数: ${recordCount}`);
    return recordCount; // 模拟导入成功的记录数
  }

  private async uploadFile(
    file: BackupFile,
    storage: StorageConfiguration
  ): Promise<void> {
    // 这里应该实现实际的文件上传逻辑
    console.log(`上传文件: ${file.fileName} 到 ${storage.type}`);
  }

  private async downloadFile(file: BackupFile): Promise<void> {
    // 这里应该实现实际的文件下载逻辑
    console.log(`下载文件: ${file.fileName}`);
  }

  private async verifyFile(
    file: BackupFile,
    storage: StorageConfiguration
  ): Promise<boolean> {
    // 这里应该实现实际的文件验证逻辑
    console.log(`验证文件: ${file.fileName}`);
    return Math.random() > 0.1; // 90%的成功率
  }

  private async decryptFile(file: BackupFile): Promise<void> {
    // 这里应该实现实际的文件解密逻辑
    console.log(`解密文件: ${file.fileName}`);
  }

  private async decompressFile(file: BackupFile): Promise<void> {
    // 这里应该实现实际的文件解压逻辑
    console.log(`解压文件: ${file.fileName}`);
  }

  private async checkStorage(configuration: BackupConfiguration): Promise<HealthCheckResult> {
    try {
      await this.testStorageConnection(configuration.storage);
      return {
        status: 'pass',
        message: '存储连接正常',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `存储连接失败: ${error.message}`,
        lastChecked: new Date(),
      };
    }
  }

  private async checkEncryption(configuration: BackupConfiguration): Promise<HealthCheckResult> {
    if (!configuration.encryption.enabled) {
      return {
        status: 'warn',
        message: '加密未启用',
        lastChecked: new Date(),
      };
    }

    return {
      status: 'pass',
      message: '加密配置正常',
      lastChecked: new Date(),
    };
  }

  private async checkCompression(configuration: BackupConfiguration): Promise<HealthCheckResult> {
    if (!configuration.compression.enabled) {
      return {
        status: 'warn',
        message: '压缩未启用',
        lastChecked: new Date(),
      };
    }

    return {
      status: 'pass',
      message: '压缩配置正常',
      lastChecked: new Date(),
    };
  }

  private async checkRetention(configuration: BackupConfiguration): Promise<HealthCheckResult> {
    const totalRetention = configuration.retention.keepDaily + 
                          configuration.retention.keepWeekly + 
                          configuration.retention.keepMonthly + 
                          configuration.retention.keepYearly;
    
    if (totalRetention === 0) {
      return {
        status: 'fail',
        message: '保留策略配置错误',
        lastChecked: new Date(),
      };
    }

    return {
      status: 'pass',
      message: '保留策略配置正常',
      lastChecked: new Date(),
    };
  }

  private async checkPerformance(configuration: BackupConfiguration): Promise<HealthCheckResult> {
    const metrics = this.getBackupMetrics(configuration.id);
    
    if (metrics.averageDuration > 7200000) { // 超过2小时
      return {
        status: 'warn',
        message: '备份性能较差',
        lastChecked: new Date(),
        details: { averageDuration: metrics.averageDuration },
      };
    }

    return {
      status: 'pass',
      message: '备份性能正常',
      lastChecked: new Date(),
    };
  }

  private determineOverallHealthStatus(checks: {
    storage: HealthCheckResult;
    encryption: HealthCheckResult;
    compression: HealthCheckResult;
    retention: HealthCheckResult;
    performance: HealthCheckResult;
  }): 'healthy' | 'warning' | 'critical' {
    const results = Object.values(checks);
    
    if (results.some(r => r.status === 'fail')) {
      return 'critical';
    }
    
    if (results.some(r => r.status === 'warn')) {
      return 'warning';
    }
    
    return 'healthy';
  }

  private generateHealthRecommendations(checks: {
    storage: HealthCheckResult;
    encryption: HealthCheckResult;
    compression: HealthCheckResult;
    retention: HealthCheckResult;
    performance: HealthCheckResult;
  }): string[] {
    const recommendations: string[] = [];
    
    if (checks.storage.status === 'fail') {
      recommendations.push('检查存储连接配置');
    }
    
    if (checks.encryption.status === 'warn') {
      recommendations.push('建议启用数据加密');
    }
    
    if (checks.compression.status === 'warn') {
      recommendations.push('建议启用数据压缩以节省存储空间');
    }
    
    if (checks.retention.status === 'fail') {
      recommendations.push('修正保留策略配置');
    }
    
    if (checks.performance.status === 'warn') {
      recommendations.push('优化备份性能配置');
    }
    
    return recommendations;
  }

  private handleBackupJobError(job: BackupJob, error: any): void {
    job.status = 'failed';
    job.completedAt = new Date();
    job.duration = job.completedAt.getTime() - job.startedAt.getTime();
    
    const backupError: BackupError = {
      id: this.generateId('backup_error'),
      jobId: job.id,
      type: 'system',
      severity: 'high',
      message: error.message || '未知错误',
      details: error.stack,
      timestamp: new Date(),
      isResolved: false,
    };
    
    job.errors.push(backupError);
    this.addBackupJobLog(job, 'error', `备份任务失败: ${error.message}`);
  }

  private handleRestoreJobError(job: RestoreJob, error: any): void {
    job.status = 'failed';
    job.completedAt = new Date();
    job.duration = job.completedAt.getTime() - job.startedAt.getTime();
    
    const restoreError: RestoreError = {
      id: this.generateId('restore_error'),
      jobId: job.id,
      type: 'import',
      severity: 'high',
      message: error.message || '未知错误',
      details: error.stack,
      timestamp: new Date(),
      isResolved: false,
    };
    
    job.errors.push(restoreError);
    this.addRestoreJobLog(job, 'error', `恢复任务失败: ${error.message}`);
  }

  private addBackupJobLog(
    job: BackupJob,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    details?: Record<string, any>
  ): void {
    const log: BackupLog = {
      id: this.generateId('backup_log'),
      jobId: job.id,
      level,
      message,
      details,
      timestamp: new Date(),
    };
    
    job.logs.push(log);
  }

  private addRestoreJobLog(
    job: RestoreJob,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    details?: Record<string, any>
  ): void {
    const log: RestoreLog = {
      id: this.generateId('restore_log'),
      jobId: job.id,
      level,
      message,
      details,
      timestamp: new Date(),
    };
    
    job.logs.push(log);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChecksum(data: string): string {
    // 这里应该实现实际的校验和生成逻辑
    return `checksum_${data.length}_${Date.now()}`;
  }

  private async entityExists(entityCode: string): Promise<boolean> {
    // 这里应该实现实际的实体存在性检查逻辑
    return true; // 简化为总是返回true
  }
}