// import { useSearchParams } from 'react-router-dom'

export const setToken = () => {
  // 获取token，并保存
  // const [searchParams] = useSearchParams()

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
  const token = searchParams.get('token')
  if (token) {
    window.AG_NEPTUNE_LOWCODE_TOKEN = token
    localStorage.setItem('AG_NEPTUNE_LOWCODE_TOKEN', token)
  } else {
    window.AG_NEPTUNE_LOWCODE_TOKEN = localStorage.getItem('AG_NEPTUNE_LOWCODE_TOKEN')
  }
}

export const getToken = () =>
  window.AG_NEPTUNE_LOWCODE_TOKEN || localStorage.getItem('AG_NEPTUNE_LOWCODE_TOKEN')
