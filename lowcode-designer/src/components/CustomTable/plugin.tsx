import { TablePlugin } from 'amis-editor'
import {
  BaseEventContext,
  defaultValue,
  getSchemaTpl,
  tipedLabel,
  getI18nEnabled,
  RendererInfoResolveEventContext,
  BasicRendererInfo,
  PluginInterface,
} from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { Button } from 'amis-ui'
import { cloneDeep } from 'lodash'
export class TablePluginRefactor extends TablePlugin {
  // static id = 'TablePlugin'
  // // 关联渲染器名字
  // rendererName = 'table'

  renderColumnsControl = (context: any) => {
    const builder = this.dsManager.getBuilderBySchema(context.node.schema)

    return {
      title: '列设置',
      order: 5,
      body: [
        {
          type: 'ag-ae-crud-column-control',
          name: 'columns',
          nodeId: context.id,
          builder,
        },
      ],
    }
  }

  panelBodyCreator = (context: BaseEventContext) => {
    const isCRUDBody = context.schema.type === 'crud' || context.schema.type === 'ag-crud'
    const i18nEnabled = getI18nEnabled()
    return getSchemaTpl('tabs', [
      {
        title: '属性',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '基本',
            body: [
              isCRUDBody
                ? getSchemaTpl('switch', {
                    name: 'enableDynimicColumn',
                    label: '是否开启动态列',
                    clearValueOnHidden: true,
                    labelRemark: `指定表格是否开启动态列功能，动态列功能会根据数据源自动生成显示的表格列，通过列选择器进行设置显示/隐藏及排序`,

                    pipeIn: defaultValue(false),
                    pipeOut: (value: any) => {
                      const rest = cloneDeep(context.node.schema) as any
                      console.log('rest', rest)
                      // 如果启用了动态列，api 请求和响应需要带上动态列参数
                      if (value && rest.dynimicColumnKey) {
                        // 如果 api 请求没有处理动态列，需要手动添加
                        if (rest.api.requestAdaptor?.length < 20) {
                          rest.api.requestAdaptor = `return {\n  ...api,\n  data: {\n    ...api.data,\n    dynimicColumnKey: "${rest.dynimicColumnKey}" // 表格动态列唯一KEY\n  }\n}`
                        }
                        // 如果 api 响应没有处理动态列，需要手动添加
                        if (rest.api.adaptor?.length < 20) {
                          rest.api.adaptor = `if (window.__JSEditStatus && payload.data.columns) {\n  delete payload.data.columns;\n}\npayload.data.dynimicColumnKey = "${rest.dynimicColumnKey}"\nreturn payload;`
                        }
                        const customColumnToggled = {
                          ignoreError: false,
                          script:
                            '// 动态列保存\nwindow.__JSFunc.dynimicColumnSave(context, event)',
                          actionType: 'custom',
                          args: {},
                        }
                        // 动态列保存事件，需要手动添加
                        if (rest.onEvent && rest.onEvent.columnToggled) {
                          if (rest.onEvent.columnToggled.actions?.length > 0) {
                            if (
                              !rest.onEvent.columnToggled.actions.find((item: any) =>
                                item?.script.includes('window.__JSFunc.dynimicColumnSave'),
                              )
                            ) {
                              rest.onEvent.columnToggled.actions.unshfit(customColumnToggled)
                            }
                          } else {
                            rest.onEvent.columnToggled.actions = [customColumnToggled]
                          }
                        } else if (rest.onEvent) {
                          rest.onEvent.columnToggled = {
                            weight: 0,
                            actions: [customColumnToggled],
                          }
                        } else if (!rest.onEvent) {
                          rest.onEvent = {
                            columnToggled: {
                              weight: 0,
                              actions: [customColumnToggled],
                            },
                          }
                        }
                      }

                      context.node.updateSchema({
                        ...rest,
                      })
                      return value
                    },
                  })
                : null,
              isCRUDBody
                ? {
                    name: 'dynimicColumnKey',
                    type: i18nEnabled ? 'input-text-i18n' : 'input-text',
                    label: '动态列UUID',
                    readOnly: true,
                  }
                : null,
              {
                name: 'title',
                type: i18nEnabled ? 'input-text-i18n' : 'input-text',
                label: '标题',
              },

              isCRUDBody
                ? null
                : getSchemaTpl('sourceBindControl', {
                    label: '数据源',
                  }),

              {
                name: 'combineNum',
                label: tipedLabel(
                  '自动合并单元格',
                  '设置从左到右多少列内启用自动合并单元格，根据字段值是否相同来决定是否合并。',
                ),
                type: 'input-number',
                labelAlign: 'left',
                horizontal: {
                  left: 5,
                  right: 7,
                },
                placeholder: '设置列数',
              },
              {
                name: 'combineFromIndex',
                label: tipedLabel(
                  '跳过列数',
                  '不想从第一列开始合并单元格，可以配置 combineFromIndex，如果配置为 1，则会跳过第一列的合并。如果配置为 2，则会跳过第一列和第二列的合并，从第三行开始向右合并 combineNum 列。',
                ),
                type: 'input-number',
                labelAlign: 'left',
                horizontal: {
                  left: 5,
                  right: 7,
                },
                placeholder: '跳过列数',
              },
              {
                type: 'ae-switch-more',
                mode: 'normal',
                formType: 'extend',
                label: '头部',
                name: 'showHeader',
                pipeIn: (value: any) => value ?? true,
                falseValue: false, // 这个属性模式按true处理，关闭不能删除，除非去掉配置的header
                form: {
                  body: [
                    {
                      children: (
                        <Button
                          level="primary"
                          size="sm"
                          block
                          onClick={this.editHeaderDetail.bind(this, context.id)}
                        >
                          配置头部
                        </Button>
                      ),
                    },
                  ],
                },
              },
              {
                type: 'ae-switch-more',
                mode: 'normal',
                formType: 'extend',
                label: '底部',
                name: 'showFooter',
                pipeIn: (value: any) => value ?? true,
                falseValue: false, // 这个属性模式按true处理，关闭不能删除，除非去掉配置的footer
                form: {
                  body: [
                    {
                      children: (
                        <Button
                          level="primary"
                          size="sm"
                          block
                          onClick={this.editFooterDetail.bind(this, context.id)}
                        >
                          配置底部
                        </Button>
                      ),
                    },
                  ],
                },
              },
              getSchemaTpl('switch', {
                name: 'checkOnItemClick',
                label: '开启行选中效果',
                clearValueOnHidden: true,
                labelRemark: `指定表格开启行选中效果，必须配合批量操作使用才有效果`,

                pipeIn: defaultValue(false),
              }),
            ],
          },
          getSchemaTpl('status'),
          this.renderColumnsControl(context),
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
                name: 'showIndex',
                label: '是否显示序号',
                pipeIn: defaultValue(false)
              }),

              getSchemaTpl('switch', {
                name: 'affixHeader',
                label: '是否固定表头',
                pipeIn: defaultValue(true),
              }),

              getSchemaTpl('switch', {
                name: 'footable',
                label: tipedLabel(
                  '是否开启单条底部展示',
                  '如果列太多显示会很臃肿，可以考虑把部分列放在当前行的底部展示',
                ),
                pipeIn: (value: any) => !!value,
              }),

              {
                name: 'footable.expand',
                type: 'button-group-select',
                size: 'sm',
                visibleOn: 'this.footable',
                label: '底部默认展开',
                pipeIn: defaultValue('none'),
                options: [
                  {
                    label: '第一条',
                    value: 'first',
                  },

                  {
                    label: '所有',
                    value: 'all',
                  },

                  {
                    label: '不展开',
                    value: 'none',
                  },
                ],
              },

              {
                name: 'placeholder',
                pipeIn: defaultValue('暂无数据'),
                type: 'input-text',
                label: '无数据提示',
              },
              {
                name: 'rowClassNameExpr',
                type: 'input-text',
                label: '行高亮规则',
                placeholder: `支持模板语法，如 <%= this.id % 2 ? 'bg-success' : '' %>`,
              },
            ],
          },
          {
            title: 'CSS类名',
            body: [
              getSchemaTpl('className', {
                label: '外层',
              }),

              getSchemaTpl('className', {
                name: 'tableClassName',
                label: '表格',
              }),

              getSchemaTpl('className', {
                name: 'headerClassName',
                label: '顶部外层',
              }),

              getSchemaTpl('className', {
                name: 'footerClassName',
                label: '底部外层',
              }),

              getSchemaTpl('className', {
                name: 'toolbarClassName',
                label: '工具栏',
              }),
            ],
          },
        ]),
      },
      isCRUDBody
        ? null
        : {
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

  // 为了能够自动注入数据。
  getRendererInfo(
    context: RendererInfoResolveEventContext
  ): BasicRendererInfo | void {
    const plugin: PluginInterface = this;
    const {schema, renderer} = context;
    if (
      !schema.$$id &&
      (schema.$$editor?.renderer.name === 'crud' ||
        schema.$$editor?.renderer.name === 'ag-crud') &&
      renderer.name === 'table'
    ) {
      return {
        ...({id: schema.$$editor.id} as any),
        name: plugin.name!,
        regions: plugin.regions,
        patchContainers: plugin.patchContainers,
        vRendererConfig: plugin.vRendererConfig,
        wrapperProps: plugin.wrapperProps,
        wrapperResolve: plugin.wrapperResolve,
        filterProps: plugin.filterProps,
        $schema: plugin.$schema,
        renderRenderer: plugin.renderRenderer
      };
    }
    return super.getRendererInfo(context);
  } 
}
