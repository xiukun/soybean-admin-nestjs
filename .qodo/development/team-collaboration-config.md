# 团队协作配置补充文档

## 提交规范配置

### commitlint 配置

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档更新
        'style',    // 代码格式调整
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试相关
        'chore',    // 构建过程或辅助工具的变动
        'revert',   // 回滚
        'build',    // 构建系统或外部依赖项的更改
        'ci'        // CI配置文件和脚本的更改
      ]
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-empty': [0],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100]
  }
};
```

### 提交消息模板

```bash
# .gitmessage
# <类型>[可选 范围]: <描述>
#
# [可选 正文]
#
# [可选 脚注]
#
# 类型说明:
# feat:     新功能
# fix:      修复bug
# docs:     文档更新
# style:    代码格式调整
# refactor: 重构
# perf:     性能优化
# test:     测试相关
# chore:    构建过程或辅助工具的变动
# revert:   回滚
# build:    构建系统或外部依赖项的更改
# ci:       CI配置文件和脚本的更改
#
# 示例:
# feat(user): 添加用户登录功能
# fix(api): 修复用户信息获取接口返回数据错误
# docs(readme): 更新项目安装说明
```

### 配置 Git 提交模板

```bash
# 设置全局提交模板
git config --global commit.template .gitmessage

# 或为当前项目设置
git config commit.template .gitmessage
```

## 代码质量工具配置

### ESLint 配置

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:vue/vue3-essential',
    'plugin:prettier/recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module'
  },
  plugins: ['vue', '@typescript-eslint'],
  rules: {
    // TypeScript 规则
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'warn',
    
    // Vue 规则
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'error',
    'vue/no-mutating-props': 'error',
    'vue/no-v-html': 'warn',
    
    // 通用规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 'off', // 由 @typescript-eslint/no-unused-vars 处理
    'prefer-const': 'error',
    'no-var': 'error'
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off'
      }
    }
  ]
};
```

### Prettier 配置

```javascript
// .prettierrc.js
module.exports = {
  // 行宽
  printWidth: 100,
  // 缩进
  tabWidth: 2,
  useTabs: false,
  // 分号
  semi: true,
  // 单引号
  singleQuote: true,
  // 对象属性引号
  quoteProps: 'as-needed',
  // JSX 单引号
  jsxSingleQuote: true,
  // 尾随逗号
  trailingComma: 'es5',
  // 大括号空格
  bracketSpacing: true,
  // JSX 大括号
  bracketSameLine: false,
  // 箭头函数参数括号
  arrowParens: 'avoid',
  // 换行符
  endOfLine: 'lf',
  // Vue 文件中的 script 和 style 标签缩进
  vueIndentScriptAndStyle: false
};
```

### StyleLint 配置

```javascript
// .stylelintrc.js
module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-prettier',
    'stylelint-config-recommended-vue'
  ],
  plugins: ['stylelint-order'],
  rules: {
    // 颜色
    'color-hex-case': 'lower',
    'color-hex-length': 'short',
    'color-no-invalid-hex': true,
    
    // 字体
    'font-family-no-duplicate-names': true,
    'font-family-no-missing-generic-family-keyword': true,
    
    // 函数
    'function-calc-no-unspaced-operator': true,
    'function-linear-gradient-no-nonstandard-direction': true,
    
    // 字符串
    'string-no-newline': true,
    'string-quotes': 'single',
    
    // 长度
    'length-zero-no-unit': true,
    
    // 单位
    'unit-case': 'lower',
    'unit-no-unknown': true,
    
    // 值
    'value-list-comma-space-after': 'always-single-line',
    'value-list-comma-space-before': 'never',
    
    // 属性
    'property-case': 'lower',
    'property-no-unknown': true,
    
    // 声明
    'declaration-bang-space-after': 'never',
    'declaration-bang-space-before': 'always',
    'declaration-colon-space-after': 'always-single-line',
    'declaration-colon-space-before': 'never',
    
    // 块
    'block-closing-brace-empty-line-before': 'never',
    'block-closing-brace-newline-after': 'always',
    'block-closing-brace-newline-before': 'always-multi-line',
    'block-opening-brace-newline-after': 'always-multi-line',
    'block-opening-brace-space-before': 'always',
    
    // 选择器
    'selector-attribute-brackets-space-inside': 'never',
    'selector-attribute-operator-space-after': 'never',
    'selector-attribute-operator-space-before': 'never',
    'selector-combinator-space-after': 'always',
    'selector-combinator-space-before': 'always',
    'selector-pseudo-class-case': 'lower',
    'selector-pseudo-element-case': 'lower',
    'selector-pseudo-element-colon-notation': 'double',
    'selector-type-case': 'lower',
    
    // 规则
    'rule-empty-line-before': [
      'always-multi-line',
      {
        except: ['first-nested'],
        ignore: ['after-comment']
      }
    ],
    
    // 媒体查询
    'media-feature-colon-space-after': 'always',
    'media-feature-colon-space-before': 'never',
    'media-feature-name-case': 'lower',
    'media-feature-parentheses-space-inside': 'never',
    'media-feature-range-operator-space-after': 'always',
    'media-feature-range-operator-space-before': 'always',
    
    // At 规则
    'at-rule-case': 'lower',
    'at-rule-name-case': 'lower',
    'at-rule-name-space-after': 'always-single-line',
    'at-rule-semicolon-newline-after': 'always',
    
    // 注释
    'comment-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['stylelint-commands']
      }
    ],
    'comment-whitespace-inside': 'always',
    
    // 通用
    'indentation': 2,
    'linebreaks': 'unix',
    'max-empty-lines': 1,
    'no-eol-whitespace': true,
    'no-missing-end-of-source-newline': true,
    
    // 属性排序
    'order/properties-order': [
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'z-index',
      'display',
      'flex',
      'flex-grow',
      'flex-shrink',
      'flex-basis',
      'flex-direction',
      'flex-flow',
      'flex-wrap',
      'grid',
      'grid-area',
      'grid-template',
      'grid-template-areas',
      'grid-template-rows',
      'grid-template-columns',
      'grid-row',
      'grid-row-start',
      'grid-row-end',
      'grid-column',
      'grid-column-start',
      'grid-column-end',
      'grid-auto-rows',
      'grid-auto-columns',
      'grid-auto-flow',
      'grid-gap',
      'grid-row-gap',
      'grid-column-gap',
      'gap',
      'row-gap',
      'column-gap',
      'align-content',
      'align-items',
      'align-self',
      'justify-content',
      'justify-items',
      'justify-self',
      'order',
      'float',
      'clear',
      'box-sizing',
      'width',
      'min-width',
      'max-width',
      'height',
      'min-height',
      'max-height',
      'margin',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'padding',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'overflow',
      'overflow-x',
      'overflow-y',
      'clip',
      'clip-path',
      'visibility',
      'opacity',
      'vertical-align',
      'resize',
      'cursor',
      'pointer-events',
      'user-select',
      'background',
      'background-color',
      'background-image',
      'background-repeat',
      'background-position',
      'background-size',
      'background-clip',
      'background-origin',
      'background-attachment',
      'background-blend-mode',
      'border',
      'border-width',
      'border-style',
      'border-color',
      'border-top',
      'border-top-width',
      'border-top-style',
      'border-top-color',
      'border-right',
      'border-right-width',
      'border-right-style',
      'border-right-color',
      'border-bottom',
      'border-bottom-width',
      'border-bottom-style',
      'border-bottom-color',
      'border-left',
      'border-left-width',
      'border-left-style',
      'border-left-color',
      'border-radius',
      'border-top-left-radius',
      'border-top-right-radius',
      'border-bottom-right-radius',
      'border-bottom-left-radius',
      'border-image',
      'border-image-source',
      'border-image-slice',
      'border-image-width',
      'border-image-outset',
      'border-image-repeat',
      'outline',
      'outline-width',
      'outline-style',
      'outline-color',
      'outline-offset',
      'box-shadow',
      'filter',
      'backdrop-filter',
      'mix-blend-mode',
      'isolation',
      'color',
      'font',
      'font-family',
      'font-size',
      'font-weight',
      'font-style',
      'font-variant',
      'font-size-adjust',
      'font-stretch',
      'font-effect',
      'font-emphasize',
      'font-emphasize-position',
      'font-emphasize-style',
      'font-smooth',
      'line-height',
      'direction',
      'letter-spacing',
      'white-space',
      'text-align',
      'text-align-last',
      'text-decoration',
      'text-emphasis',
      'text-emphasis-color',
      'text-emphasis-style',
      'text-emphasis-position',
      'text-indent',
      'text-justify',
      'text-outline',
      'text-transform',
      'text-wrap',
      'text-overflow',
      'text-overflow-ellipsis',
      'text-overflow-mode',
      'text-shadow',
      'word-spacing',
      'word-wrap',
      'word-break',
      'overflow-wrap',
      'tab-size',
      'hyphens',
      'unicode-bidi',
      'columns',
      'column-count',
      'column-fill',
      'column-gap',
      'column-rule',
      'column-rule-color',
      'column-rule-style',
      'column-rule-width',
      'column-span',
      'column-width',
      'page-break-after',
      'page-break-before',
      'page-break-inside',
      'src',
      'list-style',
      'list-style-position',
      'list-style-type',
      'list-style-image',
      'table-layout',
      'empty-cells',
      'caption-side',
      'border-spacing',
      'border-collapse',
      'content',
      'quotes',
      'counter-reset',
      'counter-increment',
      'transform',
      'transform-origin',
      'animation',
      'animation-name',
      'animation-duration',
      'animation-play-state',
      'animation-timing-function',
      'animation-delay',
      'animation-iteration-count',
      'animation-direction',
      'animation-fill-mode',
      'transition',
      'transition-delay',
      'transition-timing-function',
      'transition-duration',
      'transition-property',
      'will-change'
    ]
  }
};
```

## 测试配置

### Jest 配置

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### Vitest 配置 (前端测试)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
```

## CI/CD 配置

### GitHub Actions 配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
        
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint code
        run: |
          pnpm lint:frontend
          pnpm lint:backend

      - name: Type check
        run: |
          pnpm type-check:frontend
          pnpm type-check:backend

      - name: Run tests
        run: |
          pnpm test:backend
          pnpm test:frontend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_HOST: localhost
          REDIS_PORT: 6379

      - name: Build applications
        run: |
          pnpm build:frontend
          pnpm build:backend

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
```

### Docker 构建配置

```yaml
# .github/workflows/docker.yml
name: Docker Build and Push

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    strategy:
      matrix:
        service: [frontend, backend, lowcode-designer, amis-lowcode-backend, lowcode-platform-backend]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.service }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## 开发工具脚本

### 项目初始化脚本

```bash
#!/bin/bash
# scripts/setup-project.sh

set -e

echo "🚀 初始化项目开发环境..."

# 检查必要工具
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 未安装，请先安装 $1"
        exit 1
    fi
}

echo "🔍 检查必要工具..."
check_tool "node"
check_tool "pnpm"
check_tool "git"
check_tool "docker"
check_tool "psql"

# 安装 Git hooks
echo "🔧 安装 Git hooks..."
pnpm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky install
npx husky add .husky/pre-commit "pnpm lint-staged"
npx husky add .husky/commit-msg "npx commitlint --edit \$1"

# 设置 Git 配置
echo "📝 配置 Git..."
git config commit.template .gitmessage

# 创建必要目录
echo "📁 创建项目目录..."
mkdir -p logs uploads generated

# 安装依赖
echo "📦 安装项目依赖..."
./scripts/install-deps.sh

# 初始化数据库
echo "🗄️ 初始化数据库..."
./scripts/init-database.sh

# 创建开发环境配置
echo "⚙️ 创建开发环境配置..."
./scripts/create-env-files.sh

echo "✅ 项目初始化完成！"
echo ""
echo "📋 下一步操作："
echo "   1. 启动开发环境: ./scripts/start-dev.sh"
echo "   2. 访问前端: http://localhost:9527"
echo "   3. 访问设计器: http://localhost:9555"
```

### 环境配置生成脚本

```bash
#!/bin/bash
# scripts/create-env-files.sh

echo "⚙️ 创建环境配置文件..."

# Backend 环境配置
cat > backend/.env.development << 'EOF'
NODE_ENV=development
PORT=9528

# 数据库配置
DATABASE_URL=postgresql://soybean:soybean@123.@localhost:5432/soybean-admin-nest-backend-dev?schema=public

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 配置
JWT_SECRET=JWT_SECRET-soybean-admin-nest-dev!@#123.
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 日志配置
LOG_LEVEL=debug
LOG_DIR=./logs

# 跨域配置
CORS_ORIGIN=http://localhost:9527,http://127.0.0.1:9527,http://localhost:3002,http://127.0.0.1:3002
EOF

# Frontend 环境配置
cat > frontend/.env.development << 'EOF'
# 开发环境配置
VITE_APP_TITLE=SoybeanAdmin 低代码平台
VITE_APP_DESC=基于 Vue3、Vite、TypeScript、NaiveUI 的低代码平台

# API 服务地址
VITE_SERVICE_BASE_URL=http://localhost:9528
VITE_OTHER_SERVICE_BASE_URL={"lowcode": "http://localhost:3002", "amis": "http://localhost:9522"}

# 路由配置
VITE_ROUTE_HOME_PATH=/dashboard/analysis
VITE_ROUTE_LOGIN_PATH=/login

# 构建配置
VITE_BUILD_COMPRESS=gzip
VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE=false
EOF

# 其他服务的环境配置...
# (省略其他服务配置，与之前相同)

echo "✅ 环境配置文件创建完成！"
```

### 代码质量检查脚本

```bash
#!/bin/bash
# scripts/check-code-quality.sh

echo "🔍 开始代码质量检查..."

# 检查函数
check_service() {
    local service=$1
    echo "🔧 检查 $service..."
    
    cd "$service"
    
    # ESLint 检查
    echo "  📋 运行 ESLint..."
    if ! pnpm lint; then
        echo "  ❌ $service ESLint 检查失败"
        return 1
    fi
    
    # TypeScript 类型检查
    echo "  🔍 运行 TypeScript 类型检查..."
    if ! pnpm type-check; then
        echo "  ❌ $service TypeScript 类型检查失败"
        return 1
    fi
    
    # 运行测试
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        echo "  🧪 运行测试..."
        if ! pnpm test; then
            echo "  ❌ $service 测试失败"
            return 1
        fi
    fi
    
    cd ..
    echo "  ✅ $service 检查通过"
    return 0
}

# 检查所有服务
services=("frontend" "backend" "lowcode-designer" "amis-lowcode-backend" "lowcode-platform-backend")
failed_services=()

for service in "${services[@]}"; do
    if [ -d "$service" ]; then
        if ! check_service "$service"; then
            failed_services+=("$service")
        fi
    else
        echo "⚠️  $service 目录不存在，跳过"
    fi
done

# 输出结果
echo ""
if [ ${#failed_services[@]} -eq 0 ]; then
    echo "🎉 所有服务代码质量检查通过！"
    exit 0
else
    echo "❌ 以下服务检查失败："
    for service in "${failed_services[@]}"; do
        echo "  - $service"
    done
    exit 1
fi
```

### 性能监控脚本

```bash
#!/bin/bash
# scripts/monitor-performance.sh

echo "📊 开始性能监控..."

# 监控函数
monitor_service() {
    local service_name=$1
    local port=$2
    local url="http://localhost:$port"
    
    echo "🔍 监控 $service_name (端口: $port)..."
    
    # 检查服务是否运行
    if ! curl -f -s "$url" > /dev/null 2>&1 && ! curl -f -s "$url/api/health" > /dev/null 2>&1; then
        echo "  ❌ $service_name 服务未运行"
        return 1
    fi
    
    # 获取响应时间
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' "$url" 2>/dev/null || echo "0")
    echo "  ⏱️  响应时间: ${response_time}s"
    
    # 获取内存使用情况
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        local memory=$(ps -o rss= -p $pid 2>/dev/null | awk '{print $1/1024}')
        echo "  💾 内存使用: ${memory}MB"
        
        local cpu=$(ps -o %cpu= -p $pid 2>/dev/null)
        echo "  🖥️  CPU 使用: ${cpu}%"
    fi
    
    echo "  ✅ $service_name 监控完成"
    return 0
}

# 监控所有服务
services=(
    "Frontend:9527"
    "Backend:9528"
    "Amis Backend:9522"
    "Lowcode Platform:3002"
    "Lowcode Designer:9555"
)

for service_info in "${services[@]}"; do
    IFS=':' read -r service_name port <<< "$service_info"
    monitor_service "$service_name" "$port"
    echo ""
done

echo "📊 性能监控完成！"
```

## 故障排除指南

### 常见问题及解决方案

#### 1. 端口冲突问题

```bash
# 查找占用端口的进程
lsof -i :9527

# 批量清理端口
for port in 9527 9528 9522 3002 9555; do
    pid=$(lsof -ti: