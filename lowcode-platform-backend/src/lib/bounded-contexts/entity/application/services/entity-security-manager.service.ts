import { Injectable } from '@nestjs/common';
import { EntityTemplateField } from './entity-template.service';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';

export interface SecurityPolicy {
  id: string;
  entityCode: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  rules: SecurityRule[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityRule {
  id: string;
  type: 'access_control' | 'data_masking' | 'field_encryption' | 'audit_logging' | 'rate_limiting' | 'ip_restriction';
  fieldCode?: string;
  condition: SecurityCondition;
  action: SecurityAction;
  isActive: boolean;
  priority: number;
}

export interface SecurityCondition {
  type: 'role_based' | 'user_based' | 'time_based' | 'location_based' | 'data_based' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
  additionalParams?: Record<string, any>;
}

export interface SecurityAction {
  type: 'allow' | 'deny' | 'mask' | 'encrypt' | 'log' | 'alert' | 'throttle';
  parameters?: Record<string, any>;
  maskingPattern?: string;
  encryptionAlgorithm?: string;
  logLevel?: 'info' | 'warn' | 'error';
  alertRecipients?: string[];
}

export interface AccessPermission {
  entityCode: string;
  fieldCode?: string;
  userId?: string;
  roleId?: string;
  permissions: ('read' | 'write' | 'delete' | 'create')[];
  conditions?: SecurityCondition[];
  expiresAt?: Date;
  grantedBy: string;
  grantedAt: Date;
}

export interface DataMaskingRule {
  fieldCode: string;
  maskingType: 'partial' | 'full' | 'hash' | 'tokenize' | 'custom';
  pattern: string;
  replacement: string;
  preserveLength: boolean;
  conditions: SecurityCondition[];
}

export interface EncryptionConfig {
  fieldCode: string;
  algorithm: 'AES-256' | 'RSA' | 'ChaCha20';
  keyId: string;
  isEnabled: boolean;
  rotationInterval: number; // 天数
  lastRotated: Date;
}

export interface SecurityAuditLog {
  id: string;
  entityCode: string;
  fieldCode?: string;
  userId: string;
  action: 'read' | 'write' | 'delete' | 'create' | 'export' | 'import';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  dataSnapshot?: any;
  riskScore: number;
  metadata: Record<string, any>;
}

export interface SecurityAlert {
  id: string;
  type: 'unauthorized_access' | 'data_breach' | 'suspicious_activity' | 'policy_violation' | 'system_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  entityCode: string;
  userId?: string;
  description: string;
  timestamp: Date;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export interface SecurityMetrics {
  entityCode: string;
  period: { from: Date; to: Date };
  totalAccess: number;
  unauthorizedAttempts: number;
  dataExports: number;
  alertsGenerated: number;
  policiesViolated: number;
  averageRiskScore: number;
  topRiskyUsers: { userId: string; riskScore: number }[];
  topAccessedFields: { fieldCode: string; accessCount: number }[];
}

export interface ComplianceReport {
  entityCode: string;
  reportType: 'GDPR' | 'HIPAA' | 'SOX' | 'PCI_DSS' | 'custom';
  generatedAt: Date;
  period: { from: Date; to: Date };
  compliance: {
    score: number;
    status: 'compliant' | 'non_compliant' | 'partial';
    violations: string[];
    recommendations: string[];
  };
  dataProcessing: {
    personalDataFields: string[];
    sensitiveDataFields: string[];
    encryptedFields: string[];
    maskedFields: string[];
  };
  accessControls: {
    totalUsers: number;
    privilegedUsers: number;
    roleBasedAccess: boolean;
    mfaEnabled: boolean;
  };
  auditTrail: {
    logsRetentionDays: number;
    completeness: number;
    integrity: boolean;
  };
}

@Injectable()
export class EntitySecurityManagerService {
  private policies = new Map<string, SecurityPolicy[]>();
  private permissions = new Map<string, AccessPermission[]>();
  private maskingRules = new Map<string, DataMaskingRule[]>();
  private encryptionConfigs = new Map<string, EncryptionConfig[]>();
  private auditLogs: SecurityAuditLog[] = [];
  private alerts: SecurityAlert[] = [];
  private riskScoreCache = new Map<string, number>();

  /**
   * 创建安全策略
   */
  createSecurityPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): SecurityPolicy {
    const newPolicy: SecurityPolicy = {
      ...policy,
      id: this.generateId('policy'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const entityPolicies = this.getEntityPolicies(policy.entityCode);
    entityPolicies.push(newPolicy);
    this.policies.set(policy.entityCode, entityPolicies);

    return newPolicy;
  }

  /**
   * 获取实体安全策略
   */
  getEntityPolicies(entityCode: string): SecurityPolicy[] {
    return this.policies.get(entityCode) || [];
  }

  /**
   * 检查访问权限
   */
  checkAccess(
    entityCode: string,
    fieldCode: string | undefined,
    userId: string,
    action: 'read' | 'write' | 'delete' | 'create',
    context: Record<string, any> = {}
  ): {
    allowed: boolean;
    reason?: string;
    appliedRules: string[];
    riskScore: number;
  } {
    const policies = this.getActivePolicies(entityCode);
    const permissions = this.getUserPermissions(entityCode, userId);
    const appliedRules: string[] = [];
    let allowed = false;
    let reason = '';
    
    // 检查基础权限
    const hasPermission = this.hasBasicPermission(permissions, fieldCode, action);
    if (!hasPermission) {
      reason = '用户缺少基础权限';
    } else {
      allowed = true;
    }

    // 应用安全策略
    for (const policy of policies) {
      for (const rule of policy.rules.filter(r => r.isActive)) {
        if (rule.type === 'access_control' && this.evaluateCondition(rule.condition, { userId, action, ...context })) {
          appliedRules.push(`${policy.name}:${rule.id}`);
          
          if (rule.action.type === 'deny') {
            allowed = false;
            reason = `访问被策略 ${policy.name} 拒绝`;
            break;
          } else if (rule.action.type === 'allow') {
            allowed = true;
            reason = '';
          }
        }
      }
      
      if (!allowed) break;
    }

    // 计算风险评分
    const riskScore = this.calculateRiskScore(entityCode, fieldCode, userId, action, context);

    // 记录审计日志
    this.logAccess({
      entityCode,
      fieldCode,
      userId,
      action,
      success: allowed,
      errorMessage: allowed ? undefined : reason,
      riskScore,
      ipAddress: context.ipAddress || 'unknown',
      userAgent: context.userAgent || 'unknown',
      metadata: { appliedRules, context },
    });

    return {
      allowed,
      reason: allowed ? undefined : reason,
      appliedRules,
      riskScore,
    };
  }

  /**
   * 应用数据脱敏
   */
  applyDataMasking(
    entityCode: string,
    data: Record<string, any>,
    userId: string,
    context: Record<string, any> = {}
  ): Record<string, any> {
    const maskingRules = this.getEntityMaskingRules(entityCode);
    const maskedData = { ...data };

    for (const rule of maskingRules) {
      if (data.hasOwnProperty(rule.fieldCode) && this.shouldApplyMasking(rule, userId, context)) {
        maskedData[rule.fieldCode] = this.maskValue(data[rule.fieldCode], rule);
      }
    }

    return maskedData;
  }

  /**
   * 加密敏感字段
   */
  encryptSensitiveFields(
    entityCode: string,
    data: Record<string, any>
  ): Record<string, any> {
    const encryptionConfigs = this.getEntityEncryptionConfigs(entityCode);
    const encryptedData = { ...data };

    for (const config of encryptionConfigs.filter(c => c.isEnabled)) {
      if (data.hasOwnProperty(config.fieldCode)) {
        encryptedData[config.fieldCode] = this.encryptValue(data[config.fieldCode], config);
      }
    }

    return encryptedData;
  }

  /**
   * 解密敏感字段
   */
  decryptSensitiveFields(
    entityCode: string,
    data: Record<string, any>
  ): Record<string, any> {
    const encryptionConfigs = this.getEntityEncryptionConfigs(entityCode);
    const decryptedData = { ...data };

    for (const config of encryptionConfigs.filter(c => c.isEnabled)) {
      if (data.hasOwnProperty(config.fieldCode)) {
        decryptedData[config.fieldCode] = this.decryptValue(data[config.fieldCode], config);
      }
    }

    return decryptedData;
  }

  /**
   * 生成合规报告
   */
  generateComplianceReport(
    entityCode: string,
    reportType: ComplianceReport['reportType'],
    period: { from: Date; to: Date }
  ): ComplianceReport {
    const fields = this.getEntityFields(entityCode);
    const auditLogs = this.getAuditLogs(entityCode, period);
    const policies = this.getEntityPolicies(entityCode);
    
    const personalDataFields = fields.filter(f => this.isPersonalData(f)).map(f => f.code);
    const sensitiveDataFields = fields.filter(f => this.isSensitiveData(f)).map(f => f.code);
    const encryptedFields = this.getEntityEncryptionConfigs(entityCode).map(c => c.fieldCode);
    const maskedFields = this.getEntityMaskingRules(entityCode).map(r => r.fieldCode);
    
    const violations = this.detectComplianceViolations(entityCode, reportType, auditLogs);
    const recommendations = this.generateComplianceRecommendations(entityCode, reportType, violations);
    
    const complianceScore = this.calculateComplianceScore(violations, policies.length);
    const complianceStatus = complianceScore >= 90 ? 'compliant' : 
                           complianceScore >= 70 ? 'partial' : 'non_compliant';

    return {
      entityCode,
      reportType,
      generatedAt: new Date(),
      period,
      compliance: {
        score: complianceScore,
        status: complianceStatus,
        violations,
        recommendations,
      },
      dataProcessing: {
        personalDataFields,
        sensitiveDataFields,
        encryptedFields,
        maskedFields,
      },
      accessControls: {
        totalUsers: this.getTotalUsers(entityCode),
        privilegedUsers: this.getPrivilegedUsers(entityCode),
        roleBasedAccess: this.hasRoleBasedAccess(entityCode),
        mfaEnabled: this.isMfaEnabled(entityCode),
      },
      auditTrail: {
        logsRetentionDays: this.getLogsRetentionDays(),
        completeness: this.calculateAuditCompleteness(auditLogs),
        integrity: this.verifyAuditIntegrity(auditLogs),
      },
    };
  }

  /**
   * 获取安全指标
   */
  getSecurityMetrics(entityCode: string, period: { from: Date; to: Date }): SecurityMetrics {
    const auditLogs = this.getAuditLogs(entityCode, period);
    const alerts = this.getAlerts(entityCode, period);
    
    const totalAccess = auditLogs.length;
    const unauthorizedAttempts = auditLogs.filter(log => !log.success).length;
    const dataExports = auditLogs.filter(log => log.action === 'export').length;
    const alertsGenerated = alerts.length;
    const policiesViolated = alerts.filter(alert => alert.type === 'policy_violation').length;
    
    const riskScores = auditLogs.map(log => log.riskScore).filter(score => score > 0);
    const averageRiskScore = riskScores.length > 0 ? 
      riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length : 0;
    
    // 统计高风险用户
    const userRiskMap = new Map<string, number[]>();
    auditLogs.forEach(log => {
      if (!userRiskMap.has(log.userId)) {
        userRiskMap.set(log.userId, []);
      }
      userRiskMap.get(log.userId)!.push(log.riskScore);
    });
    
    const topRiskyUsers = Array.from(userRiskMap.entries())
      .map(([userId, scores]) => ({
        userId,
        riskScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);
    
    // 统计最常访问的字段
    const fieldAccessMap = new Map<string, number>();
    auditLogs.forEach(log => {
      if (log.fieldCode) {
        fieldAccessMap.set(log.fieldCode, (fieldAccessMap.get(log.fieldCode) || 0) + 1);
      }
    });
    
    const topAccessedFields = Array.from(fieldAccessMap.entries())
      .map(([fieldCode, accessCount]) => ({ fieldCode, accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return {
      entityCode,
      period,
      totalAccess,
      unauthorizedAttempts,
      dataExports,
      alertsGenerated,
      policiesViolated,
      averageRiskScore,
      topRiskyUsers,
      topAccessedFields,
    };
  }

  /**
   * 创建安全告警
   */
  createAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'isResolved'>): SecurityAlert {
    const newAlert: SecurityAlert = {
      ...alert,
      id: this.generateId('alert'),
      timestamp: new Date(),
      isResolved: false,
    };

    this.alerts.push(newAlert);
    
    // 发送通知（这里可以集成邮件、短信等通知服务）
    this.sendAlertNotification(newAlert);
    
    return newAlert;
  }

  /**
   * 解决安全告警
   */
  resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      return false;
    }

    alert.isResolved = true;
    alert.resolvedBy = resolvedBy;
    alert.resolvedAt = new Date();
    
    return true;
  }

  /**
   * 分析实体安全风险
   */
  analyzeSecurityRisks(entityCode: string, fields: EntityTemplateField[]): {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: {
      factor: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      recommendation: string;
    }[];
    securityScore: number;
  } {
    const riskFactors: any[] = [];
    let totalRiskScore = 0;

    // 检查敏感数据字段
    const sensitiveFields = fields.filter(f => this.isSensitiveData(f));
    if (sensitiveFields.length > 0) {
      const encryptedCount = this.getEntityEncryptionConfigs(entityCode).length;
      const unencryptedSensitive = sensitiveFields.length - encryptedCount;
      
      if (unencryptedSensitive > 0) {
        riskFactors.push({
          factor: 'unencrypted_sensitive_data',
          severity: 'high',
          description: `${unencryptedSensitive} 个敏感字段未加密`,
          recommendation: '对敏感字段启用加密保护',
        });
        totalRiskScore += 30;
      }
    }

    // 检查个人数据字段
    const personalFields = fields.filter(f => this.isPersonalData(f));
    if (personalFields.length > 0) {
      const maskedCount = this.getEntityMaskingRules(entityCode).length;
      const unmaskedPersonal = personalFields.length - maskedCount;
      
      if (unmaskedPersonal > 0) {
        riskFactors.push({
          factor: 'unmasked_personal_data',
          severity: 'medium',
          description: `${unmaskedPersonal} 个个人数据字段未脱敏`,
          recommendation: '对个人数据字段配置脱敏规则',
        });
        totalRiskScore += 20;
      }
    }

    // 检查访问控制策略
    const policies = this.getEntityPolicies(entityCode);
    const accessControlPolicies = policies.filter(p => 
      p.rules.some(r => r.type === 'access_control')
    );
    
    if (accessControlPolicies.length === 0) {
      riskFactors.push({
        factor: 'no_access_control',
        severity: 'high',
        description: '缺少访问控制策略',
        recommendation: '配置基于角色的访问控制策略',
      });
      totalRiskScore += 25;
    }

    // 检查审计日志
    const auditPolicies = policies.filter(p => 
      p.rules.some(r => r.type === 'audit_logging')
    );
    
    if (auditPolicies.length === 0) {
      riskFactors.push({
        factor: 'no_audit_logging',
        severity: 'medium',
        description: '缺少审计日志策略',
        recommendation: '启用审计日志记录所有数据访问',
      });
      totalRiskScore += 15;
    }

    // 检查字段数量和复杂度
    if (fields.length > 50) {
      riskFactors.push({
        factor: 'high_field_count',
        severity: 'low',
        description: '字段数量过多，增加管理复杂度',
        recommendation: '考虑拆分实体或简化字段结构',
      });
      totalRiskScore += 5;
    }

    // 计算整体风险等级
    const securityScore = Math.max(0, 100 - totalRiskScore);
    let overallRisk: 'low' | 'medium' | 'high' | 'critical';
    
    if (securityScore >= 80) {
      overallRisk = 'low';
    } else if (securityScore >= 60) {
      overallRisk = 'medium';
    } else if (securityScore >= 40) {
      overallRisk = 'high';
    } else {
      overallRisk = 'critical';
    }

    return {
      overallRisk,
      riskFactors,
      securityScore,
    };
  }

  /**
   * 获取活跃策略
   */
  private getActivePolicies(entityCode: string): SecurityPolicy[] {
    return this.getEntityPolicies(entityCode)
      .filter(p => p.isActive)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取用户权限
   */
  private getUserPermissions(entityCode: string, userId: string): AccessPermission[] {
    const entityPermissions = this.permissions.get(entityCode) || [];
    return entityPermissions.filter(p => 
      p.userId === userId || 
      (p.roleId && this.userHasRole(userId, p.roleId))
    );
  }

  /**
   * 检查基础权限
   */
  private hasBasicPermission(
    permissions: AccessPermission[],
    fieldCode: string | undefined,
    action: string
  ): boolean {
    return permissions.some(p => {
      const hasAction = p.permissions.includes(action as any);
      const hasFieldAccess = !fieldCode || !p.fieldCode || p.fieldCode === fieldCode;
      const notExpired = !p.expiresAt || p.expiresAt > new Date();
      
      return hasAction && hasFieldAccess && notExpired;
    });
  }

  /**
   * 评估安全条件
   */
  private evaluateCondition(condition: SecurityCondition, context: Record<string, any>): boolean {
    const { type, operator, value } = condition;
    const contextValue = context[type] || context[type.replace('_based', '')];
    
    switch (operator) {
      case 'equals':
        return contextValue === value;
      case 'not_equals':
        return contextValue !== value;
      case 'in':
        return Array.isArray(value) && value.includes(contextValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(contextValue);
      case 'contains':
        return String(contextValue).includes(String(value));
      case 'greater_than':
        return Number(contextValue) > Number(value);
      case 'less_than':
        return Number(contextValue) < Number(value);
      case 'between':
        return Array.isArray(value) && 
               Number(contextValue) >= Number(value[0]) && 
               Number(contextValue) <= Number(value[1]);
      default:
        return false;
    }
  }

  /**
   * 计算风险评分
   */
  private calculateRiskScore(
    entityCode: string,
    fieldCode: string | undefined,
    userId: string,
    action: string,
    context: Record<string, any>
  ): number {
    const cacheKey = `${entityCode}:${fieldCode}:${userId}:${action}`;
    
    if (this.riskScoreCache.has(cacheKey)) {
      return this.riskScoreCache.get(cacheKey)!;
    }

    let riskScore = 0;
    
    // 基础风险评分
    if (action === 'delete') riskScore += 30;
    else if (action === 'write') riskScore += 20;
    else if (action === 'read') riskScore += 10;
    
    // 字段敏感性评分
    if (fieldCode) {
      const field = this.getFieldByCode(entityCode, fieldCode);
      if (field && this.isSensitiveData(field)) riskScore += 25;
      if (field && this.isPersonalData(field)) riskScore += 20;
    }
    
    // 用户历史行为评分
    const userRiskHistory = this.getUserRiskHistory(userId);
    riskScore += Math.min(userRiskHistory * 5, 25);
    
    // 时间和位置风险
    const now = new Date();
    const hour = now.getHours();
    if (hour < 6 || hour > 22) riskScore += 10; // 非工作时间
    
    if (context.ipAddress && this.isUnusualLocation(userId, context.ipAddress)) {
      riskScore += 15;
    }
    
    // 缓存结果
    this.riskScoreCache.set(cacheKey, riskScore);
    
    return Math.min(riskScore, 100);
  }

  /**
   * 记录访问日志
   */
  private logAccess(logData: Omit<SecurityAuditLog, 'id' | 'timestamp'>): void {
    const auditLog: SecurityAuditLog = {
      ...logData,
      id: this.generateId('audit'),
      timestamp: new Date(),
    };

    this.auditLogs.push(auditLog);
    
    // 检查是否需要生成告警
    this.checkForSecurityAlerts(auditLog);
  }

  /**
   * 获取实体脱敏规则
   */
  private getEntityMaskingRules(entityCode: string): DataMaskingRule[] {
    return this.maskingRules.get(entityCode) || [];
  }

  /**
   * 获取实体加密配置
   */
  private getEntityEncryptionConfigs(entityCode: string): EncryptionConfig[] {
    return this.encryptionConfigs.get(entityCode) || [];
  }

  /**
   * 判断是否应用脱敏
   */
  private shouldApplyMasking(rule: DataMaskingRule, userId: string, context: Record<string, any>): boolean {
    return rule.conditions.every(condition => 
      this.evaluateCondition(condition, { userId, ...context })
    );
  }

  /**
   * 脱敏值
   */
  private maskValue(value: any, rule: DataMaskingRule): any {
    if (value == null) return value;
    
    const stringValue = String(value);
    
    switch (rule.maskingType) {
      case 'full':
        return rule.preserveLength ? '*'.repeat(stringValue.length) : '***';
      case 'partial':
        return stringValue.replace(new RegExp(rule.pattern, 'g'), rule.replacement);
      case 'hash':
        return this.hashValue(stringValue);
      case 'tokenize':
        return this.tokenizeValue(stringValue);
      case 'custom':
        return this.applyCustomMasking(stringValue, rule);
      default:
        return value;
    }
  }

  /**
   * 加密值
   */
  private encryptValue(value: any, config: EncryptionConfig): string {
    // 这里应该使用真实的加密算法
    // 为了演示，使用简单的Base64编码
    return Buffer.from(String(value)).toString('base64');
  }

  /**
   * 解密值
   */
  private decryptValue(encryptedValue: string, config: EncryptionConfig): any {
    // 这里应该使用真实的解密算法
    // 为了演示，使用简单的Base64解码
    try {
      return Buffer.from(encryptedValue, 'base64').toString();
    } catch {
      return encryptedValue;
    }
  }

  /**
   * 检查是否为敏感数据
   */
  private isSensitiveData(field: EntityTemplateField): boolean {
    const sensitivePatterns = [
      /password/i, /secret/i, /token/i, /key/i, /credit/i, /card/i,
      /ssn/i, /social/i, /bank/i, /account/i, /salary/i, /income/i
    ];
    
    return sensitivePatterns.some(pattern => 
      pattern.test(field.code) || pattern.test(field.name)
    );
  }

  /**
   * 检查是否为个人数据
   */
  private isPersonalData(field: EntityTemplateField): boolean {
    const personalPatterns = [
      /name/i, /email/i, /phone/i, /address/i, /birth/i, /age/i,
      /gender/i, /nationality/i, /id_number/i, /passport/i
    ];
    
    return personalPatterns.some(pattern => 
      pattern.test(field.code) || pattern.test(field.name)
    );
  }

  /**
   * 获取实体字段
   */
  private getEntityFields(entityCode: string): EntityTemplateField[] {
    // 这里应该从实际的实体服务获取字段信息
    // 为了演示，返回空数组
    return [];
  }

  /**
   * 获取审计日志
   */
  private getAuditLogs(entityCode: string, period: { from: Date; to: Date }): SecurityAuditLog[] {
    return this.auditLogs.filter(log => 
      log.entityCode === entityCode &&
      log.timestamp >= period.from &&
      log.timestamp <= period.to
    );
  }

  /**
   * 获取告警
   */
  private getAlerts(entityCode: string, period: { from: Date; to: Date }): SecurityAlert[] {
    return this.alerts.filter(alert => 
      alert.entityCode === entityCode &&
      alert.timestamp >= period.from &&
      alert.timestamp <= period.to
    );
  }

  /**
   * 检测合规违规
   */
  private detectComplianceViolations(
    entityCode: string,
    reportType: ComplianceReport['reportType'],
    auditLogs: SecurityAuditLog[]
  ): string[] {
    const violations: string[] = [];
    
    switch (reportType) {
      case 'GDPR':
        // GDPR 合规检查
        const personalFields = this.getEntityFields(entityCode).filter(f => this.isPersonalData(f));
        if (personalFields.length > 0) {
          const hasConsentTracking = auditLogs.some(log => log.metadata.consent);
          if (!hasConsentTracking) {
            violations.push('缺少用户同意追踪机制');
          }
          
          const hasDataRetention = this.hasDataRetentionPolicy(entityCode);
          if (!hasDataRetention) {
            violations.push('缺少数据保留策略');
          }
        }
        break;
        
      case 'HIPAA':
        // HIPAA 合规检查
        const healthFields = this.getEntityFields(entityCode).filter(f => this.isHealthData(f));
        if (healthFields.length > 0) {
          const encryptedFields = this.getEntityEncryptionConfigs(entityCode);
          if (encryptedFields.length === 0) {
            violations.push('健康数据未加密');
          }
        }
        break;
        
      // 其他合规标准...
    }
    
    return violations;
  }

  /**
   * 生成合规建议
   */
  private generateComplianceRecommendations(
    entityCode: string,
    reportType: ComplianceReport['reportType'],
    violations: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (violations.includes('缺少用户同意追踪机制')) {
      recommendations.push('实施用户同意管理系统');
    }
    
    if (violations.includes('缺少数据保留策略')) {
      recommendations.push('制定并实施数据保留和删除策略');
    }
    
    if (violations.includes('健康数据未加密')) {
      recommendations.push('对所有健康相关数据启用端到端加密');
    }
    
    return recommendations;
  }

  /**
   * 计算合规评分
   */
  private calculateComplianceScore(violations: string[], totalPolicies: number): number {
    const baseScore = 100;
    const violationPenalty = violations.length * 10;
    const policyBonus = Math.min(totalPolicies * 2, 20);
    
    return Math.max(0, Math.min(100, baseScore - violationPenalty + policyBonus));
  }

  /**
   * 辅助方法
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private userHasRole(userId: string, roleId: string): boolean {
    // 这里应该查询用户角色关系
    return false;
  }

  private getUserRiskHistory(userId: string): number {
    const userLogs = this.auditLogs.filter(log => log.userId === userId && !log.success);
    return userLogs.length;
  }

  private isUnusualLocation(userId: string, ipAddress: string): boolean {
    // 这里应该检查用户的常用IP地址
    return false;
  }

  private getFieldByCode(entityCode: string, fieldCode: string): EntityTemplateField | null {
    const fields = this.getEntityFields(entityCode);
    return fields.find(f => f.code === fieldCode) || null;
  }

  private checkForSecurityAlerts(auditLog: SecurityAuditLog): void {
    // 检查是否需要生成安全告警
    if (!auditLog.success && auditLog.riskScore > 70) {
      this.createAlert({
        type: 'unauthorized_access',
        severity: 'high',
        entityCode: auditLog.entityCode,
        userId: auditLog.userId,
        description: `高风险未授权访问尝试: ${auditLog.errorMessage}`,
        metadata: { auditLogId: auditLog.id, riskScore: auditLog.riskScore },
      });
    }
  }

  private sendAlertNotification(alert: SecurityAlert): void {
    // 这里应该实现实际的通知发送逻辑
    console.log(`Security Alert: ${alert.type} - ${alert.description}`);
  }

  private hashValue(value: string): string {
    // 简单的哈希实现，实际应该使用加密哈希函数
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private tokenizeValue(value: string): string {
    // 简单的令牌化实现
    return `TOKEN_${this.hashValue(value)}`;
  }

  private applyCustomMasking(value: string, rule: DataMaskingRule): string {
    // 自定义脱敏逻辑
    return value.replace(new RegExp(rule.pattern, 'g'), rule.replacement);
  }

  private getTotalUsers(entityCode: string): number {
    const permissions = this.permissions.get(entityCode) || [];
    const userIds = new Set(permissions.map(p => p.userId).filter(Boolean));
    return userIds.size;
  }

  private getPrivilegedUsers(entityCode: string): number {
    const permissions = this.permissions.get(entityCode) || [];
    const privilegedUsers = permissions.filter(p => 
      p.permissions.includes('delete') || p.permissions.includes('write')
    );
    const userIds = new Set(privilegedUsers.map(p => p.userId).filter(Boolean));
    return userIds.size;
  }

  private hasRoleBasedAccess(entityCode: string): boolean {
    const permissions = this.permissions.get(entityCode) || [];
    return permissions.some(p => p.roleId);
  }

  private isMfaEnabled(entityCode: string): boolean {
    const policies = this.getEntityPolicies(entityCode);
    return policies.some(p => 
      p.rules.some(r => r.action.parameters?.requireMfa === true)
    );
  }

  private getLogsRetentionDays(): number {
    return 365; // 默认保留一年
  }

  private calculateAuditCompleteness(auditLogs: SecurityAuditLog[]): number {
    // 简单的完整性检查
    const requiredFields = ['userId', 'action', 'timestamp', 'ipAddress'];
    const completeLogsCount = auditLogs.filter(log => 
      requiredFields.every(field => log[field as keyof SecurityAuditLog])
    ).length;
    
    return auditLogs.length > 0 ? (completeLogsCount / auditLogs.length) * 100 : 100;
  }

  private verifyAuditIntegrity(auditLogs: SecurityAuditLog[]): boolean {
    // 简单的完整性验证
    return auditLogs.every(log => log.id && log.timestamp);
  }

  private hasDataRetentionPolicy(entityCode: string): boolean {
    const policies = this.getEntityPolicies(entityCode);
    return policies.some(p => 
      p.rules.some(r => r.action.parameters?.dataRetentionDays)
    );
  }

  private isHealthData(field: EntityTemplateField): boolean {
    const healthPatterns = [
      /medical/i, /health/i, /diagnosis/i, /treatment/i, /medication/i,
      /symptom/i, /allergy/i, /condition/i, /doctor/i, /hospital/i
    ];
    
    return healthPatterns.some(pattern => 
      pattern.test(field.code) || pattern.test(field.name)
    );
  }
}