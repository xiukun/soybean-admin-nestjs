import { toast } from 'amis-ui'
import { normalizeApiResponseData } from 'amis-core'

export const dataModelFormPlugin = {
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
          id: 'u:adddc470d36c',
          multiple: false,
          clearable: true,
          searchable: true,
          source: {
            url: '/system/structTab/query',
            method: 'post',
            data: {
              objName: '',
            },
            requestAdaptor: '',
            adaptor: '',
            messages: {},
          },
          labelField: 'remark',
          valueField: 'id',
          joinValues: false,
          pipeIn: (value: any, data: any) => {
            return value || data.data.dataModelEntity || ''
          },
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
                  script: async (ctx: any, _: any, event: any) => {
                    const dataModelEntity = ctx.props.data.dataModelEntity
                    if (dataModelEntity) {
                      // const response = await ctx.props.env.fetcher(
                      //   'https://mock.apifox.com/m1/3546534-0-default/formDataObject',
                      //   { mainId: dataModelEntity?.value },
                      //   {
                      //     method: 'post',
                      //   },
                      // )
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
                      if (Array.isArray(items)) {
                        // items.forEach((obj: any) => {
                        //   autoFillKeyValues.push({
                        //     // displayType: "tpl",
                        //     label: obj.label,
                        //     // inputType: obj.componentType,
                        //     name: obj.name,
                        //     type: obj.componentType,
                        //   })
                        // })
                        items.forEach((obj: any) => {
                          autoFillKeyValues.push({
                            label: obj.remark,
                            inputType: obj.htmlType || 'input-text',
                            name: obj.paramName,
                          })
                        })

                        const listKey = `${event.data.feat.toLowerCase()}Fields`
                        ctx.props.formStore.setValues({
                          // body: autoFillKeyValues,
                          [listKey]: autoFillKeyValues,
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

  mode: 'horizontal',
}
