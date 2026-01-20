const apiType = {
  create: '/save',
  update: '/update',
  delete: '/delete',
  bulkDelete: '/deleteBatch'
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
export function bulkDeleteBtnSchema(api = {}) {
  return {
    type: 'button',
    label: '批量删除',
    disabledOnAction: false,
    level: 'danger',
    confirmText: "确定批量删除<br/>${REPLACE(ids,',','<br/>')}？",
    onEvent: {
      click: {
        actions: [
          {
            ignoreError: false,
            actionType: 'ajax',
            outputVar: 'responseResult',
            options: {},
            api: {
              url: '',
              method: 'post',
              data: {
                ids: '${ids}'
              },
              ...api
            }
          }
        ]
      }
    }
  }
}

/**
 * 将展现控件转成编辑控件（列类型 -> 表单控件类型），表格列显示类型转为编辑类型
 * @param type
 * @returns
 */
export const viewTypeToEditType = (type: string) => {
  const mapping: Record<string, string> = {
    // 文本/模板/静态展示
    tpl: 'input-text',
    text: 'input-text',
    static: 'input-text',
    html: 'input-text',
    textarea: 'textarea',

    // 数字/进度
    number: 'input-number',
    progress: 'input-number',

    // 媒体
    image: 'input-image',
    audio: 'input-file',
    video: 'input-file',
    file: 'input-file',

    // 时间日期
    date: 'input-date',
    datetime: 'input-datetime',
    time: 'input-time',

    // 选择类
    select: 'select',
    radios: 'radios',
    checkboxes: 'checkboxes',
    status: 'select',
    mapping: 'select',

    // 布尔类
    switch: 'switch',
    checkbox: 'checkbox',
    boolean: 'switch',

    // 其它
    color: 'input-color',
    richtext: 'input-rich-text',
    json: 'json-editor',
    tag: 'input-tag',
    badge: 'input-text',
    link: 'input-text',
    url: 'input-url',
    email: 'input-email',
    password: 'input-password'
  }

  if (mapping[type]) {
    return mapping[type]
  }

  // 安全兜底：未知类型统一使用可编辑文本，避免生成无效的 input-${type}
  return 'input-text'
}
