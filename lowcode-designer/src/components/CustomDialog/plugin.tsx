import {
  BaseEventContext,
  defaultValue,
  DialogPlugin,
  getI18nEnabled,
  getSchemaTpl,
} from 'amis-editor'
import { getEventControlConfig } from 'amis-editor'

export class DialogPluginRefactor extends DialogPlugin {
  panelBodyCreator = (context: BaseEventContext) => {
    const i18nEnabled = getI18nEnabled()
    // 确认对话框的配置面板
    if (context.schema?.dialogType === 'confirm') {
      return getSchemaTpl('tabs', [
        {
          title: '属性',
          body: getSchemaTpl('collapseGroup', [
            {
              title: '基本',
              body: [
                {
                  type: 'input-text',
                  label: '组件名称',
                  name: 'editorSetting.displayName',
                },

                {
                  type: 'radios',
                  label: '弹出方式',
                  name: 'actionType',
                  pipeIn: (value: any, store: any, data: any) => value ?? data.type,
                  inline: false,
                  options: [
                    {
                      label: '弹窗',
                      value: 'dialog',
                    },
                    {
                      label: '抽屉',
                      value: 'drawer',
                    },
                    {
                      label: '确认对话框',
                      value: 'confirmDialog',
                    },
                  ],
                },

                {
                  label: '标题',
                  type: 'input-text',
                  name: 'title',
                },
                {
                  label: '确认按钮文案',
                  type: 'input-text',
                  name: 'confirmText',
                },
                {
                  label: '取消按钮文案',
                  type: 'input-text',
                  name: 'cancelText',
                },
                getSchemaTpl('switch', {
                  label: '可按 Esc 关闭',
                  name: 'closeOnEsc',
                  value: false,
                }),
              ],
            },
          ]),
        },
        {
          title: '外观',
          body: getSchemaTpl('collapseGroup', [
            {
              title: '基本',
              body: [
                {
                  label: '尺寸',
                  type: 'button-group-select',
                  name: 'size',
                  size: 'sm',
                  options: [
                    {
                      label: '标准',
                      value: '',
                    },
                    {
                      label: '小',
                      value: 'sm',
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
                      label: '超大',
                      value: 'xl',
                    },
                  ],
                  pipeIn: defaultValue(''),
                  pipeOut: (value: string) => (value ? value : undefined),
                },
                getSchemaTpl('buttonLevel', {
                  label: '确认按钮样式',
                  name: 'confirmBtnLevel',
                }),
                getSchemaTpl('buttonLevel', {
                  label: '取消按钮样式',
                  name: 'cancelBtnLevel',
                }),
              ],
            },
          ]),
        },
      ])
    }
    return getSchemaTpl('tabs', [
      {
        title: '属性',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '基本',
            body: [
              {
                type: 'input-text',
                label: '组件名称',
                name: 'editorSetting.displayName',
              },

              {
                type: 'radios',
                label: '弹出方式',
                name: 'actionType',
                pipeIn: (value: any, store: any, data: any) => value ?? data.type,
                inline: false,
                options: [
                  {
                    label: '弹窗',
                    value: 'dialog',
                  },
                  {
                    label: '抽屉',
                    value: 'drawer',
                  },
                  {
                    label: '确认对话框',
                    value: 'confirmDialog',
                  },
                ],
              },

              getSchemaTpl('layout:originPosition', { value: 'left-top' }),

              {
                label: '标题',
                type: i18nEnabled ? 'input-text-i18n' : 'input-text',
                name: 'title',
              },

              getSchemaTpl('switch', {
                label: '展示关闭按钮',
                name: 'showCloseButton',
                value: true,
              }),
              getSchemaTpl('switch', {
                label: '点击遮罩关闭',
                name: 'closeOnOutside',
                value: false,
              }),
              getSchemaTpl('switch', {
                label: '可按 Esc 关闭',
                name: 'closeOnEsc',
                value: false,
              }),
              {
                type: 'ae-StatusControl',
                label: '隐藏按钮区',
                mode: 'normal',
                name: 'hideActions',
                expressionName: 'hideActionsOn',
              },
              getSchemaTpl('switch', {
                label: '左下角展示报错消息',
                name: 'showErrorMsg',
                value: true,
              }),
              getSchemaTpl('switch', {
                label: '左下角展示loading动画',
                name: 'showLoading',
                value: true,
              }),
              getSchemaTpl('switch', {
                label: '是否可拖拽',
                name: 'draggable',
                value: true,
              }),
              getSchemaTpl('dataMap'),
            ],
          },
        ]),
      },
      {
        title: '外观',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '样式',
            body: [
              {
                label: '尺寸',
                type: 'button-group-select',
                name: 'size',
                size: 'xs',
                options: [
                  {
                    label: '标准',
                    value: '',
                  },
                  {
                    label: '小',
                    value: 'sm',
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
                    label: '超大',
                    value: 'xl',
                  },
                  {
                    label: '自定义',
                    value: 'custom',
                  },
                ],
                pipeIn: defaultValue(''),
                pipeOut: (value: string) => (value ? value : undefined),
                onChange: (value: string, oldValue: string, model: any, form: any) => {
                  if (value !== 'custom') {
                    form.setValueByName('style', undefined)
                  }
                },
              },
              {
                type: 'input-number',
                label: '宽度',
                name: 'style.width',
                disabled: true,
                clearable: true,
                unitOptions: ['px', '%', 'em', 'vh', 'vw'],
                visibleOn: 'this.size !== "custom"',
                pipeIn: (value: any, form: any) => {
                  if (!form.data.size) {
                    return '500px'
                  } else if (form.data.size === 'sm') {
                    return '350px'
                  } else if (form.data.size === 'md') {
                    return '800px'
                  } else if (form.data.size === 'lg') {
                    return '1100px'
                  } else if (form.data.size === 'xl') {
                    return '90%'
                  }
                  return ''
                },
              },
              {
                type: 'input-number',
                label: '宽度',
                name: 'style.width',
                clearable: true,
                unitOptions: ['px', '%', 'em', 'vh', 'vw'],
                visibleOn: 'this.size === "custom"',
                pipeOut: (value: string) => {
                  const curValue = parseInt(value)
                  if (value === 'auto' || curValue || curValue === 0) {
                    return value
                  } else {
                    return undefined
                  }
                },
              },
              {
                type: 'input-number',
                label: '高度',
                name: 'style.height',
                disabled: true,
                visibleOn: 'this.size !== "custom"',
                clearable: true,
                unitOptions: ['px', '%', 'em', 'vh', 'vw'],
              },
              {
                type: 'input-number',
                label: '高度',
                name: 'style.height',
                visibleOn: 'this.size === "custom"',
                clearable: true,
                unitOptions: ['px', '%', 'em', 'vh', 'vw'],
                pipeOut: (value: string) => {
                  const curValue = parseInt(value)
                  if (value === 'auto' || curValue || curValue === 0) {
                    return value
                  } else {
                    return undefined
                  }
                },
              },
              getSchemaTpl('theme:border', {
                name: 'themeCss.dialogClassName.border',
              }),
              getSchemaTpl('theme:radius', {
                name: 'themeCss.dialogClassName.radius',
              }),
              getSchemaTpl('theme:shadow', {
                name: 'themeCss.dialogClassName.box-shadow',
              }),
              getSchemaTpl('theme:colorPicker', {
                label: '背景',
                name: 'themeCss.dialogClassName.background',
                labelMode: 'input',
              }),
              getSchemaTpl('theme:colorPicker', {
                label: '遮罩颜色',
                name: 'themeCss.dialogMaskClassName.background',
                labelMode: 'input',
              }),
            ],
          },
          {
            title: '标题区',
            body: [
              getSchemaTpl('theme:font', {
                label: '文字',
                name: 'themeCss.dialogTitleClassName.font',
                hasVertical: false,
              }),
              getSchemaTpl('theme:paddingAndMargin', {
                name: 'themeCss.dialogHeaderClassName.padding-and-margin',
                label: '间距',
              }),
              getSchemaTpl('theme:colorPicker', {
                label: '背景',
                name: 'themeCss.dialogHeaderClassName.background',
                labelMode: 'input',
              }),
            ],
          },
          {
            title: '内容区',
            body: [
              getSchemaTpl('theme:border', {
                name: 'themeCss.dialogBodyClassName.border',
              }),
              getSchemaTpl('theme:radius', {
                name: 'themeCss.dialogBodyClassName.radius',
              }),
              getSchemaTpl('theme:paddingAndMargin', {
                name: 'themeCss.dialogBodyClassName.padding-and-margin',
                label: '间距',
              }),
              getSchemaTpl('theme:colorPicker', {
                label: '背景',
                name: 'themeCss.dialogBodyClassName.background',
                labelMode: 'input',
              }),
            ],
          },
          {
            title: '底部区',
            body: [
              getSchemaTpl('theme:paddingAndMargin', {
                name: 'themeCss.dialogFooterClassName.padding-and-margin',
                label: '间距',
              }),
              getSchemaTpl('theme:colorPicker', {
                label: '背景',
                name: 'themeCss.dialogFooterClassName.background',
                labelMode: 'input',
              }),
            ],
          },
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
