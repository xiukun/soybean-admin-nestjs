#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * 数据库初始化脚本
 * Database Initialization Script
 */
async function initializeDatabase() {
  console.log('🚀 开始初始化数据库...');
  console.log('🚀 Starting database initialization...');

  try {
    // 1. 创建默认管理员用户
    console.log('👤 创建默认管理员用户...');
    
    const adminExists = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@lowcode.com',
          password: hashedPassword,
          status: 'ACTIVE',
          role: 'ADMIN',
          profile: {
            create: {
              firstName: 'System',
              lastName: 'Administrator',
              avatar: null,
            }
          }
        },
        include: {
          profile: true
        }
      });

      console.log('✅ 默认管理员用户创建成功:', admin.username);
    } else {
      console.log('ℹ️ 默认管理员用户已存在');
    }

    // 2. 创建示例项目
    console.log('📁 创建示例项目...');
    
    const exampleProject = await prisma.project.upsert({
      where: { code: 'example-blog' },
      update: {},
      create: {
        name: '示例博客系统',
        code: 'example-blog',
        description: '一个完整的博客管理系统示例，包含用户管理、文章管理、评论系统等功能',
        version: '1.0.0',
        status: 'ACTIVE',
        createdBy: adminExists?.id || (await prisma.user.findUnique({ where: { username: 'admin' } }))?.id || '',
      }
    });

    console.log('✅ 示例项目创建成功:', exampleProject.name);

    // 3. 创建示例实体 - 用户实体
    console.log('🏗️ 创建示例实体...');
    
    const userEntity = await prisma.entity.upsert({
      where: { 
        projectId_code: {
          projectId: exampleProject.id,
          code: 'user'
        }
      },
      update: {},
      create: {
        projectId: exampleProject.id,
        name: '用户',
        code: 'user',
        tableName: 'users',
        description: '系统用户实体',
        category: 'core',
        status: 'PUBLISHED',
        createdBy: adminExists?.id || (await prisma.user.findUnique({ where: { username: 'admin' } }))?.id || '',
      }
    });

    // 4. 为用户实体创建字段
    console.log('📝 创建实体字段...');
    
    const userFields = [
      {
        name: 'ID',
        code: 'id',
        type: 'UUID',
        nullable: false,
        primaryKey: true,
        description: '用户唯一标识',
        order: 1
      },
      {
        name: '用户名',
        code: 'username',
        type: 'VARCHAR',
        length: 50,
        nullable: false,
        unique: true,
        description: '用户登录名',
        order: 2
      },
      {
        name: '邮箱',
        code: 'email',
        type: 'VARCHAR',
        length: 255,
        nullable: false,
        unique: true,
        description: '用户邮箱地址',
        order: 3
      },
      {
        name: '密码',
        code: 'password',
        type: 'VARCHAR',
        length: 255,
        nullable: false,
        description: '加密后的密码',
        order: 4
      },
      {
        name: '状态',
        code: 'status',
        type: 'VARCHAR',
        length: 20,
        nullable: false,
        defaultValue: 'ACTIVE',
        description: '用户状态',
        order: 5
      },
      {
        name: '创建时间',
        code: 'createdAt',
        type: 'TIMESTAMP',
        nullable: false,
        description: '创建时间',
        order: 6
      },
      {
        name: '更新时间',
        code: 'updatedAt',
        type: 'TIMESTAMP',
        nullable: false,
        description: '最后更新时间',
        order: 7
      }
    ];

    for (const fieldData of userFields) {
      await prisma.field.upsert({
        where: {
          entityId_code: {
            entityId: userEntity.id,
            code: fieldData.code
          }
        },
        update: {},
        create: {
          ...fieldData,
          entityId: userEntity.id,
          createdBy: adminExists?.id || (await prisma.user.findUnique({ where: { username: 'admin' } }))?.id || '',
        }
      });
    }

    console.log('✅ 用户实体字段创建完成');

    // 5. 创建文章实体
    const postEntity = await prisma.entity.upsert({
      where: { 
        projectId_code: {
          projectId: exampleProject.id,
          code: 'post'
        }
      },
      update: {},
      create: {
        projectId: exampleProject.id,
        name: '文章',
        code: 'post',
        tableName: 'posts',
        description: '博客文章实体',
        category: 'content',
        status: 'PUBLISHED',
        createdBy: adminExists?.id || (await prisma.user.findUnique({ where: { username: 'admin' } }))?.id || '',
      }
    });

    // 6. 为文章实体创建字段
    const postFields = [
      {
        name: 'ID',
        code: 'id',
        type: 'UUID',
        nullable: false,
        primaryKey: true,
        description: '文章唯一标识',
        order: 1
      },
      {
        name: '标题',
        code: 'title',
        type: 'VARCHAR',
        length: 200,
        nullable: false,
        description: '文章标题',
        order: 2
      },
      {
        name: '内容',
        code: 'content',
        type: 'TEXT',
        nullable: false,
        description: '文章内容',
        order: 3
      },
      {
        name: '作者ID',
        code: 'authorId',
        type: 'UUID',
        nullable: false,
        description: '文章作者ID',
        order: 4
      },
      {
        name: '状态',
        code: 'status',
        type: 'VARCHAR',
        length: 20,
        nullable: false,
        defaultValue: 'DRAFT',
        description: '文章状态',
        order: 5
      },
      {
        name: '发布时间',
        code: 'publishedAt',
        type: 'TIMESTAMP',
        nullable: true,
        description: '文章发布时间',
        order: 6
      }
    ];

    for (const fieldData of postFields) {
      await prisma.field.upsert({
        where: {
          entityId_code: {
            entityId: postEntity.id,
            code: fieldData.code
          }
        },
        update: {},
        create: {
          ...fieldData,
          entityId: postEntity.id,
          createdBy: adminExists?.id || (await prisma.user.findUnique({ where: { username: 'admin' } }))?.id || '',
        }
      });
    }

    console.log('✅ 文章实体字段创建完成');

    // 7. 创建基础代码模板
    console.log('📄 创建基础代码模板...');
    
    const nestjsServiceTemplate = await prisma.codeTemplate.upsert({
      where: {
        projectId_code: {
          projectId: exampleProject.id,
          code: 'nestjs-service'
        }
      },
      update: {},
      create: {
        projectId: exampleProject.id,
        name: 'NestJS 服务模板',
        code: 'nestjs-service',
        category: 'service',
        language: 'typescript',
        framework: 'nestjs',
        description: '用于生成 NestJS 服务类的模板',
        template: `import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { {{pascalCase entity.code}} } from '@prisma/client';

@Injectable()
export class {{pascalCase entity.code}}Service {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<{{pascalCase entity.code}}[]> {
    return this.prisma.{{camelCase entity.code}}.findMany();
  }

  async findOne(id: string): Promise<{{pascalCase entity.code}} | null> {
    return this.prisma.{{camelCase entity.code}}.findUnique({
      where: { id },
    });
  }

  async create(data: Omit<{{pascalCase entity.code}}, 'id'>): Promise<{{pascalCase entity.code}}> {
    return this.prisma.{{camelCase entity.code}}.create({
      data,
    });
  }

  async update(id: string, data: Partial<{{pascalCase entity.code}}>): Promise<{{pascalCase entity.code}}> {
    return this.prisma.{{camelCase entity.code}}.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<{{pascalCase entity.code}}> {
    return this.prisma.{{camelCase entity.code}}.delete({
      where: { id },
    });
  }
}`,
        variables: JSON.stringify([
          { name: 'entity', type: 'object', required: true, description: '实体信息' }
        ]),
        status: 'PUBLISHED',
        createdBy: adminExists?.id || (await prisma.user.findUnique({ where: { username: 'admin' } }))?.id || '',
      }
    });

    console.log('✅ 代码模板创建完成');

    console.log('');
    console.log('🎉 数据库初始化完成！');
    console.log('');
    console.log('📊 初始化数据统计：');
    console.log(`  - 用户数量: ${await prisma.user.count()}`);
    console.log(`  - 项目数量: ${await prisma.project.count()}`);
    console.log(`  - 实体数量: ${await prisma.entity.count()}`);
    console.log(`  - 字段数量: ${await prisma.field.count()}`);
    console.log(`  - 模板数量: ${await prisma.codeTemplate.count()}`);
    console.log('');
    console.log('🔑 默认管理员账号：');
    console.log('  用户名: admin');
    console.log('  密码: admin123');
    console.log('  邮箱: admin@lowcode.com');
    console.log('');
    console.log('🚀 现在可以启动应用程序了！');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行初始化
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };
