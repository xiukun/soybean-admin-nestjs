import { Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, HashRouter } from 'react-router-dom'
import router from './router'
import { message } from 'antd'
import { Spinner } from 'amis-ui'
import { setToken } from './utils/token'
import { bytesToMB } from './utils/utils'
import { useReactive } from 'ahooks'
import { removeItemsFromLocalStorage } from '@/utils/storage'

function App() {
  setToken()

  const appState = useReactive({
    memoryState: true,
    time: 1000 * 6 * 20,
    fastTime: 1000 * 6 * 10,
  })

  useEffect(() => {
    removeItemsFromLocalStorage(/^\/page\/body.*/); // 这将删除所有以"/page/body"开头的

    if (window.performance?.memory) {
      console.log(`总内存: ${bytesToMB(window.performance?.memory?.totalJSHeapSize)} MB`)
      console.log(`已使用内存: ${bytesToMB(window.performance?.memory?.usedJSHeapSize)} MB`)
      console.log(`JS堆大小限制: ${bytesToMB(window.performance?.memory?.jsHeapSizeLimit)} MB`)
    }

    // 内存资源占用轮询
    const intervalId = setInterval(() => {
      if (appState.memoryState) {
        const { performance } = window
        if (performance.memory) {
          if (bytesToMB(performance.memory.usedJSHeapSize) > 3200) {
            appState.time = appState.fastTime
            appState.memoryState = false

            message.warning({
              duration: 6,
              content: (
                <>
                  <span className="text-danger">
                    当前内存占用过高，存在崩溃风险，请及时保存，关闭当前页面重新打开！！
                  </span>{' '}
                  <br />
                  已使用内存:
                  <span className="text-danger">
                    {bytesToMB(window.performance.memory.usedJSHeapSize)} MB,
                  </span>
                  JS堆大小限制: {bytesToMB(window.performance.memory.jsHeapSizeLimit)} MB.
                </>
              ),
              onClose: () => {
                appState.memoryState = true
              },
            })
          }
        } else {
          try {
            clearInterval(intervalId)
          } catch (error) {
            console.log(error)
          }
          console.log('不支持performance.memory API')
        }
      }
    }, appState.time)

    // 清理函数，用以停止轮询和清理资源
    return () => {
      clearInterval(intervalId)
    }
  }, [])
  const Spin = () => <Spinner overlay className="m-t-lg" size="lg" />
  return (
    <>
      <HashRouter>
        <Suspense fallback={<Spin />}>
          <Routes>
            {router.map((item, i) => {
              return (
                <Route
                  key={i}
                  path={item.path}
                  element={
                    <Suspense fallback={<Spin />}>
                      <item.component />
                    </Suspense>
                  }
                />
              )
            })}
          </Routes>
        </Suspense>
      </HashRouter>
    </>
  )
}

export default App
