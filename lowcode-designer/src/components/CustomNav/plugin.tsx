import { NavPlugin } from 'amis-editor/lib/plugin/Nav'
import { BaseEventContext, diff, getSchemaTpl, tipedLabel } from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { TooltipWrapper } from 'amis-ui'
import { schemaArrayFormat, schemaToArray } from 'amis-editor/lib/util'

export class NavPluginRefactor extends NavPlugin {
  editDetail(id: string) {
    const manager = this.manager
    const store = manager.store
    const node = store.getNodeById(id)
    const value = store.getValueOf(id)
    const defaultItemSchema = {
      type: 'dropdown-button',
      level: 'link',
      icon: 'fa fa-ellipsis-h',
      hideCaret: true,
      buttons: [
        {
          type: 'button',
          label: '编辑',
        },
        {
          type: 'button',
          label: '删除',
        },
      ],
    }

    node &&
      value &&
      this.manager.openSubEditor({
        title: '配置显示模板',
        value: schemaToArray(value.itemActions ?? defaultItemSchema),
        slot: {
          type: 'container',
          body: '$$',
        },
        onChange: (newValue: any) => {
          newValue = { ...value, itemActions: schemaArrayFormat(newValue) }
          manager.panelChangeValue(newValue, diff(value, newValue))
        },
        data: {},
      })
  }
  panelBodyCreator = (context: BaseEventContext) => {
    return getSchemaTpl('tabs', [
      {
        title: '属性',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '基本',
            body: [
              getSchemaTpl('layout:originPosition', { value: 'left-top' }),
              getSchemaTpl('switch', {
                name: 'stacked',
                label: '横向摆放',
                pipeIn: (value: boolean) => !value,
                pipeOut: (value: boolean) => !value,
              }),
              getSchemaTpl('switch', {
                name: 'mode',
                label: [
                  {
                    children: (
                      <TooltipWrapper
                        tooltipClassName="ae-nav-tooltip-wrapper"
                        trigger="hover"
                        rootClose={true}
                        placement="top"
                        tooltipTheme="dark"
                        style={{
                          fontSize: '12px',
                        }}
                        tooltip={{
                          children: () => (
                            <div>
                              <span>
                                默认为内联模式，开启后子菜单不在父级下方展开，会悬浮在菜单的侧边展示
                              </span>
                              <div className="nav-mode-gif" />
                            </div>
                          ),
                        }}
                      >
                        <span>子菜单悬浮展示</span>
                      </TooltipWrapper>
                    ),
                  },
                ],
                visibleOn: 'this.stacked',
                pipeIn: (value: any) => value === 'float',
                pipeOut: (value: boolean) => (value ? 'float' : 'inline'),
              }),
              getSchemaTpl('switch', {
                label: tipedLabel('手风琴模式', '点击菜单，只展开当前父级菜单，收起其他展开的菜单'),
                visibleOn: 'this.stacked && this.mode !== "float"',
                name: 'accordion',
              }),
              {
                type: 'input-number',
                name: 'defaultOpenLevel',
                label: tipedLabel('默认展开层级', '默认展开全部菜单的对应层级'),
                visibleOn: 'this.stacked && this.mode !== "float"',
                mode: 'horizontal',
                labelAlign: 'left',
              },
              {
                type: 'input-number',
                name: 'level',
                label: tipedLabel(
                  '最大显示层级',
                  '配置后将隐藏超过该层级的菜单项，如最大显示两级，菜单项的三级及以下将被隐藏',
                ),
                mode: 'horizontal',
                labelAlign: 'left',
              },
            ],
          },
          {
            title: '菜单项',
            body: [
              getSchemaTpl('navControl'),
              // 角标
              getSchemaTpl('nav-badge', {
                visibleOn: 'this.links',
              }),
              // 默认选中菜单
              // getSchemaTpl('nav-default-active', {
              //   visibleOn: 'this.links'
              // }),
              {
                type: 'ae-switch-more',
                mode: 'normal',
                label: '显示下拉模板',
                bulk: false,
                name: 'itemActions',
                formType: 'extend',
                form: {
                  body: [
                    {
                      type: 'button',
                      level: 'primary',
                      size: 'sm',
                      block: true,
                      onClick: this.editDetail.bind(this, context.id),
                      label: '配置显示模板',
                    },
                  ],
                },
                pipeIn: (value: any) => {
                  return value !== undefined
                },
                pipeOut: (value: any, _originValue: any, data: any) => {
                  if (value === true) {
                    return {
                      type: 'dropdown-button',
                      level: 'link',
                      icon: 'fa fa-ellipsis-h',
                      hideCaret: true,
                      buttons: [
                        {
                          type: 'button',
                          label: '编辑',
                        },
                        {
                          type: 'button',
                          label: '删除',
                        },
                      ],
                    }
                  }
                  return value ? value : undefined
                },
              },
            ],
          },

          // {
          //   title: '高级',
          //   body: [
          //     getSchemaTpl('switch', {
          //       name: 'draggable',
          //       label: '拖拽排序',
          //       visibleOn: 'this.source && this.source !== "${amisStore.app.portalNav}"',
          //     }),
          //     getSchemaTpl('switch', {
          //       name: 'dragOnSameLevel',
          //       label: '仅同级拖拽',
          //       visibleOn: 'this.draggable',
          //     }),
          //     getSchemaTpl('apiControl', {
          //       name: 'saveOrderApi',
          //       label: '保存排序接口',
          //       mode: 'normal',
          //       visibleOn: 'this.source && this.source !== "${amisStore.app.portalNav}"',
          //     }),
          //   ],
          // },
          {
            title: '状态',
            body: [getSchemaTpl('visible'), getSchemaTpl('hidden')],
          },
        ]),
      },
      {
        title: '外观',
        body: getSchemaTpl('collapseGroup', [
          ...getSchemaTpl('style:common', ['layout']),
          {
            title: 'CSS类名',
            body: [
              getSchemaTpl('className', {
                label: '外层',
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
