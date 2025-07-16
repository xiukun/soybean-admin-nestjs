import { TableControlPlugin } from 'amis-editor'
import {
  BaseEventContext,
  defaultValue,
  getSchemaTpl,
  tipedLabel,
  getI18nEnabled,
  ScaffoldForm,
} from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
import { cloneDeep } from 'lodash'
import { dataModelInputTablePlugin } from '../common/json/data-model-input-table-plugin'

export class TableControlPluginRefactor extends TableControlPlugin {
  // static id = 'TableControlPlugin'
  // rendererName = 'input-table'
  get scaffoldForm(): ScaffoldForm {
    const i18nEnabled = getI18nEnabled()
    return {
      title: '快速构建表格编辑框',
      body: [
        dataModelInputTablePlugin,
        {
          name: 'columns',
          type: 'input-table',
          label: false,
          needConfirm: false,
          addable: true,
          removable: true,
          columns: [
            {
              type: 'text',
              name: 'label',
              label: '标题',
              quickEdit: {
                type: i18nEnabled ? 'input-text-i18n' : 'input-text',
                mode: 'inline',
              },
            },
            {
              type: 'text',
              name: 'name',
              label: '绑定字段名',
              quickEdit: {
                type: 'input-text',
                mode: 'inline',
              },
            },
            {
              type: 'text',
              name: 'type',
              label: '展示类型',
              width: 140,
              quickEdit: {
                type: 'select',
                options: [
                  {
                    value: 'text',
                    label: '纯文本',
                  },
                  {
                    value: 'tpl',
                    label: '模板',
                  },
                  {
                    value: 'container',
                    label: '容器',
                  },
                  {
                    value: 'image',
                    label: '图片',
                  },
                  {
                    value: 'date',
                    label: '日期',
                  },
                  {
                    value: 'datetime',
                    label: '日期时间',
                  },
                  {
                    value: 'time',
                    label: '时间',
                  },
                  {
                    value: 'status',
                    label: '状态',
                  },
                  {
                    value: 'mapping',
                    label: '映射',
                  },
                  {
                    value: 'hidden',
                    label: '隐藏',
                  },
                ],
                pipeIn: defaultValue('text'),
              },
            },
            {
              type: 'text',
              name: 'quickEdit.type',
              label: '编辑类型',
              quickEdit: {
                type: 'select',
                clearable: true,
                placeholder: '为空则不支持编辑',
                options: [
                  {
                    value: 'input-text',
                    label: '文本框',
                  },
                  {
                    value: 'input-number',
                    label: '数字框',
                  },
                  {
                    value: 'select',
                    label: '选择框',
                  },
                  {
                    value: 'input-color',
                    label: '颜色选择框',
                  },
                  {
                    value: 'checkboxes',
                    label: '多选框',
                  },
                  {
                    value: 'radios',
                    label: '单选框',
                  },
                  {
                    value: 'input-date',
                    label: '日期',
                  },
                  {
                    value: 'input-datetime',
                    label: '日期时间',
                  },
                  {
                    value: 'input-date-range',
                    label: '日期范围',
                  },
                  {
                    value: 'switch',
                    label: '开关',
                  },
                  {
                    value: 'nested-select',
                    label: '级联选择器',
                  },
                  {
                    value: 'input-city',
                    label: '城市选择器',
                  },
                  {
                    value: 'input-tree',
                    label: '树选择框',
                  },
                ],
              },
              width: 210,
            },
          ],
        },
      ],
      pipeOut: (schema: any) => {
        const columns = cloneDeep(schema.columns || [])
        const rawColumns: any = []
        columns.forEach((column: any) => {
          const rawColumn = {
            ...column,
            type: column.type,
            quickEdit: column.quickEdit?.type
              ? {
                  type: column.quickEdit.type,
                  name: column.name,
                }
              : false,
          }
          rawColumns.push(rawColumn)
        })
        schema.columns = rawColumns
        return { ...schema }
      },
      canRebuild: true,
    }
  }

  panelBodyCreator = (context: BaseEventContext) => {
    const i18nEnabled = getI18nEnabled()
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
              {
                type: 'ae-switch-more',
                name: 'needConfirm',
                label: tipedLabel(
                  '确认模式',
                  '开启时，新增、编辑需要点击表格右侧的“保存”按钮才能变更组件数据。未开启时，新增、编辑、删除操作直接改变组件数据。',
                ),
                isChecked: (v: any) => v.value !== false,
                falseValue: false,
                mode: 'normal',
                formType: 'extend',
                hiddenOnDefault: true,
                form: {
                  body: [
                    {
                      type: i18nEnabled ? 'input-text-i18n' : 'input-text',
                      name: 'confirmBtnLabel',
                      label: '确认按钮名称',
                      placeholder: '确认按钮名称',
                    },
                    getSchemaTpl('icon', {
                      name: 'confirmBtnIcon',
                      label: '确认按钮图标',
                      pipeIn: defaultValue('check'),
                    }),
                    {
                      type: i18nEnabled ? 'input-text-i18n' : 'input-text',
                      name: 'cancelBtnLabel',
                      label: '取消按钮名称',
                      placeholder: '取消按钮名称',
                    },
                    getSchemaTpl('icon', {
                      name: 'cancelBtnIcon',
                      label: '取消按钮图标',
                      pipeIn: defaultValue('close'),
                    }),
                  ],
                },
                pipeIn: defaultValue(true),
              },
              {
                type: 'ae-switch-more',
                name: 'addable',
                label: '可新增',
                mode: 'normal',
                formType: 'extend',
                hiddenOnDefault: true,
                form: {
                  body: [
                    getSchemaTpl('apiControl', {
                      label: '新增接口',
                      name: 'addApi',
                      mode: 'row',
                    }),
                    getSchemaTpl('switch', {
                      name: 'showTableAddBtn',
                      label: '操作栏新增按钮',
                      value: true,
                    }),
                    {
                      label: '按钮名称',
                      name: 'addBtnLabel',
                      visibleOn: 'this.showTableAddBtn',
                      type: i18nEnabled ? 'input-text-i18n' : 'input-text',
                    },
                    getSchemaTpl('icon', {
                      name: 'addBtnIcon',
                      label: '按钮图标',
                      visibleOn: 'this.showTableAddBtn',
                      pipeIn: defaultValue('plus'),
                    }),
                  ],
                },
              },
              {
                type: 'ae-switch-more',
                name: 'copyable',
                label: '可复制',
                mode: 'normal',
                formType: 'extend',
                hiddenOnDefault: true,
                form: {
                  body: [
                    {
                      label: '按钮名称',
                      name: 'copyBtnLabel',
                      type: i18nEnabled ? 'input-text-i18n' : 'input-text',
                    },
                    getSchemaTpl('icon', {
                      name: 'copyBtnIcon',
                      label: '按钮图标',
                      pipeIn: defaultValue('copy'),
                    }),
                  ],
                },
              },
              {
                type: 'ae-switch-more',
                name: 'editable',
                label: '可编辑',
                mode: 'normal',
                formType: 'extend',
                hiddenOnDefault: true,
                form: {
                  body: [
                    getSchemaTpl('apiControl', {
                      label: '编辑接口',
                      name: 'updateApi',
                      mode: 'row',
                    }),
                    {
                      label: '按钮名称',
                      name: 'editBtnLabel',
                      type: i18nEnabled ? 'input-text-i18n' : 'input-text',
                    },
                    getSchemaTpl('icon', {
                      name: 'editBtnIcon',
                      label: '按钮图标',
                      pipeIn: defaultValue('pencil'),
                    }),
                  ],
                },
              },
              {
                type: 'ae-switch-more',
                name: 'removable',
                label: '可删除',
                mode: 'normal',
                formType: 'extend',
                hiddenOnDefault: true,
                form: {
                  body: [
                    getSchemaTpl('deleteApi'),
                    {
                      label: '按钮名称',
                      name: 'deleteBtnLabel',
                      type: i18nEnabled ? 'input-text-i18n' : 'input-text',
                    },
                    getSchemaTpl('icon', {
                      name: 'deleteBtnIcon',
                      label: '按钮图标',
                      pipeIn: defaultValue('minus'),
                    }),
                  ],
                },
              },
              getSchemaTpl('switch', {
                name: 'showIndex',
                label: '显示序号',
                pipeIn: defaultValue(false),
              }),
              {
                type: 'input-number',
                name: 'perPage',
                label: '每页展示条数',
                placeholder: '如果为空则不进行分页',
              },
              {
                type: 'input-number',
                name: 'minLength',
                label: '最小行数',
                pipeIn: defaultValue(0),
              },
              {
                type: 'input-number',
                name: 'maxLength',
                label: '最大行数',
              },
              getSchemaTpl('description'),
              getSchemaTpl('placeholder'),
              getSchemaTpl('labelRemark'),
            ],
          },
          {
            title: '高级',
            body: [
              getSchemaTpl('switch', {
                name: 'strictMode',
                label: tipedLabel(
                  '严格模式',
                  '为了性能，默认其他表单项项值变化不会让当前表格更新，有时候为了同步获取其他表单项字段，需要开启这个。',
                ),
                pipeIn: defaultValue(false),
              }),
              getSchemaTpl('switch', {
                name: 'canAccessSuperData',
                label: tipedLabel(
                  '获取父级数据',
                  '是否可以访问父级数据，也就是表单中的同级数据，通常需要跟 “严格模式”属性搭配使用。',
                ),
                pipeIn: defaultValue(false),
              }),
            ],
          },
          getSchemaTpl('status', { isFormItem: true }),
          getSchemaTpl('agValidation', {
            tag: ValidatorTag.MultiSelect,
          }),
        ]),
      },
      {
        title: '外观',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '基本',
            body: [
              {
                name: 'columnsTogglable',
                label: tipedLabel(
                  '列显示开关',
                  '是否展示表格列的显隐控件，“自动”即列数量大于5时自动开启',
                ),
                type: 'button-group-select',
                pipeIn: defaultValue('auto'),
                size: 'sm',
                labelAlign: 'left',
                options: [
                  {
                    label: '自动',
                    value: 'auto',
                  },

                  {
                    label: '开启',
                    value: true,
                  },

                  {
                    label: '关闭',
                    value: false,
                  },
                ],
              },
              getSchemaTpl('switch', {
                name: 'affixHeader',
                label: '是否固定表头',
                pipeIn: defaultValue(false),
              }),
              getSchemaTpl('switch', {
                name: 'showFooterAddBtn',
                label: '展示底部新增按钮',
                pipeIn: defaultValue(true),
              }),
              getSchemaTpl('switch', {
                name: 'showTableAddBtn',
                label: '展示操作列新增按钮',
                pipeIn: defaultValue(true),
              }),
            ],
          },
          getSchemaTpl('style:formItem', { renderer: context.info.renderer }),
          getSchemaTpl('style:classNames', {
            schema: [
              getSchemaTpl('className', {
                name: 'rowClassName',
                label: '行样式',
              }),
              getSchemaTpl('className', {
                name: 'toolbarClassName',
                label: '工具栏',
              }),
            ],
          }),
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
