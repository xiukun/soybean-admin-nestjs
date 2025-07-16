import { render as renderAmis } from 'amis'

import registerCompoments from '@/designer/register'
import { AlertComponent, Spinner, ToastComponent } from 'amis-ui'
import axios from 'axios'
// 解决monaco web worker error 的问题
import '@/utils/monaco'
import { Suspense } from 'react'

registerCompoments() // 注册自定义组件

function ParseJson() {
  return (
    <>
      <Suspense fallback={<Spinner overlay className="m-t-lg" size="lg" />}>
        {renderAmis(
          {
            type: 'ag-crud',
            syncLocation: false,
            api: {
              method: 'get',
              url: '/api/test2List',
              messages: {},
              requestAdaptor: '',
              adaptor: '',
            },
            columns: [
              {
                label: 'name',
                type: 'text',
                name: 'name',
                id: 'u:aa87d0117072',
              },
              {
                label: 'age',
                type: 'text',
                name: 'age',
                id: 'u:363cede9d0f0',
              },
              {
                label: 'date',
                type: 'text',
                name: 'date',
                id: 'u:e870d94fec9c',
              },
              {
                label: 'id',
                type: 'text',
                name: 'id',
                id: 'u:f8e16c827336',
              },
              {
                label: 'address',
                type: 'text',
                name: 'address',
                id: 'u:4a984be3025a',
              },
            ],
            bulkActions: [],
            itemActions: [],
            id: 'u:6d279a0f191e',
            perPageAvailable: [10],
            messages: {},
            draggable: false,
            filterSettingSource: ['name', 'age', 'date', 'id', 'address'],
          },
          {
            // props...
            // locale: 'en-US' // 请参考「多语言」的文档
            // scopeRef: (ref: any) => (amisScoped = ref)  // 功能和前面 SDK 的 amisScoped 一样
          },
          {
            // 下面三个接口必须实现
            fetcher: ({
              url, // 接口地址
              method, // 请求方法 get、post、put、delete
              data, // 请求数据
              responseType,
              config, // 其他配置
              headers, // 请求头
            }: any) => {
              config = config || {}
              config.withCredentials = false
              responseType && (config.responseType = responseType)

              if (config.cancelExecutor) {
                config.cancelToken = new (axios as any).CancelToken(config.cancelExecutor)
              }

              config.headers = headers || {}

              if (method !== 'post' && method !== 'put' && method !== 'patch') {
                if (data) {
                  config.params = data
                }

                return (axios as any)[method](url, config)
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

              return (axios as any)[method](url, data, config)
            },
            isCancel: (value: any) => (axios as any).isCancel(value),
          },
        )}
      </Suspense>
      <ToastComponent key="toast" position={'top-center'} />
      <AlertComponent key="alert" />
    </>
  )
}

export default ParseJson
