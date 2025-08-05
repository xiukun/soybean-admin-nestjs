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
  ];

  return prisma.sysRoleMenu.createMany({ data });
};
