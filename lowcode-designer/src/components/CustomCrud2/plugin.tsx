import {
  ApiDSBuilderKey,
  DSBuilderManager,
  Table2RendererAction,
  Table2RenderereEvent,
} from 'amis-editor'
import {
  BuildPanelEventContext,
  EditorManager,
  defaultValue,
  getSchemaTpl,
  isObject,
  tipedLabel,
} from 'amis-editor-core'

import { BaseCRUDPluginRefactor } from './base-plugin'
import { IFormItemStore, IFormStore } from 'amis-core'

export class TableCRUDPluginRefactor extends BaseCRUDPluginRefactor {
  static id = 'TableCRUDPlugin'

  panelJustify = true

  multifactor = true

  isBaseComponent = true

  description =
    '用来实现对数据的增删改查，用来展示表格数据，可以配置列信息，然后关联数据便能完成展示。支持嵌套、超级表头、列固定、表头固顶、合并单元格等等。'

  order = -950

  $schema = '/schemas/CRUD2TableSchema.json'

  docLink = '/amis/zh-CN/components/table2'

  previewSchema: Record<string, any> = this.generatePreviewSchema('table2')

  scaffold: any = this.generateScaffold('table2')

  constructor(manager: EditorManager) {
    super(manager, Table2RenderereEvent, Table2RendererAction)
    this.dsManager = new DSBuilderManager(manager)
  }

  /** 非实体数据源走默认构建 */
  panelBodyCreator = (context: BuildPanelEventContext) => {
    return this.baseCRUDPanelBody(context)
  }

  /** 基础配置 */
  renderBasicPropsCollapse(context: BuildPanelEventContext) {
    /** 动态加载的配置集合 */
    const dc = this.dynamicControls
    /** 数据源控件 */
    const generateDSControls = () => {
      /** 数据源类型 */
      const dsTypeSelector = this.dsManager.getDSSelectorSchema(
        {
          type: 'select',
          label: '数据源',
          onChange: (value: string, oldValue: string, model: IFormItemStore, form: IFormStore) => {
            if (value !== oldValue) {
              const data = form.data

              Object.keys(data).forEach(key => {
                if (key?.toLowerCase()?.endsWith('fields') || key?.toLowerCase()?.endsWith('api')) {
                  form.deleteValueByName(key)
                }
              })
              form.deleteValueByName('__fields')
              form.deleteValueByName('__relations')
            }
            return value
          },
        },
        { schema: context?.schema, sourceKey: 'api' },
      )
      /** 默认数据源类型 */
      const defaultDsType = dsTypeSelector.value
      /** 数据源配置 */
      const dsSettings = this.dsManager.buildCollectionFromBuilders((builder, builderKey) => {
        return {
          type: 'container',
          visibleOn: `data.dsType == null ? '${builderKey}' === '${
            defaultDsType || ApiDSBuilderKey
          }' : data.dsType === '${builderKey}'`,
          body: builder.makeSourceSettingForm({
            feat: 'List',
            renderer: 'crud',
            inScaffold: false,
            sourceSettings: {
              userOrders: true,
            },
          }),
          /** 因为会使用 container 包裹，所以加一个 margin-bottom */
          className: 'mb-3',
        }
      })

      return [dsTypeSelector, ...dsSettings]
    }

    return {
      title: '基本',
      order: 1,
      body: [
        ...generateDSControls(),
        /** 主键配置，TODO：支持联合主键 */
        dc?.primaryField?.(context),
        /** 可选择配置，这里的配置会覆盖底层 Table 的 rowSelection 中的配置 */
        getSchemaTpl('switch', {
          name: 'selectable',
          label: tipedLabel('可选择', '开启后支持选择表格行数据'),
          pipeIn: (value: boolean | undefined, formStore: IFormStore) => {
            if (typeof value === 'boolean') {
              return value
            }

            const rowSelection = formStore?.data?.rowSelection
            return rowSelection && isObject(rowSelection)
          },
        }),
        {
          type: 'container',
          className: 'ae-ExtendMore mb-3',
          visibleOn:
            "data.selectable || (data.rowSelection && data.rowSelection?.type !== 'radio')",
          body: [
            getSchemaTpl('switch', {
              name: 'multiple',
              label: '可多选',
              pipeIn: (value: boolean | undefined, formStore: IFormStore) => {
                if (typeof value === 'boolean') {
                  return value
                }

                const rowSelection = formStore?.data?.rowSelection

                return rowSelection && isObject(rowSelection)
                  ? rowSelection.type !== 'radio'
                  : false
              },
            }),
          ],
        },
        {
          name: 'placeholder',
          pipeIn: defaultValue('暂无数据'),
          type: 'input-text',
          label: '占位内容',
        },
        getSchemaTpl('switch', {
          name: 'syncLocation',
          label: tipedLabel(
            '同步地址栏',
            '开启后会把查询条件数据和分页信息同步到地址栏中，页面中出现多个时，建议只保留一个同步地址栏，否则会相互影响。',
          ),
          pipeIn: defaultValue(false),
        }),
      ],
    }
  }
}
export const id = TableCRUDPluginRefactor.id
