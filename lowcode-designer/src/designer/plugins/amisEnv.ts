import { useNavigate } from 'react-router-dom'
import { normalizeLink } from 'amis-core'
import agHttp from '@/utils/amis-http'
const fetcher = ({
  url, // 接口地址
  method, // 请求方法 get、post、put、delete
  responseType,
  data, // 请求数据
  config, // 其他配置
  headers,
}: any) => {
  config = config || {}
  // config.withCredentials = true
  responseType && (config.responseType = responseType)
  config.headers = headers || {}

  if (method !== 'post' && method !== 'put' && method !== 'patch') {
    if (data) {
      config.params = data
    }

    return (agHttp as any)[method](url, config)
  } else if (data && data instanceof FormData) {
    config.headers = config.headers || {}
    config.headers['Content-Type'] = 'multipart/form-data'
  } else if (
    data &&
    typeof data !== 'string' &&
    !(data instanceof Blob) &&
    !(data instanceof ArrayBuffer)
  ) {
    data = JSON.stringify(data)
    config.headers = config.headers || {}
    config.headers['Content-Type'] = 'application/json'
  }

  return (agHttp as any)[method](url, data, config)
}

const amisEnv = () => {
  const router = useNavigate()
  return {
    enableAMISDebug: true,
    fetcher,
    // jumpTo: (to: any, action: any) => {
    //   if (to === 'goBack') {
    //     return router(-1)
    //   }
    //   if (location.hash.includes('#')) {
    //     to = normalizeLink(location.hash.includes('#') ? `#${to}` : to)
    //     if (action?.actionType === 'url') {
    //       if (action.blank === false) {
    //         router(to.substring(to.indexOf('#') + 1))
    //       } else {
    //         if (/^(http|https):\/\//.test(to.substring(to.indexOf('#') + 1))) {
    //           window.open(to.substring(to.indexOf('#') + 1))
    //         } else {
    //           window.open(to)
    //         }
    //       }
    //       return
    //     }
    //   } else {
    //     to = normalizeLink(to)

    //     if (action?.actionType === 'url') {
    //       action.blank === false ? router(to.substring(to.indexOf('#'))) : window.open(to)
    //       return
    //     }
    //   }

    //   // 主要是支持 nav 中的跳转
    //   if (action && to && action.target) {
    //     window.open(to, action.target)
    //     return
    //   }
    //   if (/^https?:\/\//.test(to)) {
    //     window.location.replace(to)
    //   } else {
    //     router(to)
    //   }
    // },

    // updateLocation: (to: any, replace: any) => {
    //   if (to === 'goBack') {
    //     return router(-1)
    //   }

    //   if (location.hash.includes('#')) {
    //     to = normalizeLink(location.hash.includes('#') ? `#${to}` : to)
    //     router(to.substring(to.indexOf('#') + 1))
    //   } else {
    //     to = normalizeLink(to, window.location)
    //     replace ? router(to, { replace: true }) : router(to, { replace: true })
    //   }
    // },
  }
}

export { amisEnv }
