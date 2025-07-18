import { Prisma } from '@prisma/client';

import { prisma } from '../helper';

export const initSysRoleMenu = async () => {
  const data: Prisma.SysRoleMenuCreateInput[] = [
    {
      roleId: '1',
      menuId: 50,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 54,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 62,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 63,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 64,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 65,
      domain: 'built-in',
    },
    {
      roleId: '2',
      menuId: 50,
      domain: 'built-in',
    },
    {
      roleId: '2',
      menuId: 62,
      domain: 'built-in',
    },
    {
      roleId: '3',
      menuId: 50,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 51,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 52,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 71,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 72,
      domain: 'built-in',
    },
    // 低代码页面示例
    {
      roleId: '1',
      menuId: 80,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 81,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 82,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 83,
      domain: 'built-in',
    },
    // 低代码平台菜单权限 - 管理员角色
    {
      roleId: '1',
      menuId: 100,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 101,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 102,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 103,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 104,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 105,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 106,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 107,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 108,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 109,
      domain: 'built-in',
    },
  ];

  return prisma.sysRoleMenu.createMany({ data });
};
