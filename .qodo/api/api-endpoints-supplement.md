# API 接口补充文档

## 代码生成 API

### 6.1 生成项目代码
```http
POST /api/v1/projects/{projectId}/generate
```

**请求参数:**
```json
{
  "type": "FULL",
  "config": {
    "generateBackend": true,
    "generateFrontend": true,
    "generateDatabase": true,
    "framework": "nestjs",
    "language": "typescript"
  }
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "代码生成任务已创建",
  "data": {
    "taskId": "task_001",
    "status": "PENDING",
    "progress": 0,
    "estimatedTime": 300
  }
}
```

### 6.2 获取生成任务状态
```http
GET /api/v1/codegen-tasks/{taskId}
```

### 6.3 获取生成日志
```http
GET /api/v1/codegen-tasks/{taskId}/logs
```

## 部署管理 API

### 7.1 部署项目
```http
POST /api/v1/projects/{projectId}/deploy
```

**请求参数:**
```json
{
  "version": "1.0.0",
  "port": 8001,
  "config": {
    "env": {
      "NODE_ENV": "production",
      "DATABASE_URL": "postgresql://..."
    },
    "resources": {
      "memory": "512Mi",
      "cpu": "500m"
    }
  }
}
```

### 7.2 停止项目
```http
POST /api/v1/projects/{projectId}/stop
```

### 7.3 获取部署日志
```http
GET /api/v1/deployments/{deploymentId}/logs
```

## 错误码说明

### 业务错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 10001 | 项目不存在 | 检查项目ID是否正确 |
| 10002 | 项目名称已存在 | 使用不同的项目名称 |
| 10003 | 实体不存在 | 检查实体ID是否正确 |
| 10004 | 字段名称冲突 | 使用不同的字段名称 |
| 10005 | 关系创建失败 | 检查实体关系配置 |
| 10006 | 代码生成失败 | 查看生成日志获取详细错误 |
| 10007 | 部署失败 | 检查部署配置和资源 |
| 10008 | 端口已被占用 | 使用其他可用端口 |

## API 测试示例

### 使用 curl 测试

```bash
# 登录获取token
curl -X POST http://localhost:9528/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "123456"
  }'

# 使用token访问API
curl -X GET http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# 创建项目
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试项目",
    "code": "test_project",
    "description": "这是一个测试项目"
  }'
```

### 使用 Postman 测试

1. **设置环境变量**
   - `base_url`: http://localhost:3000
   - `token`: {{auth_token}}

2. **认证设置**
   - Type: Bearer Token
   - Token: {{token}}

3. **请求示例**
   ```
   GET {{base_url}}/api/v1/projects
   Authorization: Bearer {{token}}
   ```

## SDK 使用示例

### JavaScript/TypeScript SDK

```typescript
import { LowcodePlatformClient } from '@soybean/lowcode-sdk';

const client = new LowcodePlatformClient({
  baseURL: 'http://localhost:3000',
  token: 'your-jwt-token'
});

// 获取项目列表
const projects = await client.projects.list({
  page: 1,
  pageSize: 10
});

// 创建项目
const newProject = await client.projects.create({
  name: '新项目',
  code: 'new_project',
  description: '项目描述'
});

// 创建实体
const entity = await client.entities.create(newProject.id, {
  name: '用户',
  code: 'user',
  fields: [
    {
      name: '用户名',
      code: 'username',
      type: 'VARCHAR',
      length: 50,
      required: true
    }
  ]
});
```

### Python SDK

```python
from soybean_lowcode import LowcodePlatformClient

client = LowcodePlatformClient(
    base_url='http://localhost:3000',
    token='your-jwt-token'
)

# 获取项目列表
projects = client.projects.list(page=1, page_size=10)

# 创建项目
new_project = client.projects.create({
    'name': '新项目',
    'code': 'new_project',
    'description': '项目描述'
})
```

## 性能优化建议

### 1. 分页查询优化
- 使用合适的页面大小（建议10-50）
- 避免查询过大的数据集
- 使用索引优化查询性能

### 2. 缓存策略
- 对频繁访问的数据使用缓存
- 设置合理的缓存过期时间
- 使用 Redis 进行分布式缓存

### 3. 请求优化
- 批量操作减少请求次数
- 使用 GraphQL 按需获取数据
- 启用 HTTP/2 提升传输效率

### 4. 监控和日志
- 监控 API 响应时间
- 记录错误日志便于排查
- 使用 APM 工具监控性能

## 安全注意事项

### 1. 认证授权
- 所有 API 都需要有效的 JWT Token
- Token 过期后需要刷新
- 实现细粒度的权限控制

### 2. 输入验证
- 验证所有输入参数
- 防止 SQL 注入攻击
- 限制文件上传大小和类型

### 3. 速率限制
- 实现 API 调用频率限制
- 防止恶意请求和 DDoS 攻击
- 对不同用户设置不同的限制

### 4. 数据加密
- 敏感数据传输使用 HTTPS
- 数据库中敏感信息加密存储
- 定期更新加密密钥