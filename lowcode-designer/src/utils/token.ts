// import { useSearchParams } from 'react-router-dom'

export const setToken = () => {
  // 获取token，并保存
  // const [searchParams] = useSearchParams()
  const searchParams = new URLSearchParams(location.hash || location.search)
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
