import { Schema } from 'amis-core'
import { SelectControlPlugin } from 'amis-editor'

import {
  BaseEventContext,
  EditorManager,
  RendererPluginEvent,
  getSchemaTpl,
  tipedLabel,
} from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
import { OPTION_EDIT_EVENTS_REFACTOR, dictIdProp, getI18N, i18nExtendEnum } from '../common/utils'
import { OPTION_EDIT_EVENTS_OLD, resolveOptionEventDataSchame } from 'amis-editor/lib/util'
import { inputStateTpl } from 'amis-editor/lib/renderer/style-control/helper'

export class SelectControlPluginRefactor extends SelectControlPlugin {
  // static id = 'SelectControlPlugin'

  events: (schema: any) => RendererPluginEvent[] = (schema: any) => {
    return [
      {
        eventName: 'change',
        eventLabel: getI18N(i18nExtendEnum.值变化), //'值变化',
        description: '选中值变化时触发',
        dataSchema: (manager: EditorManager) => {
          const { value, selectedItems, items } = resolveOptionEventDataSchame(manager)

          return [
            {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  title: '数据',
                  properties: {
                    value,
                    selectedItems,
                    items,
                  },
                },
              },
            },
          ]
        },
      },
      {
        eventName: 'focus',
        eventLabel: getI18N(i18nExtendEnum.获取焦点), //'获取焦点',
        description: '输入框获取焦点时触发',
        dataSchema: (manager: EditorManager) => {
          const { value, items } = resolveOptionEventDataSchame(manager)

          return [
            {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  title: '数据',
                  properties: {
                    value,
                    items,
                  },
                },
              },
            },
          ]
        },
      },
      {
        eventName: 'blur',
        eventLabel: getI18N(i18nExtendEnum.失去焦点), //'失去焦点',
        description: '输入框失去焦点时触发',
        dataSchema: (manager: EditorManager) => {
          const { value, items } = resolveOptionEventDataSchame(manager)

          return [
            {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  title: '数据',
                  properties: {
                    value,
                    items,
                  },
                },
              },
            },
          ]
        },
      },
      ...OPTION_EDIT_EVENTS_REFACTOR,
      ...OPTION_EDIT_EVENTS_OLD(schema),
    ]
  }

  panelBodyCreator = (context: BaseEventContext) => {
    return getSchemaTpl('tabs', [
      {
        title: getI18N(i18nExtendEnum.属性), //'属性',
        body: getSchemaTpl('collapseGroup', [
          {
            title: getI18N(i18nExtendEnum.基本),
            body: [
              getSchemaTpl('layout:originPosition', { value: 'left-top' }),
              ...dataModelItemPlugin,
              // getSchemaTpl('formItemName', {
              //   required: true,
              // }),
              getSchemaTpl('label'),
              getSchemaTpl('clearable',{ "value": true }),
              getSchemaTpl('searchable',{ "value": true }),
              getSchemaTpl('multiple', {
                body: [
                  getSchemaTpl('switch', {
                    label: '单行显示选中值',
                    name: 'valuesNoWrap',
                  }),
                  {
                    type: 'input-number',
                    name: 'maxTagCount',
                    label: tipedLabel(
                      '标签展示数',
                      '标签的最大展示数量，超出数量后以收纳浮层的方式展示，默认全展示',
                    ),
                  },
                ],
              }),
              getSchemaTpl('checkAll'),
              getSchemaTpl('valueFormula', {
                rendererSchema: (schema: Schema) => schema,
              }),
              getSchemaTpl('labelRemark'),
              getSchemaTpl('remark'),
              getSchemaTpl('placeholder'),
              getSchemaTpl('description'),
            ],
          },
          {
            title: getI18N(i18nExtendEnum.选项), //'选项',
            body: [
              dictIdProp(context),
              getSchemaTpl('optionControlV2'),
              getSchemaTpl('selectFirst'),
              getSchemaTpl(
                'loadingConfig',
                {
                  visibleOn: 'this.source || !this.options',
                },
                { context },
              ),
              // 模板
              getSchemaTpl('optionsMenuTpl', {
                manager: this.manager,
                onChange: (value: any) => {},
              }),
              /** 新增选项 */
              getSchemaTpl('optionAddControl', {
                manager: this.manager,
              }),
              /** 编辑选项 */
              getSchemaTpl('optionEditControl', {
                manager: this.manager,
              }),
              /** 删除选项 */
              getSchemaTpl('optionDeleteControl'),
            ],
          },
          {
            title: getI18N(i18nExtendEnum.高级), //'高级',
            body: [
              getSchemaTpl('switch', {
                label: tipedLabel(
                  '选项值检查',
                  '开启后，当选项值未匹配到当前options中的选项时，选项文本飘红',
                ),
                name: 'showInvalidMatch',
              }),
              getSchemaTpl('virtualThreshold'),
              getSchemaTpl('virtualItemHeight'),
            ],
          },
          getSchemaTpl('status', { isFormItem: true }),
          getSchemaTpl('agValidation', { tag: ValidatorTag.MultiSelect }),
        ]),
      },
      {
        title: getI18N(i18nExtendEnum.外观), //'外观',
        body: [
          getSchemaTpl('collapseGroup', [
            getSchemaTpl('theme:formItem'),
            getSchemaTpl('theme:form-label'),
            getSchemaTpl('theme:form-description'),
            {
              title: '选择框样式',
              body: [...inputStateTpl('themeCss.selectControlClassName', '--select-base')],
            },
            {
              title: '下拉框样式',
              body: [
                ...inputStateTpl(
                  'themeCss.selectPopoverClassName',
                  '--select-base-${state}-option',
                  {
                    state: [
                      { label: '常规', value: 'default' },
                      { label: '悬浮', value: 'hover' },
                      { label: '选中', value: 'focused' },
                    ],
                  },
                ),
              ],
            },
            getSchemaTpl('theme:cssCode'),
            getSchemaTpl('style:classNames'),
          ]),
        ],
      },
      {
        title: getI18N(i18nExtendEnum.事件), //'事件',
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
