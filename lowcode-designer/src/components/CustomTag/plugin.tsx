import { TagPlugin, getSchemaTpl, undefinedPipeOut } from 'amis-editor'
import { getEventControlConfig } from 'amis-editor'
const presetColors = [
  '#2468f2',
  '#b8babf',
  '#528eff',
  '#30bf13',
  '#f33e3e',
  '#ff9326',
  '#fff',
  '#000',
]
export class TagPluginRefactor extends TagPlugin {
  static id = 'AgTagPlugin'
  // 关联渲染器名字
  rendererName = 'ag-tag'
  $schema = '/schemas/TagSchema.json'
  // 组件名称
  name = 'ag标签'
  isBaseComponent = true
  tags = ['重构组件']

  scaffold: any = {
    type: 'ag-tag',
    label: '普通标签11',
    color: 'processing',
  }

  previewSchema = {
    ...this.scaffold,
  }

  panelBodyCreator = (context: any) => {
    return getSchemaTpl('tabs', [
      {
        title: '属性',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '基本',
            body: [
              getSchemaTpl('valueFormula', {
                name: 'label',
                label: '标签内容',
                rendererSchema: {
                  type: 'input-text',
                },
              }),
              {
                type: 'button-group-select',
                label: '模式',
                name: 'displayMode',
                value: 'normal',
                options: [
                  {
                    label: '普通',
                    value: 'normal',
                  },
                  {
                    label: '圆角',
                    value: 'rounded',
                  },
                  {
                    label: '状态',
                    value: 'status',
                  },
                ],
                onChange: (value: any, origin: any, item: any, form: any) => {
                  if (value !== 'status') {
                    form.setValues({
                      icon: undefined,
                    })
                  }
                },
              },
              getSchemaTpl('icon', {
                visibleOn: 'this.displayMode === "status"',
                label: '前置图标',
              }),
              getSchemaTpl('switch', {
                label: '可关闭',
                name: 'closable',
              }),
            ],
          },
          getSchemaTpl('status'),
        ]),
      },
      {
        title: '外观',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '颜色',
            body: [
              {
                type: 'input-color',
                label: '主题',
                name: 'color',
                presetColors,
                pipeOut: undefinedPipeOut,
              },
              {
                type: 'input-color',
                label: '背景色',
                name: 'style.backgroundColor',
                presetColors,
                pipeOut: undefinedPipeOut,
              },
              {
                type: 'input-color',
                label: '边框',
                name: 'style.borderColor',
                presetColors,
                pipeOut: undefinedPipeOut,
              },
              {
                type: 'input-color',
                label: '文字',
                name: 'style.color',
                presetColors,
                pipeOut: undefinedPipeOut,
              },
            ],
          },
          getSchemaTpl('style:classNames', {
            isFormItem: false,
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
