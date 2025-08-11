import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3200',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,

    // 测试文件配置
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',

    // 环境变量
    env: {
      apiUrl: 'http://localhost:3100',
      adminUsername: 'admin',
      adminPassword: 'admin123'
    },

    setupNodeEvents(on, config) {
      // 实现node事件监听器

      // 任务定义
      on('task', {
        // 数据库清理任务
        clearDatabase() {
          // 这里可以实现数据库清理逻辑
          return null;
        },

        // 创建测试数据任务
        createTestData(data) {
          // 这里可以实现测试数据创建逻辑
          console.log('Creating test data:', data);
          return null;
        },

        // 日志任务
        log(message) {
          console.log(message);
          return null;
        }
      });

      // 浏览器启动配置
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          // Chrome特定配置
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-gpu');
        }

        if (browser.name === 'electron') {
          // Electron特定配置
          launchOptions.preferences.width = 1280;
          launchOptions.preferences.height = 720;
        }

        return launchOptions;
      });

      // 文件预处理器
      on('file:preprocessor', file => {
        // TypeScript支持
        if (file.filePath.includes('.ts')) {
          return require('@cypress/webpack-preprocessor')({
            webpackOptions: {
              resolve: {
                extensions: ['.ts', '.js']
              },
              module: {
                rules: [
                  {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: [
                      {
                        loader: 'ts-loader',
                        options: {
                          transpileOnly: true
                        }
                      }
                    ]
                  }
                ]
              }
            }
          })(file);
        }

        return file;
      });

      return config;
    }
  },

  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite'
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts'
  },

  // 全局配置
  retries: {
    runMode: 2,
    openMode: 0
  },

  // 实验性功能
  experimentalStudio: true,
  experimentalMemoryManagement: true
});
