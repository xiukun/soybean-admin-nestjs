import { DSField } from 'amis-editor'
import { getSchemaTpl, setSchemaTpl, tipedLabel } from 'amis-editor-core'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { Html } from 'amis-ui'

export function setTplApi() {
  setSchemaTpl('apiControl', (patch: any = {}) => {
    const { name, label, value, description, sampleBuilder, apiDesc, ...rest } = patch
    return {
      type: 'ae-apiControl',
      label,
      name: name || 'api',
      description,
      labelRemark: sampleBuilder
        ? {
            label: false,
            title: '接口返回示例',
            icon: 'fa fa-code',
            className: 'm-l-xs ae-ApiSample-icon',
            tooltipClassName: 'ae-ApiSample-tooltip',
            children: (data: any) => (
              <Html
                className="ae-ApiSample"
                inline={false}
                html={`
                  <pre><code>${sampleBuilder(data)}</code></pre>
                  `}
              />
            ),
            trigger: 'click',
            rootClose: true,
            placement: 'left',
          }
        : undefined,
      ...rest,
    }
  })

  setSchemaTpl('agFormItemName', {
    label: '字段名',
    name: 'name',
    type: 'ag-modelBindingControl',
    onBindingChange(field: DSField, onBulkChange: (value: any) => void) {
      onBulkChange(field.resolveEditSchema?.() || { label: field.label })
    },
    // validations: {
    //     matchRegexp: /^[a-z\$][a-z0-0\-_]*$/i
    // },
    // validationErrors: {
    //     "matchRegexp": "请输入合法的变量名"
    // },
    // validateOnChange: false
  })

  setSchemaTpl('agRequired', {
    type: 'ae-StatusControl',
    label: '必填',
    mode: 'normal',
    name: 'required',
    expressionName: 'requiredOn',
  })

  setSchemaTpl('agValidation', (config: { tag: ValidatorTag | ((ctx: any) => ValidatorTag) }) => {
    const a = {
      title: '校验',
      body: [
        {
          type: 'ag-ae-validationControl',
          mode: 'normal',
          ...config,
        },
        getSchemaTpl('agRequired'),
        getSchemaTpl('validateOnChange'),
      ],
    }
    return a
  })

  setSchemaTpl(
    'agStatus',
    (config: {
      isFormItem?: boolean
      readonly?: boolean
      disabled?: boolean
      unsupportStatic?: boolean
      hidden?: boolean
    }) => {
      return {
        title: '状态',
        body: [
          getSchemaTpl('visible'),
          config?.hidden ? getSchemaTpl('hidden') : null,
          config?.isFormItem ? getSchemaTpl('clearValueOnHidden') : null,
          !config?.unsupportStatic && config?.isFormItem ? getSchemaTpl('static') : null,
          config?.readonly ? getSchemaTpl('readonly') : null,
          config?.disabled || config?.isFormItem ? getSchemaTpl('disabled') : null,
        ].filter(Boolean),
      }
    },
  )

  setSchemaTpl('agLocaleEn', (body: any) => {
    return {
      type: 'ae-switch-more',
      mode: 'normal',
      formType: 'extend',
      label: tipedLabel('英文名称', '设置后切换为英文时显示的字段名称'),
      form: {
        body: [
          getSchemaTpl('combo-container', {
            type: 'combo',
            mode: 'normal',
            name: 'en-US',
            items: [
              getSchemaTpl('textareaFormulaControl', {
                label: '英文名称',
                mode: 'normal',
                name: 'label',
              }),
            ],
          }),
        ],
      },
    }
  })

  setSchemaTpl('agBindingPermission', (context: any) => {
    return {
      type: 'ae-switch-more',
      mode: 'normal',
      formType: 'extend',
      label: tipedLabel('绑定权限', '指定权限后，只有拥有该权限的用户才能执行此操作。'),
      form: {
        body: [
          {
            type: 'tree-select',
            label: '按钮权限',
            name: 'hasPermission',
            multiple: false,
            enableNodePath: false,
            hideRoot: true,
            showIcon: true,
            initiallyOpen: true,
            source: '${window:AG_NEPTUNE_LOWCODE_MENUS}',
            labelField: 'menuName',
            valueField: 'menuId',
            clearable: true,
            onlyLeaf: false,
            showOutline: false,
            searchable: true,
            placeholder: '关联按钮权限',
            onEvent: {
              change: {
                weight: 0,
                actions: [
                  {
                    ignoreError: false,
                    script: async (_ctx: any, _ac: any, event: any) => {
                      const permissionsOn = event.data.hasPermission
                      if (permissionsOn) {
                        context.node.updateSchema({
                          ...context.node.schema,
                          hiddenOn: `\${getPermissionById('${permissionsOn}')}`,
                        })
                      } else {
                        context.node.updateSchema({
                          ...context.node.schema,
                          hiddenOn: '',
                        })
                      }
                    },
                    actionType: 'custom',
                  },
                ],
              },
            },
          },
          getSchemaTpl('textareaFormulaControl', {
            label: '表达式',
            mode: 'normal',
            name: 'hiddenOn',
          }),
        ],
      },
    }
  })
}

export default setTplApi
