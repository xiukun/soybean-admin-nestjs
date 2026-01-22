## Context
需要在管理端新增“数据字典”模块，并让低代码设计器能动态加载字典列表与字典项，适配 AMIS `select` 的 `source` 格式与 `getDictById` 过滤器。

## Goals
- 提供可维护的树形数据字典（支持层级、排序、启用/禁用）
- 管理端默认可见入口，便于维护
- 设计器通过 `window.MAITA_LOWCODE_DICT_NAME_LIST` 快速拿到字典名称列表（可缓存）
- `getDictById` 能按 dictId 返回 AMIS `options` 数组（label/value）

## Non-Goals
- 不做字典导入导出/多语言
- 不做大规模权限控制细分（先复用现有权限体系）

## Data Model (proposed)
- `sys_dict`：字典目录/字典定义（可树形）
  - `id`, `name`, `code`, `pid`, `order`, `status`, `remark`, timestamps
- `sys_dict_item`：字典项
  - `id`, `dictId`, `label`, `dictValue`, `order`, `status`, `remark`, timestamps

## API Design (AMIS)
- 字典名称列表（供设计器 select）：
  - `GET /iam/dict/names`
  - `{ status:0, msg:"", data:{ options:[{ id, name }] } }`
- 字典项列表（供 getDictById）：
  - `GET /iam/dict/items?dictId=xxx`
  - `{ status:0, msg:"", data:{ options:[{ label, dictValue }] } }`

## Caching Strategy (designer)
- `window.MAITA_LOWCODE_DICT_NAME_LIST` 在首次进入设计器时加载一次并缓存（localStorage 或内存均可，默认内存 + 失败重试）
- 保证返回为数组（供 `ls:` 读取），或以 `ls:` 支持的结构存储

## Risks
- AMIS `ls:` 对 localStorage 值类型敏感（字符串 vs JSON）
  - 需明确写入 JSON 字符串并确保读取端能解析
- 树过滤/排序需要保证父子关系正确（pid + order）
