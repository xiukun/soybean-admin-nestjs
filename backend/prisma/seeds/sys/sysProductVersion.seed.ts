import { prisma } from '../helper';
import { sysProductVersionData } from './sysProductVersion';

export const initSysProductVersion = async () => {
  console.log('Initializing sys_product_version table...');
  
  for (const version of sysProductVersionData) {
    await prisma.sysProductVersion.upsert({
      where: { id: version.id },
      update: version,
      create: version,
    });
  }
  
  console.log('sys_product_version table initialized successfully');
};
