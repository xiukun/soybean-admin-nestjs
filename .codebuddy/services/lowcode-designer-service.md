# Lowcode Designer 低代码可视化设计器服务说明文档

## 服务概述

Lowcode Designer 是 SoybeanAdmin NestJS 低代码平台的核心可视化设计器，基于 React + TypeScript 构建的现代化低代码页面设计工具。该服务集成了 Amis 低代码引擎，提供拖拽式页面设计、组件配置、实时预览等功能，让用户能够通过可视化方式快速构建复杂的管理后台页面。

## 技术架构

### 核心技术栈
- **框架**: React 18.3.1 + TypeScript 5.6.2
- **构建工具**: Vite 6.0.5
- **包管理器**: pnpm
- **Node.js**: 18.0.0+

### UI 和组件库
- **UI 组件库**: Ant Design 5.24.4
- **样式方案**: Ant Design Style 3.7.1 + Sass 1.83.1
- **图标库**: Font Awesome 4.7.0 + @fortawesome/fontawesome-free 5
- **低代码引擎**: Amis 6.11.0 完整套件
  - amis-core 6.11.0 (核心引擎)
  - amis-editor 6.11.0 (可视化编辑器)
  - amis-editor-core 6.11.0 (编辑器核心)
  - amis-ui 6.11.0 (UI 组件)
  - amis-formula 6.11.0 (公式引擎)

### 状态管理和工具
- **状态管理**: Zustand 5.0.3 + MobX 4 + MobX State Tree 3
- **路由管理**: React Router DOM 7.1.1
- **HTTP 客户端**: Axios 1.7.9
- **代码编辑器**: Monaco Editor 0.30.1
- **工具库**: 
  - Lodash 4.17.21 (工具函数)
  - Day.js 1.11.13 (日期处理)
  - Classnames 2.5.1 (样式类名管理)
  - Immer 10.0.3 (不可变数据)

### 特色功能库
- **拖拽排序**: Sortable.js 1.15.6
- **热键支持**: Hotkeys.js 3.13.9
- **无限滚动**: React Infinite Scroll Component 6.1.0
- **打印功能**: Print.js 1.6.0
- **颜色处理**: TinyColor2 1.6.0
- **本地存储**: IDB 8.0.3 (IndexedDB 封装)
- **视频播放**: mpegts.js 1.7.3

## 项目结构

```
lowcode-designer/
├── src/
│   ├── App.tsx                 # 根组件
│   ├── main.tsx                # 应用入口
│   ├── vite-env.d.ts          # Vite 类型定义
│   ├── shims.d.ts             # 全局类型声明
│   ├── api/                   # API 接口
│   │   └── amis.ts            # Amis 相关 API
│   ├── assets/                # 静态资源
│   ├── components/            # 公共组件
│   ├── db/                    # 本地数据库
│   ├── designer/              # 设计器核心
│   │   ├── amis-designer.tsx  # Amis 设计器主组件
│   │   ├── dict.json          # 数据字典
│   │   ├── register.ts        # 组件注册
│   │   ├── i18n/              # 国际化
│   │   ├── filters/           # 过滤器
│   │   ├── plugins/           # 插件系统
│   │   └── refactor/          # 重构工具
│   ├── pages/                 # 页面组件
│   │   ├── flow/              # 流程设计
│   │   ├── html/              # HTML 编辑
│   │   └── plugin/            # 插件管理
│   ├── router/                # 路由配置
│   ├── store/                 # 状态管理
│   │   ├── amis-store.ts      # Amis 状态
│   │   ├── entity-store.ts    # 实体状态
│   │   ├── menus-store.ts     # 菜单状态
│   │   └── types/             # 类型定义
│   ├── styles/                # 全局样式
│   └── utils/                 # 工具函数
├── public/                    # 公共资源
├── package.json               # 项目配置
├── vite.config.ts             # Vite 配置
├── tsconfig.json              # TypeScript 配置
└── Dockerfile                 # Docker 配置
```

## 核心功能模块

### 1. Amis 可视化设计器

#### 设计器主组件
```typescript
// amis-designer.tsx 核心功能
interface AmisDesignerProps {
  schema: AmisSchema;          // 页面 Schema
  onSchemaChange: (schema: AmisSchema) => void;
  preview?: boolean;           // 预览模式
  locale?: string;            // 语言设置
}

// Amis Schema 结构
interface AmisSchema {
  type: string;               // 组件类型
  title?: string;             // 页面标题
  body?: AmisSchema[];        // 子组件
  data?: any;                 // 数据源
  api?: string | ApiObject;   # API 配置
  [key: string]: any;         // 其他属性
}
```

**主要特性**:
- **拖拽设计**: 支持组件拖拽添加和排序
- **属性配置**: 可视化组件属性编辑面板
- **实时预览**: 设计过程中实时预览效果
- **代码视图**: 支持 JSON Schema 代码编辑
- **组件库**: 丰富的内置组件和自定义组件

#### 组件注册系统
```typescript
// register.ts 组件注册
import { registerEditorPlugin } from 'amis-editor';

// 注册自定义组件
registerEditorPlugin({
  rendererName: 'custom-component',
  name: '自定义组件',
  description: '自定义业务组件',
  tags: ['业务组件'],
  icon: 'fa fa-cube',
  scaffold: {
    type: 'custom-component',
    label: '自定义组件'
  },
  previewSchema: {
    type: 'custom-component',
    label: '自定义组件预览'
  },
  panelTitle: '自定义组件配置',
  panelBody: [
    {
      type: 'input-text',
      name: 'label',
      label: '标签'
    }
  ]
});
```

### 2. 页面管理系统

#### 页面类型支持
- **表单页面**: 数据录入和编辑表单
- **列表页面**: 数据展示和管理列表
- **详情页面**: 数据详情展示页面
- **仪表板**: 数据统计和图表展示
- **流程页面**: 业务流程设计和展示
- **自定义页面**: 完全自定义的复杂页面

#### 页面模板系统
```typescript
// 页面模板定义
interface PageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  schema: AmisSchema;
  tags: string[];
}

// 内置模板
const builtinTemplates: PageTemplate[] = [
  {
    id: 'crud-list',
    name: 'CRUD 列表页',
    description: '标准的增删改查列表页面',
    category: '数据管理',
    schema: {
      type: 'page',
      title: 'CRUD 列表',
      body: {
        type: 'crud',
        api: '/api/data',
        columns: [
          { name: 'id', label: 'ID' },
          { name: 'name', label: '名称' }
        ]
      }
    }
  }
];
```

### 3. 组件库系统

#### 内置组件分类
```typescript
// 组件分类
const componentCategories = {
  layout: {
    name: '布局组件',
    components: ['page', 'container', 'grid', 'hbox', 'vbox']
  },
  form: {
    name: '表单组件',
    components: ['form', 'input-text', 'select', 'checkbox', 'radio']
  },
  display: {
    name: '展示组件',
    components: ['table', 'list', 'cards', 'chart', 'image']
  },
  feedback: {
    name: '反馈组件',
    components: ['dialog', 'drawer', 'toast', 'alert']
  },
  navigation: {
    name: '导航组件',
    components: ['nav', 'breadcrumb', 'tabs', 'steps']
  },
  business: {
    name: '业务组件',
    components: ['crud', 'service', 'wizard', 'tasks']
  }
};
```

#### 自定义组件开发
```typescript
// 自定义组件示例
import { Renderer } from 'amis-core';
import { BaseSchema } from 'amis';

interface CustomComponentSchema extends BaseSchema {
  type: 'custom-component';
  title?: string;
  content?: string;
  color?: string;
}

@Renderer({
  type: 'custom-component'
})
export class CustomComponent extends React.Component<CustomComponentSchema> {
  render() {
    const { title, content, color } = this.props;
    
    return (
      <div className="custom-component" style={{ color }}>
        <h3>{title}</h3>
        <p>{content}</p>
      </div>
    );
  }
}
```

### 4. 数据源管理

#### API 配置
```typescript
// API 配置接口
interface ApiConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  data?: any;
  dataType?: 'json' | 'form-data' | 'form';
  responseType?: 'json' | 'text' | 'blob';
  cache?: number;
  requestAdaptor?: string;
  adaptor?: string;
}

// 数据源配置
interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'static' | 'variable';
  config: ApiConfig | any;
  mock?: any;
}
```

#### 数据绑定
```typescript
// 数据绑定表达式
const dataBindingExamples = {
  // 简单数据绑定
  simple: '${data.name}',
  
  // 条件表达式
  condition: '${data.status === "active" ? "激活" : "禁用"}',
  
  // 函数调用
  function: '${DATETOSTR(data.createTime, "YYYY-MM-DD")}',
  
  // 复杂表达式
  complex: '${data.items | filter:status:active | map:name | join:","}'
};
```

### 5. 插件系统

#### 插件架构
```typescript
// 插件接口定义
interface DesignerPlugin {
  name: string;
  version: string;
  description: string;
  author: string;
  
  // 插件生命周期
  install(designer: AmisDesigner): void;
  uninstall(designer: AmisDesigner): void;
  
  // 组件注册
  components?: ComponentPlugin[];
  
  // 面板扩展
  panels?: PanelPlugin[];
  
  // 工具栏扩展
  toolbar?: ToolbarPlugin[];
}

// 组件插件
interface ComponentPlugin {
  type: string;
  name: string;
  icon: string;
  scaffold: AmisSchema;
  previewSchema: AmisSchema;
  panelBody: AmisSchema[];
}
```

#### 内置插件
- **表单增强插件**: 扩展表单组件功能
- **图表插件**: 集成 ECharts 图表组件
- **地图插件**: 地图展示和交互组件
- **富文本插件**: 富文本编辑器组件
- **文件上传插件**: 文件上传和管理组件

### 6. 主题和样式系统

#### 主题配置
```typescript
// 主题配置接口
interface ThemeConfig {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderRadius: number;
  fontSize: {
    small: number;
    normal: number;
    large: number;
  };
  spacing: {
    small: number;
    normal: number;
    large: number;
  };
}

// 内置主题
const themes: ThemeConfig[] = [
  {
    name: 'default',
    primaryColor: '#1890ff',
    secondaryColor: '#52c41a',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderColor: '#d9d9d9',
    borderRadius: 4,
    fontSize: { small: 12, normal: 14, large: 16 },
    spacing: { small: 8, normal: 16, large: 24 }
  },
  {
    name: 'dark',
    primaryColor: '#1890ff',
    secondaryColor: '#52c41a',
    backgroundColor: '#141414',
    textColor: '#ffffff',
    borderColor: '#434343',
    borderRadius: 4,
    fontSize: { small: 12, normal: 14, large: 16 },
    spacing: { small: 8, normal: 16, large: 24 }
  }
];
```

## 状态管理架构

### Zustand 状态管理
```typescript
// amis-store.ts 主要状态
interface AmisStore {
  // 当前编辑的 Schema
  schema: AmisSchema;
  setSchema: (schema: AmisSchema) => void;
  
  // 选中的组件
  selectedComponent: string | null;
  setSelectedComponent: (id: string | null) => void;
  
  // 预览模式
  previewMode: boolean;
  setPreviewMode: (preview: boolean) => void;
  
  // 历史记录
  history: AmisSchema[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  
  // 剪贴板
  clipboard: AmisSchema | null;
  copy: (schema: AmisSchema) => void;
  paste: () => void;
}
```

### 实体状态管理
```typescript
// entity-store.ts 实体管理
interface EntityStore {
  entities: Entity[];
  currentEntity: Entity | null;
  
  // 实体操作
  loadEntities: () => Promise<void>;
  createEntity: (entity: Partial<Entity>) => Promise<void>;
  updateEntity: (id: string, entity: Partial<Entity>) => Promise<void>;
  deleteEntity: (id: string) => Promise<void>;
  
  // 字段操作
  addField: (entityId: string, field: Field) => Promise<void>;
  updateField: (entityId: string, fieldId: string, field: Partial<Field>) => Promise<void>;
  deleteField: (entityId: string, fieldId: string) => Promise<void>;
}
```

### 菜单状态管理
```typescript
// menus-store.ts 菜单管理
interface MenusStore {
  menus: MenuItem[];
  currentMenu: MenuItem | null;
  
  loadMenus: () => Promise<void>;
  createMenu: (menu: Partial<MenuItem>) => Promise<void>;
  updateMenu: (id: string, menu: Partial<MenuItem>) => Promise<void>;
  deleteMenu: (id: string) => Promise<void>;
}
```

## API 接口设计

### Amis API 服务
```typescript
// amis.ts API 接口
class AmisApiService {
  // 页面管理
  async getPages(): Promise<AmisPage[]> {
    return await this.request.get('/api/v1/amis/pages');
  }
  
  async savePage(page: AmisPage): Promise<void> {
    return await this.request.post('/api/v1/amis/pages', page);
  }
  
  async deletePage(id: string): Promise<void> {
    return await this.request.delete(`/api/v1/amis/pages/${id}`);
  }
  
  // 组件管理
  async getComponents(): Promise<ComponentDefinition[]> {
    return await this.request.get('/api/v1/amis/components');
  }
  
  // 模板管理
  async getTemplates(): Promise<PageTemplate[]> {
    return await this.request.get('/api/v1/amis/templates');
  }
  
  // 数据源管理
  async getDataSources(): Promise<DataSource[]> {
    return await this.request.get('/api/v1/amis/datasources');
  }
  
  // 预览和发布
  async previewPage(schema: AmisSchema): Promise<string> {
    return await this.request.post('/api/v1/amis/preview', { schema });
  }
  
  async publishPage(id: string): Promise<void> {
    return await this.request.post(`/api/v1/amis/pages/${id}/publish`);
  }
}
```

### 数据接口规范
```typescript
// 统一响应格式
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// 分页响应
interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 错误响应
interface ErrorResponse {
  code: number;
  message: string;
  details?: any;
  timestamp: number;
}
```

## 设计器核心功能

### 1. 拖拽系统
```typescript
// 拖拽配置
interface DragConfig {
  // 可拖拽的组件类型
  draggableTypes: string[];
  
  // 可放置的容器类型
  droppableTypes: string[];
  
  // 拖拽约束
  constraints: {
    maxChildren?: number;
    allowedChildren?: string[];
    forbiddenChildren?: string[];
  };
  
  // 拖拽回调
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: (item: DragItem, target: DropTarget) => void;
  onDrop?: (item: DragItem, target: DropTarget) => void;
}
```

### 2. 属性面板
```typescript
// 属性面板配置
interface PropertyPanel {
  title: string;
  body: PropertyField[];
}

interface PropertyField {
  type: string;
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  options?: any[];
  visibleOn?: string;
  disabledOn?: string;
}

// 常用属性字段类型
const propertyFieldTypes = {
  'input-text': '文本输入',
  'input-number': '数字输入',
  'select': '下拉选择',
  'switch': '开关',
  'color-picker': '颜色选择器',
  'icon-picker': '图标选择器',
  'code-editor': '代码编辑器',
  'formula-editor': '公式编辑器'
};
```

### 3. 预览系统
```typescript
// 预览配置
interface PreviewConfig {
  mode: 'desktop' | 'tablet' | 'mobile';
  width?: number;
  height?: number;
  scale?: number;
  background?: string;
  
  // 预览数据
  mockData?: any;
  
  // 预览环境
  env?: {
    api: string;
    theme: string;
    locale: string;
  };
}

// 预览组件
const PreviewComponent: React.FC<PreviewConfig> = ({
  mode,
  width,
  height,
  scale,
  mockData,
  env
}) => {
  return (
    <div 
      className={`preview-container preview-${mode}`}
      style={{ 
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        transform: scale ? `scale(${scale})` : 'none'
      }}
    >
      <AmisRenderer 
        schema={schema}
        data={mockData}
        env={env}
      />
    </div>
  );
};
```

### 4. 代码编辑器
```typescript
// Monaco Editor 配置
interface CodeEditorConfig {
  language: 'json' | 'javascript' | 'typescript' | 'css';
  theme: 'vs' | 'vs-dark' | 'hc-black';
  readOnly?: boolean;
  minimap?: boolean;
  lineNumbers?: boolean;
  wordWrap?: boolean;
  
  // 代码提示
  suggestions?: CompletionItem[];
  
  // 语法检查
  diagnostics?: boolean;
  
  // 格式化
  formatOnSave?: boolean;
}

// 代码编辑器组件
const CodeEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  config: CodeEditorConfig;
}> = ({ value, onChange, config }) => {
  return (
    <MonacoEditor
      language={config.language}
      theme={config.theme}
      value={value}
      onChange={onChange}
      options={{
        readOnly: config.readOnly,
        minimap: { enabled: config.minimap },
        lineNumbers: config.lineNumbers ? 'on' : 'off',
        wordWrap: config.wordWrap ? 'on' : 'off'
      }}
    />
  );
};
```

## 国际化支持

### 多语言配置
```typescript
// i18n 配置
const i18nConfig = {
  defaultLocale: 'zh-CN',
  locales: ['zh-CN', 'en-US'],
  resources: {
    'zh-CN': {
      designer: {
        title: '低代码设计器',
        components: '组件库',
        properties: '属性面板',
        preview: '预览',
        code: '代码视图'
      }
    },
    'en-US': {
      designer: {
        title: 'Lowcode Designer',
        components: 'Components',
        properties: 'Properties',
        preview: 'Preview',
        code: 'Code View'
      }
    }
  }
};
```

## 性能优化

### 虚拟滚动
```typescript
// 大量组件列表的虚拟滚动
const VirtualComponentList: React.FC<{
  components: ComponentDefinition[];
  itemHeight: number;
  containerHeight: number;
}> = ({ components, itemHeight, containerHeight }) => {
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  
  useEffect(() => {
    setEndIndex(Math.min(startIndex + visibleCount, components.length));
  }, [startIndex, visibleCount, components.length]);
  
  return (
    <div className="virtual-list" style={{ height: containerHeight }}>
      {components.slice(startIndex, endIndex).map((component, index) => (
        <ComponentItem 
          key={component.id}
          component={component}
          style={{ 
            position: 'absolute',
            top: (startIndex + index) * itemHeight,
            height: itemHeight
          }}
        />
      ))}
    </div>
  );
};
```

### 组件懒加载
```typescript
// 组件懒加载
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

const ComponentLoader: React.FC<{ type: string }> = ({ type }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent type={type} />
    </Suspense>
  );
};
```

### Schema 缓存
```typescript
// Schema 缓存策略
class SchemaCache {
  private cache = new Map<string, AmisSchema>();
  private maxSize = 100;
  
  get(key: string): AmisSchema | undefined {
    return this.cache.get(key);
  }
  
  set(key: string, schema: AmisSchema): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, schema);
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

## 部署配置

### Docker 配置
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx 配置
```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # 支持 SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://lowcode-platform:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 环境变量配置
```bash
# 开发环境
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_TITLE=低代码设计器
VITE_APP_VERSION=1.0.0

# 生产环境
VITE_API_BASE_URL=http://lowcode-platform:3000/api/v1
VITE_APP_TITLE=Lowcode Designer
VITE_BUILD_MODE=production
```

## 开发指南

### 本地开发
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview

# 代码检查
pnpm lint
pnpm lint-fix
```

### 自定义组件开发
```typescript
// 1. 创建组件文件
// src/components/CustomComponent.tsx
import { Renderer } from 'amis-core';

@Renderer({
  type: 'custom-component'
})
export class CustomComponent extends React.Component {
  render() {
    return <div>自定义组件</div>;
  }
}

// 2. 注册编辑器插件
// src/designer/plugins/custom-component.ts
import { registerEditorPlugin } from 'amis-editor';

registerEditorPlugin({
  rendererName: 'custom-component',
  name: '自定义组件',
  description: '这是一个自定义组件',
  tags: ['自定义'],
  icon: 'fa fa-cube',
  scaffold: {
    type: 'custom-component'
  },
  previewSchema: {
    type: 'custom-component'
  },
  panelTitle: '自定义组件',
  panelBody: [
    {
      type: 'input-text',
      name: 'title',
      label: '标题'
    }
  ]
});

// 3. 在 register.ts 中导入
import './plugins/custom-component';
```

### 插件开发
```typescript
// 插件开发示例
export class ChartPlugin implements DesignerPlugin {
  name = 'chart-plugin';
  version = '1.0.0';
  description = '图表插件';
  author = 'Developer';
  
  install(designer: AmisDesigner): void {
    // 注册图表组件
    this.registerChartComponents();
    
    // 添加工具栏按钮
    designer.addToolbarItem({
      type: 'button',
      label: '图表',
      icon: 'fa fa-chart-bar',
      onClick: () => this.openChartWizard()
    });
  }
  
  uninstall(designer: AmisDesigner): void {
    // 清理插件资源
  }
  
  private registerChartComponents(): void {
    // 注册各种图表组件
  }
  
  private openChartWizard(): void {
    // 打开图表配置向导
  }
}
```

### 调试配置
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug React App",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vite",
      "args": ["--mode", "development"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "sourceMaps": true
    }
  ]
}
```

### 测试配置
```typescript
// 组件测试示例
import { render, screen } from '@testing-library/react';
import { AmisDesigner } from '../designer/amis-designer';

describe('AmisDesigner', () => {
  test('renders designer interface', () => {
    const mockSchema = {
      type: 'page',
      title: 'Test Page'
    };
    
    render(
      <AmisDesigner 
        schema={mockSchema}
        onSchemaChange={jest.fn()}
      />
    );
    
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });
});
```

## 故障排查

### 常见问题

#### 1. 组件加载失败
```typescript
// 问题：自定义组件无法加载
// 解决方案：检查组件注册
console.log('已注册的组件:', getRenderers());

// 确保组件正确导入和注册
import './components/CustomComponent';
import './designer/plugins/custom-component';
```

#### 2. Schema 验证错误
```typescript
// 问题：Schema 格式不正确
// 解决方案：使用 Schema 验证器
import { validateSchema } from 'amis-core';

const validateResult = validateSchema(schema);
if (!validateResult.valid) {
  console.error('Schema 验证失败:', validateResult.errors);
}
```

#### 3. 预览模式异常
```typescript
// 问题：预览模式下组件显示异常
// 解决方案：检查环境配置
const previewEnv = {
  fetcher: (api) => {
    // 自定义数据获取逻辑
    return fetch(api.url, {
      method: api.method || 'GET',
      headers: api.headers,
      body: api.data ? JSON.stringify(api.data) : undefined
    }).then(res => res.json());
  },
  
  jumpTo: (to) => {
    // 自定义页面跳转逻辑
    console.log('跳转到:', to);
  }
};
```

### 性能监控
```typescript
// 性能监控工具
class PerformanceMonitor {
  private metrics = new Map<string, number>();
  
  startTiming(name: string): void {
    this.metrics.set(name, performance.now());
  }
  
  endTiming(name: string): number {
    const startTime = this.metrics.get(name);
    if (!startTime) return 0;
    
    const duration = performance.now() - startTime;
    console.log(`${name} 耗时: ${duration.toFixed(2)}ms`);
    return duration;
  }
  
  // 监控 Schema 渲染性能
  monitorSchemaRender(schema: AmisSchema): void {
    this.startTiming('schema-render');
    
    // 渲染完成后调用
    requestAnimationFrame(() => {
      this.endTiming('schema-render');
    });
  }
}
```

## 扩展开发

### 主题扩展
```typescript
// 自定义主题开发
interface CustomTheme extends ThemeConfig {
  // 扩展主题属性
  gradients: {
    primary: string;
    secondary: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}

const customTheme: CustomTheme = {
  name: 'custom-theme',
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  borderColor: '#e5e7eb',
  borderRadius: 8,
  fontSize: { small: 12, normal: 14, large: 16 },
  spacing: { small: 8, normal: 16, large: 24 },
  gradients: {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    secondary: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px rgba(0, 0, 0, 0.1)'
  }
};
```

### 数据源扩展
```typescript
// 自定义数据源适配器
class CustomDataSourceAdapter {
  async fetchData(config: DataSourceConfig): Promise<any> {
    switch (config.type) {
      case 'graphql':
        return this.fetchGraphQLData(config);
      case 'websocket':
        return this.fetchWebSocketData(config);
      case 'file':
        return this.fetchFileData(config);
      default:
        return this.fetchRestData(config);
    }
  }
  
  private async fetchGraphQLData(config: any): Promise<any> {
    // GraphQL 数据获取逻辑
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: config.query,
        variables: config.variables
      })
    });
    
    return response.json();
  }
  
  private async fetchWebSocketData(config: any): Promise<any> {
    // WebSocket 实时数据获取
    return new Promise((resolve) => {
      const ws = new WebSocket(config.url);
      ws.onmessage = (event) => {
        resolve(JSON.parse(event.data));
      };
    });
  }
}
```

## 最佳实践

### 1. 组件设计原则
- **单一职责**: 每个组件只负责一个功能
- **可复用性**: 设计通用的组件接口
- **可配置性**: 提供丰富的配置选项
- **性能优化**: 避免不必要的重渲染

### 2. Schema 设计规范
```typescript
// 良好的 Schema 设计示例
const goodSchema: AmisSchema = {
  type: 'page',
  title: '用户管理',
  body: {
    type: 'crud',
    api: {
      method: 'GET',
      url: '/api/users',
      adaptor: 'return { ...payload, data: payload.data.items }'
    },
    columns: [
      {
        name: 'id',
        label: 'ID',
        type: 'text',
        width: 80
      },
      {
        name: 'name',
        label: '姓名',
        type: 'text',
        searchable: true
      },
      {
        name: 'email',
        label: '邮箱',
        type: 'text',
        searchable: true
      },
      {
        name: 'status',
        label: '状态',
        type: 'mapping',
        map: {
          'active': '<span class="label label-success">激活</span>',
          'inactive': '<span class="label label-default">禁用</span>'
        }
      }
    ],
    headerToolbar: [
      {
        type: 'button',
        label: '新增用户',
        actionType: 'dialog',
        dialog: {
          title: '新增用户',
          body: {
            type: 'form',
            api: 'POST /api/users',
            body: [
              {
                type: 'input-text',
                name: 'name',
                label: '姓名',
                required: true
              },
              {
                type: 'input-email',
                name: 'email',
                label: '邮箱',
                required: true
              }
            ]
          }
        }
      }
    ]
  }
};
```

### 3. 性能优化建议
- **懒加载**: 大型组件使用懒加载
- **虚拟滚动**: 长列表使用虚拟滚动
- **缓存策略**: 合理使用缓存减少重复请求
- **代码分割**: 按功能模块分割代码

### 4. 安全考虑
- **XSS 防护**: 对用户输入进行转义
- **CSRF 防护**: 使用 CSRF Token
- **权限控制**: 组件级别的权限控制
- **数据验证**: 严格的数据格式验证

---

**服务端口**: 9555  
**API 基础路径**: http://localhost:3000/api/v1  
**文档版本**: v1.0.0  
**更新时间**: 2024年12月  
**维护团队**: SoybeanAdmin 低代码团队
