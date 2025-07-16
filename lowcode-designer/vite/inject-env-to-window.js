import fs from 'fs-extra'
import path from 'path'
import dotenv from 'dotenv'
const CONFIG_NAME = '__PRODUCTION__APP__CONF__'
const CONFIG_NAME_API_BASE_URL = CONFIG_NAME + 'API_BASE_URL'
const CONFIG_FILE_NAME = '_app.config.js'
const OUTPUT_DIR = 'dist'
/**
 * 获取用户根目录
 * @param dir file path
 */
export function getRootPath(...dir) {
  return path.resolve(process.cwd(), ...dir)
}

/**
 * 获取以指定前缀开头的环境变量
 * @param match prefix
 * @param confFiles ext
 */
function getEnvConfig(match = 'VITE_', confFiles = ['.env', '.env.production']) {
  let envConfig = {}
  confFiles.forEach(item => {
    try {
      const env = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), item)))
      envConfig = { ...envConfig, ...env }
    } catch (e) {
      console.error(`解析错误:${item}`, e)
    }
  })
  const reg = new RegExp(`^(${match})`)
  Object.keys(envConfig).forEach(key => {
    if (!reg.test(key)) {
      Reflect.deleteProperty(envConfig, key)
    }
  })
  return envConfig
}

function createConfig(params) {
  const { configName, config, configFileName } = params
  try {
    const windowConf = `window.${configName}`

    // 确保变量不会被修改
    // Object.freeze(${windowConf});
    //   Object.defineProperty(window, "${configName}", {
    //     configurable: false,
    //     writable: false,
    //   });
    const configStr = `${windowConf}=${JSON.stringify(config)};
    localStorage.setItem("${CONFIG_NAME_API_BASE_URL}", ${JSON.stringify(config.VITE_APP_API_BASEURL)});`.replace(
      /\s/g,
      '',
    )

    // 拼接新的输出根目录地址
    const filePath = `${OUTPUT_DIR}/`

    // 创建根目录
    fs.mkdirp(getRootPath(filePath))
    fs.writeFileSync(getRootPath(filePath + configFileName), configStr)

    console.log(`✨ 配置文件构建成功:`)
    console.log(filePath + '\n')
  } catch (error) {
    console.log('配置文件配置文件打包失败:\n' + error)
  }
}

const runBuild = async () => {
  try {
    const config = getEnvConfig()
    createConfig({
      config,
      configName: CONFIG_NAME,
      configFileName: CONFIG_FILE_NAME,
    })
    console.log(`环境变量注入成功 - 构建成功!`)
  } catch (error) {
    console.log('虚拟构建错误:\n' + error)
    process.exit(1)
  }
}

runBuild()
