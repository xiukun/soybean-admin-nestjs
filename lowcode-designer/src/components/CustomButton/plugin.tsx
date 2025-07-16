import { BaseEventContext, ButtonPlugin, defaultValue, getSchemaTpl, tipedLabel } from 'amis-editor'
import { getEventControlConfig, getOldActionSchema } from 'amis-editor'

import { buttonStateFunc } from 'amis-editor/lib/renderer/style-control/helper'
export class ButtonPluginRefactor extends ButtonPlugin {
  panelBodyCreator = (context: BaseEventContext) => {
    const isInDialog = /(?:\/|^)dialog\/.+$/.test(context.path)
    const isInDrawer = /(?:\/|^)drawer\/.+$/.test(context.path)

    const isInDropdown = /^button-group\/.+$/.test(context.path)

    return getSchemaTpl('tabs', [
      {
        title: '属性',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '基本',
            body: [
              getSchemaTpl('agLocaleEn', { context }),
              getSchemaTpl('layout:originPosition', { value: 'left-top' }),
              getSchemaTpl('label', {
                label: '名称',
              }),
              {
                label: '类型',
                type: 'button-group-select',
                name: 'type',
                size: 'sm',
                visibleOn: 'type === "submit" || type === "reset" ',
                options: [
                  {
                    label: '按钮',
                    value: 'button',
                  },

                  {
                    label: '提交',
                    value: 'submit',
                  },

                  {
                    label: '重置',
                    value: 'reset',
                  },
                ],
              },

              getSchemaTpl('switch', {
                name: 'close',
                label: '是否关闭',
                clearValueOnHidden: true,
                labelRemark: `指定此次操作完后关闭当前 ${isInDialog ? 'dialog' : 'drawer'}`,
                hidden: !isInDialog && !isInDrawer,
                pipeIn: defaultValue(false),
              }),

              {
                type: 'ae-switch-more',
                mode: 'normal',
                formType: 'extend',
                label: tipedLabel(
                  '二次确认',
                  '点击后先询问用户，由手动确认后再执行动作，避免误触。可从数据域变量中取值。',
                ),
                form: {
                  body: [
                    getSchemaTpl('textareaFormulaControl', {
                      label: '确认内容',
                      mode: 'normal',
                      name: 'confirmText',
                    }),
                  ],
                },
              },

              {
                type: 'ae-switch-more',
                formType: 'extend',
                mode: 'normal',
                label: '气泡提示',
                hidden: isInDropdown,
                form: {
                  body: [
                    getSchemaTpl('textareaFormulaControl', {
                      name: 'tooltip',
                      mode: 'normal',
                      label: tipedLabel(
                        '正常提示',
                        '正常状态下的提示内容，不填则不弹出提示。可从数据域变量中取值。',
                      ),
                    }),
                    getSchemaTpl('textareaFormulaControl', {
                      name: 'disabledTip',
                      mode: 'normal',
                      label: tipedLabel(
                        '禁用提示',
                        '禁用状态下的提示内容，不填则弹出正常提示。可从数据域变量中取值。',
                      ),
                      clearValueOnHidden: true,
                      visibleOn: 'this.tooltipTrigger !== "focus"',
                    }),
                    {
                      type: 'button-group-select',
                      name: 'tooltipTrigger',
                      label: '触发方式',
                      // visibleOn: 'this.tooltip || this.disabledTip',
                      size: 'sm',
                      options: [
                        {
                          label: '鼠标悬浮',
                          value: 'hover',
                        },
                        {
                          label: '聚焦',
                          value: 'focus',
                        },
                      ],
                      pipeIn: defaultValue('hover'),
                    },
                    {
                      type: 'button-group-select',
                      name: 'tooltipPlacement',
                      // visibleOn: 'this.tooltip || this.disabledTip',
                      label: '提示位置',
                      size: 'sm',
                      options: [
                        {
                          label: '上',
                          value: 'top',
                        },
                        {
                          label: '右',
                          value: 'right',
                        },
                        {
                          label: '下',
                          value: 'bottom',
                        },
                        {
                          label: '左',
                          value: 'left',
                        },
                      ],
                      pipeIn: defaultValue('bottom'),
                    },
                  ],
                },
              },

              getSchemaTpl('icon', {
                label: '左侧图标',
              }),

              getSchemaTpl('icon', {
                name: 'rightIcon',
                label: '右侧图标',
              }),
              getSchemaTpl('badge'),
              getSchemaTpl('agBindingPermission', context),
              getSchemaTpl('switch', {
                name: 'disabledOnAction',
                label: '动作完成前禁用',
                value: false
              })
            ],
          },

          getSchemaTpl('agStatus', {
            disabled: true,
          }),
        ]),
      },
      {
        title: '外观',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '基本',
            body: [
              getSchemaTpl('buttonLevel', {
                label: '样式',
                name: 'level',
                hidden: isInDropdown,
              }),

              getSchemaTpl('buttonLevel', {
                label: '高亮样式',
                name: 'activeLevel',
                hidden: isInDropdown,
                visibleOn: 'this.active',
              }),

              getSchemaTpl('switch', {
                name: 'block',
                label: '块状显示',
                hidden: isInDropdown,
              }),

              getSchemaTpl('size', {
                label: '尺寸',
                hidden: isInDropdown,
              }),
            ],
          },
          {
            title: '基本样式',
            body: [
              {
                type: 'select',
                name: '__editorState',
                label: '状态',
                selectFirst: true,
                options: [
                  {
                    label: '常规',
                    value: 'default',
                  },
                  {
                    label: '悬浮',
                    value: 'hover',
                  },
                  {
                    label: '点击',
                    value: 'active',
                  },
                ],
              },
              ...buttonStateFunc("${__editorState == 'default' || !__editorState}", 'default'),
              ...buttonStateFunc("${__editorState == 'hover'}", 'hover'),
              ...buttonStateFunc("${__editorState == 'active'}", 'active'),
            ],
          },
          getSchemaTpl('theme:cssCode', {
            themeClass: [
              {
                value: '',
                state: ['default', 'hover', 'active'],
              },
            ],
          }),
        ]),
      },
      {
        title: '事件',
        className: 'p-none',
        body:
          !!context.schema.actionType || ['submit', 'reset'].includes(context.schema.type)
            ? [
                getSchemaTpl('eventControl', {
                  name: 'onEvent',
                  ...getEventControlConfig(this.manager, context),
                  rawType: 'button',
                }),
                getOldActionSchema(this.manager, context),
              ]
            : [
                getSchemaTpl('eventControl', {
                  name: 'onEvent',
                  ...getEventControlConfig(this.manager, context),
                  rawType: 'button',
                }),
              ],
      },
    ])
  }
}
