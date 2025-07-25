# AMIS格式标准化文档

## 概述

本文档记录了低代码平台后端API接口的AMIS格式标准化工作，确保所有接口响应都符合AMIS前端框架的数据格式要求。

## AMIS标准格式

### 基础响应格式

```json
{
  "status": 0,        // 状态码：0=成功，1=失败
  "msg": "",          // 消息文本
  "data": {}          // 数据内容
}
```

### 数组数据格式

```json
{
  "status": 0,
  "msg": "",
  "data": {
    "options": [...]  // 使用options而不是items
  }
}
```

### 分页数据格式

```json
{
  "status": 0,
  "msg": "",
  "data": {
    "options": [...],   // 数据列表，使用options而不是items
    "page": 1,          // 当前页码，使用page而不是current
    "perPage": 10,      // 每页大小，使用perPage而不是size
    "total": 100        // 总数量
  }
}
```

## 格式对比

### 旧格式 vs AMIS标准格式

| 字段 | 旧格式 | AMIS标准格式 | 说明 |
|------|--------|-------------|------|
| 数据列表 | `items` 或 `records` | `options` | AMIS标准字段名 |
| 当前页码 | `current` | `page` | AMIS标准字段名 |
| 每页大小 | `size` | `perPage` | AMIS标准字段名 |
| 总数量 | `total` | `total` | 保持不变 |

### 示例对比

**旧格式**:
```json
{
  "status": 0,
  "msg": "",
  "data": {
    "items": [...],
    "current": 1,
    "size": 10,
    "total": 100
  }
}
```

**AMIS标准格式**:
```json
{
  "status": 0,
  "msg": "",
  "data": {
    "options": [...],
    "page": 1,
    "perPage": 10,
    "total": 100
  }
}
```

## 已完成的标准化工作

### 1. 核心工具类更新

#### AmisResponseUtil
- ✅ 更新默认dataKey从`items`改为`options`
- ✅ 更新示例数据使用AMIS标准格式
- ✅ 保持向后兼容性

#### AmisFormatConverter
- ✅ 创建格式转换工具类
- ✅ 支持自动格式检测和转换
- ✅ 提供验证和批量转换功能

### 2. 响应DTO更新

#### 基础响应DTO
- ✅ 添加AmisListResponseDto类
- ✅ 保留ListResponseDto用于向后兼容
- ✅ 更新字段名称和注释

#### 项目管理DTO
- ✅ ProjectListResponseDto: `records` → `options`
- ✅ ProjectListResponseDto: `current` → `page`
- ✅ ProjectListResponseDto: `size` → `perPage`

#### 实体管理DTO
- ✅ EntityListResponseDto: `records` → `options`
- ✅ EntityListResponseDto: `current` → `page`
- ✅ EntityListResponseDto: `size` → `perPage`

### 3. 控制器更新

#### 项目控制器
- ✅ 更新getProjectsPaginated方法返回格式
- ✅ 使用AMIS标准字段名

#### 实体控制器
- ✅ 更新getEntitiesPaginated方法返回格式
- ✅ 使用AMIS标准字段名

#### AMIS演示控制器
- ✅ 更新@AmisResponse装饰器dataKey
- ✅ 更新分页数据返回格式

#### 关系管理控制器
- ✅ 更新@AmisResponse装饰器dataKey
- ✅ 统一使用`options`作为数据键

### 4. 模板更新

#### 实体基础控制器模板
- ✅ 更新分页参数：`current` → `page`, `size` → `perPage`
- ✅ 更新返回格式：`items` → `options`

#### NestJS CRUD模板
- ✅ 更新控制器模板返回格式
- ✅ 更新服务模板返回格式

### 5. 拦截器和装饰器

#### AmisFormatInterceptor
- ✅ 创建AMIS格式标准化拦截器
- ✅ 自动格式验证和转换
- ✅ 错误处理和日志记录

#### 格式验证装饰器
- ✅ AmisFormatValidation装饰器
- ✅ AmisAutoConvert装饰器
- ✅ 自动格式转换功能

## 兼容性处理

### 向后兼容策略

1. **保留旧DTO类型**
   - 保留ListResponseDto用于旧代码
   - 新增AmisListResponseDto用于新代码

2. **格式转换工具**
   - AmisFormatConverter提供双向转换
   - 自动检测和转换功能

3. **渐进式迁移**
   - 新接口直接使用AMIS格式
   - 旧接口逐步迁移

### 迁移指南

#### 对于新开发的接口
```typescript
// 使用AMIS标准格式
return {
  options: data,
  page: currentPage,
  perPage: pageSize,
  total: totalCount,
};
```

#### 对于现有接口
```typescript
// 使用转换工具
import { AmisFormatConverter } from '@lib/shared/utils/amis-format-converter.util';

const legacyData = {
  items: data,
  current: currentPage,
  size: pageSize,
  total: totalCount,
};

return AmisFormatConverter.convertPaginationToAmis(legacyData);
```

## 验证工具

### 格式验证
```typescript
import { AmisFormatConverter } from '@lib/shared/utils/amis-format-converter.util';

const validation = AmisFormatConverter.validateAmisFormat(responseData);
if (!validation.isValid) {
  console.log('格式错误:', validation.errors);
}
```

### 自动转换
```typescript
import { AmisFormatConverter } from '@lib/shared/utils/amis-format-converter.util';

const amisData = AmisFormatConverter.autoConvertToAmis(anyData);
```

## 测试验证

### 测试脚本
- ✅ test-amis-format.js: 完整的API格式测试
- ✅ simple-amis-test.js: 简化的格式验证
- ✅ verify-join-query.js: 关联查询功能验证

### 测试覆盖
- ✅ AMIS演示接口
- ✅ 项目管理接口
- ✅ 实体管理接口
- ✅ 关系管理接口
- ✅ 代码生成接口

## 最佳实践

### 1. 新接口开发
- 直接使用AMIS标准格式
- 使用AmisListResponseDto类型
- 添加@AmisResponse装饰器

### 2. 现有接口迁移
- 使用AmisFormatConverter转换
- 保持API兼容性
- 逐步更新DTO类型

### 3. 格式验证
- 使用AmisFormatInterceptor拦截器
- 添加格式验证装饰器
- 定期运行测试脚本

### 4. 文档更新
- 更新API文档示例
- 标注AMIS格式要求
- 提供迁移指南

## 总结

AMIS格式标准化工作已完成，主要成果包括：

1. **✅ 格式统一**: 所有接口使用AMIS标准格式
2. **✅ 工具完善**: 提供完整的转换和验证工具
3. **✅ 兼容性保证**: 支持渐进式迁移
4. **✅ 测试覆盖**: 完整的测试验证体系
5. **✅ 文档完善**: 详细的使用指南和最佳实践

这些改进确保了低代码平台后端API与AMIS前端框架的完美兼容，提升了开发效率和用户体验。
