# API配置500错误诊断和解决方案

## 🔧 问题描述

**错误状态**: 500 Internal Server Error
**请求URL**: `http://localhost:9527/proxy-lowcodeService/api-configs/project/demo-project-1/paginated?current=1&size=10`

这表明后端服务已启动，但在处理请求时出现内部错误。

## 🔍 可能的原因

### 1. 数据库连接问题
- 数据库服务未启动
- 数据库连接配置错误
- 数据库表不存在

### 2. 数据库表结构问题
- 缺少 `ApiConfig` 表
- 表结构与模型不匹配
- 缺少必要的索引

### 3. 依赖注入问题
- Repository 注入失败
- PrismaService 未正确配置

### 4. 数据问题
- 项目 `demo-project-1` 不存在
- 数据格式不匹配

## 🛠️ 诊断步骤

### 1. 检查后端日志

查看后端控制台输出，寻找具体的错误信息：

```bash
cd lowcode-platform-backend
npm run start:dev
```

关注以下类型的错误：
- Prisma 连接错误
- SQL 查询错误
- 依赖注入错误

### 2. 检查数据库连接

```bash
# 检查 .env 文件
cat .env

# 测试数据库连接
npx prisma db pull
```

### 3. 检查数据库表

```bash
# 查看数据库状态
npx prisma studio

# 或者直接查询
npx prisma db execute --stdin <<< "SELECT * FROM \"ApiConfig\" LIMIT 5;"
```

### 4. 检查项目数据

```bash
# 查看项目表
npx prisma db execute --stdin <<< "SELECT * FROM \"Project\" WHERE code = 'demo-project-1';"
```

## 🚀 解决方案

### 方案1: 初始化数据库

如果数据库表不存在或结构不匹配：

```bash
cd lowcode-platform-backend

# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init

# 重置数据库（如果需要）
npx prisma migrate reset
```

### 方案2: 创建示例数据

创建测试项目和API配置数据：

```bash
# 运行种子脚本
npx prisma db seed
```

如果没有种子脚本，手动创建数据：

```sql
-- 创建示例项目
INSERT INTO "Project" (id, name, code, description, version, status, "createdBy", "createdAt")
VALUES (
  'demo-project-1',
  '演示项目',
  'demo-project-1',
  '用于演示的项目',
  '1.0.0',
  'ACTIVE',
  'system',
  NOW()
);

-- 创建示例API配置
INSERT INTO "ApiConfig" (
  id, "projectId", name, code, description, method, path,
  parameters, responses, security, config, status, version,
  "createdBy", "createdAt"
) VALUES (
  gen_random_uuid(),
  'demo-project-1',
  '获取用户列表',
  'get-users',
  '获取系统中的用户列表',
  'GET',
  '/api/users',
  '[]',
  '[]',
  '{"type":"none"}',
  '{}',
  'ACTIVE',
  '1.0.0',
  'system',
  NOW()
);
```

### 方案3: 修复环境配置

检查并修复 `.env` 文件：

```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/lowcode_platform"

# 应用配置
NODE_ENV=development
PORT=3000

# JWT配置
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
```

### 方案4: 启动依赖服务

确保所有依赖服务正在运行：

```bash
# 启动 PostgreSQL 和 Redis
docker-compose up -d postgres redis

# 或者使用本地服务
sudo systemctl start postgresql
sudo systemctl start redis
```

### 方案5: 添加错误处理

在控制器中添加更详细的错误处理：

```typescript
@Get('project/:projectId/paginated')
async getApiConfigsPaginated(
  @Param('projectId') projectId: string,
  @Query() query: any,
): Promise<any> {
  try {
    console.log('Received request:', { projectId, query });
    
    const result = await this.queryBus.execute(
      new GetApiConfigsPaginatedQuery(
        projectId,
        query.current || 1,
        query.size || 10,
        query
      )
    );
    
    console.log('Query result:', result);
    return result;
  } catch (error) {
    console.error('Error in getApiConfigsPaginated:', error);
    throw error;
  }
}
```

## 🧪 测试验证

### 1. 直接测试数据库查询

```bash
# 测试项目查询
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Project\";"

# 测试API配置查询
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"ApiConfig\";"
```

### 2. 测试API接口

```bash
# 测试健康检查
curl http://localhost:3000/health

# 测试项目列表
curl http://localhost:3000/api/v1/projects

# 测试API配置列表
curl "http://localhost:3000/api/v1/api-configs/project/demo-project-1/paginated?current=1&size=10"
```

### 3. 检查Swagger文档

访问 `http://localhost:3000/api` 查看API文档，确认接口是否正确注册。

## 🔧 快速修复脚本

创建一个快速修复脚本：

```bash
#!/bin/bash
# fix-api-config.sh

echo "🔧 修复API配置500错误..."

# 1. 检查数据库连接
echo "📊 检查数据库连接..."
npx prisma db pull || {
  echo "❌ 数据库连接失败，请检查 .env 配置"
  exit 1
}

# 2. 运行迁移
echo "🗄️ 运行数据库迁移..."
npx prisma migrate dev --name fix-api-config

# 3. 生成客户端
echo "🔄 生成Prisma客户端..."
npx prisma generate

# 4. 创建示例数据
echo "📝 创建示例数据..."
npx prisma db seed || {
  echo "⚠️ 种子脚本失败，手动创建示例数据..."
  
  # 手动创建项目
  npx prisma db execute --stdin <<< "
    INSERT INTO \"Project\" (id, name, code, description, version, status, \"createdBy\", \"createdAt\")
    VALUES ('demo-project-1', '演示项目', 'demo-project-1', '用于演示的项目', '1.0.0', 'ACTIVE', 'system', NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  
  # 手动创建API配置
  npx prisma db execute --stdin <<< "
    INSERT INTO \"ApiConfig\" (
      id, \"projectId\", name, code, description, method, path,
      parameters, responses, security, config, status, version,
      \"createdBy\", \"createdAt\"
    ) VALUES (
      gen_random_uuid(), 'demo-project-1', '获取用户列表', 'get-users',
      '获取系统中的用户列表', 'GET', '/api/users',
      '[]', '[]', '{\"type\":\"none\"}', '{}', 'ACTIVE', '1.0.0',
      'system', NOW()
    );
  "
}

# 5. 重启服务
echo "🚀 重启服务..."
pkill -f "npm run start:dev" || true
npm run start:dev &

echo "✅ 修复完成！请等待服务启动后测试接口。"
```

## 📋 检查清单

修复后验证以下项目：

- [ ] 数据库服务正常运行
- [ ] 数据库表结构正确
- [ ] 示例项目 `demo-project-1` 存在
- [ ] 示例API配置数据存在
- [ ] 后端服务无错误启动
- [ ] API接口返回数据而不是500错误
- [ ] Swagger文档可以访问
- [ ] 前端页面正常显示数据

## 🎯 预期结果

修复成功后，API接口应该返回类似以下格式的数据：

```json
{
  "records": [
    {
      "id": "uuid",
      "name": "获取用户列表",
      "code": "get-users",
      "method": "GET",
      "path": "/api/users",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "current": 1,
  "size": 10
}
```

## 🚨 紧急处理

如果问题仍然存在，可以临时使用模拟数据：

```typescript
// 在控制器中添加临时处理
@Get('project/:projectId/paginated')
async getApiConfigsPaginated(@Param('projectId') projectId: string, @Query() query: any) {
  // 临时返回模拟数据
  if (process.env.NODE_ENV === 'development') {
    return {
      records: [
        {
          id: '1',
          name: '获取用户列表',
          code: 'get-users',
          method: 'GET',
          path: '/api/users',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        }
      ],
      total: 1,
      current: parseInt(query.current) || 1,
      size: parseInt(query.size) || 10
    };
  }
  
  // 正常处理逻辑...
}
```
