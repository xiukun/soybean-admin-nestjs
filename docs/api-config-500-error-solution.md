# API配置500错误完整解决方案

## 🎯 问题总结

**错误状态**: 500 Internal Server Error
**请求URL**: `/api-configs/project/demo-project-1/paginated?current=1&size=10`
**根本原因**: 后端服务启动但缺少必要的数据库数据或配置

## 🚀 一键修复方案

### 方法1: 使用自动修复脚本（推荐）

```bash
cd soybean-admin-nestjs/lowcode-platform-backend

# 给脚本执行权限
chmod +x fix-api-config-500.sh

# 运行修复脚本
./fix-api-config-500.sh
```

这个脚本会自动：
- ✅ 检查环境配置
- ✅ 安装依赖
- ✅ 验证数据库连接
- ✅ 运行数据库迁移
- ✅ 创建示例数据
- ✅ 验证数据完整性

### 方法2: 手动修复步骤

#### 1. 进入后端目录
```bash
cd soybean-admin-nestjs/lowcode-platform-backend
```

#### 2. 检查环境配置
确保 `.env` 文件存在并配置正确：
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/lowcode_platform"
NODE_ENV=development
PORT=3000
JWT_SECRET=your-jwt-secret-key
```

#### 3. 启动数据库服务
```bash
# 使用Docker（推荐）
docker run --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=lowcode_platform \
  -p 5432:5432 -d postgres:13

# 或启动本地PostgreSQL服务
sudo systemctl start postgresql
```

#### 4. 安装依赖和初始化
```bash
# 安装依赖
npm install

# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init

# 运行种子脚本创建示例数据
npx prisma db seed
```

#### 5. 启动开发服务器
```bash
npm run start:dev
```

## 🧪 验证修复结果

### 1. 检查服务状态
```bash
# 健康检查
curl http://localhost:3000/health

# 应该返回: {"status":"ok","timestamp":"..."}
```

### 2. 测试API接口
```bash
# 测试项目列表
curl http://localhost:3000/api/v1/projects

# 测试API配置分页接口
curl "http://localhost:3000/api/v1/api-configs/project/demo-project-1/paginated?current=1&size=10"

# 测试低代码分页接口
curl "http://localhost:3000/api/v1/api-configs/project/demo-project-1/lowcode-paginated?page=1&perPage=10"
```

### 3. 检查数据库数据
```bash
# 使用Prisma Studio查看数据
npx prisma studio

# 或直接查询
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Project\";"
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"ApiConfig\";"
```

## 📊 预期结果

修复成功后，API接口应该返回类似以下数据：

### 平台管理接口响应
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
  "total": 5,
  "current": 1,
  "size": 10
}
```

### 低代码页面接口响应
```json
{
  "status": 0,
  "msg": "",
  "data": {
    "options": [
      {
        "label": "获取用户列表",
        "value": "get-users",
        "method": "GET",
        "path": "/api/users",
        "hasAuthentication": false,
        "status": "ACTIVE"
      }
    ],
    "page": 1,
    "perPage": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

## 🔧 常见问题解决

### 问题1: 数据库连接失败
```bash
# 检查PostgreSQL是否运行
sudo systemctl status postgresql

# 检查端口是否被占用
lsof -i :5432

# 测试连接
psql -h localhost -U postgres -d lowcode_platform
```

### 问题2: 迁移失败
```bash
# 重置数据库
npx prisma migrate reset --force

# 重新运行迁移
npx prisma migrate dev --name init
```

### 问题3: 种子数据创建失败
```bash
# 手动创建项目
npx prisma db execute --stdin <<< "
INSERT INTO \"Project\" (id, name, code, description, version, status, \"createdBy\", \"createdAt\", \"updatedAt\")
VALUES ('demo-project-1', '演示项目', 'demo-project-1', '用于演示的项目', '1.0.0', 'ACTIVE', 'system', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
"

# 手动创建API配置
npx prisma db execute --stdin <<< "
INSERT INTO \"ApiConfig\" (id, \"projectId\", name, code, description, method, path, parameters, responses, security, config, status, version, \"createdBy\", \"createdAt\", \"updatedAt\")
VALUES (gen_random_uuid(), 'demo-project-1', '获取用户列表', 'get-users', '获取系统中的用户列表', 'GET', '/api/users', '[]'::jsonb, '{}'::jsonb, '{\"type\":\"none\"}'::jsonb, '{}'::jsonb, 'ACTIVE', '1.0.0', 'system', NOW(), NOW());
"
```

### 问题4: 端口冲突
```bash
# 查找占用3000端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或使用其他端口
export PORT=3001
npm run start:dev
```

## 📋 完整检查清单

修复完成后，确认以下项目：

- [ ] PostgreSQL服务正在运行
- [ ] `.env` 文件配置正确
- [ ] 数据库 `lowcode_platform` 已创建
- [ ] Prisma迁移已运行
- [ ] 示例项目 `demo-project-1` 存在
- [ ] 示例API配置数据存在（至少5条）
- [ ] 后端服务在3000端口运行
- [ ] 健康检查接口返回正常
- [ ] API配置接口返回数据而不是500错误
- [ ] Swagger文档可以访问 (`http://localhost:3000/api`)
- [ ] 前端页面正常显示API配置列表

## 🎉 成功标志

当看到以下情况时，表示问题已解决：

1. **后端控制台显示**:
   ```
   [Nest] INFO [NestApplication] Nest application successfully started
   [Nest] INFO [NestApplication] Application is running on: http://localhost:3000
   ```

2. **前端页面**:
   - API配置管理页面正常加载
   - 显示示例API配置数据
   - 所有功能标签页都能正常工作
   - 不再出现500错误

3. **API测试**:
   - 健康检查返回 `{"status":"ok"}`
   - API配置接口返回正确的JSON数据
   - Swagger文档正常显示

## 🚨 紧急处理

如果上述方法都无法解决问题，可以使用临时的模拟数据方案：

在控制器中添加临时处理逻辑，返回模拟数据，确保前端功能可以继续使用，然后再逐步排查和修复数据库问题。

## 📞 获取帮助

如果问题仍然存在，请：

1. 检查后端控制台的详细错误日志
2. 查看数据库连接状态和数据
3. 确认所有依赖服务都在运行
4. 参考详细诊断文档: `docs/api-config-500-error-diagnosis.md`

修复完成后，低代码平台的API配置功能应该能够正常工作！
