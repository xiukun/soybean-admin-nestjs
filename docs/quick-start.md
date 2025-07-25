# 🚀 快速开始指南

## 📋 目录

1. [系统要求](#系统要求)
2. [5分钟快速部署](#5分钟快速部署)
3. [第一个低代码项目](#第一个低代码项目)
4. [常用操作](#常用操作)
5. [下一步](#下一步)

---

## 💻 系统要求

### 最低要求
- **操作系统**: Linux/macOS/Windows 10+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **内存**: 4GB RAM
- **磁盘空间**: 10GB 可用空间
- **网络**: 互联网连接（用于下载镜像）

### 推荐配置
- **内存**: 8GB+ RAM
- **CPU**: 4核心+
- **磁盘空间**: 20GB+ SSD
- **网络**: 稳定的互联网连接

---

## ⚡ 5分钟快速部署

### 步骤1: 获取项目

```bash
# 克隆项目
git clone https://github.com/your-org/soybean-admin-nestjs.git
cd soybean-admin-nestjs

# 或者下载压缩包
wget https://github.com/your-org/soybean-admin-nestjs/archive/main.zip
unzip main.zip
cd soybean-admin-nestjs-main
```

### 步骤2: 环境配置

```bash
# 复制环境配置文件
cp .env.docker.example .env.docker

# 编辑配置文件（可选，使用默认配置即可快速启动）
nano .env.docker
```

**默认配置说明**:
```bash
# 数据库配置
POSTGRES_DB=soybean_admin
POSTGRES_USER=soybean
POSTGRES_PASSWORD=soybean123

# JWT配置（生产环境请修改）
JWT_SECRET=your-jwt-secret-key-here
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here

# 服务端口
BACKEND_PORT=9528
LOWCODE_PORT=3000
AMIS_PORT=9522
FRONTEND_PORT=3001
```

### 步骤3: 一键启动

```bash
# 赋予脚本执行权限
chmod +x scripts/deploy.sh

# 初始化并启动所有服务
./scripts/deploy.sh init
./scripts/deploy.sh start prod

# 等待服务启动完成（约2-3分钟）
./scripts/deploy.sh status
```

### 步骤4: 验证部署

```bash
# 检查服务状态
./scripts/deploy.sh health

# 查看服务日志
./scripts/deploy.sh logs
```

**访问地址**:
- 🌐 **前端应用**: http://localhost:3001
- 📚 **主后端API文档**: http://localhost:9528/api/docs
- 🎨 **低代码平台API**: http://localhost:3000/api/docs
- 📄 **Amis后端API**: http://localhost:9522/api/docs

### 步骤5: 首次登录

1. 打开浏览器访问 http://localhost:3001
2. 使用默认管理员账户登录：
   - **用户名**: `admin`
   - **密码**: `admin123`

> ⚠️ **重要**: 首次登录后请立即修改默认密码！

---

## 🎯 第一个低代码项目

### 创建项目

1. **登录系统**
   - 访问 http://localhost:3001
   - 使用 admin/admin123 登录

2. **创建项目**
   ```bash
   # 或通过API创建
   curl -X POST "http://localhost:3000/api/projects" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "我的第一个项目",
       "description": "学习低代码平台的示例项目",
       "type": "web-application"
     }'
   ```

### 设计实体

1. **进入实体设计器**
   - 点击左侧菜单 "实体设计器"
   - 点击 "新建画布"

2. **创建用户实体**
   - 点击工具栏 "添加实体"
   - 设置实体信息：
     - **实体代码**: `user`
     - **实体名称**: `用户`
     - **描述**: `系统用户实体`

3. **添加字段**
   ```json
   {
     "fields": [
       {
         "name": "id",
         "type": "string",
         "required": true,
         "description": "用户ID"
       },
       {
         "name": "username",
         "type": "string",
         "required": true,
         "unique": true,
         "length": 50,
         "description": "用户名"
       },
       {
         "name": "email",
         "type": "string",
         "required": true,
         "unique": true,
         "description": "邮箱"
       },
       {
         "name": "status",
         "type": "string",
         "required": true,
         "defaultValue": "active",
         "description": "状态"
       }
     ]
   }
   ```

4. **保存画布**
   - 点击工具栏 "保存" 按钮
   - 画布自动保存到数据库

### 生成代码

1. **验证设计**
   - 点击 "验证设计" 按钮
   - 确保没有错误和警告

2. **配置生成参数**
   - 点击 "生成代码" 按钮
   - 配置生成选项：
     ```json
     {
       "taskName": "用户管理系统代码生成",
       "config": {
         "projectName": "user-management",
         "outputDir": "./generated",
         "generateBase": true,
         "generateBiz": true,
         "generateTests": true
       }
     }
     ```

3. **执行生成**
   - 点击 "确认生成"
   - 系统创建代码生成任务
   - 在任务管理页面查看进度

### 查看生成结果

1. **任务状态**
   ```bash
   # 通过API查看任务状态
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3000/api/code-generation/layered/tasks/TASK_ID"
   ```

2. **生成的文件结构**
   ```
   generated/user-management/
   ├── base/                    # 基础层（自动生成）
   │   ├── controllers/
   │   │   └── user.base.controller.ts
   │   ├── services/
   │   │   └── user.base.service.ts
   │   ├── repositories/
   │   │   └── user.base.repository.ts
   │   ├── dto/
   │   │   ├── create-user.dto.ts
   │   │   └── update-user.dto.ts
   │   └── entities/
   │       └── user.entity.ts
   ├── biz/                     # 业务层（可修改）
   │   ├── controllers/
   │   │   └── user.controller.ts
   │   ├── services/
   │   │   └── user.service.ts
   │   └── modules/
   │       └── user.module.ts
   ├── shared/                  # 共享层
   │   ├── utils/
   │   ├── constants/
   │   └── decorators/
   └── test/                    # 测试层
       ├── unit/
       ├── integration/
       └── e2e/
   ```

---

## 🔧 常用操作

### 管理用户

```bash
# 创建新用户
curl -X POST "http://localhost:9528/api/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "roles": ["user"]
  }'

# 获取用户列表
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:9528/api/users?page=1&limit=10"
```

### 管理模板

```bash
# 获取模板列表
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/templates?type=controller"

# 创建自定义模板
curl -X POST "http://localhost:3000/api/templates" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的控制器模板",
    "type": "controller",
    "language": "typescript",
    "framework": "nestjs",
    "template": "import { Controller } from \"@nestjs/common\";\n\n@Controller(\"{{kebabCase entity.name}}\")\nexport class {{pascalCase entity.name}}Controller {\n  // 自定义实现\n}"
  }'
```

### 监控系统

```bash
# 查看系统健康状态
curl "http://localhost:9528/api/performance/health"

# 查看性能统计
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:9528/api/performance/stats"

# 查看系统资源使用
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:9528/api/performance/system/resources"
```

### 备份数据

```bash
# 创建数据库备份
./scripts/backup.sh

# 查看备份文件
ls -la backups/

# 恢复数据库（如需要）
./scripts/restore.sh backups/db_backup_20240115_103000.sql.gz
```

### 查看日志

```bash
# 查看所有服务日志
./scripts/deploy.sh logs

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f lowcode
docker-compose logs -f postgres

# 查看实时日志
docker-compose logs -f --tail=100 backend
```

---

## 🎓 下一步

### 深入学习

1. **阅读完整文档**
   - [用户手册](user-manual.md) - 详细的功能说明
   - [API参考](api-reference.md) - 完整的API文档
   - [开发指南](development-guide.md) - 开发和扩展指南

2. **探索高级功能**
   - 自定义模板开发
   - 复杂实体关系设计
   - 业务层代码扩展
   - 性能监控和优化

3. **参与社区**
   - [GitHub仓库](https://github.com/your-org/soybean-admin-nestjs)
   - [问题反馈](https://github.com/your-org/soybean-admin-nestjs/issues)
   - [讨论区](https://github.com/your-org/soybean-admin-nestjs/discussions)

### 生产部署

1. **安全配置**
   - 修改默认密码和密钥
   - 配置HTTPS证书
   - 设置防火墙规则
   - 启用访问日志

2. **性能优化**
   - 配置数据库连接池
   - 启用Redis缓存
   - 设置CDN加速
   - 优化Docker镜像

3. **监控告警**
   - 配置Prometheus监控
   - 设置告警规则
   - 集成日志分析
   - 建立运维流程

### 常见问题

**Q: 服务启动失败怎么办？**
```bash
# 检查端口占用
netstat -tulpn | grep :3000

# 查看详细错误日志
docker-compose logs backend

# 重新构建镜像
docker-compose build --no-cache
```

**Q: 如何修改默认端口？**
```bash
# 编辑 .env.docker 文件
FRONTEND_PORT=8080
BACKEND_PORT=8081

# 重启服务
./scripts/deploy.sh restart
```

**Q: 如何重置数据库？**
```bash
# 停止服务
./scripts/deploy.sh stop

# 删除数据卷
docker volume rm soybean-admin-nestjs_postgres_data

# 重新启动
./scripts/deploy.sh start prod
```

**Q: 如何更新系统？**
```bash
# 拉取最新代码
git pull origin main

# 重新构建和启动
./scripts/deploy.sh rebuild
```

---

## 📞 获取帮助

如果遇到问题，可以通过以下方式获取帮助：

1. **查看文档**: [完整文档](user-manual.md)
2. **搜索问题**: [GitHub Issues](https://github.com/your-org/soybean-admin-nestjs/issues)
3. **提交问题**: [新建Issue](https://github.com/your-org/soybean-admin-nestjs/issues/new)
4. **参与讨论**: [GitHub Discussions](https://github.com/your-org/soybean-admin-nestjs/discussions)

---

**🎉 恭喜！您已经成功部署并开始使用 Soybean Admin NestJS 低代码平台！**
