const apiType = {
  create: '/save',
  update: '/update',
  delete: '/delete',
  bulkDelete: '/deleteBatch',
}
/**
 * 生成API接口地址
 * @param newApi
 * @param type
 * @returns
 */
export function generateApiUrl(newApi: any, type: string) {
  const url =
    newApi.url.lastIndexOf('/') > 0 ? newApi.url.substring(0, newApi.url.lastIndexOf('/')) : ''
  return url + (apiType as any)[type]
}

/**
 * 批量删除按钮配置
 * @returns 
 */
export function bulkDeleteBtnSchema(api={}) {
  return {
    "type": "button",
    "label": "批量删除",
    "disabledOnAction": false,
    "level": "danger",
    "confirmText": "确定批量删除<br/>${REPLACE(ids,',','<br/>')}？",
    "onEvent": {
      "click": {
        "actions": [
          {
            "ignoreError": false,
            "actionType": "ajax",
            "outputVar": "responseResult",
            "options": {},
            "api": {
              "url": "",
              "method": "post",
              "data": {
                "ids": "${ids}"
              },
              ...api
            }
          }
        ]
      }
    }
  }
   
}