import { tipedLabel } from 'amis-editor-core'

// import { getSchemaTpl } from 'amis-editor'
export const tplModeObj = {
  mode: 'horizontal',
  horizontal: {
    justify: true,
    left: 4,
  },
  inputClassName: 'is-inline ',
}

export const dataModelItemPlugin = [
  {
    ...tplModeObj,
    name: 'selectModelName',
    label: '模型列表',
    type: 'select',
    id: 'u:selectModelName',
    multiple: false,
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
    selectFirst: false,
    onEvent: {
      change: {
        weight: 0,
        actions: [
          {
            componentId: 'u:selectModelField',
            ignoreError: false,
            actionType: 'reload',
          },
        ],
      },
    },
    clearable: true,
    searchable: true,
  },
  {
    ...tplModeObj,
    name: 'selectModelField',
    label: '模型字段',
    type: 'select',
    id: 'u:selectModelField',
    multiple: false,
    source: {
      url: '/system/structCol/query?mainId=${selectModelName}',
      method: 'post',
      data: {
        mainId: '${selectModelName}',
      },
      requestAdaptor: '',
      adaptor: '',
      messages: {},
      sendOn: '${selectModelName}',
    },
    labelField: 'remark',
    valueField: 'paramName',
    clearable: true,
    searchable: true,
  },
  // getSchemaTpl('formItemName', {
  //   required: true,
  //   value: '${IF(selectModelField,selectModelField,name)}',
  // }),
  {
    ...tplModeObj,
    name: 'name',
    type: 'ag-modelBindingControl',
    label: tipedLabel('列字段', '点击+号设置字段过滤方法'),
    required: true,
    value: '${IF(selectModelField,selectModelField,name)}',
    onBindingChange(field: any, onBulkChange: (value: any) => void) {
      const schema = field?.resolveColumnSchema?.('List') || {
        title: field.label,
      }
      onBulkChange(schema)
    },
  },
  // getSchemaTpl('agFormItemName', {
  //   required: true,
  //   value: '${IF(selectModelField,selectModelField,name)}',
  // }),
]
