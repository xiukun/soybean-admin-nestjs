import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import dayjs from 'dayjs'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import AutoImport from 'unplugin-auto-import/vite'
import AntdResolver from 'unplugin-auto-import-antd'
import legacy from '@vitejs/plugin-legacy'
import createVitePlugins from './vite/index'
import pkg from './package.json'
// 路径查找
const pathResolve = (dir: string): string => {
  return resolve(__dirname, '.', dir)
}

// 设置别名
const alias: Record<string, string> = {
  '@': pathResolve('src'),
  '/@': pathResolve('src'),
}

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [
      react({
        babel: {
          plugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-proposal-class-properties', { loose: true }],
          ],
        },
      }),
      visualizer({ open: false }),
      AutoImport({
        resolvers: [
          AntdResolver({
            prefix: 'A',
          }),
        ],
      }),
      ...createVitePlugins(env, command === 'build'),
      legacy({
        targets: ['chrome 86'],
        renderLegacyChunks: false,
        polyfills: [
          'es.symbol',
          'es.array.filter',
          'es.promise',
          'es.promise.finally',
          'es/map',
          'es/set',
          'es.array.for-each',
          'es.object.define-properties',
          'es.object.define-property',
          'es.object.get-own-property-descriptor',
          'es.object.get-own-property-descriptors',
          'es.object.keys',
          'es.object.to-string',
          'web.dom-collections.for-each',
          'esnext.global-this',
          'esnext.string.match-all',
          'es.string.replace-all',
          'es.object.has-own',
          'es.array.at',
          'es.array.find-last',
        ],
        modernPolyfills: [
          'es.array.for-each',
          'es.object.define-properties',
          'es.object.define-property',
          'es.object.get-own-property-descriptor',
          'es.object.get-own-property-descriptors',
          'es.object.keys',
          'es.object.to-string',
          'web.dom-collections.for-each',
          'esnext.global-this',
          'esnext.string.match-all',
          'es.string.replace-all',
          'es.object.has-own',
          'es.array.at',
          'es.array.find-last',
        ],
      }),
    ],
    resolve: {
      alias,
    },
    // vite.config.ts
    build: {
      rollupOptions: {
        output: {
          // manualChunks 配置
          manualChunks: {
            // 将 React 相关库打包成单独的 chunk 中
            'react-vendor': ['react', 'react-dom'],
            // 将 Lodash 库的代码单独打包
            // 'lodash': ['lodash-es'],
            // 将组件库的代码打包
            amis: ['amis'],
            // 'amis-ui': ['amis-ui'],
            'amis-editor': ['amis-editor'],
            // 'amis-editor-core': ['amis-editor-core'],
            'monaco-editor': ['monaco-editor'],
          },
        },
      },
    },
    define: {
      __PRODUCTION__APP__CONF__: JSON.stringify({
        pkg: {
          version: pkg.version,
          dependencies: pkg.dependencies,
          devDependencies: pkg.devDependencies,
        },
        lastBuildTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        ...env,
      }),
    },
    optimizeDeps: {
      include: [
        'amis-editor',
        `monaco-editor/esm/vs/language/json/json.worker`,
        `monaco-editor/esm/vs/language/css/css.worker`,
        `monaco-editor/esm/vs/language/typescript/ts.worker`,
        `monaco-editor/esm/vs/editor/editor.worker`,
      ],
    },
    css: {
      // user javascriptEnabled
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          modifyVars: {
            //在这里进行主题的修改，参考官方配置属性
            '@primary-color': '#1677FF',
          },
        },
      },
    },
    server: {
      host: true,
      open: true,
      port: 9555,
      proxy: {
        '/api': {
          target: env.VITE_APP_API_BASEURL,
          changeOrigin: true,
          rewrite: path => path.replace(/\/api/, ''),
        },
      },
    },
    router: {
      mode: 'hash',
    },
  }
})
