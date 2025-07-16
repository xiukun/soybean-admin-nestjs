import { memo, useEffect, useState } from 'react'
import { useReactive } from 'ahooks'
import { Editor, GlobalVariableEventContext, GlobalVariablesEventContext, PluginEvent } from 'amis-editor'
import { ToastComponent, AlertComponent, toast } from 'amis-ui'
import { SchemaObject } from 'amis/lib/Schema'

import useAmisStore, { AmisStoreProvider } from '@/store/amis-store'
import DesignerHeader from './plugins/designer-header'
import agHttp from '@/utils/amis-http'

import '@/styles/amis-desiginer.scss'
import { isEmpty } from 'lodash'
import { amisPageFindDetail, amisPageFindPageById, amisPageSave } from '@/api/amis'
import LayoutList from '@/components/layout'
import { cacheDictionary } from '@/utils/dictionary'
import _ from 'lodash'
import { uuid } from 'amis-core'

const globalEvents = [
  {
    name: 'globalEventA',
    label: '全局事件A',
    description: '全局事件动作A',
    mapping: [
      {
        key: 'name',
        type: 'string'
      },
      {
        key: 'age',
        type: 'number'
      }
    ]
  },
  {
    name: 'globalEventB',
    label: '全局事件B',
    description: '全局事件动作A',
    mapping: [
      {
        key: 'name',
        type: 'string'
      }
    ]
  }
];

export function AmisDesigner(props: { title: string; editorType: string }) {
  const searchParams = new URLSearchParams(location.hash || location.search)
  window.AG_NEPTUNE_LOWCODE_PAGE_ID = searchParams.get('pageKey')
  window.AG_NEPTUNE_LOWCODE_PAGE_HISTORY_ID = searchParams.get('historyId')
  const store = useAmisStore()
  const appState = useReactive<{ schema: any }>({
    schema: { ...store.defaultSchema }
  })
  const getSchemaData = (id: string) => {
    if (window.AG_NEPTUNE_LOWCODE_PAGE_HISTORY_ID) {
      amisPageFindPageById({ id: window.AG_NEPTUNE_LOWCODE_PAGE_HISTORY_ID }).then((res: any) => {
        commonSetSchema(res)
      })
    } else {
      amisPageFindDetail({ id }).then((res: any) => {
        commonSetSchema(res)
      })
    }
  }
  /**
   * 设置页面 schema
   * @param res
   */
  function commonSetSchema(res: any) {
    if (isEmpty(res.data)) {
      appState.schema = {
        type: 'page',
        body: [],
        regions: ['body'],
        config: {
          globalVals: []
        }
      }

    } else {
      if (res.data.unitType === '0') {
        appState.schema = res.data.content
          ? {
            type: 'page',
            body: JSON.parse(res.data.content),
            regions: ['body'],
          }
          : undefined
      } else {
        appState.schema = res.data.content ? JSON.parse(res.data.content) : undefined
      }
    }
  }
  useEffect(() => {
    getSchemaData(searchParams.get('pageKey') || '')
  }, [])

  // AmisStoreProvider的事件
  function providerActions() {
    return {
      // 清空
      onClear: () => {
        appState.schema = { ...store.emptySchema }
      },
      // 页面  页面模板保存
      onSave: () => {
        amisPageSave({
          id: searchParams.get('pageKey'),
          unitType: searchParams.get('unitType') || undefined,
          content: JSON.stringify(appState.schema),
        }).then((res: any) => {
          if (res.status > 0) {
            toast.error(res.msg)
          } else {
            toast.success(res.msg)
          }
        })
      },
      // 组件 保存
      onSavePlugin: () => {
        let pluginSchema = undefined
        if (appState.schema.type == 'page') {
          pluginSchema = _.isEmpty(appState.schema.body) ? undefined : appState.schema.body
        }
        amisPageSave({
          id: searchParams.get('pageKey'),
          unitType: 1,
          content: JSON.stringify(pluginSchema),
        }).then((res: any) => {
          if (res.status > 0) {
            toast.error(res.msg)
          } else {
            toast.success(res.msg)
          }
        })
      },
      onDictionarySave: () => cacheDictionary(),
    }
  }
  // 事件
  function editorActions() {
    return {
      onChange: (e: SchemaObject) => {
        appState.schema = e
      },
      onAsyncChange: (id: string) => {
        getSchemaData(id)
      },
    }
  }

  // 右侧面板构建处理
  function onBuildPanels(_event: any) {
    // if (_event.context?.info.type == 'button')
    //   console.log(_event.context.node, '_event.context.node..')
    // if (_event.context?.info.type == 'button') {
    //   let panel = _event.context.info.plugin.panelBodyCreator(_event.context)
    //   _event.context.info.plugin.panelBody = panel?.tabs?.splice(0, 1)
    //   console.log('onBuildPanels', _event.context?.info.type, _event.context.info.plugin.panelBody)
    // }
  }

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

  // 通过 localstorage 存储全局变量
  // 实际场景肯定是后端存储到数据库里面
  // 可以参考这个利用这三个事件来实现全局变量的增删改查
  function getGlobalVariablesFromStorage(): Array<any> {
    const key = 'amis-lowcode-global-variable';
    let globalVariables = localStorage.getItem(key);
    let variables: Array<any> = [];

    if (globalVariables) {
      variables = JSON.parse(globalVariables);
    }

    return variables;
  }

  function saveGlobalVariablesToStorage(variables: Array<any>) {
    const key = 'amis-lowcode-global-variable';
    localStorage.setItem(key, JSON.stringify(variables));
  }

  function onGlobalVariableInit(event: PluginEvent<GlobalVariablesEventContext>) {
    saveGlobalVariablesToStorage(appState.schema.config?.globalVals || [])
    event.setData(appState.schema.config?.globalVals || getGlobalVariablesFromStorage() || []);
  }

  function onGlobalVariableSave(event: PluginEvent<GlobalVariableEventContext>) {
    const item = event.data;
    const obj = { ...appState.schema }
    if (obj.config && obj.config.globalVals) {
      if (obj.config["globalVals"].length > 0) {
        const list = [...obj.config["globalVals"]]
        const idx = item.id
          ? list.findIndex((it: any) => it.id === item.id)
          : -1;

        if (idx === -1) {
          item.id = uuid();
          list.push(item);
        } else {
          list[idx] = item;
        }
        obj.config["globalVals"] = list
      } else {
        obj.config["globalVals"] = [event.data]
      }

    } else {
      obj.config = { globalVals: [event.data] }
    }

    appState.schema = obj
    saveGlobalVariablesToStorage(appState.schema.config?.globalVals || [])

  }

  function onGlobalVariableDelete(
    event: PluginEvent<GlobalVariableEventContext>
  ) {
    const item = event.data;
    const schemaObj = { ...appState.schema }
    const list = [...schemaObj.config["globalVals"]];
    const idx = item.id
      ? list.findIndex((it: any) => it.id === item.id)
      : -1;

    if (idx === -1) {
      return;
    } else {
      list.splice(idx, 1);
    }
    schemaObj.config["globalVals"] = list
    appState.schema = schemaObj
    saveGlobalVariablesToStorage(appState.schema.config?.globalVals || [])
  }



  return (
    <AmisStoreProvider value={{ ...providerActions(), ...editorActions() }}>
      <div className="amis-desiginer-layout">
        <DesignerHeader
          title={`${props.title}(${searchParams.get('objtitle') || searchParams.get('title') || '空'})`}
          editorType={window.AG_NEPTUNE_LOWCODE_PAGE_HISTORY_ID ? 'view' : props.editorType}
        />
        <div className="context">
          <Editor
            className="is-fixed"
            preview={store.isProview}
            isMobile={store.isMobile}
            value={appState.schema}
            theme={store.theme}
            onChange={editorActions().onChange}
            afterResolveJsonSchema={onBuildPanels}
            amisEnv={{ fetcher, enableAMISDebug: true } as any}
            showCustomRenderersPanel={true}
            plugins={LayoutList} // 存放常见布局组件
            actionOptions={{
              showOldEntry: false,
              globalEventGetter: () => globalEvents
            }}
            onGlobalVariableInit={onGlobalVariableInit}
            onGlobalVariableSave={onGlobalVariableSave}
            onGlobalVariableDelete={onGlobalVariableDelete}
          // ctx={{
          //   __page: {
          //     num: 2,
          //     arr1:[],
          //     arr2:[]
          //   }
          // }}
          />
        </div>
      </div>
      <ToastComponent key="toast" position={'top-center'} theme={store.theme} />
      <AlertComponent key="alert" theme={store.theme} />
    </AmisStoreProvider>
  )
}

export default memo(AmisDesigner)
