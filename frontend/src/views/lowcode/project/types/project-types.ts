// 项目管理相关类型定义
export interface ProjectStatus {
  ACTIVE: 'ACTIVE';
  INACTIVE: 'INACTIVE';
  ARCHIVED: 'ARCHIVED';
}

export interface ProjectStatusDisplay {
  active: 'active';
  inactive: 'inactive';
  archived: 'archived';
}

// 状态转换函数
export const convertProjectStatus = (status: keyof ProjectStatus): keyof ProjectStatusDisplay => {
  const statusMap: Record<keyof ProjectStatus, keyof ProjectStatusDisplay> = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    ARCHIVED: 'archived'
  };
  return statusMap[status];
};

// 项目扩展类型
export interface ProjectExtended {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: keyof ProjectStatus;
  deploymentStatus?: 'INACTIVE' | 'DEPLOYING' | 'DEPLOYED' | 'FAILED';
  framework?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  entityCount?: number;
  templateCount?: number;
  config?: Record<string, any>;
}

// 项目显示类型
export interface ProjectDisplay {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: keyof ProjectStatusDisplay;
  deploymentStatus?: 'INACTIVE' | 'DEPLOYING' | 'DEPLOYED' | 'FAILED';
  framework?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  entityCount?: number;
  templateCount?: number;
  preview?: string;
}
