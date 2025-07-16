import { AgGlobalConfig } from '@ag-neptune/bu-ui'
import { saveColumns } from '@/api/amis.ts'
const init = new AgGlobalConfig() // 初始化全局配置
;(() => {
  // 定义的通用window方法，供amis设计器使用
  const newJsFunc = {
    /**
     * 浏览器动态列缓存
     * @param ctx amis context上下文
     * @param event amis event事件
     * @param clear 是否清除 默认false
     */
    dynimicColumnCache: (ctx: any, event: any, clear: boolean = false) => {
      //  前端缓存动态列，如果不存在动态列调整，读取当前json中的列配置缓存
      if (ctx?.props?.dynimicColumnKey && event?.data?.columns) {
        if (clear) {
          sessionStorage.removeItem(ctx.props.dynimicColumnKey)
        } else {
          sessionStorage.setItem(ctx.props.dynimicColumnKey, JSON.stringify(event.data.columns))
        }
      } else if (ctx?.props?.dynimicColumnKey && ctx?.props?.columns) {
        if (clear) {
          sessionStorage.removeItem(ctx.props.dynimicColumnKey)
        } else {
          sessionStorage.setItem(ctx.props.dynimicColumnKey, JSON.stringify(ctx.props.columns))
        }
      }
    },
    dynimicColumnSave: (ctx: any, event: any, clear: boolean = false) => {
      if(clear && event.data?.__super?.dynimicColumnKey) {
        sessionStorage.removeItem(event.data.__super.dynimicColumnKey)
        saveColumns({ key: event.data.__super.dynimicColumnKey, columns: undefined })
      } else
      if (ctx?.props?.dynimicColumnKey && event?.data?.columns) {
        const columnsData = JSON.stringify(event.data.columns)
        sessionStorage.setItem(ctx.props.dynimicColumnKey, JSON.stringify(event.data.columns))
        saveColumns({ key: ctx.props.dynimicColumnKey, columns: columnsData })
      }
    },
  }

  Object.assign((window as any).__JSFunc, newJsFunc)
  ;(window as any).__JSEditStatus = (window.top as any).__JSEditStatus = 1
})()
