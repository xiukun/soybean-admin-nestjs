import { Injectable } from '@nestjs/common';
import { EntityTemplateField } from './entity-template.service';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';

export interface EntityVersion {
  id: string;
  entityCode: string;
  version: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
  isPublished: boolean;
  parentVersion?: string;
  tags: string[];
  metadata: {
    fieldCount: number;
    relationshipCount: number;
    indexCount: number;
    constraintCount: number;
    complexity: number;
  };
}

export interface EntityVersionDiff {
  fromVersion: string;
  toVersion: string;
  changes: VersionChange[];
  summary: {
    fieldsAdded: number;
    fieldsRemoved: number;
    fieldsModified: number;
    relationshipsChanged: number;
    indexesChanged: number;
    constraintsChanged: number;
  };
  compatibility: {
    isBackwardCompatible: boolean;
    isForwardCompatible: boolean;
    breakingChanges: string[];
    warnings: string[];
  };
}

export interface VersionChange {
  type: 'field_added' | 'field_removed' | 'field_modified' | 'relationship_added' | 'relationship_removed' | 'relationship_modified' | 'index_added' | 'index_removed' | 'constraint_added' | 'constraint_removed' | 'metadata_changed';
  path: string;
  oldValue?: any;
  newValue?: any;
  description: string;
  impact: 'low' | 'medium' | 'high';
  isBreaking: boolean;
}

export interface EntitySnapshot {
  version: string;
  entityCode: string;
  timestamp: Date;
  fields: EntityTemplateField[];
  relationships: any[];
  indexes: any[];
  constraints: any[];
  configuration: any;
  checksum: string;
}

export interface VersionBranch {
  name: string;
  baseVersion: string;
  headVersion: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
  versions: string[];
}

export interface MergeRequest {
  id: string;
  sourceBranch: string;
  targetBranch: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  status: 'open' | 'merged' | 'closed' | 'conflict';
  conflicts: MergeConflict[];
  reviewers: string[];
  approvals: string[];
}

export interface MergeConflict {
  path: string;
  type: 'field' | 'relationship' | 'index' | 'constraint';
  sourceValue: any;
  targetValue: any;
  resolution?: 'source' | 'target' | 'custom';
  customValue?: any;
}

export interface VersioningConfig {
  autoVersioning: boolean;
  versioningStrategy: 'semantic' | 'timestamp' | 'sequential';
  maxVersionsToKeep: number;
  autoCleanup: boolean;
  requireApproval: boolean;
  allowRollback: boolean;
  branchingEnabled: boolean;
  tagRequired: boolean;
}

@Injectable()
export class EntityVersionControlService {
  private versions = new Map<string, EntityVersion[]>();
  private snapshots = new Map<string, EntitySnapshot>();
  private branches = new Map<string, VersionBranch[]>();
  private mergeRequests = new Map<string, MergeRequest[]>();
  private config: VersioningConfig = {
    autoVersioning: true,
    versioningStrategy: 'semantic',
    maxVersionsToKeep: 50,
    autoCleanup: true,
    requireApproval: false,
    allowRollback: true,
    branchingEnabled: true,
    tagRequired: false,
  };

  /**
   * 创建新版本
   */
  createVersion(
    entityCode: string,
    fields: EntityTemplateField[],
    description: string,
    createdBy: string,
    parentVersion?: string
  ): EntityVersion {
    const versions = this.getEntityVersions(entityCode);
    const newVersion = this.generateVersionNumber(entityCode, parentVersion);
    
    const version: EntityVersion = {
      id: this.generateVersionId(),
      entityCode,
      version: newVersion,
      description,
      createdBy,
      createdAt: new Date(),
      isActive: false,
      isPublished: false,
      parentVersion,
      tags: [],
      metadata: this.calculateVersionMetadata(fields),
    };

    versions.push(version);
    this.versions.set(entityCode, versions);

    // 创建快照
    this.createSnapshot(entityCode, version.version, fields);

    // 自动清理旧版本
    if (this.config.autoCleanup) {
      this.cleanupOldVersions(entityCode);
    }

    return version;
  }

  /**
   * 获取实体的所有版本
   */
  getEntityVersions(entityCode: string): EntityVersion[] {
    return this.versions.get(entityCode) || [];
  }

  /**
   * 获取特定版本
   */
  getVersion(entityCode: string, version: string): EntityVersion | null {
    const versions = this.getEntityVersions(entityCode);
    return versions.find(v => v.version === version) || null;
  }

  /**
   * 获取当前活跃版本
   */
  getActiveVersion(entityCode: string): EntityVersion | null {
    const versions = this.getEntityVersions(entityCode);
    return versions.find(v => v.isActive) || null;
  }

  /**
   * 获取最新版本
   */
  getLatestVersion(entityCode: string): EntityVersion | null {
    const versions = this.getEntityVersions(entityCode);
    if (versions.length === 0) return null;
    
    return versions.reduce((latest, current) => {
      return this.compareVersionStrings(current.version, latest.version) > 0 ? current : latest;
    });
  }

  /**
   * 激活版本
   */
  activateVersion(entityCode: string, version: string): boolean {
    const versions = this.getEntityVersions(entityCode);
    const targetVersion = versions.find(v => v.version === version);
    
    if (!targetVersion) {
      return false;
    }

    // 取消其他版本的激活状态
    versions.forEach(v => v.isActive = false);
    
    // 激活目标版本
    targetVersion.isActive = true;
    
    return true;
  }

  /**
   * 发布版本
   */
  publishVersion(entityCode: string, version: string): boolean {
    const targetVersion = this.getVersion(entityCode, version);
    
    if (!targetVersion) {
      return false;
    }

    targetVersion.isPublished = true;
    targetVersion.isActive = true;
    
    // 取消其他版本的激活状态
    const versions = this.getEntityVersions(entityCode);
    versions.forEach(v => {
      if (v.version !== version) {
        v.isActive = false;
      }
    });
    
    return true;
  }

  /**
   * 比较两个版本
   */
  compareVersions(entityCode: string, fromVersion: string, toVersion: string): EntityVersionDiff {
    const fromSnapshot = this.getSnapshot(entityCode, fromVersion);
    const toSnapshot = this.getSnapshot(entityCode, toVersion);
    
    if (!fromSnapshot || !toSnapshot) {
      throw new Error('版本快照不存在');
    }

    const changes = this.calculateChanges(fromSnapshot, toSnapshot);
    const summary = this.calculateChangeSummary(changes);
    const compatibility = this.analyzeCompatibility(changes);

    return {
      fromVersion,
      toVersion,
      changes,
      summary,
      compatibility,
    };
  }

  /**
   * 回滚到指定版本
   */
  rollbackToVersion(entityCode: string, version: string): boolean {
    if (!this.config.allowRollback) {
      return false;
    }

    const targetVersion = this.getVersion(entityCode, version);
    if (!targetVersion) {
      return false;
    }

    // 创建新的回滚版本
    const snapshot = this.getSnapshot(entityCode, version);
    if (!snapshot) {
      return false;
    }

    const rollbackVersion = this.createVersion(
      entityCode,
      snapshot.fields,
      `回滚到版本 ${version}`,
      'system',
      this.getLatestVersion(entityCode)?.version
    );

    this.activateVersion(entityCode, rollbackVersion.version);
    
    return true;
  }

  /**
   * 创建分支
   */
  createBranch(
    entityCode: string,
    branchName: string,
    baseVersion: string,
    description: string,
    createdBy: string
  ): VersionBranch {
    if (!this.config.branchingEnabled) {
      throw new Error('分支功能未启用');
    }

    const branch: VersionBranch = {
      name: branchName,
      baseVersion,
      headVersion: baseVersion,
      description,
      createdBy,
      createdAt: new Date(),
      isActive: true,
      versions: [baseVersion],
    };

    const branches = this.getEntityBranches(entityCode);
    branches.push(branch);
    this.branches.set(entityCode, branches);

    return branch;
  }

  /**
   * 获取实体分支
   */
  getEntityBranches(entityCode: string): VersionBranch[] {
    return this.branches.get(entityCode) || [];
  }

  /**
   * 合并分支
   */
  mergeBranch(
    entityCode: string,
    sourceBranch: string,
    targetBranch: string,
    mergedBy: string
  ): MergeRequest {
    const branches = this.getEntityBranches(entityCode);
    const source = branches.find(b => b.name === sourceBranch);
    const target = branches.find(b => b.name === targetBranch);

    if (!source || !target) {
      throw new Error('分支不存在');
    }

    const conflicts = this.detectMergeConflicts(entityCode, source.headVersion, target.headVersion);
    
    const mergeRequest: MergeRequest = {
      id: this.generateMergeRequestId(),
      sourceBranch,
      targetBranch,
      title: `合并 ${sourceBranch} 到 ${targetBranch}`,
      description: '',
      createdBy: mergedBy,
      createdAt: new Date(),
      status: conflicts.length > 0 ? 'conflict' : 'open',
      conflicts,
      reviewers: [],
      approvals: [],
    };

    const mergeRequests = this.getEntityMergeRequests(entityCode);
    mergeRequests.push(mergeRequest);
    this.mergeRequests.set(entityCode, mergeRequests);

    return mergeRequest;
  }

  /**
   * 获取合并请求
   */
  getEntityMergeRequests(entityCode: string): MergeRequest[] {
    return this.mergeRequests.get(entityCode) || [];
  }

  /**
   * 解决合并冲突
   */
  resolveMergeConflict(
    entityCode: string,
    mergeRequestId: string,
    conflictPath: string,
    resolution: 'source' | 'target' | 'custom',
    customValue?: any
  ): boolean {
    const mergeRequests = this.getEntityMergeRequests(entityCode);
    const mergeRequest = mergeRequests.find(mr => mr.id === mergeRequestId);
    
    if (!mergeRequest) {
      return false;
    }

    const conflict = mergeRequest.conflicts.find(c => c.path === conflictPath);
    if (!conflict) {
      return false;
    }

    conflict.resolution = resolution;
    if (resolution === 'custom' && customValue !== undefined) {
      conflict.customValue = customValue;
    }

    // 检查是否所有冲突都已解决
    const unresolvedConflicts = mergeRequest.conflicts.filter(c => !c.resolution);
    if (unresolvedConflicts.length === 0) {
      mergeRequest.status = 'open';
    }

    return true;
  }

  /**
   * 添加版本标签
   */
  addVersionTag(entityCode: string, version: string, tag: string): boolean {
    const targetVersion = this.getVersion(entityCode, version);
    if (!targetVersion) {
      return false;
    }

    if (!targetVersion.tags.includes(tag)) {
      targetVersion.tags.push(tag);
    }
    
    return true;
  }

  /**
   * 移除版本标签
   */
  removeVersionTag(entityCode: string, version: string, tag: string): boolean {
    const targetVersion = this.getVersion(entityCode, version);
    if (!targetVersion) {
      return false;
    }

    const index = targetVersion.tags.indexOf(tag);
    if (index > -1) {
      targetVersion.tags.splice(index, 1);
      return true;
    }
    
    return false;
  }

  /**
   * 获取版本历史
   */
  getVersionHistory(entityCode: string, limit?: number): EntityVersion[] {
    const versions = this.getEntityVersions(entityCode);
    const sorted = versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * 搜索版本
   */
  searchVersions(
    entityCode: string,
    criteria: {
      tag?: string;
      createdBy?: string;
      dateRange?: { from: Date; to: Date };
      isPublished?: boolean;
      description?: string;
    }
  ): EntityVersion[] {
    const versions = this.getEntityVersions(entityCode);
    
    return versions.filter(version => {
      if (criteria.tag && !version.tags.includes(criteria.tag)) {
        return false;
      }
      
      if (criteria.createdBy && version.createdBy !== criteria.createdBy) {
        return false;
      }
      
      if (criteria.dateRange) {
        const createdAt = version.createdAt.getTime();
        if (createdAt < criteria.dateRange.from.getTime() || 
            createdAt > criteria.dateRange.to.getTime()) {
          return false;
        }
      }
      
      if (criteria.isPublished !== undefined && version.isPublished !== criteria.isPublished) {
        return false;
      }
      
      if (criteria.description && !version.description.toLowerCase().includes(criteria.description.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * 获取版本统计
   */
  getVersionStatistics(entityCode: string): {
    totalVersions: number;
    publishedVersions: number;
    activeBranches: number;
    pendingMergeRequests: number;
    averageVersionInterval: number;
    mostActiveContributor: string;
    complexityTrend: { version: string; complexity: number }[];
  } {
    const versions = this.getEntityVersions(entityCode);
    const branches = this.getEntityBranches(entityCode);
    const mergeRequests = this.getEntityMergeRequests(entityCode);
    
    const publishedVersions = versions.filter(v => v.isPublished).length;
    const activeBranches = branches.filter(b => b.isActive).length;
    const pendingMergeRequests = mergeRequests.filter(mr => mr.status === 'open').length;
    
    // 计算平均版本间隔
    let averageInterval = 0;
    if (versions.length > 1) {
      const sortedVersions = versions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const intervals = [];
      for (let i = 1; i < sortedVersions.length; i++) {
        intervals.push(sortedVersions[i].createdAt.getTime() - sortedVersions[i - 1].createdAt.getTime());
      }
      averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    }
    
    // 找出最活跃的贡献者
    const contributorCounts = new Map<string, number>();
    versions.forEach(v => {
      contributorCounts.set(v.createdBy, (contributorCounts.get(v.createdBy) || 0) + 1);
    });
    const mostActiveContributor = Array.from(contributorCounts.entries())
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
    
    // 复杂度趋势
    const complexityTrend = versions
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(v => ({ version: v.version, complexity: v.metadata.complexity }));
    
    return {
      totalVersions: versions.length,
      publishedVersions,
      activeBranches,
      pendingMergeRequests,
      averageVersionInterval: averageInterval / (1000 * 60 * 60 * 24), // 转换为天
      mostActiveContributor,
      complexityTrend,
    };
  }

  /**
   * 导出版本数据
   */
  exportVersionData(entityCode: string): {
    versions: EntityVersion[];
    snapshots: EntitySnapshot[];
    branches: VersionBranch[];
    mergeRequests: MergeRequest[];
  } {
    const versions = this.getEntityVersions(entityCode);
    const snapshots = versions.map(v => this.getSnapshot(entityCode, v.version)).filter(Boolean) as EntitySnapshot[];
    const branches = this.getEntityBranches(entityCode);
    const mergeRequests = this.getEntityMergeRequests(entityCode);
    
    return {
      versions,
      snapshots,
      branches,
      mergeRequests,
    };
  }

  /**
   * 导入版本数据
   */
  importVersionData(
    entityCode: string,
    data: {
      versions: EntityVersion[];
      snapshots: EntitySnapshot[];
      branches: VersionBranch[];
      mergeRequests: MergeRequest[];
    }
  ): void {
    this.versions.set(entityCode, data.versions);
    this.branches.set(entityCode, data.branches);
    this.mergeRequests.set(entityCode, data.mergeRequests);
    
    data.snapshots.forEach(snapshot => {
      const key = `${entityCode}:${snapshot.version}`;
      this.snapshots.set(key, snapshot);
    });
  }

  /**
   * 创建快照
   */
  private createSnapshot(
    entityCode: string,
    version: string,
    fields: EntityTemplateField[],
    relationships: any[] = [],
    indexes: any[] = [],
    constraints: any[] = [],
    configuration: any = {}
  ): void {
    const snapshot: EntitySnapshot = {
      version,
      entityCode,
      timestamp: new Date(),
      fields,
      relationships,
      indexes,
      constraints,
      configuration,
      checksum: this.calculateChecksum({ fields, relationships, indexes, constraints, configuration }),
    };

    const key = `${entityCode}:${version}`;
    this.snapshots.set(key, snapshot);
  }

  /**
   * 获取快照
   */
  private getSnapshot(entityCode: string, version: string): EntitySnapshot | null {
    const key = `${entityCode}:${version}`;
    return this.snapshots.get(key) || null;
  }

  /**
   * 生成版本号
   */
  private generateVersionNumber(entityCode: string, parentVersion?: string): string {
    const versions = this.getEntityVersions(entityCode);
    
    switch (this.config.versioningStrategy) {
      case 'semantic':
        return this.generateSemanticVersion(versions, parentVersion);
      case 'timestamp':
        return new Date().toISOString().replace(/[:.]/g, '-');
      case 'sequential':
        return `v${versions.length + 1}`;
      default:
        return `v${versions.length + 1}`;
    }
  }

  /**
   * 生成语义化版本号
   */
  private generateSemanticVersion(versions: EntityVersion[], parentVersion?: string): string {
    if (versions.length === 0) {
      return '1.0.0';
    }

    const latestVersion = this.getLatestVersionFromList(versions);
    const versionParts = latestVersion.version.replace(/^v/, '').split('.');
    const [major, minor, patch] = versionParts.map(Number);
    
    // 简单的语义化版本递增逻辑
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * 从版本列表获取最新版本
   */
  private getLatestVersionFromList(versions: EntityVersion[]): EntityVersion {
    return versions.reduce((latest, current) => {
      return this.compareVersionStrings(current.version, latest.version) > 0 ? current : latest;
    });
  }

  /**
   * 比较版本号字符串
   */
  private compareVersionStrings(version1: string, version2: string): number {
    const v1Parts = version1.replace(/^v/, '').split('.').map(Number);
    const v2Parts = version2.replace(/^v/, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  /**
   * 计算版本元数据
   */
  private calculateVersionMetadata(fields: EntityTemplateField[]): EntityVersion['metadata'] {
    const relationshipCount = fields.filter(f => f.dataType === FieldDataType.STRING && f.code?.includes('_id')).length;
    const indexCount = fields.filter(f => f.unique || f.required).length;
    const constraintCount = fields.filter(f => f.required || f.unique).length;
    
    // 简单的复杂度计算
    let complexity = fields.length;
    complexity += relationshipCount * 2;
    complexity += fields.filter(f => f.dataType === FieldDataType.JSON).length * 1.5;
    complexity += fields.filter(f => f.dataType === FieldDataType.TEXT).length * 1.2;
    
    return {
      fieldCount: fields.length,
      relationshipCount,
      indexCount,
      constraintCount,
      complexity: Math.round(complexity),
    };
  }

  /**
   * 计算变更
   */
  private calculateChanges(fromSnapshot: EntitySnapshot, toSnapshot: EntitySnapshot): VersionChange[] {
    const changes: VersionChange[] = [];
    
    // 比较字段变更
    const fromFields = new Map(fromSnapshot.fields.map(f => [f.code, f]));
    const toFields = new Map(toSnapshot.fields.map(f => [f.code, f]));
    
    // 新增字段
    for (const [code, field] of toFields) {
      if (!fromFields.has(code)) {
        changes.push({
          type: 'field_added',
          path: `fields.${code}`,
          newValue: field,
          description: `添加字段: ${field.name}`,
          impact: field.required ? 'high' : 'medium',
          isBreaking: field.required,
        });
      }
    }
    
    // 删除字段
    for (const [code, field] of fromFields) {
      if (!toFields.has(code)) {
        changes.push({
          type: 'field_removed',
          path: `fields.${code}`,
          oldValue: field,
          description: `删除字段: ${field.name}`,
          impact: 'high',
          isBreaking: true,
        });
      }
    }
    
    // 修改字段
    for (const [code, newField] of toFields) {
      const oldField = fromFields.get(code);
      if (oldField && this.hasFieldChanged(oldField, newField)) {
        changes.push({
          type: 'field_modified',
          path: `fields.${code}`,
          oldValue: oldField,
          newValue: newField,
          description: `修改字段: ${newField.name}`,
          impact: this.assessFieldChangeImpact(oldField, newField),
          isBreaking: this.isFieldChangeBreaking(oldField, newField),
        });
      }
    }
    
    return changes;
  }

  /**
   * 检查字段是否有变更
   */
  private hasFieldChanged(oldField: EntityTemplateField, newField: EntityTemplateField): boolean {
    return JSON.stringify(oldField) !== JSON.stringify(newField);
  }

  /**
   * 评估字段变更影响
   */
  private assessFieldChangeImpact(oldField: EntityTemplateField, newField: EntityTemplateField): 'low' | 'medium' | 'high' {
    if (oldField.dataType !== newField.dataType) return 'high';
    if (oldField.required !== newField.required) return 'high';
    if (oldField.unique !== newField.unique) return 'medium';
    return 'low';
  }

  /**
   * 判断字段变更是否为破坏性变更
   */
  private isFieldChangeBreaking(oldField: EntityTemplateField, newField: EntityTemplateField): boolean {
    // 数据类型变更
    if (oldField.dataType !== newField.dataType) return true;
    // 从非必填变为必填
    if (!oldField.required && newField.required) return true;
    // 长度减少
    if (oldField.length && newField.length && newField.length < oldField.length) return true;
    
    return false;
  }

  /**
   * 计算变更摘要
   */
  private calculateChangeSummary(changes: VersionChange[]): EntityVersionDiff['summary'] {
    return {
      fieldsAdded: changes.filter(c => c.type === 'field_added').length,
      fieldsRemoved: changes.filter(c => c.type === 'field_removed').length,
      fieldsModified: changes.filter(c => c.type === 'field_modified').length,
      relationshipsChanged: changes.filter(c => c.type.includes('relationship')).length,
      indexesChanged: changes.filter(c => c.type.includes('index')).length,
      constraintsChanged: changes.filter(c => c.type.includes('constraint')).length,
    };
  }

  /**
   * 分析兼容性
   */
  private analyzeCompatibility(changes: VersionChange[]): EntityVersionDiff['compatibility'] {
    const breakingChanges = changes.filter(c => c.isBreaking);
    const warnings = changes.filter(c => c.impact === 'high' && !c.isBreaking);
    
    return {
      isBackwardCompatible: breakingChanges.length === 0,
      isForwardCompatible: changes.filter(c => c.type.includes('removed')).length === 0,
      breakingChanges: breakingChanges.map(c => c.description),
      warnings: warnings.map(c => c.description),
    };
  }

  /**
   * 检测合并冲突
   */
  private detectMergeConflicts(entityCode: string, sourceVersion: string, targetVersion: string): MergeConflict[] {
    const sourceSnapshot = this.getSnapshot(entityCode, sourceVersion);
    const targetSnapshot = this.getSnapshot(entityCode, targetVersion);
    
    if (!sourceSnapshot || !targetSnapshot) {
      return [];
    }

    const conflicts: MergeConflict[] = [];
    
    // 检查字段冲突
    const sourceFields = new Map(sourceSnapshot.fields.map(f => [f.code, f]));
    const targetFields = new Map(targetSnapshot.fields.map(f => [f.code, f]));
    
    for (const [code, sourceField] of sourceFields) {
      const targetField = targetFields.get(code);
      if (targetField && this.hasFieldChanged(sourceField, targetField)) {
        conflicts.push({
          path: `fields.${code}`,
          type: 'field',
          sourceValue: sourceField,
          targetValue: targetField,
        });
      }
    }
    
    return conflicts;
  }

  /**
   * 清理旧版本
   */
  private cleanupOldVersions(entityCode: string): void {
    const versions = this.getEntityVersions(entityCode);
    
    if (versions.length <= this.config.maxVersionsToKeep) {
      return;
    }

    // 按创建时间排序，保留最新的版本
    const sortedVersions = versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const versionsToKeep = sortedVersions.slice(0, this.config.maxVersionsToKeep);
    const versionsToRemove = sortedVersions.slice(this.config.maxVersionsToKeep);
    
    // 不删除已发布的版本
    const filteredVersionsToRemove = versionsToRemove.filter(v => !v.isPublished);
    
    // 删除快照
    filteredVersionsToRemove.forEach(version => {
      const key = `${entityCode}:${version.version}`;
      this.snapshots.delete(key);
    });
    
    // 更新版本列表
    const remainingVersions = versions.filter(v => 
      versionsToKeep.includes(v) || v.isPublished
    );
    
    this.versions.set(entityCode, remainingVersions);
  }

  /**
   * 计算校验和
   */
  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(16);
  }

  /**
   * 生成版本ID
   */
  private generateVersionId(): string {
    return `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成合并请求ID
   */
  private generateMergeRequestId(): string {
    return `merge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}