#!/bin/sh
set -e

echo "Starting Lowcode Platform Backend..."

# 等待数据库就绪
echo "Waiting for database to be ready..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready!"

# 检查是否是首次运行
if [ "$FIRST_RUN" = "true" ] || [ ! -f "/app/.initialized" ]; then
  echo "First run detected, initializing database..."
  
  # 运行数据库迁移
  echo "Running database migrations..."
  npx prisma db push --accept-data-loss
  
  # 生成Prisma客户端
  echo "Generating Prisma client..."
  npx prisma generate
  
  # 初始化数据
  echo "Initializing default data..."
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function initializeData() {
      try {
        // 创建默认项目
        const defaultProject = await prisma.project.upsert({
          where: { name: 'Default Project' },
          update: {},
          create: {
            name: 'Default Project',
            description: 'Default project for getting started',
            type: 'web',
            status: 'ACTIVE',
            config: {
              framework: 'react',
              database: 'postgresql'
            },
            createdBy: 'system'
          }
        });
        
        console.log('Default project created:', defaultProject.id);
        
        // 创建示例实体
        const userEntity = await prisma.entity.upsert({
          where: { 
            projectId_code: {
              projectId: defaultProject.id,
              code: 'user'
            }
          },
          update: {},
          create: {
            projectId: defaultProject.id,
            name: 'User',
            code: 'user',
            tableName: 'users',
            description: 'User entity for authentication and management',
            category: 'core',
            status: 'DRAFT',
            createdBy: 'system'
          }
        });
        
        console.log('User entity created:', userEntity.id);
        
        // 创建示例API配置
        await prisma.apiConfig.upsert({
          where: {
            projectId_path_method: {
              projectId: defaultProject.id,
              path: '/api/users',
              method: 'GET'
            }
          },
          update: {},
          create: {
            projectId: defaultProject.id,
            name: 'Get Users',
            path: '/api/users',
            method: 'GET',
            description: 'Get list of users',
            entityId: userEntity.id,
            queryConfig: {
              pagination: {
                enabled: true,
                defaultPageSize: 20,
                maxPageSize: 100
              }
            },
            responseConfig: {
              format: 'json'
            },
            authRequired: true,
            status: 'ACTIVE',
            createdBy: 'system'
          }
        });
        
        console.log('Default API config created');
        
        // 创建示例代码模板
        await prisma.codeTemplate.upsert({
          where: {
            projectId_name: {
              projectId: defaultProject.id,
              name: 'React Component'
            }
          },
          update: {},
          create: {
            projectId: defaultProject.id,
            name: 'React Component',
            description: 'Basic React functional component template',
            category: 'component',
            language: 'typescript',
            framework: 'react',
            content: \`import React from 'react';

interface {{componentName}}Props {
  // Add your props here
}

const {{componentName}}: React.FC<{{componentName}}Props> = () => {
  return (
    <div>
      <h1>{{title}}</h1>
      <p>{{description}}</p>
    </div>
  );
};

export default {{componentName}};\`,
            variables: [
              {
                name: 'componentName',
                type: 'string',
                description: 'Name of the React component',
                required: true,
                defaultValue: 'MyComponent'
              },
              {
                name: 'title',
                type: 'string',
                description: 'Component title',
                required: false,
                defaultValue: 'Hello World'
              },
              {
                name: 'description',
                type: 'string',
                description: 'Component description',
                required: false,
                defaultValue: 'This is a sample component'
              }
            ],
            tags: ['react', 'component', 'typescript'],
            isPublic: true,
            status: 'PUBLISHED',
            currentVersion: '1.0.0',
            versions: [
              {
                version: '1.0.0',
                content: \`import React from 'react';

interface {{componentName}}Props {
  // Add your props here
}

const {{componentName}}: React.FC<{{componentName}}Props> = () => {
  return (
    <div>
      <h1>{{title}}</h1>
      <p>{{description}}</p>
    </div>
  );
};

export default {{componentName}};\`,
                variables: [
                  {
                    name: 'componentName',
                    type: 'string',
                    description: 'Name of the React component',
                    required: true,
                    defaultValue: 'MyComponent'
                  },
                  {
                    name: 'title',
                    type: 'string',
                    description: 'Component title',
                    required: false,
                    defaultValue: 'Hello World'
                  },
                  {
                    name: 'description',
                    type: 'string',
                    description: 'Component description',
                    required: false,
                    defaultValue: 'This is a sample component'
                  }
                ],
                changelog: 'Initial version',
                createdAt: new Date(),
                createdBy: 'system'
              }
            ],
            usageCount: 0,
            createdBy: 'system'
          }
        });
        
        console.log('Default code template created');
        
        console.log('Database initialization completed successfully!');
      } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
      } finally {
        await prisma.\$disconnect();
      }
    }
    
    initializeData();
  "
  
  # 标记为已初始化
  touch /app/.initialized
  echo "Initialization completed!"
fi

# 启动应用
echo "Starting the application..."
exec node dist/main.js
