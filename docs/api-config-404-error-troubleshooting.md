# API配置接口404错误排查指南

## 🔧 问题描述

**错误信息**: 
```
{
  "message": "Cannot GET /api/v1/api-configs/project/demo-project-1/lowcode-paginated?page=1&perPage=10",
  "error": "Not Found",
  "statusCode": 404
}
```

**请求URL**: `http://localhost:9527/proxy-lowcodeService/api-configs/project/demo-project-1/lowcode-paginated?page=1&perPage=100`

## 🔍 问题分析

### 1. URL路径分析
- **前端请求**: `/api-configs/project/{projectId}/lowcode-paginated`
- **后端路由**: `/api/v1/api-configs/project/{projectId}/lowcode-paginated`
- **代理转换**: `proxy-lowcodeService` → `localhost:3000/api/v1`

### 2. 可能的原因

1. **后端服务未启动**
2. **路由注册问题**
3. **代理配置问题**
4. **版本控制器配置问题**

## 🎯 排查步骤

### 1. 检查后端服务状态

```bash
# 检查低代码平台后端是否运行
curl http://localhost:3000/health

# 检查API配置相关路由
curl http://localhost:3000/api/v1/api-configs/project/demo-project-1/lowcode-paginated?page=1&perPage=10
```

### 2. 检查路由注册

**控制器定义** (`api-config.controller.ts`):
```typescript
@Controller({ path: 'api-configs', version: '1' })
export class ApiConfigController {
  @Get('project/:projectId/lowcode-paginated')
  async getApiConfigsLowcodePaginated(
    @Param('projectId') projectId: string,
    @Query() query: any,
  ): Promise<any> {
    // 实现逻辑
  }
}
```

**模块注册** (`app.module.ts`):
```typescript
@Module({
  controllers: [
    // ... 其他控制器
    ApiConfigController,  // ✅ 确保已注册
  ],
})
export class AppModule {}
```

### 3. 检查版本控制配置

确保应用启用了版本控制：

```typescript
// main.ts
app.enableVersioning({
  type: VersioningType.URI,
  prefix: 'api/v',
});
```

### 4. 检查代理配置

**前端代理配置** (`vite.config.ts`):
```typescript
proxy: {
  '/proxy-lowcodeService': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    rewrite: path => path.replace(/^\/proxy-lowcodeService/, '/api/v1')
  }
}
```

## 🛠️ 解决方案

### 方案1: 启动后端服务

```bash
cd lowcode-platform-backend
npm run start:dev
```

### 方案2: 检查路由顺序

确保具体路由在通用路由之前：

```typescript
@Controller({ path: 'api-configs', version: '1' })
export class ApiConfigController {
  // ✅ 具体路由在前
  @Get('project/:projectId/lowcode-paginated')
  async getApiConfigsLowcodePaginated() { ... }
  
  @Get('project/:projectId/paginated')
  async getApiConfigsPaginated() { ... }
  
  // ✅ 通用路由在后
  @Get('project/:projectId')
  async getApiConfigsByProject() { ... }
  
  @Get(':id')
  async getApiConfig() { ... }
}
```

### 方案3: 添加调试日志

在控制器中添加日志：

```typescript
@Get('project/:projectId/lowcode-paginated')
async getApiConfigsLowcodePaginated(
  @Param('projectId') projectId: string,
  @Query() query: any,
): Promise<any> {
  console.log('Received request for lowcode-paginated:', { projectId, query });
  
  // 实现逻辑...
}
```

### 方案4: 创建测试接口

添加一个简单的测试接口验证路由：

```typescript
@Get('test')
@ApiOperation({ summary: 'Test API Config routes' })
async testRoute(): Promise<any> {
  return { message: 'API Config routes are working', timestamp: new Date() };
}
```

测试命令：
```bash
curl http://localhost:3000/api/v1/api-configs/test
```

## 🧪 验证步骤

### 1. 直接测试后端接口

```bash
# 测试基础路由
curl -X GET "http://localhost:3000/api/v1/api-configs/test"

# 测试项目API配置列表
curl -X GET "http://localhost:3000/api/v1/api-configs/project/demo-project-1"

# 测试低代码分页接口
curl -X GET "http://localhost:3000/api/v1/api-configs/project/demo-project-1/lowcode-paginated?page=1&perPage=10"
```

### 2. 检查Swagger文档

访问 `http://localhost:3000/api` 查看API文档，确认路由是否正确注册。

### 3. 检查应用启动日志

查看后端启动日志，确认控制器和路由是否正确加载：

```
[Nest] INFO [RouterExplorer] Mapped {/api/v1/api-configs/project/:projectId/lowcode-paginated, GET} route
```

## 🔧 临时解决方案

如果后端接口暂时不可用，可以使用模拟数据：

```typescript
// 在前端API服务中添加模拟响应
export function fetchGetApiConfigListForLowcode(projectId: string, params?: any) {
  // 临时返回模拟数据
  if (process.env.NODE_ENV === 'development') {
    return Promise.resolve({
      data: {
        status: 0,
        data: {
          options: [
            {
              label: '获取用户列表',
              value: 'get-users',
              method: 'GET',
              path: '/api/users',
              hasAuthentication: true,
              status: 'ACTIVE'
            },
            {
              label: '创建用户',
              value: 'create-user',
              method: 'POST',
              path: '/api/users',
              hasAuthentication: true,
              status: 'ACTIVE'
            }
          ],
          page: params?.page || 1,
          perPage: params?.perPage || 10,
          total: 2
        }
      }
    });
  }
  
  return request<any>({
    url: `/api-configs/project/${projectId}/lowcode-paginated`,
    method: 'get',
    params
  });
}
```

## 📋 检查清单

- [ ] 后端服务是否运行在 localhost:3000
- [ ] ApiConfigController 是否在 AppModule 中注册
- [ ] 版本控制是否正确配置
- [ ] 路由顺序是否正确（具体路由在通用路由之前）
- [ ] 代理配置是否正确
- [ ] Swagger文档中是否显示相关路由
- [ ] 控制器方法是否有正确的装饰器

## ✅ 预期结果

修复后，接口应该返回类似以下格式的数据：

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
        "hasAuthentication": true,
        "status": "ACTIVE"
      }
    ],
    "page": 1,
    "perPage": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

## 🚀 后续优化

1. **添加健康检查接口**
2. **完善错误处理机制**
3. **添加接口监控和日志**
4. **实现接口缓存机制**
5. **添加接口性能监控**
