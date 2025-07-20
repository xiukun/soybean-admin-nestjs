# API配置使用指南

## 概述

低代码平台的API配置功能已经完全修复并增强，支持双接口规范，提供完整的CRUD操作和测试功能。

## 功能特性

### ✅ 已修复的问题

1. **类型错误修复**
   - 修复了 `useNaiveForm` 未定义的问题
   - 修复了表格列渲染的类型推断问题
   - 修复了字段名称映射不匹配的问题

2. **接口格式适配**
   - 平台管理接口：`current/size` + `records` 格式
   - 低代码页面接口：`page/perPage` + `options` 格式
   - 自动处理后端响应格式转换

3. **国际化完善**
   - 添加了缺失的翻译键
   - 支持中英文双语
   - 完善了表单验证消息

4. **组件功能增强**
   - API配置选择器组件
   - 接口格式对比功能
   - amis配置自动生成

## 使用方法

### 1. 访问API配置管理

```
路径: /lowcode/api-config
功能: API配置的完整CRUD操作
```

### 2. 接口格式对比

在API配置管理页面中，切换到"接口格式对比"标签页：
- 查看平台管理格式和低代码页面格式的对比
- 测试API配置选择器功能
- 生成amis配置

### 3. 功能测试

```
测试路径: /lowcode/api-config/test
功能: 完整的API配置功能测试
```

测试页面包含：
- 项目选择测试
- 平台管理接口测试
- 低代码页面接口测试
- API配置选择器测试
- amis配置生成测试

## API接口规范

### 平台管理接口

**用途**: Vue管理界面的表格展示

**请求格式**:
```typescript
{
  current: 1,    // 当前页码
  size: 10,      // 每页大小
  search: "",    // 搜索关键词
  method: "",    // HTTP方法筛选
  status: ""     // 状态筛选
}
```

**响应格式**:
```typescript
{
  records: ApiConfig[],  // API配置列表
  total: number,         // 总记录数
  current: number,       // 当前页码
  size: number          // 每页大小
}
```

### 低代码页面接口

**用途**: amis等低代码框架的数据源

**请求格式**:
```typescript
{
  page: 1,       // 页码
  perPage: 10,   // 每页大小
  search: "",    // 搜索关键词
  method: "",    // HTTP方法筛选
  status: ""     // 状态筛选
}
```

**响应格式**:
```typescript
{
  status: 0,
  msg: "",
  data: {
    options: ApiConfigOption[],  // 选项列表
    page: number,
    perPage: number,
    total: number,
    totalPages: number
  }
}
```

## 开发指南

### 前端调用示例

```typescript
// 平台管理接口调用
const platformResponse = await fetchGetApiConfigList(projectId, {
  current: 1,
  size: 10
});

// 低代码页面接口调用
const lowcodeResponse = await fetchGetApiConfigListForLowcode(projectId, {
  page: 1,
  perPage: 10
});
```

### amis配置生成

```typescript
// GET请求的amis配置
{
  type: 'service',
  api: {
    method: 'GET',
    url: 'http://localhost:3000/api/users',
    headers: {
      Authorization: '${token}'
    }
  },
  body: {
    type: 'table',
    source: '$data',
    columns: [
      { name: 'id', label: 'ID' },
      { name: 'name', label: '名称' }
    ]
  }
}

// POST请求的amis配置
{
  type: 'form',
  api: {
    method: 'POST',
    url: 'http://localhost:3000/api/users',
    headers: {
      Authorization: '${token}'
    }
  },
  body: [
    {
      type: 'input-text',
      name: 'name',
      label: '名称',
      required: true
    }
  ]
}
```

## 测试步骤

### 1. 基础功能测试

1. 访问 `/lowcode/api-config`
2. 选择项目
3. 测试API配置的增删改查操作
4. 验证搜索和筛选功能

### 2. 接口格式测试

1. 切换到"接口格式对比"标签页
2. 选择项目，查看两种接口格式的响应
3. 测试API配置选择器
4. 验证amis配置生成

### 3. 完整功能测试

1. 访问 `/lowcode/api-config/test`
2. 按照页面提示逐步测试各项功能
3. 检查错误处理和边界情况

## 故障排除

### 常见问题

1. **useNaiveForm 未定义**
   - 确保已导入: `import { useNaiveForm } from '@/hooks/common/form'`

2. **类型错误**
   - 检查类型定义文件是否最新
   - 确保国际化翻译键完整

3. **接口调用失败**
   - 检查后端服务是否启动
   - 验证项目ID是否正确
   - 查看网络请求日志

4. **数据格式不匹配**
   - 确认使用正确的接口（平台管理 vs 低代码页面）
   - 检查适配器函数是否正确处理响应

### 调试技巧

1. 使用浏览器开发者工具查看网络请求
2. 检查控制台错误信息
3. 使用测试页面验证各项功能
4. 查看后端日志确认接口调用

## 最佳实践

1. **接口选择**
   - 管理界面使用平台管理接口
   - 低代码页面使用低代码页面接口

2. **错误处理**
   - 统一的错误处理机制
   - 友好的用户提示

3. **性能优化**
   - 合理的分页大小
   - 适当的缓存策略

4. **扩展性**
   - 支持自定义字段映射
   - 支持不同的低代码框架格式

## 更新日志

### v1.0.0 (当前版本)
- ✅ 修复所有类型错误和逻辑问题
- ✅ 实现双接口规范支持
- ✅ 添加API配置选择器组件
- ✅ 完善国际化翻译
- ✅ 添加完整的测试功能
- ✅ 生成详细的技术文档
