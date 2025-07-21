# 🚀 低代码平台快速启动指南

欢迎使用低代码平台！本指南将帮助您在5分钟内启动并运行整个系统。

## 📋 前置要求

确保您的系统已安装：
- **Node.js** (v18+)
- **npm** 或 **yarn**
- **PostgreSQL** (v13+)
- **Git**

## ⚡ 快速启动 (5分钟)

### 1. 启动数据库 (1分钟)
```bash
# 如果使用Docker
docker run --name lowcode-postgres -e POSTGRES_PASSWORD=soybean@123. -e POSTGRES_USER=soybean -e POSTGRES_DB=soybean-admin-nest-backend -p 25432:5432 -d postgres:13

# 或者启动您现有的PostgreSQL服务
```

### 2. 启动amis-lowcode-backend (2分钟)
```bash
# 进入amis-lowcode-backend目录
cd amis-lowcode-backend

# 安装依赖 (如果还没有安装)
npm install

# 启动服务
npm run start:dev
```

等待看到以下日志：
```
🚀 Amis Lowcode Backend is running on http://localhost:9522/api/v1
📚 API Documentation: http://localhost:9522/api/v1/docs
```

### 3. 启动lowcode-platform-backend (2分钟)
```bash
# 新开一个终端，进入lowcode-platform-backend目录
cd lowcode-platform-backend

# 安装依赖 (如果还没有安装)
npm install

# 启动服务
npm run start:dev
```

等待看到以下日志：
```
🚀 Low-Code Platform Backend is running on: http://0.0.0.0:3003
📚 API Documentation: http://0.0.0.0:3003/api-docs
```

### 4. 验证系统运行 (30秒)
```bash
# 在项目根目录运行测试脚本
./test-system.sh
```

## 🌐 访问系统

### API文档
- **lowcode-platform-backend**: http://localhost:3003/api-docs
- **amis-lowcode-backend**: http://localhost:9522/api/v1/docs

### 健康检查
- **amis-lowcode-backend**: http://localhost:9522/api/v1/health

### API信息
- **amis-lowcode-backend**: http://localhost:9522/api/v1

## 🧪 快速测试

### 测试用户管理API
```bash
# 获取用户列表
curl "http://localhost:9522/api/v1/users?page=1&pageSize=5"

# 获取角色列表
curl "http://localhost:9522/api/v1/roles?page=1&pageSize=5"
```

### 测试项目管理API (需要JWT认证)
```bash
# 获取项目列表 (会返回401，需要认证)
curl "http://localhost:3003/api/v1/projects/paginated?current=1&size=5"
```

## 🔑 获取JWT Token (用于测试)

由于lowcode-platform-backend的所有端点都需要JWT认证，您需要：

1. **使用Swagger UI**: 访问 http://localhost:3003/api-docs
2. **点击"Authorize"按钮**
3. **输入JWT token** (需要先实现认证端点或使用测试token)

## 📊 系统状态检查

运行完整的系统测试：
```bash
# 在项目根目录
./test-system.sh
```

预期输出：
```
🚀 Testing Low-Code Platform System...

1. Testing lowcode-platform-backend (port 3003)...
==================================================
Testing Projects List... ✅ PASS (HTTP 200)

2. Testing amis-lowcode-backend (port 9522)...
==============================================
Testing Health Check... ✅ PASS (HTTP 200)
Testing API Info... ✅ PASS (HTTP 200)
Testing Users List... ✅ PASS (HTTP 200)
Testing Roles List... ✅ PASS (HTTP 200)

4. System Status Summary...
==========================
lowcode-platform-backend: ✅ Running on port 3003
amis-lowcode-backend: ✅ Running on port 9522
```

## 🛠️ 开发工具

### 代码生成测试
```bash
# 测试代码生成功能 (需要JWT认证)
curl -X POST "http://localhost:3003/api/v1/code-generation/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "projectId": "demo-project-1",
    "templateIds": ["tpl-nestjs-entity-model"],
    "entityIds": ["demo-entity-user"],
    "variables": {},
    "options": {
      "overwriteExisting": true,
      "generateTests": false,
      "generateDocs": false,
      "architecture": "base-biz",
      "framework": "nestjs"
    }
  }'
```

### 数据库查看
```bash
# 连接数据库查看数据
PGPASSWORD='soybean@123.' psql -h localhost -p 25432 -U soybean -d soybean-admin-nest-backend

# 查看项目表
SELECT * FROM lowcode_projects;

# 查看实体表
SELECT * FROM lowcode_entities;

# 查看模板表
SELECT * FROM lowcode_code_templates;
```

## 📚 下一步

### 学习资源
1. **系统指南**: `docs/LOWCODE_PLATFORM_GUIDE.md`
2. **API参考**: `docs/API_REFERENCE.md`
3. **完整实现指南**: `docs/lowcode-complete-implementation-guide.md`
4. **系统状态报告**: `docs/FINAL_SYSTEM_STATUS.md`

### 开发建议
1. **先熟悉API**: 使用Swagger UI探索所有可用的API端点
2. **理解数据模型**: 查看数据库表结构和关系
3. **测试代码生成**: 尝试生成简单的CRUD代码
4. **自定义模板**: 创建您自己的代码生成模板

## 🔧 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 检查端口使用情况
lsof -ti:3003  # lowcode-platform-backend
lsof -ti:9522  # amis-lowcode-backend
lsof -ti:25432 # PostgreSQL

# 杀死占用端口的进程
kill -9 $(lsof -ti:3003)
```

#### 2. 数据库连接失败
```bash
# 检查PostgreSQL是否运行
pg_isready -h localhost -p 25432

# 检查数据库是否存在
PGPASSWORD='soybean@123.' psql -h localhost -p 25432 -U soybean -l
```

#### 3. 依赖安装问题
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 或者使用yarn
rm -rf node_modules yarn.lock
yarn install
```

#### 4. 服务启动失败
```bash
# 检查环境变量
cat .env

# 检查日志输出
npm run start:dev 2>&1 | tee startup.log
```

## 🆘 获取帮助

如果遇到问题：

1. **检查日志**: 查看服务启动时的控制台输出
2. **运行测试**: 使用 `./test-system.sh` 诊断问题
3. **查看文档**: 参考 `docs/` 目录下的详细文档
4. **检查配置**: 确认 `.env` 文件配置正确

## 🎉 成功！

如果您看到两个服务都正常启动，并且测试脚本显示绿色的 ✅，那么恭喜您！低代码平台已经成功运行。

现在您可以：
- 🔍 探索API文档
- 🧪 测试代码生成功能
- 📝 创建自定义模板
- 🏗️ 开始构建您的低代码应用

**祝您使用愉快！** 🚀
