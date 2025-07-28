import type { Project } from '../composables/useProjectPerformance';

// 修复项目数据类型转换
export function fixProjectData(apiProject: any): Project {
  return {
    id: apiProject.id,
    name: apiProject.name,
    code: apiProject.code,
    description: apiProject.description,
    status: apiProject.status as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
    deploymentStatus: apiProject.deploymentStatus,
    deploymentPort: apiProject.deploymentPort,
    config: apiProject.config || {},
    entityCount: apiProject.entityCount || 0,
    templateCount: apiProject.templateCount || 0,
    createdBy: apiProject.createdBy,
    createdAt: apiProject.createdAt || new Date().toISOString(),
    updatedAt: apiProject.updatedAt || new Date().toISOString()
  };
}

// 修复错误处理
export function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '未知错误';
}

// 修复Blob处理
export function createDownloadBlob(data: any, filename: string): void {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('下载失败:', error);
  }
}

// 状态映射
export const statusMap = {
  ACTIVE: 'active',
  INACTIVE: 'inactive', 
  ARCHIVED: 'archived'
} as const;

export function mapProjectStatus(status: string): 'active' | 'inactive' | 'archived' {
  return statusMap[status as keyof typeof statusMap] || 'inactive';
}