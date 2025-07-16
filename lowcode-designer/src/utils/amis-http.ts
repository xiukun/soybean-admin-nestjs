import type { AxiosInstance } from 'axios'
import Axios from 'axios'
import { getServiceAddress } from './system-address'
import { getToken } from './token'

const searchParams = new URLSearchParams(location.hash || location.search)
const { CancelToken } = Axios

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
      withCredentials: false,
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
        // 设计器开发环境下post请求过滤id="u:xxxxx"的id参数，修复表格通过接口生成数据因为ID导致无法查询出数据的问题
        if (import.meta.env.DEV && config.method == 'post') {
          const params = JSON.parse(config.data)
          if (params?.id?.indexOf('u:') === 0) {
            delete params.id
          }
          $config.data = JSON.stringify(params)
        }
        $config.headers.Token = getToken()
        $config.headers['Page-Auth'] = searchParams.get('pageKey') // 功能页面标识，后端需要用到
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
        try {
          // 下载文件，需要后端返回文件名称做编码处理，否则中文名会乱码
          if (response && response.headers && response.headers['content-disposition']) {
            const contentDisposition = response.headers['content-disposition']
            let filename = contentDisposition.split('filename=')[1]
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i

            const matches = contentDisposition.match(filenameRegex)
            if (matches && matches.length) {
              filename = matches[1].replace(`UTF-8''`, '').replace(/['"]/g, '')
            }

            // 很可能是中文被 url-encode 了
            if (filename && filename.replace(/[^%]/g, '').length > 2) {
              filename = decodeURIComponent(filename)
              // 有些后端用错了，导致空格转义成了 +，这里转回来
              filename = filename.replace(/\+/g, ' ')
            }
            const downloadUrl = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = downloadUrl
            link.setAttribute('download', filename) // 设置下载的文件名
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)
            return Promise.resolve({
              ...response,
              data: {
                status: 0,
                msg: '下载成功',
                data: '',
              },
            }) // 自定义返回内容，这里需要返回一个 Promise 对象，否则页面会报错
          }
          console.log(response, 'response')
          return Promise.resolve(response)
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
