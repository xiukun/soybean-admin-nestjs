import { toast } from 'amis-ui'
import { normalizeApiResponseData } from 'amis-core'

export const dataModelTablePlugin = {
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
          // label: '数据模型',
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
            // adaptor: function (payload: any) {
            //   if (payload.status == 0) delete payload.error
            //   console.log(payload) // 打印上下文数据
            //   return payload
            // },
            messages: {},
            dataType: 'json',
          },
          labelField: 'remark',
          valueField: 'id',
          // source: {
          //   url: 'http://mock.apifox.com/m1/3546534-0-default/formdataModelList',
          //   method: 'post',
          //   data: {
          //     objName: '',
          //   },
          //   requestAdaptor: '',
          //   adaptor: '',
          //   messages: {},
          //   dataType: 'json',
          // },
          // labelField: 'label',
          // valueField: 'value',
          mode: 'normal',
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
                  script: async (ctx: any) => {
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
                        //     label: obj.label,
                        //     type: 'text',
                        //     name: obj.name,
                        //   })
                        // })

                        items.forEach((obj: any) => {
                          autoFillKeyValues.push({
                            label: obj.remark,
                            type:
                              obj.htmlType?.indexOf('input-') >= 0
                                ? obj.htmlType?.split('input-')?.[1] || 'text'
                                : 'text',
                            name: obj.paramName,
                          })
                        })
                        ctx.props.formStore.setValues({
                          columns: autoFillKeyValues,
                        })
                        // 查询条件的字段列表
                        ctx.props.formStore.setValues({
                          filterSettingSource: autoFillKeyValues.map(column => {
                            return column.name
                          }),
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
