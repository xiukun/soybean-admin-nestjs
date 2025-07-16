import { toast } from 'amis-ui'
import { normalizeApiResponseData } from 'amis-core'

export const dataModelTablePlugin2 = {
  type: 'group',
  body: [
    {
      type: 'service',
      dsType: 'api',
      api: {
        url: '',
        method: 'post',
        requestAdaptor: '',
        adaptor: '',
        messages: {},
      },
      name: 'dataModelService',
      dataProvider: '',
      onEvent: {
        init: {
          weight: 0,
          actions: [],
        },
      },
      body: [
        {
          type: 'select',
          label: '数据模型',
          name: 'dataModelEntity',
          multiple: false,
          clearable: true,
          searchable: true,
          joinValues: false,
          source: {
            url: '/system/structTab/query',
            method: 'post',
            data: {
              objName: '',
            },
            messages: {},
            dataType: 'json',
          },
          labelField: 'remark',
          valueField: 'id',

          mode: 'horizontal',
        },
      ],
    },
    {
      type: 'button-toolbar',
      label: '',
      buttons: [
        {
          type: 'button',
          label: '生成模型数据列',
          onEvent: {
            click: {
              actions: [
                {
                  ignoreError: false,
                  script: async (ctx: any, e: any, ae: any) => {
                    const dataModelEntity = ctx.props.data.dataModelEntity
                    if (dataModelEntity) {
                      const response = await ctx.props.env.fetcher(
                        '/system/structCol/query',
                        { mainId: dataModelEntity?.id },
                        {
                          method: 'post',
                        },
                      )
                      const result = normalizeApiResponseData(response.data)
                      const items = result.options
                      const autoFillKeyValues: any[] = []
                      const tplTypeList = ['text', 'number']
                      if (Array.isArray(items)) {
                        items.forEach((obj: any) => {
                          autoFillKeyValues.push({
                            checked: true,
                            displayType:
                              obj.htmlType?.indexOf('input-') >= 0
                                ? tplTypeList.includes(obj.htmlType?.split('input-')?.[1])
                                  ? 'tpl'
                                  : obj.htmlType?.split('input-')?.[1]
                                : 'tpl',
                            inputType: obj.htmlType || 'input-text',
                            label: obj.remark,
                            name: obj.paramName,
                          })
                        })

                        ctx.props.formStore.setValues({
                          listFields: autoFillKeyValues,
                          viewFields: autoFillKeyValues,
                          simpleQueryFields: autoFillKeyValues,
                          insertFields: autoFillKeyValues,
                          editFields: autoFillKeyValues,
                          deleteFields: autoFillKeyValues,
                          bulkEditFields: autoFillKeyValues,
                          bulkDeleteFields: autoFillKeyValues,
                          dataModelEntity,
                          // value: autoFillKeyValues,
                        })
                      } else {
                        toast.warning('数据模型对象格式错误，应返回数组～～')
                      }
                    } else {
                      toast.warning('暂无数据～～')
                    }
                  },
                  actionType: 'custom',
                },
              ],
            },
          },
        },
      ],
      level: 'horizontal',
      mode: 'inline',
    },
  ],
  className: 'm-t',
  mode: 'horizontal',
}
