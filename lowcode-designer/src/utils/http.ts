import Axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { getToken } from './token'
import { getServiceAddress } from './system-address'

// 正确解析hash模式下的查询参数
const getSearchParams = () => {
  const hash = location.hash
  if (hash && hash.includes('?')) {
    // 从hash中提取查询参数部分: #/?pageKey=81&token=... -> pageKey=81&token=...
    const queryString = hash.split('?')[1]
    return new URLSearchParams(queryString)
  }
  // 回退到普通的search参数
  return new URLSearchParams(location.search)
}

const searchParams = getSearchParams()
const { CancelToken } = Axios
// 取消重复请求
const pending = [] as any
// 移除重复请求
const removePending = (config: InternalAxiosRequestConfig<any>) => {
  // debugger
  for (const key in pending) {
    const item = +key
    const list = pending[key]
    // 当前请求在数组中存在时执行函数体
    if (
      list.url === config.url &&
      list.method === config.method &&
      JSON.stringify(list.params) === JSON.stringify(config.params) &&
      JSON.stringify(list.data) === JSON.stringify(config.data)
    ) {
      // 执行取消操作
      list.cancel(
        `操作频繁已取消:${list.url},get:${JSON.stringify(list.params)},post:${JSON.stringify(
          list.data,
        )}`,
      )
      // 从数组中移除记录
      pending.splice(item, 1)
    }
  }
}
/**
 * http(axios)加载处理对象
 */
class Http {
  readonly className: string = 'AgHttp'
  $http = Axios.create(
    Object.assign({
      baseURL:
        import.meta.env.DEV && import.meta.env.VITE_OPEN_PROXY === 'true'
          ? '/api/'
          : getServiceAddress(),
      withCredentials: true,
      timeout: 10000,
    }),
  )
  constructor() {
    this.initReqInterceptors(this.$http)
    this.initRespInterceptors(this.$http)
  }

  /**
   * 初始化请求拦截器
   * @param axiosInstance 请求实例
   */
  initReqInterceptors(axiosInstance: AxiosInstance) {
    axiosInstance.interceptors.request.use(
      (config: any) => {
        const $config = config

        const token = getToken()
        if (token) {
          $config.headers['Authorization'] = `Bearer ${token}`
        }
        $config.headers['Page-Auth'] = searchParams.get('pageKey') // 功能页面标识，后端需要用到
        removePending($config)
        config.cancelToken = new CancelToken(c => {
          const { url, method, params, data } = config
          pending.push({ url, method: method, params, data, cancel: c })
        })
        return $config
      },
      error => {
        const $error = error
        // $error.isCancelRequest = Axios.isCancel($error)
        return Promise.reject($error)
      },
    )
  }

  /**
   * 初始化响应拦截器
   * @param axiosInstance 请求实例
   */
  initRespInterceptors(axiosInstance: AxiosInstance) {
    axiosInstance.interceptors.response.use(
      response => {
        const { data, config } = response
        removePending(config)
        try {
          if (config?.responseType == 'blob' || config?.responseType == 'arraybuffer') {
            return response
          } else {
            if (data.status > 0) {
              delete data.data
              data.error = data.msg
            }
            return data
          }
        } catch (error) {
          return Promise.reject(response)
        }
      },
      error => {
        const $error = error
        $error.isCancelRequest = Axios.isCancel($error)

        if ($error.isCancelRequest) {
          console.error($error.message)
          return new Promise(() => {})
        } else {
          // 所有的响应异常 区分来源为取消请求/非取消请求
          return Promise.reject($error)
        }
      },
    )
  }
}
export default new Http().$http
export { Http }
