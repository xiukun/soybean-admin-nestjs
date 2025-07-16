import { IFormStore } from 'amis-core'
import { CRUDScaffoldConfig, DSFeatureEnum, ModelDSBuilderKey } from 'amis-editor'
import { BuildPanelEventContext, getSchemaTpl, ScaffoldForm } from 'amis-editor-core'

import { FiltersConfig, OperatorsConfig, ToolsConfig } from './constants'
import { cloneDeep, flattenDeep, uniq } from 'lodash'
import { dataModelTablePlugin2 } from '../common/json/data-model-table-plugin2'
import { getI18N, i18nExtendEnum } from '../common/utils'
import { BaseCRUDPlugin } from 'amis-editor/lib/plugin/CRUD2/BaseCRUD'

export class BaseCRUDPluginRefactor extends BaseCRUDPlugin {
  // static id = 'CRUD2Plugin'
  // rendererName = 'crud2'
  // name = '表格2.0'

  // renderToolbarCollapse(context: BuildPanelEventContext) {
  //   const builder = this.dsManager.getBuilderBySchema(context.node.schema)

  //   return {
  //     order: 20,
  //     title: getI18N(i18nExtendEnum.事件), //'工具栏',
  //     body: [
  //       {
  //         type: 'ae-crud-toolbar-control',
  //         name: 'headerToolbar',
  //         nodeId: context.id,
  //         builder,
  //       },
  //     ],
  //   }
  // }

  /** 各场景字段设置 Schema */
  getScaffoldFeatureTab() {
    const tabs: { title: string; icon: string; body: any; visibleOn: string }[] = []
    ;[
      {
        groupName: '',
        options: [
          {
            label: getI18N(i18nExtendEnum.列表展示), //'列表展示',
            value: 'List',
            icon: 'fa fa-list',
          },
        ],
      },
      ToolsConfig,
      FiltersConfig,
      OperatorsConfig,
    ].forEach(group => {
      group.options.forEach((item: { value: any; label: string; icon: string }, index: number) => {
        this.dsManager.buildCollectionFromBuilders((builder, builderKey) => {
          if (!builder.features.includes(item.value)) {
            return null
          }

          const tabContent =
            builderKey === ModelDSBuilderKey
              ? [
                  ...builder.makeFieldsSettingForm({
                    feat: item.value,
                    renderer: 'crud',
                    inScaffold: true,
                  }),
                ]
              : [
                  ...(item.value === 'Edit'
                    ? /** CRUD的编辑单条需要初始化接口 */ builder.makeSourceSettingForm({
                        feat: item.value,
                        renderer: 'crud',
                        inScaffold: true,
                        sourceKey: 'initApi',
                      })
                    : !['List', 'SimpleQuery'].includes(item.value)
                      ? builder.makeSourceSettingForm({
                          feat: item.value,
                          renderer: 'crud',
                          inScaffold: true,
                        })
                      : []),
                  ...builder.makeFieldsSettingForm({
                    feat: item.value,
                    renderer: 'crud',
                    inScaffold: true,
                    fieldSettings: {
                      renderLabel: false,
                    },
                  }),
                ]

          if (!tabContent || tabContent.length === 0) {
            return null
          }

          const groupName = group.groupName
          const extraVisibleOn = groupName
            ? `data["${groupName}"] && ~data['${groupName}'].indexOf('${item.value}')`
            : true

          tabs.push({
            title: item.label,
            icon: item.icon,
            visibleOn: `(!this.dsType || this.dsType === '${builderKey}') && ${extraVisibleOn}`,
            body: tabContent.filter(Boolean).map(formItem => ({ ...formItem, mode: 'normal' })),
          })

          return
        })
      })
    })

    return tabs
  }

  get scaffoldForm(): ScaffoldForm {
    return {
      title: `新${this.name}创建向导`,
      mode: {
        mode: 'horizontal',
        horizontal: {
          leftFixed: 'sm',
        },
      },
      className:
        'ae-Scaffold-Modal ae-Scaffold-Modal--CRUD ae-Scaffold-Modal-content :AMISCSSWrapper', //  ae-formItemControl
      stepsBody: true,
      canSkip: true,
      canRebuild: true,
      body: [
        {
          title: getI18N(i18nExtendEnum.数据配置), //'新数据配置',
          body: [
            dataModelTablePlugin2,
            /** 数据源选择 */
            this.dsManager.getDSSelectorSchema({
              onChange: (value: any, oldValue: any, model: any, form: any) => {
                if (value !== oldValue) {
                  const data = form.data

                  Object.keys(data).forEach(key => {
                    if (
                      key?.toLowerCase()?.endsWith('fields') ||
                      key?.toLowerCase()?.endsWith('api')
                    ) {
                      form.deleteValueByName(key)
                    }
                  })
                  form.deleteValueByName('__fields')
                  form.deleteValueByName('__relations')
                }
                return value
              },
            }),

            /** 数据源配置 */
            ...this.dsManager.buildCollectionFromBuilders((builder, builderKey) => {
              return {
                type: 'container',
                visibleOn: `!this.dsType || this.dsType === '${builderKey}'`,
                body: flattenDeep([
                  builder.makeSourceSettingForm({
                    feat: DSFeatureEnum.List,
                    renderer: 'crud',
                    inScaffold: true,
                    sourceSettings: {
                      userOrders: true,
                    },
                  }),
                  builder.makeFieldsSettingForm({
                    feat: DSFeatureEnum.List,
                    renderer: 'crud',
                    inScaffold: true,
                  }),
                ]),
              }
            }),
            getSchemaTpl('primaryField', {
              visibleOn: `!data.dsType || data.dsType !== '${ModelDSBuilderKey}'`,
            }),
          ],
        },
        {
          title: getI18N(i18nExtendEnum.功能配置), //'功能配置',
          body: [
            /** 功能场景选择 */
            ...this.dsManager.buildCollectionFromBuilders((builder, builderKey) => {
              return {
                type: 'container',
                visibleOn: `dsType == null || dsType === '${builderKey}'`,
                body: [
                  {
                    type: 'checkboxes',
                    label: getI18N(i18nExtendEnum.工具栏), //'工具栏',
                    name: ToolsConfig.groupName,
                    joinValues: false,
                    extractValue: true,
                    multiple: true,
                    options: ToolsConfig.options.filter(item => builder.filterByFeat(item.value)),
                  },
                  {
                    type: 'checkboxes',
                    label: getI18N(i18nExtendEnum.条件查询), //'条件查询',
                    name: FiltersConfig.groupName,
                    multiple: true,
                    joinValues: false,
                    extractValue: true,
                    options: FiltersConfig.options.filter(item => builder.filterByFeat(item.value)),
                  },
                  {
                    type: 'checkboxes',
                    label: getI18N(i18nExtendEnum.数据操作), //'数据操作',
                    name: OperatorsConfig.groupName,
                    multiple: true,
                    joinValues: false,
                    extractValue: true,
                    options: OperatorsConfig.options.filter(item =>
                      builder.filterByFeat(item.value),
                    ),
                  },
                  // 占位，最后一个form item没有间距
                  {
                    type: 'container',
                  },
                ],
              }
            }),
            /** 各场景字段设置 */
            {
              type: 'tabs',
              tabsMode: 'vertical',
              className: 'ae-Scaffold-Modal-tabs',
              tabs: this.getScaffoldFeatureTab(),
            },
          ],
        },
      ],
      /** 用于重新构建的数据回填 */
      pipeIn: async (schema: any) => {
        /** 数据源类型 */
        const dsType = schema?.dsType ?? this.dsManager.getDefaultBuilderKey()
        const builder = this.dsManager.getBuilderByKey(dsType)
        if (!builder) {
          return { dsType }
        }

        const config = await builder.guessCRUDScaffoldConfig({ schema })
        return { ...config, dataModelEntity: schema?.dataModelEntity }
      },
      pipeOut: async (config: CRUDScaffoldConfig) => {
        // 获取原始的id，用于回填
        const originId = config?.__pristineSchema?.id
        const scaffold: any = cloneDeep(this.scaffold)
        const builder = this.dsManager.getBuilderByScaffoldSetting(config)
        if (!builder) {
          return scaffold
        }

        const schema = await builder.buildCRUDSchema({
          feats: uniq(
            [
              DSFeatureEnum.List as 'List',
              ...(config.tools ?? []),
              ...(config.filters ?? []),
              ...(config.operators ?? []),
            ].filter(Boolean),
          ),
          renderer: 'crud',
          inScaffold: true,
          entitySource: config?.entitySource,
          fallbackSchema: scaffold,
          scaffoldConfig: config,
        })

        /** table2单独增加schema.__origin = 'scaffold'无效，脚手架构建的 Schema 加个标识符，避免addChild替换 Schema ID */
        schema.__origin = 'scaffold'
        // builder.buildCRUDSchema中重新生成了id,这里回填原先的id
        if (originId) schema.id = originId
        return { ...schema, dataModelEntity: config?.dataModelEntity }
      },
      validate: (data: CRUDScaffoldConfig, form: IFormStore) => {
        const feat = DSFeatureEnum.List
        const builder = this.dsManager.getBuilderByScaffoldSetting(data)
        const featValue = builder?.getFeatValueByKey(feat)
        const fieldsKey = `${featValue}Fields`
        const errors: Record<string, string> = {}

        if (data?.dsType === ModelDSBuilderKey || builder?.key === ModelDSBuilderKey) {
          return errors
        }

        const fieldErrors = false
        // FieldSetting.validator(form.data[fieldsKey]);

        if (fieldErrors) {
          errors[fieldsKey] = fieldErrors
        }

        return errors
      },
    }
  }
}
