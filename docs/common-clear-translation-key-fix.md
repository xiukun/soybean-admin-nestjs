# 通用翻译键 `common.clear` 缺失修复

## 🔧 问题描述

**错误信息**: `[intlify] Not found 'common.clear' key in 'zh' locale messages.`

**错误位置**: `api-config-online-test.vue:16`

**问题原因**: 
在 `api-config-online-test.vue` 组件中使用了 `$t('common.clear')` 翻译键，但该键在中文和英文翻译文件中都不存在。

## 🎯 修复内容

### 1. 中文翻译添加

**文件**: `src/locales/langs/zh-cn.ts`

```typescript
// 修复前
common: {
  // ... 其他字段
  cancel: '取消',
  close: '关闭',
  check: '勾选',
  // ... 其他字段
}

// 修复后
common: {
  // ... 其他字段
  cancel: '取消',
  clear: '清空',      // ✅ 新增
  close: '关闭',
  check: '勾选',
  // ... 其他字段
}
```

### 2. 英文翻译添加

**文件**: `src/locales/langs/en-us.ts`

```typescript
// 修复前
common: {
  // ... 其他字段
  cancel: 'Cancel',
  close: 'Close',
  check: 'Check',
  // ... 其他字段
}

// 修复后
common: {
  // ... 其他字段
  cancel: 'Cancel',
  clear: 'Clear',     // ✅ 新增
  close: 'Close',
  check: 'Check',
  // ... 其他字段
}
```

### 3. 类型定义更新

**文件**: `src/typings/app.d.ts`

```typescript
// 修复前
interface Common {
  // ... 其他字段
  cancel: string;
  close: string;
  check: string;
  // ... 其他字段
}

// 修复后
interface Common {
  // ... 其他字段
  cancel: string;
  clear: string;      // ✅ 新增
  close: string;
  check: string;
  // ... 其他字段
}
```

## 🎨 使用场景

### 1. API配置在线测试组件

**文件**: `api-config-online-test.vue`

```vue
<template>
  <NButton @click="clearTestData">
    <template #icon>
      <SvgIcon icon="ic:round-clear" />
    </template>
    {{ $t('common.clear') }}  <!-- ✅ 现在可以正常显示 -->
  </NButton>
</template>
```

**功能**: 清空测试数据和历史记录

### 2. 其他可能的使用场景

`common.clear` 翻译键可以在以下场景中使用：

- **表单重置**: 清空表单数据
- **搜索清空**: 清空搜索条件
- **缓存清理**: 清空缓存数据
- **历史记录**: 清空操作历史
- **临时数据**: 清空临时存储的数据

## 🧪 测试验证

### 1. 界面显示测试
- ✅ 中文环境下显示"清空"
- ✅ 英文环境下显示"Clear"
- ✅ 不再出现翻译键缺失警告

### 2. 语言切换测试
- ✅ 中英文切换时文本正确更新
- ✅ 翻译键正确解析
- ✅ 控制台无错误信息

### 3. 功能完整性测试
- ✅ 按钮点击功能正常
- ✅ 清空操作正确执行
- ✅ 用户体验良好

## 📋 修复的文件

### 1. 翻译文件
- ✅ `src/locales/langs/zh-cn.ts` - 中文翻译
- ✅ `src/locales/langs/en-us.ts` - 英文翻译

### 2. 类型定义文件
- ✅ `src/typings/app.d.ts` - TypeScript类型定义

### 3. 使用该翻译键的组件
- ✅ `src/views/lowcode/api-config/components/api-config-online-test.vue`

## 🔍 翻译键命名规范

### 1. 通用操作翻译键
位置: `common` 命名空间下
格式: `common.{actionName}`

**常用操作翻译键**:
- `common.add` - 添加
- `common.edit` - 编辑
- `common.delete` - 删除
- `common.cancel` - 取消
- `common.confirm` - 确认
- `common.clear` - 清空 ✅ 新增
- `common.reset` - 重置
- `common.refresh` - 刷新
- `common.search` - 搜索

### 2. 翻译键使用最佳实践

```vue
<!-- ✅ 推荐：使用通用翻译键 -->
<NButton @click="handleClear">
  {{ $t('common.clear') }}
</NButton>

<!-- ❌ 不推荐：使用组件特定翻译键 -->
<NButton @click="handleClear">
  {{ $t('page.lowcode.apiConfig.clearButton') }}
</NButton>
```

**优势**:
- 保持翻译一致性
- 减少重复翻译
- 便于维护和更新
- 提高开发效率

## 🚀 扩展建议

### 1. 其他可能缺失的通用翻译键

建议检查并添加以下常用翻译键：
- `common.copy` - 复制
- `common.paste` - 粘贴
- `common.cut` - 剪切
- `common.undo` - 撤销
- `common.redo` - 重做
- `common.select` - 选择
- `common.selectAll` - 全选
- `common.deselect` - 取消选择

### 2. 翻译键完整性检查

建议实施以下检查机制：
- 自动化翻译键完整性测试
- 中英文翻译键对比验证
- 组件中使用的翻译键存在性检查
- 未使用翻译键的清理机制

## ✅ 修复结果

- ✅ `common.clear` 翻译键已添加到中英文翻译文件
- ✅ TypeScript类型定义已更新
- ✅ 不再出现翻译键缺失警告
- ✅ API配置在线测试组件正常显示"清空"按钮
- ✅ 中英文切换功能正常工作

现在 `$t('common.clear')` 可以正确显示为"清空"（中文）或"Clear"（英文），不会再出现翻译键缺失的警告信息。
