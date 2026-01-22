## 1. Investigation
- [x] 1.1 复核 AMIS `select` 的 `source`、`labelField/valueField` 以及 `ls:` 数据源格式要求
- [x] 1.2 复核项目接口返回规范与分页规范（见 `.kiro/rules`）

## 2. Backend
- [x] 2.1 新增 Prisma 模型：`sys_dict`
- [x] 2.2 更新 `deploy/postgres` seed SQL（不创建迁移文件），确保与 Prisma 一致（已新增 sys_dict 建表与 seed）
- [x] 2.3 新增 Prisma 模型：`sys_dict_item`
- [x] 2.4 实现字典查询接口：字典树/名称列表（供管理端与设计器）
- [x] 2.5 实现字典项 CRUD 接口：按 dictId 维护字典项
- [x] 2.6 实现字典项查询接口：按 dictId 返回字典项 options（供 getDictById / AMIS source）

## 3. Frontend (admin)
- [x] 3.1 新增“数据字典”路由与导航入口（默认显示）
- [x] 3.2 实现字典管理页面：左侧树形字典目录（CRUD、调整父节点、排序、启用/禁用、检索、删除确认）
- [x] 3.3 实现字典管理页面：右侧字典项维护（CRUD、排序、启用/禁用、批量删除）

## 4. Lowcode Designer
- [x] 4.1 重新实现 `window.MAITA_LOWCODE_DICT_NAME_LIST` 的加载/缓存/刷新
- [x] 4.2 确认 `dictIdProp` 的 source 与后端返回格式匹配（`labelField/valueField` 对齐）
- [x] 4.3 实现/适配 `getDictById`（若当前过滤器不存在或不匹配）

## 5. Validation
- [ ] 5.1 `openspec validate add-data-dict-module --strict`
- [ ] 5.2 联调验证：管理端维护字典树；设计器 select 可加载字典列表并根据 dictId 动态加载字典项
