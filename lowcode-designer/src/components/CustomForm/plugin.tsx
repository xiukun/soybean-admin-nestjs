import cx from 'classnames'

import {
  FormPlugin,
  ScaffoldForm,
  DSFeatureEnum,
  ModelDSBuilderKey,
  FormPluginFeat,
  FormScaffoldConfig,
  ApiDSBuilderKey,
  getSchemaTpl,
  tipedLabel,
  defaultValue,
  BaseEventContext,
} from 'amis-editor'
import { dataModelFormPlugin } from '@/components/common/json/data-model-form-plugin'
import flatten from 'lodash/flatten'
import cloneDeep from 'lodash/cloneDeep'
import { i18n } from 'i18n-runtime'
import { type IFormStore, type IFormItemStore, setVariable, getRendererByName } from 'amis-core'
import { FieldSetting } from 'amis-editor/lib/renderer/FieldSetting'
import { _isModelComp } from 'amis-editor/lib/util'
import { getEventControlConfig } from 'amis-editor'
import { getI18N, i18nExtendEnum } from '../common/utils'
export class FormPluginRefactor extends FormPlugin {
  /** 表单脚手架 */
  get scaffoldForm(): ScaffoldForm {
    const features = this.Features.filter(f => !f.disabled)

    return {
      title: '表单创建向导',
      mode: {
        mode: 'horizontal',
        horizontal: {
          leftFixed: 'sm',
        },
      },
      canRebuild: true,
      className: 'ae-Scaffold-Modal ae-Scaffold-Modal-content :AMISCSSWrapper',
      body: [
        {
          type: 'radios',
          name: 'feat',
          label: getI18N(i18nExtendEnum.使用场景), //'使用场景',
          value: DSFeatureEnum.Insert,
          options: features,
          onChange: (
            value: FormPluginFeat,
            oldValue: FormPluginFeat,
            model: IFormItemStore,
            form: IFormStore,
          ) => {
            if (value !== oldValue) {
              const data = form.data

              Object.keys(data).forEach(key => {
                if (
                  /^(insert|edit|bulkEdit|view)Fields$/i.test(key) ||
                  /^(insert|edit|bulkEdit|view)Api$/i.test(key)
                ) {
                  form.deleteValueByName(key)
                }
              })
              form.deleteValueByName('__fields')
              form.deleteValueByName('__relations')
              form.setValues({
                dsType: this.dsManager.getDefaultBuilderKey(),
                initApi:
                  DSFeatureEnum.Insert === value || DSFeatureEnum.BulkEdit === value
                    ? undefined
                    : '',
              })
            }
          },
        },
        dataModelFormPlugin,
        /** 数据源选择器 */
        this.dsManager.getDSSelectorSchema({
          onChange: (value: string, oldValue: string, model: IFormItemStore, form: IFormStore) => {
            if (value !== oldValue) {
              const data = form.data

              Object.keys(data).forEach(key => {
                if (
                  /^(insert|edit|bulkEdit|view)Fields$/i.test(key) ||
                  /^(insert|edit|bulkEdit|view)Api$/i.test(key)
                ) {
                  form.deleteValueByName(key)
                }
              })
              form.deleteValueByName('__fields')
              form.deleteValueByName('__relations')
              form.setValues({
                initApi:
                  DSFeatureEnum.Insert === value || DSFeatureEnum.BulkEdit === value
                    ? undefined
                    : '',
              })
            }

            return value
          },
        }),
        /** 数据源相关配置 */
        ...flatten(
          features.map(feat =>
            this.dsManager.buildCollectionFromBuilders((builder, builderKey) => {
              return {
                type: 'container',
                className: 'form-item-gap',
                visibleOn: `$\{feat === '${feat.value}' && (!dsType || dsType === '${builderKey}')}`,
                body: flatten([
                  builder.makeSourceSettingForm({
                    feat: feat.value,
                    renderer: 'form',
                    inScaffold: true,
                    sourceSettings: {
                      userOrders: false,
                    },
                  }),
                  builder.makeFieldsSettingForm({
                    feat: feat.value,
                    renderer: 'form',
                    inScaffold: true,
                  }),
                ]),
              }
            }),
          ),
        ),
        {
          name: 'operators',
          label: '操作',
          type: 'checkboxes',
          value: ['submit'],
          joinValues: false,
          extractValue: false,
          options: [
            {
              label: getI18N(i18nExtendEnum.重置),
              value: 'reset',
              order: 1,
              schema: {
                level: 'default',
              },
            },
            {
              label: getI18N(i18nExtendEnum.取消),
              value: 'cancel',
              order: 0,
              schema: {
                level: 'default',
              },
            },
            {
              label: getI18N(i18nExtendEnum.提交),
              value: 'submit',
              order: 2,
              schema: {
                level: 'primary',
              },
            },
            // FormOperatorMap['reset'],
            // FormOperatorMap['submit'],
            // FormOperatorMap['cancel'],
          ],
        },
      ],
      pipeIn: async (schema: any) => {
        /** 数据源类型 */
        const dsType = schema?.dsType ?? this.dsManager.getDefaultBuilderKey()
        const builder = this.dsManager.getBuilderByKey(dsType)

        if (!builder) {
          return { dsType }
        }
        const config = await builder.guessFormScaffoldConfig({
          schema,
          include: {
            dataModelEntity: schema?.dataModelEntity,
            mode: schema?.mode,
          },
        })

        return { ...config }
      },
      pipeOut: async (config: FormScaffoldConfig) => {
        const scaffold: any = cloneDeep(this.scaffold)
        const builder = this.dsManager.getBuilderByScaffoldSetting(config)

        if (!builder) {
          return scaffold
        }

        const schema = await builder.buildFormSchema({
          feat: config.feat,
          renderer: 'form',
          inScaffold: true,
          entitySource: config?.entitySource,
          fallbackSchema: scaffold,
          scaffoldConfig: config,
        })

        /** 脚手架构建的 Schema 加个标识符，避免addChild替换 Schema ID */
        schema.__origin = 'scaffold'

        schema.dataModelEntity = config.dataModelEntity
        if (schema.mode) {
          schema.mode = config.mode
        }
        // schema.body = [...(config.body || []), ...(schema.body || [])]

        return schema
      },
      validate: (data: FormScaffoldConfig, form: IFormStore) => {
        const { feat } = data
        const builder = this.dsManager.getBuilderByScaffoldSetting(data)
        const featValue = builder?.getFeatValueByKey(feat ?? DSFeatureEnum.Insert)
        // const apiKey = `${featValue}Api`
        const fieldsKey = `${featValue}Fields`
        const errors: Record<string, string> = {}

        if (data?.dsType === ModelDSBuilderKey) {
          return errors
        }

        // if (!form.data[apiKey]) {
        //   errors[apiKey] = '请输入接口信息';
        // }

        // if (feat === 'Edit' && !form.data?.initApi) {
        //   errors['initApi'] = '请输入初始化接口信息';
        // }

        const fieldErrors = FieldSetting.validator(form.data[fieldsKey])

        if (fieldErrors) {
          errors[fieldsKey] = fieldErrors
        }

        return errors
      },
    }
  }

  panelBodyCreator = (context: BaseEventContext) => {
    /** 是否为CRUD的过滤器表单 */
    const isCRUDFilter: boolean =
      /\/crud\/filter\/form$/.test(context.path) ||
      /\/crud2\/filter\/\d\/form$/.test(context.path) ||
      /\/crud2\/filter\/form$/.test(context.path) ||
      /body\/0\/filter$/.test(context.schemaPath);
    /** 表单是否位于Dialog内 */
    const isInDialog: boolean =
      context.path?.includes?.('dialog/') ||
      context.path?.includes?.('drawer/');
    /** 是否使用Panel包裹 */
    const isWrapped = 'this.wrapWithPanel !== false';
    const justifyLayout = (left: number = 2) => ({
      mode: 'horizontal',
      horizontal: {
        left,
        justify: true
      }
    });
    const schema = context?.node?.schema ?? context?.schema;
    /** 新版数据源控件 */
    const generateDSControls = () => {
      const dsTypeSelector = this.dsManager.getDSSelectorSchema(
        {
          type: 'select',
          label: '数据源',
          onChange: (value: string, oldValue: string, model: IFormItemStore, form: IFormStore) => {
            if (value !== oldValue) {
              const data = form.data

              Object.keys(data).forEach(key => {
                if (
                  /^(insert|edit|bulkEdit|view)Fields$/i.test(key) ||
                  /^(insert|edit|bulkEdit|view)Api$/i.test(key)
                ) {
                  form.deleteValueByName(key)
                }
              })
              form.deleteValueByName('__fields')
              form.deleteValueByName('__relations')
              form.deleteValueByName('initApi')
              form.deleteValueByName('api')
            }
            return value
          },
        },
        {
          schema: context?.schema,
          sourceKey: 'api',
          getDefautlValue: (key, builder) => {
            const schema = context?.schema
            let dsType = schema?.dsType

            // TODO: api和initApi可能是混合模式的场景
            if (builder.match(schema, 'api') || builder.match(schema, 'initApi')) {
              dsType = key
            }

            return dsType
          },
        },
      )
      /** 默认数据源类型 */
      const defaultDsType = dsTypeSelector.value
      /** 数据源配置 */
      const dsSettings = flatten(
        this.Features.map(feat =>
          this.dsManager.buildCollectionFromBuilders((builder, builderKey, _index) => {
            return {
              type: 'container',
              className: 'form-item-gap',
              visibleOn: `$\{feat === '${feat.value}' && (dsType == null ? '${builderKey}' === '${
                defaultDsType || ApiDSBuilderKey
              }' : dsType === '${builderKey}')}`,
              body: flatten([
                builder.makeSourceSettingForm({
                  feat: feat.value,
                  renderer: 'form',
                  inScaffold: false,
                  sourceSettings: {
                    renderLabel: true,
                    userOrders: false,
                    /**
                     * name 默认是基于场景自动生成的
                     * 1. 脚手架中，默认生成的是 viewApi
                     * 2. 配置面板中要读取Schema 配置，所以使用 initApi
                     */
                    ...(feat.value === DSFeatureEnum.View ? { name: 'initApi' } : {}),
                  },
                }),
              ]),
            }
          }),
        ),
      )

      return [dsTypeSelector, ...dsSettings]
    }

    /** 数据源 */
    const generateDSCollapse = () => {
      if (isCRUDFilter) {
        /** CRUD查询表头数据源交给CRUD托管 */
        return null
      } else if (_isModelComp(schema)) {
        /** 模型组件使用旧版数据源配置 */
        return {
          title: '数据源',
          body: [
            getSchemaTpl('apiControl', {
              label: '保存接口',
              sampleBuilder: () => {
                return `{\n  "status": 0,\n  "msg": "",\n  // 可以不返回，如果返回了数据将被 merge 进来。\n  data: {}\n}`
              },
            }),
            getSchemaTpl('apiControl', {
              name: 'asyncApi',
              label: tipedLabel(
                '异步检测接口',
                '设置此属性后，表单提交发送保存接口后，还会继续轮询请求该接口，直到返回 finished 属性为 true 才 结束',
              ),
              visibleOn: 'this.asyncApi != null',
            }),
            getSchemaTpl('apiControl', {
              name: 'initAsyncApi',
              label: tipedLabel(
                '异步检测接口',
                '设置此属性后，表单请求 initApi 后，还会继续轮询请求该接口，直到返回 finished 属性为 true 才 结束',
              ),
              visibleOn: 'data.initAsyncApi != null',
            }),
            getSchemaTpl('apiControl', {
              name: 'initApi',
              label: '初始化接口',
              sampleBuilder: () => {
                const data = {}
                const schema = context?.schema

                if (Array.isArray(schema?.body)) {
                  schema.body.forEach((control: any) => {
                    if (control.name && !~['combo', 'input-array', 'form'].indexOf(control.type)) {
                      setVariable(data, control.name, 'sample')
                    }
                  })
                }

                return JSON.stringify(
                  {
                    status: 0,
                    msg: '',
                    data: data,
                  },
                  null,
                  2,
                )
              },
            }),
          ],
        }
      } else {
        return {
          title: getI18N(i18nExtendEnum.数据源), //'数据源',
          body: [
            {
              type: 'select',
              name: 'feat',
              label: getI18N(i18nExtendEnum.使用场景), //'使用场景',
              options: this.Features,
              pipeIn: (value: FormPluginFeat | undefined, formStore: IFormStore) => {
                let feat = value

                if (!value) {
                  feat = this.guessDSFeatFromSchema(formStore?.data)
                }

                return feat
              },
              onChange: (
                value: FormPluginFeat,
                oldValue: FormPluginFeat,
                model: IFormItemStore,
                form: IFormStore,
              ) => {
                if (value !== oldValue) {
                  form.setValues({
                    dsType: this.dsManager.getDefaultBuilderKey(),
                    initApi:
                      DSFeatureEnum.Insert === value || DSFeatureEnum.BulkEdit === value
                        ? undefined
                        : '',
                    api: undefined,
                  })
                }
              },
            },
            ...generateDSControls(),
            {
              type: 'picker',
              label: '实体模型',
              name: 'dataModelEntity',
              overflowConfig: {
                maxTagCount: -1,
              },
              modalClassName: 'app-popover :AMISCSSWrapper',
              multiple: false,
              source: {
                // url: 'https://mock.apifox.com/m1/3546534-0-default/formdataModelList',
                url: '/system/structTab/query',
                method: 'post',
                data: {
                  objName: '',
                },
                adaptor: '',
                messages: {},
                dataType: 'json',
              },
              labelField: 'remark',
              valueField: 'id',
              // labelField: 'label',
              // valueField: 'value',
              pickerSchema: {
                mode: 'list',
                listItem: {
                  title: '${remark}',
                },
                labelField: 'remark',
                valueField: 'id',
              },
            },
          ],
        }
      }
    }
    return [
      getSchemaTpl('tabs', [
        {
          title: getI18N(i18nExtendEnum.属性), //'属性',
          body: getSchemaTpl(
            'collapseGroup',
            [
              generateDSCollapse(),
              {
                title: '基本',
                body: [
                  {
                    name: 'title',
                    type: 'input-text',
                    label: '标题',
                    visibleOn: isWrapped,
                  },
                  getSchemaTpl('switch', {
                    name: 'autoFocus',
                    label: tipedLabel('自动聚焦', '设置后将让表单的第一个可输入的表单项获得焦点'),
                  }),
                  getSchemaTpl('switch', {
                    name: 'persistData',
                    label: tipedLabel(
                      '本地缓存',
                      '开启后，表单的数据会缓存在浏览器中，切换页面或关闭弹框不会清空当前表单内的数据',
                    ),
                    pipeIn: (value: boolean | string | undefined) => !!value,
                  }),
                  {
                    type: 'container',
                    className: 'ae-ExtendMore mb-3',
                    visibleOn: 'this.persistData',
                    body: [
                      getSchemaTpl('tplFormulaControl', {
                        name: 'persistData',
                        label: tipedLabel(
                          '持久化Key',
                          '使用静态数据或者变量：<code>"\\${id}"</code>，来为Form指定唯一的Key',
                        ),
                        pipeIn: (value: boolean | string | undefined) =>
                          typeof value === 'string' ? value : '',
                      }),
                      {
                        type: 'input-array',
                        label: tipedLabel(
                          '保留字段集合',
                          '如果只需要保存Form中的部分字段值，请配置需要保存的字段名称集合，留空则保留全部字段',
                        ),
                        name: 'persistDataKeys',
                        items: {
                          type: 'input-text',
                          placeholder: '请输入字段名',
                          options: flatten(schema?.body ?? schema?.controls ?? [])
                            .map((item: any) => {
                              const isFormItem = getRendererByName(item?.type)?.isFormItem

                              return isFormItem && typeof item?.name === 'string'
                                ? { label: item.name, value: item.name }
                                : false
                            })
                            .filter(Boolean),
                        },
                        itemClassName: 'bg-transparent',
                      },
                      getSchemaTpl('switch', {
                        name: 'clearPersistDataAfterSubmit',
                        label: tipedLabel(
                          '提交成功后清空缓存',
                          '开启本地缓存并开启本配置项后，表单提交成功后，会自动清除浏览器中当前表单的缓存数据',
                        ),
                        pipeIn: defaultValue(false),
                      }),
                    ],
                  },
                  getSchemaTpl('switch', {
                    name: 'canAccessSuperData',
                    label: tipedLabel(
                      '自动填充数据域同名变量',
                      '默认表单是可以获取到完整数据链中的数据的，如果想使表单的数据域独立，请关闭此配置',
                    ),
                    pipeIn: defaultValue(true),
                  }),
                  getSchemaTpl('loadingConfig', { label: '加载设置' }, { context }),
                ],
              },
              {
                title: '提交设置',
                body: [
                  {
                    name: 'submitText',
                    type: 'input-text',
                    label: tipedLabel(
                      '提交按钮名称',
                      '如果底部按钮不是自定义按钮时，可以通过该配置可以快速修改按钮名称，如果设置成空，则可以把默认按钮去掉。',
                    ),
                    pipeIn: defaultValue('提交'),
                    visibleOn: `${isWrapped} && !this.actions && (!Array.isArray(this.body) || !this.body.some(function(item) {return !!~['submit','button','reset','button-group'].indexOf(item.type);}))`,
                    ...justifyLayout(4),
                  },
                  getSchemaTpl('switch', {
                    name: 'submitOnChange',
                    label: tipedLabel('修改即提交', '设置后，表单中每次有修改都会触发提交'),
                  }),
                  getSchemaTpl('switch', {
                    name: 'resetAfterSubmit',
                    label: tipedLabel('提交后重置表单', '表单提交后，让所有表单项的值还原成初始值'),
                  }),
                  getSchemaTpl('switch', {
                    name: 'preventEnterSubmit',
                    label: tipedLabel(
                      '阻止回车提交',
                      '默认按回车键触发表单提交，开启后将阻止这一行为',
                    ),
                  }),
                  // isCRUDFilter
                  //   ? null
                  //   : getSchemaTpl('switch', {
                  //       name: 'submitOnInit',
                  //       label: tipedLabel(
                  //         '初始化后提交一次',
                  //         '开启后，表单初始完成便会触发一次提交'
                  //       )
                  //     }),
                  isInDialog
                    ? getSchemaTpl('switch', {
                        label: '提交后关闭对话框',
                        name: 'closeDialogOnSubmit',
                        pipeIn: (value: any) => value !== false,
                      })
                    : null,
                  // isCRUDFilter
                  //   ? null
                  //   : {
                  //       label: tipedLabel(
                  //         '提交其他组件',
                  //         '可以通过设置此属性，把当前表单的值提交给目标组件，而不是自己来通过接口保存，请填写目标组件的 <code>name</code> 属性，多个组件请用逗号隔开。当 <code>target</code> 为 <code>window</code> 时，则把表单数据附属到地址栏。'
                  //       ),
                  //       name: 'target',
                  //       type: 'input-text',
                  //       placeholder: '请输入组件name',
                  //       ...justifyLayout(4)
                  //     },
                  // getSchemaTpl('reload', {
                  //   test: !isCRUDFilter
                  // }),
                  // isCRUDFilter
                  //   ? null
                  //   : {
                  //       type: 'ae-switch-more',
                  //       mode: 'normal',
                  //       label: tipedLabel(
                  //         '提交后跳转',
                  //         '当设置此值后，表单提交完后跳转到目标地址'
                  //       ),
                  //       formType: 'extend',
                  //       form: {
                  //         mode: 'horizontal',
                  //         horizontal: {
                  //           justify: true,
                  //           left: 4
                  //         },
                  //         body: [
                  //           {
                  //             label: '跳转地址',
                  //             name: 'redirect',
                  //             type: 'input-text',
                  //             placeholder: '请输入目标地址'
                  //           }
                  //         ]
                  //       }
                  //     }
                ],
              },
              {
                title: '组合校验',
                body: [
                  {
                    name: 'rules',
                    label: false,
                    type: 'combo',
                    multiple: true,
                    multiLine: true,
                    subFormMode: 'horizontal',
                    placeholder: '',
                    addBtn: {
                      label: '添加校验规则',
                      block: true,
                      icon: 'fa fa-plus',
                      className: cx('ae-Button--enhance'),
                    },
                    items: [
                      {
                        type: 'ae-formulaControl',
                        name: 'rule',
                        label: '校验规则',
                        ...justifyLayout(4),
                      },
                      {
                        name: 'message',
                        label: '报错提示',
                        type: 'input-text',
                        ...justifyLayout(4),
                      },
                    ],
                  },
                ],
              },
              {
                title: '状态',
                body: [getSchemaTpl('disabled'), getSchemaTpl('visible'), getSchemaTpl('static')],
              },
              {
                title: '高级',
                body: [
                  getSchemaTpl('switch', {
                    name: 'debug',
                    label: tipedLabel('开启调试', '在表单顶部显示当前表单的数据'),
                  }),
                ],
              },
            ].filter(Boolean),
          ),
        },
        {
          title: getI18N(i18nExtendEnum.外观), //'外观',
          body: getSchemaTpl('collapseGroup', [
            {
              title: '布局',
              body: [
                getSchemaTpl('formItemMode', {
                  isForm: true,
                  /** Form组件默认为normal模式 */
                  defaultValue: 'normal',
                }),
                getSchemaTpl('horizontal'),
                {
                  label: '列数',
                  name: 'columnCount',
                  type: 'input-number',
                  step: 1,
                  min: 1,
                  precision: 0,
                  resetValue: '',
                  unitOptions: ['列'],
                  pipeOut: (value: string) => {
                    if (value && typeof value === 'string') {
                      const count = Number.parseInt(value?.replace(/\D+/g, ''), 10)

                      return isNaN(count) ? undefined : count
                    } else if (value && typeof value === 'number') {
                      return value
                    } else {
                      return undefined
                    }
                  },
                },
                {
                  type: 'label-align',
                  name: 'labelAlign',
                  label: '标签位置',
                },
                getSchemaTpl('theme:select', {
                  label: '标签宽度',
                  name: 'labelWidth',
                  hiddenOn: 'this.labelAlign == "top"',
                }),
              ],
            },
            {
              title: getI18N(i18nExtendEnum.其他), //'其他',
              body: [
                getSchemaTpl('switch', {
                  name: 'wrapWithPanel',
                  label: tipedLabel(
                    'Panel包裹',
                    '关闭后，表单只会展示表单项，标题和操作栏将不会显示。',
                  ),
                  pipeIn: defaultValue(true),
                }),
                getSchemaTpl('switch', {
                  name: 'affixFooter',
                  label: tipedLabel('吸附操作栏', '开启后，滚动表单内容区时使底部操作区悬浮吸附'),
                  visibleOn: isWrapped,
                }),
              ],
            },
            /** */
            getSchemaTpl('style:classNames', {
              isFormItem: false,
              schema: [
                getSchemaTpl('className', {
                  name: 'panelClassName',
                  label: 'Panel',
                  visibleOn: isWrapped,
                }),
                getSchemaTpl('className', {
                  name: 'headerClassName',
                  label: '标题区',
                  visibleOn: isWrapped,
                }),
                getSchemaTpl('className', {
                  name: 'bodyClassName',
                  label: '内容区',
                  visibleOn: isWrapped,
                }),
                getSchemaTpl('className', {
                  name: 'actionsClassName',
                  label: '操作区',
                  visibleOn: isWrapped,
                }),
              ],
            }),
          ]),
        },
        {
          title: getI18N(i18nExtendEnum.事件), //'事件',
          className: 'p-none',
          body: [
            getSchemaTpl('eventControl', {
              name: 'onEvent',
              ...getEventControlConfig(this.manager, context),
            }),
          ],
        },
      ]),
    ]
  }
}
export const id = FormPluginRefactor.id
