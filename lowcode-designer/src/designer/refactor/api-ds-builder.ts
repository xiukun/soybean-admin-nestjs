import {
  DSFeature,
  DSFeatureEnum,
  DSFeatureType,
  DSRendererType,
  FormOperatorMap,
  FormOperatorValue,
  GenericSchema,
  JSONPipeOut,
  ScaffoldField,
  getSchemaTpl,
  tipedLabel,
  traverseSchemaDeep,
} from 'amis-editor'
import { ApiDSBuilder, ApiDSBuilderOptions } from 'amis-editor/lib/builder/ApiDSBuilder'
import { i18n } from 'i18n-runtime'
import { intersection, pick, uniq } from 'lodash'
import get from 'lodash/get'
import omit from 'lodash/omit'

/**
 * 注册数据源构造器 重写
 */
export class ApiDSBuilderRefactor extends ApiDSBuilder {
  guessFormScaffoldConfig<FormScaffoldConfig>(options: {
    schema: GenericSchema
    [propName: string]: any
  }) {
    const { schema, include } = options || {}
    const dsType = this.key

    if (!schema.dsType || schema.dsType !== dsType) {
      return { dsType } as FormScaffoldConfig
    }

    const feat = schema?.feat ?? 'Insert'
    /** 表单操作 */
    const operators = (schema.actions ?? [])
      .map((item: any) => {
        const opValue = get(item, 'onEvent.click.actions[0].actionType') as FormOperatorValue

        if (
          typeof opValue === 'string' &&
          opValue &&
          ['submit', 'reset', 'cancel'].includes(opValue)
        ) {
          return FormOperatorMap[opValue]
        }

        return undefined
      })
      .filter(Boolean)
    const featValue = this.getFeatValueByKey(feat)
    const fieldKey = featValue ? `${featValue}Fields` : ''
    const apiKey = featValue ? `${featValue}Api` : ''
    const fields = (Array.isArray(schema?.body) ? schema.body : [schema.body])
      .map(item => {
        if (!item) {
          return false
        }

        return {
          name: item.name,
          label: item.label,
          displayType: 'tpl' /** 对于form这个属性没用 */,
          inputType: item.type,
        }
      })
      .filter((f): f is Exclude<typeof f, null | false | undefined> => f != null)

    const config = {
      feat: feat,
      dsType,
      ...(fieldKey ? { [fieldKey]: fields } : {}),
      ...(apiKey ? { [apiKey]: JSONPipeOut(schema?.api) } : {}),
      ...(feat === 'Edit' || schema.initApi != null
        ? { initApi: JSONPipeOut(schema?.initApi) }
        : {}),
      operators:
        operators.length < 1 ? [FormOperatorMap['cancel'], FormOperatorMap['submit']] : operators,
      __pristineSchema: omit(JSONPipeOut(schema), [
        ...Object.values(DSFeature).map(item => `${item.value}Fields`),
      ]),
      ...include,
    } as FormScaffoldConfig
    return config
  }

  guessCRUDScaffoldConfig<CRUDScaffoldConfig>(options: {
    schema: GenericSchema
    [propName: string]: any
  }) {
    const { schema } = options || {}
    const dsType = this.key

    if (!schema.dsType || schema.dsType !== dsType) {
      return { dsType, primaryField: 'id' } as CRUDScaffoldConfig
    }
    const listFields = (Array.isArray(schema?.columns) ? schema.columns : [schema.columns])
      .filter(item => item.type !== 'operation')
      .map(item => {
        if (!item) {
          return
        }
        return {
          name: item.name,
          label: item.title,
          displayType: item.type,
          inputType: item.inputType /** 对于CRUD这个属性没用 */,
        }
      })
      .filter((f): f is Exclude<typeof f, null | false | undefined> => f != null)
    let viewFields: ScaffoldField[] = []
    let viewApi: any
    let insertFields: ScaffoldField[] = []
    let insertApi: any
    let editFields: ScaffoldField[] = []
    let editApi: any
    let bulkEditFields: ScaffoldField[] = []
    let bulkEditApi: any
    let simpleQueryFields: ScaffoldField[] = []
    let bulkDeleteApi: any
    let deleteApi: any

    /** 已开启特性 */
    const feats: DSFeatureType[] = []

    const collectFormFields = (body: any[]) =>
      body.map((item: any) => ({
        ...pick(item, ['name', 'label']),
        inputType: item.type ?? 'input-text',
        displayType: 'tpl',
      }))

    traverseSchemaDeep(schema, (key: string, value: any, host: Record<string, any>) => {
      if (key === 'feat') {
        if (value === 'Insert') {
          feats.push('Insert')
          insertFields = collectFormFields(host?.body ?? [])
          insertApi = host?.api
        } else if (value === 'Edit') {
          feats.push('Edit')
          editFields = collectFormFields(host?.body ?? [])
          editApi = host?.api
        } else if (value === 'BulkEdit') {
          feats.push('BulkEdit')
          bulkEditFields = collectFormFields(host?.body ?? [])
          bulkEditApi = host?.api
        } else if (value === 'View') {
          feats.push('View')
          viewFields = collectFormFields(host?.body ?? [])
          viewApi = host?.initApi
        }
      }

      if (key === 'behavior') {
        if (value === 'BulkDelete') {
          feats.push('BulkDelete')

          const actions = get(host, 'onEvent.click.actions', [])
          const actionSchema = actions.find(
            (action: any) =>
              action?.actionType === 'ajax' && (action?.api != null || action?.args?.api != null),
          )
          bulkDeleteApi = get(actionSchema, 'api', '') || get(actionSchema, 'args.api', '')
        } else if (value === 'Delete') {
          feats.push('Delete')

          const actions = get(host, 'onEvent.click.actions', [])
          const actionSchema = actions.find(
            (action: any) =>
              action?.actionType === 'ajax' && (action?.api != null || action?.args?.api != null),
          )
          deleteApi = get(actionSchema, 'api', '') || get(actionSchema, 'args.api', '')
        } else if (Array.isArray(value) && value.includes('SimpleQuery')) {
          feats.push('SimpleQuery')

          simpleQueryFields = (host?.body ?? []).map((item: any) => ({
            ...pick(item, ['name', 'label']),
            inputType: item.type ?? 'input-text',
            isplayType: 'tpl',
          }))
        }
      }

      return [key, value]
    })
    const finalFeats = uniq(feats)

    const config = {
      dsType,
      tools: intersection(finalFeats, [
        DSFeatureEnum.Insert,
        DSFeatureEnum.BulkDelete,
        DSFeatureEnum.BulkEdit,
      ]) as DSFeatureType[],
      /** 数据操作 */
      operators: intersection(finalFeats, [
        DSFeatureEnum.View,
        DSFeatureEnum.Edit,
        DSFeatureEnum.Delete,
      ]) as DSFeatureType[],
      /** 条件查询 */
      filters: intersection(finalFeats, [
        DSFeatureEnum.FuzzyQuery,
        DSFeatureEnum.SimpleQuery,
        DSFeatureEnum.AdvancedQuery,
      ]) as DSFeatureType[],
      listFields,
      listApi: JSONPipeOut(schema?.api),
      viewFields,
      viewApi: JSONPipeOut(viewApi),
      insertFields,
      insertApi: JSONPipeOut(insertApi),
      editFields,
      editApi: JSONPipeOut(editApi),
      bulkEditFields,
      bulkEditApi: JSONPipeOut(bulkEditApi),
      deleteApi: JSONPipeOut(deleteApi),
      bulkDeleteApi: JSONPipeOut(bulkDeleteApi),
      simpleQueryFields,
      primaryField: schema?.primaryField ?? 'id',
      __pristineSchema: omit(JSONPipeOut(schema), [
        ...Object.values(DSFeature).map(item => `${item.value}Fields`),
      ]),
    }

    return config as CRUDScaffoldConfig
  }

  async buildCRUDColumn(
    field: ScaffoldField,
    options: ApiDSBuilderOptions<'crud'>,
    componentId?: string,
  ) {
    return {
      type: field.displayType,
      title: field.label,
      name: field.name,
      inputType: field?.inputType,
      /** 绑定列值, 似乎不需要 */
      // [f.typeKey || 'value']: `\${f.key}`
    }
  }
  makeSourceSettingForm(options: ApiDSBuilderOptions<DSRendererType>): any[] {
    const { feat, renderer, inScaffold, sourceSettings, sourceKey } = options || {}

    if (!feat) {
      return []
    }

    const { label, name, renderLabel, labelClassName, mode, horizontalConfig, visibleOn } =
      sourceSettings || {}
    const isCRUD = renderer === 'crud'
    /** 处理Label */
    const labelText =
      label ?? (isCRUD && feat !== 'List' ? i18n(this.getFeatLabelByKey(feat)) + '接口' : '接口')
    let normalizedLabel: any = labelText
    if (feat === 'Insert') {
      normalizedLabel = tipedLabel(
        labelText,
        `用来保存数据, 表单提交后将数据传入此接口。<br/>
        接口响应体要求(如果data中有数据，该数据将被合并到表单上下文中)：<br/>
        <pre>${JSON.stringify({ status: 0, msg: '', data: {} }, null, 2)}</pre>`,
      )
    } else if (feat === 'List') {
      normalizedLabel = tipedLabel(
        labelText,
        `接口响应体要求：<br/>
        <pre>${JSON.stringify(
          { status: 0, msg: '', items: {}, page: 0, total: 0 },
          null,
          2,
        )}</pre>`,
      )
    }

    const layoutMode = mode ?? 'horizontal'
    const baseApiSchemaConfig = {
      renderLabel: renderLabel ?? true,
      label: normalizedLabel,
      name: name ?? (inScaffold ? i18n(this.getFeatValueByKey(feat)) + 'Api' : 'api'),
      mode: layoutMode,
      labelClassName: labelClassName,
      inputClassName: 'm-b-none',
      ...(layoutMode === 'horizontal' ? horizontalConfig ?? {} : {}),
      ...(visibleOn && typeof visibleOn === 'string' ? { visibleOn } : {}),
      onPickerConfirm: (value: any) => {
        let transformedValue = value
        const transform = (apiObj: any) =>
          `${apiObj?.api?.method || 'post'}:api://${apiObj?.key || ''}`

        if (value) {
          transformedValue = Array.isArray(value)
            ? value.map(transform).join(',')
            : transform(value)
        }

        return transformedValue
      },
    }

    const isServiceCmpt = renderer === 'service'
    const shouldRenderApiControl = isServiceCmpt ? true : feat !== DSFeatureEnum.View
    const shouldRenderInitApiControl = isServiceCmpt
      ? false
      : (feat === DSFeatureEnum.Edit || feat === DSFeatureEnum.View) &&
        (renderer === 'form' || sourceKey === 'initApi')
    const shouldRenderQuickApiControl = isServiceCmpt
      ? false
      : feat === DSFeatureEnum.List && renderer === 'crud' && !inScaffold

    return [
      /** 提交接口 */
      shouldRenderApiControl ? getSchemaTpl('apiControl', baseApiSchemaConfig) : null,
      /** 表单初始化接口 */
      shouldRenderInitApiControl
        ? getSchemaTpl('apiControl', {
            ...baseApiSchemaConfig,
            name: 'initApi',
            label: tipedLabel(
              '初始化接口',
              `接口响应体要求：<br/>
              <pre>${JSON.stringify({ status: 0, msg: '', data: {} }, null, 2)}</pre>`,
            ),
          })
        : null,
      /** CRUD的快速编辑接口 */
      ...(shouldRenderQuickApiControl
        ? [
            getSchemaTpl('apiControl', {
              ...baseApiSchemaConfig,
              name: 'quickSaveApi',
              label: tipedLabel('快速保存', '快速编辑后用来批量保存的 API'),
            }),
            getSchemaTpl('apiControl', {
              ...baseApiSchemaConfig,
              name: 'quickSaveItemApi',
              label: tipedLabel('快速保存单条', '即时保存时使用的 API'),
            }),
          ]
        : []),
    ].filter(Boolean)
  }
}
