# 项目激活/停用功能文档

## 概述

项目激活/停用功能允许用户动态地部署和管理低代码项目。当项目被激活时，系统会自动生成代码并部署到 `amis-lowcode-backend` 服务中，使项目能够作为独立的后端服务运行。

## 功能特性

### 1. 项目激活（部署）
- **自动代码生成**：基于项目配置生成完整的 NestJS 后端代码
- **动态部署**：将生成的代码部署到 amis-lowcode-backend
- **端口管理**：支持自定义端口配置，自动检测端口冲突
- **配置管理**：支持环境配置、自动重启等选项
- **状态跟踪**：实时跟踪部署状态和进度

### 2. 项目停用
- **优雅停止**：安全地停止项目服务
- **资源清理**：清理部署相关的资源和配置
- **状态更新**：更新项目部署状态

### 3. 部署历史
- **历史记录**：记录所有部署操作的详细信息
- **版本管理**：支持多版本部署历史
- **日志管理**：保存部署日志和错误信息

## 架构设计

### 数据库模型

#### 项目表扩展 (lowcode_projects)
```sql
-- 新增字段
deployment_status VARCHAR(20) DEFAULT 'INACTIVE'  -- 部署状态
deployment_port INTEGER                           -- 部署端口
deployment_config JSONB DEFAULT '{}'             -- 部署配置
last_deployed_at TIMESTAMP(6)                    -- 最后部署时间
deployment_logs TEXT                              -- 部署日志
```

#### 部署历史表 (lowcode_project_deployments)
```sql
CREATE TABLE lowcode_project_deployments (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    version VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    port INTEGER,
    config JSONB DEFAULT '{}',
    logs TEXT,
    started_at TIMESTAMP(6),
    completed_at TIMESTAMP(6),
    error_msg TEXT,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);
```

### 服务架构

#### 1. 项目代码生成服务 (ProjectCodeGenerationService)
- 负责根据项目配置生成完整的后端代码
- 支持实体、API、模块的代码生成
- 生成 Prisma schema、package.json 等配置文件

#### 2. Amis 部署服务 (AmisDeploymentService)
- 管理与 amis-lowcode-backend 的集成
- 处理代码复制、环境配置、服务启停
- 端口管理和冲突检测

#### 3. 部署命令处理器
- **DeployProjectHandler**：处理项目部署命令
- **StopProjectDeploymentHandler**：处理停止部署命令
- **UpdateDeploymentStatusHandler**：处理状态更新命令

## API 接口

### 1. 部署项目
```http
POST /api/v1/projects/{id}/deploy
Content-Type: application/json

{
  "port": 9522,
  "config": {
    "environment": "development",
    "autoRestart": true
  }
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "project-id",
    "name": "项目名称",
    "deploymentStatus": "DEPLOYING",
    "deploymentPort": 9522,
    "deploymentConfig": {
      "environment": "development",
      "autoRestart": true
    }
  }
}
```

### 2. 停止部署
```http
POST /api/v1/projects/{id}/stop-deployment
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "project-id",
    "deploymentStatus": "INACTIVE"
  }
}
```

### 3. 获取项目列表（包含部署状态）
```http
GET /api/v1/projects
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "project-id",
      "name": "项目名称",
      "status": "ACTIVE",
      "deploymentStatus": "DEPLOYED",
      "deploymentPort": 9522,
      "lastDeployedAt": "2025-01-27T10:00:00Z"
    }
  ]
}
```

## 前端界面

### 1. 项目卡片增强
- **部署状态标签**：显示当前部署状态（未部署、部署中、已部署、部署失败）
- **部署控制按钮**：根据状态显示相应的操作按钮
- **状态图标**：使用不同图标和颜色表示部署状态

### 2. 部署配置对话框
- **端口配置**：支持自定义端口设置
- **环境选择**：开发、测试、生产环境
- **高级选项**：自动重启、健康检查等

### 3. 部署状态显示
- **实时状态**：动态更新部署进度
- **错误提示**：显示部署失败的详细信息
- **操作反馈**：提供清晰的用户操作反馈

## 部署状态说明

| 状态 | 描述 | 可执行操作 |
|------|------|------------|
| INACTIVE | 未部署 | 部署项目 |
| DEPLOYING | 部署中 | 等待完成 |
| DEPLOYED | 已部署 | 停止部署 |
| FAILED | 部署失败 | 重新部署 |

## 使用流程

### 1. 项目部署流程
1. 在项目管理页面选择要部署的项目
2. 点击"部署"按钮
3. 配置部署参数（端口、环境等）
4. 确认部署，系统开始生成代码
5. 代码生成完成后自动部署到 amis-lowcode-backend
6. 部署完成，项目状态更新为"已部署"

### 2. 项目停用流程
1. 在项目管理页面找到已部署的项目
2. 点击"停止"按钮
3. 确认操作，系统停止项目服务
4. 项目状态更新为"未部署"

## 配置说明

### 环境变量
```bash
# amis-lowcode-backend 路径
AMIS_BACKEND_PATH=/path/to/amis-lowcode-backend

# 代码生成输出路径
CODE_GENERATION_OUTPUT_PATH=/path/to/generated

# 默认部署端口范围
DEFAULT_PORT_START=9522
DEFAULT_PORT_END=9600
```

### 部署配置选项
```json
{
  "environment": "development|testing|production",
  "autoRestart": true|false,
  "healthCheck": {
    "enabled": true,
    "path": "/health",
    "interval": 30
  },
  "resources": {
    "memory": "512MB",
    "cpu": "0.5"
  }
}
```

## 故障排除

### 常见问题

1. **端口冲突**
   - 检查端口是否被其他服务占用
   - 使用自动端口分配功能

2. **代码生成失败**
   - 检查项目配置是否完整
   - 确认实体和字段定义正确

3. **部署失败**
   - 检查 amis-lowcode-backend 服务状态
   - 查看部署日志获取详细错误信息

4. **服务无法访问**
   - 确认防火墙设置
   - 检查端口配置是否正确

### 日志查看
```bash
# 查看部署日志
docker logs amis-lowcode-backend

# 查看项目特定日志
tail -f /path/to/logs/project-{id}.log
```

## 安全考虑

1. **端口安全**：只允许使用非特权端口（1024以上）
2. **权限控制**：部署操作需要适当的用户权限
3. **资源限制**：限制同时部署的项目数量
4. **日志安全**：敏感信息不记录在日志中

## 性能优化

1. **并发控制**：限制同时进行的部署操作
2. **资源监控**：监控部署服务的资源使用
3. **缓存优化**：缓存生成的代码模板
4. **异步处理**：部署操作异步执行，避免阻塞

## 监控和告警

1. **部署状态监控**：实时监控所有项目的部署状态
2. **性能监控**：监控部署服务的性能指标
3. **错误告警**：部署失败时发送告警通知
4. **资源告警**：资源使用超限时告警
