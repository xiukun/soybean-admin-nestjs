import { Schema } from 'amis-core'
import { TransferPlugin } from 'amis-editor'
import {
  BaseEventContext,
  defaultValue,
  getSchemaTpl,
  tipedLabel,
  undefinedPipeOut,
} from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
export class TransferPluginRefactor extends TransferPlugin {
  // static id = 'TransferPlugin'

  panelBodyCreator = (context: BaseEventContext) => {
    const renderer: any = context.info.renderer
    return getSchemaTpl('tabs', [
      {
        title: '属性',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '基本',
            body: [
              getSchemaTpl('layout:originPosition', { value: 'left-top' }),
              ...dataModelItemPlugin,
              // getSchemaTpl('formItemName', {
              //   required: true,
              // }),
              getSchemaTpl('label'),
              getSchemaTpl('valueFormula', {
                rendererSchema: (schema: Schema) => ({
                  ...schema,
                  type: 'select',
                  multiple: true,
                }),
                visibleOn: 'this.options.length > 0',
              }),
              getSchemaTpl('switch', {
                label: '统计数据',
                name: 'statistics',
              }),
              getSchemaTpl('labelRemark'),
              getSchemaTpl('remark'),
              getSchemaTpl('description'),
            ],
          },
          {
            title: '左侧选项面板',
            body: [
              {
                label: '展示形式',
                name: 'selectMode',
                type: 'select',
                options: [
                  {
                    label: '列表形式',
                    value: 'list',
                  },
                  {
                    label: '表格形式',
                    value: 'table',
                  },
                  {
                    label: '树形形式',
                    value: 'tree',
                  },
                ],
                onChange: (value: any, origin: any, item: any, form: any) => {
                  form.setValues({
                    options: undefined,
                    columns: undefined,
                    value: '',
                    valueTpl: '',
                  })
                  // 主要解决直接设置value、valueTpl为undefined配置面板不生效问题，所以先设置''，后使用setTimout设置为undefined
                  setTimeout(() => {
                    form.setValues({
                      value: undefined,
                      valueTpl: undefined,
                    })
                  }, 100)
                },
              },

              getSchemaTpl('optionControl', {
                visibleOn: 'this.selectMode === "list"',
                multiple: true,
              }),

              getSchemaTpl(
                'loadingConfig',
                {
                  visibleOn: 'this.source || !this.options',
                },
                { context },
              ),

              {
                type: 'ae-transferTableControl',
                label: '数据',
                visibleOn: 'this.selectMode === "table"',
                mode: 'normal',
                // 自定义change函数
                onValueChange: (type: 'options' | 'columns', data: any, onBulkChange: Function) => {
                  if (type === 'options') {
                    onBulkChange(data)
                  } else if (type === 'columns') {
                    const columns = data.columns
                    if (data.columns.length > 0) {
                      data.valueTpl = `\${${columns[0].name}}`
                    }
                    onBulkChange(data)
                  }
                },
              },

              getSchemaTpl('treeOptionControl', {
                visibleOn: 'this.selectMode === "tree"',
              }),

              getSchemaTpl('switch', {
                label: '可检索',
                name: 'searchable',
              }),

              getSchemaTpl('optionsMenuTpl', {
                manager: this.manager,
                onChange: (value: any) => {},
                visibleOn: 'this.selectMode !== "table"',
              }),

              {
                label: '标题',
                name: 'selectTitle',
                type: 'input-text',
                inputClassName: 'is-inline ',
              },
            ],
          },
          {
            title: '右侧结果面板',
            body: [
              {
                type: 'button-group-select',
                label: '展示形式',
                name: 'resultListModeFollowSelect',
                inputClassName: 'items-center',
                options: [
                  { label: '列表形式', value: false },
                  { label: '跟随左侧', value: true },
                ],
                onChange: (value: any, origin: any, item: any, form: any) => {
                  form.setValueByName('sortable', !value ? true : undefined)
                },
              },
              getSchemaTpl('switch', {
                label: tipedLabel('可检索', '查询功能目前只支持根据名称或值来模糊匹配查询'),
                name: 'resultSearchable',
              }),
              getSchemaTpl('sortable', {
                label: '支持排序',
                mode: 'horizontal',
                horizontal: {
                  justify: true,
                  left: 8,
                },
                inputClassName: 'is-inline',
                visibleOn: 'this.selectMode === "list" && !this.resultListModeFollowSelect',
              }),

              getSchemaTpl('optionsMenuTpl', {
                name: 'valueTpl',
                manager: this.manager,
                onChange: (value: any) => {},
                visibleOn: '!(this.selectMode === "table" && this.resultListModeFollowSelect)',
              }),
              {
                label: '标题',
                name: 'resultTitle',
                type: 'input-text',
                inputClassName: 'is-inline ',
              },
            ],
          },
          {
            title: '高级',
            body: [getSchemaTpl('virtualThreshold'), getSchemaTpl('virtualItemHeight')],
          },
          getSchemaTpl('status', { isFormItem: true }),
          getSchemaTpl('agValidation', { tag: ValidatorTag.MultiSelect }),
        ]),
      },
      {
        title: '外观',
        body: getSchemaTpl('collapseGroup', [
          getSchemaTpl('style:formItem', renderer),
          getSchemaTpl('style:classNames', [
            getSchemaTpl('className', {
              label: '描述',
              name: 'descriptionClassName',
              visibleOn: 'this.description',
            }),
            getSchemaTpl('className', {
              name: 'addOn.className',
              label: 'AddOn',
              visibleOn: 'this.addOn && this.addOn.type === "text"',
            }),
            ...(this.rendererName === 'transfer-picker'
              ? [
                  {
                    title: '边框',
                    key: 'borderMode',
                    body: [getSchemaTpl('borderMode')],
                  },
                  {
                    title: '弹窗',
                    key: 'picker',
                    body: [
                      {
                        name: 'pickerSize',
                        type: 'select',
                        pipeIn: defaultValue(''),
                        pipeOut: undefinedPipeOut,
                        label: '弹窗大小',
                        options: [
                          {
                            label: '默认',
                            value: '',
                          },
                          {
                            value: 'sm',
                            label: '小',
                          },

                          {
                            label: '中',
                            value: 'md',
                          },

                          {
                            label: '大',
                            value: 'lg',
                          },

                          {
                            label: '特大',
                            value: 'xl',
                          },

                          {
                            label: '全屏',
                            value: 'full',
                          },
                        ],
                      },
                    ],
                  },
                ]
              : []),
          ]),
        ]),
      },
      {
        title: '事件',
        className: 'p-none',
        body: [
          getSchemaTpl('eventControl', {
            name: 'onEvent',
            ...getEventControlConfig(this.manager, context),
          }),
        ],
      },
    ])
  }
}
