import { TableCell2Plugin, remarkTpl } from 'amis-editor'
import { BaseEventContext, getSchemaTpl, tipedLabel } from 'amis-editor-core'
import { flattenDeep } from 'lodash'
export class TableCell2PluginRefactor extends TableCell2Plugin {
  panelBodyCreator = (context: BaseEventContext) => {
    const manager = this.manager
    const dc = this.dynamicControls
    this._isOpColumn = context?.schema?.type === 'operation'

    return getSchemaTpl('tabs', [
      {
        title: '属性',
        body: getSchemaTpl(
          'collapseGroup',
          [
            {
              title: '数据源',
              hidden: this._isOpColumn,
              body: flattenDeep([
                /** 字段配置 */
                dc?.name?.(context),
                /** 字段配置，兼容key */
                dc?.key?.(context),
                {
                  name: 'title',
                  label: '列标题',
                  type: 'input-text'
                },
                remarkTpl({
                  name: 'remark',
                  label: '标题提示',
                  labelRemark: '在标题旁展示提示'
                }),
                {
                  name: 'placeholder',
                  type: 'input-text',
                  label: tipedLabel('占位提示', '当没有值时用这个来替代展示。'),
                  value: '-'
                }
              ]).filter(Boolean)
            },
            dc?.relationBuildSetting?.(context),
            /** 操作列按钮配置 */
            {
              title: '操作按钮',
              hidden: !this._isOpColumn,
              body: [
                {
                  type: 'ae-feature-control',
                  strictMode: false, // 注意需要添加这个才能及时获取表单data变更
                  label: false,
                  manager,
                  addable: true,
                  sortable: true,
                  removeable: true,
                  features: () => {
                    const node = manager.store.getNodeById(context.id);

                    return (node?.schema?.buttons ?? []).map(
                      (item: any, index: number) => ({
                        label: item.label,
                        value: item.$$id || '',
                        remove: (schema: any) => {
                          if (schema?.buttons?.length) {
                            schema.buttons.splice(index, 1);
                          }
                        }
                      })
                    );
                  },
                  goFeatureComp: (feat: any) => feat.value,
                  onSort: (schema: any, e: any) => {
                    if (schema?.buttons?.length > 1) {
                      schema.buttons[e.oldIndex] = schema.buttons.splice(
                        e.newIndex,
                        1,
                        schema.buttons[e.oldIndex]
                      )[0];
                    }
                  },
                  customAction: (props: any) => {
                    const {onBulkChange, schema} = props;

                    return {
                      type: 'button',
                      label: '新增按钮',
                      level: 'enhance',
                      className: 'ae-FeatureControl-action',
                      onClick: () => {
                        schema.buttons.push({
                          label: '新增按钮',
                          level: 'link'
                        });
                        onBulkChange(schema);
                      }
                    };
                  }
                }
              ]
            },
            {
              title: '列设置',
              body: flattenDeep([
                {
                  type: 'ae-columnWidthControl',
                  name: 'width',
                  label: false,
                  formLabel: '列宽'
                },
                {
                  type: 'select',
                  name: 'align',
                  label: '对齐方式',
                  hidden: this._isOpColumn,
                  options: [
                    {label: '左对齐', value: 'left'},
                    {label: '居中对齐', value: 'center'},
                    {label: '右对齐', value: 'right'}
                  ]
                },
                {
                  type: 'select',
                  name: 'fixed',
                  label: '固定当前列',
                  hidden: this._isOpColumn,
                  options: [
                    {label: '不固定', value: false},
                    {label: '左侧固定', value: 'left'},
                    {label: '右侧固定', value: 'right'}
                  ]
                },
                {
                  type: 'ae-Switch-More',
                  mode: 'normal',
                  name: 'copyable',
                  label: '可复制',
                  trueValue: true,
                  formType: 'extend',
                  bulk: false,
                  form: {
                    body: [
                      {
                        name: 'content',
                        type: 'ae-formulaControl',
                        label: '复制内容'
                      }
                    ]
                  }
                },
                /** 排序设置 */
                dc?.sorter?.(context),
                /** 可搜索 */
                dc?.searchable?.(context),
                /** 快速查看 */
                dc?.popover?.(context),
                /** 快速编辑 */
                dc?.quickEdit?.(context)
              ]).filter(Boolean)
            }
          ].filter(Boolean)
        )
      }
      ,{
        title: '外观',
        body: [
          getSchemaTpl('className'),
          getSchemaTpl('className', {
            name: 'innerClassName',
            label: '内部 CSS 类名'
          })
        ]
      }
    ]);
  }
}
