import { Status } from '@prisma/client';

export const sysProductVersionData = [
  {
    id: '1',
    versionName: '初始版本',
    versionNum: '1.0.0',
    description: '系统初始版本',
    status: Status.ENABLED,
    createdBy: '-1',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    versionName: '功能增强版',
    versionNum: '1.1.0',
    description: '增加了用户管理和权限控制功能',
    status: Status.DISABLED,
    createdBy: '-1',
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    versionName: '性能优化版',
    versionNum: '1.2.0',
    description: '优化了系统性能，提升了响应速度',
    status: Status.DISABLED,
    createdBy: '-1',
    createdAt: new Date('2024-03-01'),
  },
];
