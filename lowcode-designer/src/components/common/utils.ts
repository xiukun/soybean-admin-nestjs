import { FormItemControlPanel, ValidationOptions } from 'amis-editor'
import { BaseEventContext, EditorManager, getSchemaTpl, isObject } from 'amis-editor-core'

// import { getEventControlConfig } from 'amis-editor'
import { flatten } from 'lodash'
import { dataModelItemPlugin } from './json/data-model-item-plugin'
import { resolveOptionEventDataSchame } from 'amis-editor/lib/util'
import { i18n } from 'i18n-runtime'

/**
 * i18n枚举列表
 */
export enum i18nExtendEnum {
  '重置' = 'i18n_ag_amis_editor_form_reset',
  '提交' = 'i18n_ag_amis_editor_form_submit',
  '保存' = 'be5fbbe34ce9979bfb6576d9eddc5612',
  '取消' = 'i18n_ag_amis_editor_form_cancel',
  '清空' = '288f0c404c4e546aa3683ff5054e85e2',
  '关闭' = 'b15d91274e9fc68608c609999e0413fa',
  '预览' = '645dbc5504e722a30896486085a06b32',
  '编辑' = '95b351c86267f3aedf89520959bce689',
  '模型列表' = 'i18n_ag_models_list',
  '模型字段' = 'i18n_ag_model_field',
  '事件' = '10b2761db5a8e089049df39675abc550',
  '外观' = 'afcde2611bdd13c1e65b4fb6a2f13425',
  '属性' = '24d67862f87f439db7ca957aecb77cce',
  '选项' = 'ea15ae2b7fba76c83eec6d0986d15197',
  '高级' = 'dfac151de712ab0b3618072c8a7f0a0f',
  '数据字典' = 'i18n_ag_data_dictionary',
  '刷新数据' = 'i18n_ag_refresh_data',
  '确认编辑' = '4271f29faca65d7840ad6bb2c4a7b8c6',
  '确认删除' = 'fc763fd5ddf637fe4ba1ac59e10b8d3a',
  '值变化' = '755955372bcc0c7ebf161a656bc389b3',
  '获取焦点' = 'ab0710b367acefa1d6a78e2338291e86',
  '失去焦点' = 'fc96a5f1b79cb734afe08e401b6ba5e7',
  '基本' = '4092ed98e9035652d4c9ca9441701ed7',
  '工具栏' = '012f602372cd2dbd639cd966c63e1f90',
  '条件查询' = '0943d61befec4c6cf2d21d170c9b066e',
  '数据操作' = '5246d2c81fa12b1f4f73635c257e232d',
  '列表展示' = '46a0f3086dce242abe54e48bd86e0394',
  '新增记录' = 'a4313469fd7361486fe47076629c76ac',
  '批量编辑' = 'e73cefac9d030927da1618c7b15c98c9',
  '批量删除' = '7fb62b30119c3797a843a48368463314',
  '模糊查询' = '6ff4bf3d567e977aa4c90c27dff1e6db',
  '简单查询' = 'c26996a6506adf397f0668d376d0b40b',
  '高级查询' = '9c4666fd08c2738eb9611a3721cb5f0f',
  '查看详情' = '5b48dbb8dc710cffe6313bb56a7f6d47',
  '编辑记录' = 'e22b59b6bda1cf9a58f8979fd0a0b43c',
  '删除记录' = 'a790208cafd5c95a18dd9a168319ecf8',
  '数据配置' = 'd75a7984d3fa5b32f5d8312e899aeea8',
  '功能配置' = 'c2f1f9254c245976e346377515c2e578',
  '生成模型数据列' = 'i8n_ag_generate_model_data_columns',
  '字段' = '9caecd931b956381e0763d05aa42835c',
  '列字段' = '4ca07911d10b74cc7c357b510e7cc948',
  '使用场景' = '7efcb0ce09e8842951c5cfd298b4e7ee',
  '数据源' = 'c11322c9cc43ce3c004cf03f5ac0acd0',
  '其他' = '0d98c74797e49d00bcc4c17c9d557a2b',
  '字段名称' = 'e996419dedc2f1ffd96e7a0e808127d0',
  '字段标题' = 'eea3ebc33e69694e0c12d4ab2e07a553',
  '标题' = '32c65d8d7431e76029678ec7bb73a5ab',
  '输入类型' = 'b3e55578af5dd473bab62641bb2f5f8e',
  '文字' = 'ca746b1ff10193a3ce20878dec04a733',
  '背景' = '8e1b944f4389bdaab6f11d5bc83190c8',
  '图标尺寸' = '7893f221dae53be8e3bfe72d2eb8a240',
  '名称' = 'd7ec2d3fea4756bc1642e0f10c180cf5',
  '类型' = '226b0912184333c81babf2f1894ec0c1',
  '气泡提示' = '7e9646e2db5ce66dc2b4b922ece483ba',
  '提示位置' = 'd586324c6d6b45cb78a4172d836dab3e',
}

/**
 * 国际化翻译
 * @param key
 * @returns
 */
export const getI18N = (key: string) => {
  return i18n(key)
}

/**
 * 更新/归一化处理表单项
 *
 * @param defaultBody 默认配置
 * @param body 输入配置
 * @param replace 是否完全替换
 * @returns
 */
const normalizeBodySchema = (
  defaultBody: Array<Record<string, any>>,
  body: Array<Record<string, any>> | Record<string, any>,
  replace: boolean = false,
  reverse: boolean = false,
  order: Record<string, number> = {},
) => {
  const normalizedBody = body ? (Array.isArray(body) ? body.concat() : [body]) : []
  const schema = flatten(
    replace
      ? normalizedBody
      : reverse
        ? [...normalizedBody, ...defaultBody]
        : [...defaultBody, ...normalizedBody],
  )

  return schema
}

const normalizCollapsedGroup = (publicProps = {}, body: any) => {
  return body
    ? Array.isArray(body)
      ? body
          .filter(item => item)
          .map((item, index) => ({
            ...publicProps,
            key: item.key || index.toString(),
            ...item,
            body: flatten(item.body),
          }))
      : [
          {
            ...publicProps,
            key: '0',
            ...body,
          },
        ]
    : []
}

/**
 * 表单项组件面板
 *
 * @param {Object=} panels
 * @param {string=} key
 * `property` 属性
 *     `common` 基本
 *     `status` 状态
 *     `validation` 校验
 * `style` 样式
 * `event` 事件
 * @param {string=} panels.body - 配置面板Schema
 * @param {boolean=} panels.replace - 是否完全替换默认Schema，默认追加
 * @param {Array} panels.validation.validationType - 默认显示的校验类型
 */
// export const formItemControlRefactor: (
//   panels: Partial<
//     Record<
//       FormItemControlPanel,
//       {
//         /**
//          * 标题
//          */
//         title?: string

//         /**
//          * 配置项内容
//          */
//         body?: any

//         /**
//          * 是否完全替换默认配置项
//          */
//         replace?: boolean

//         /**
//          * 配置项倒序排列
//          */
//         reverse?: boolean

//         /**
//          * 是否隐藏面板
//          */
//         hidden?: boolean

//         /**
//          * 配置项排序优先级
//          */
//         order?: Record<string, number>

//         /**
//          * 默认支持的校验规则
//          */
//         validationType?: ValidationOptions
//       }
//     >
//   >,
//   context?: BaseEventContext,
// ) => Array<any> = (panels, context) => {
//   const type = context?.schema?.type || ''
//   const supportStatic = SUPPORT_STATIC_FORMITEM_CMPTS.includes(type)
//   const collapseProps = {
//     type: 'collapse',
//     headingClassName: 'ae-formItemControl-header ae-Collapse-header',
//     bodyClassName: 'ae-formItemControl-body',
//   }
//   // 已经配置了的属性
//   // const propsList = Object.keys(context?.schema ?? {})
//   // 选项面版内容，支持Option的组件才展示该面板
//   const optionBody = normalizeBodySchema([], panels?.option?.body, panels?.option?.replace)

//   // 属性面板配置
//   const collapseGroupBody = panels?.property
//     ? normalizCollapsedGroup(collapseProps, panels?.property)
//     : [
//         {
//           ...collapseProps,
//           header: '基本',
//           key: 'common',
//           body: normalizeBodySchema(
//             [
//               ...dataModelItemPlugin,
//               // getSchemaTpl('formItemName', {
//               //   required: true,
//               // }),
//               getSchemaTpl('label'),
//               getSchemaTpl('labelRemark'),
//               getSchemaTpl('remark'),
//               getSchemaTpl('placeholder'),
//               getSchemaTpl('description'),
//             ],
//             panels?.common?.body,
//             panels?.common?.replace,
//             panels?.common?.reverse,
//           ),
//         },
//         ...(optionBody.length !== 0
//           ? [
//               {
//                 ...collapseProps,
//                 header: panels?.option?.title || '选项',
//                 key: 'option',
//                 body: optionBody,
//               },
//             ]
//           : []),
//         {
//           ...collapseProps,
//           header: '状态',
//           key: 'status',
//           body: normalizeBodySchema(
//             [
//               getSchemaTpl('visible'),
//               getSchemaTpl('hidden'),
//               getSchemaTpl('clearValueOnHidden'),
//               supportStatic ? getSchemaTpl('static') : null,
//               // TODO: 下面的部分表单项才有，是不是判断一下是否是表单项
//               getSchemaTpl('disabled'),
//             ],
//             panels?.status?.body,
//             panels?.status?.replace,
//             panels?.status?.reverse,
//           ),
//         },
//         // ...(panels?.validation?.hidden
//         //   ? []
//         //   : [
//         //       {
//         //         ...collapseProps,
//         //         className: 'ae-ValidationControl-Panel',
//         //         header: '校验',
//         //         key: 'validation',
//         //         body: normalizeBodySchema(
//         //           [
//         //             getSchemaTpl(
//         //               'validationControl',
//         //               panels?.validation?.validationType
//         //             ),
//         //             getSchemaTpl('validateOnChange'),
//         //             getSchemaTpl('submitOnChange')
//         //           ],
//         //           panels?.validation?.body,
//         //           panels?.validation?.replace,
//         //           panels?.validation?.reverse
//         //         )
//         //       }
//         //     ])
//       ]
//   return [
//     {
//       type: 'tabs',
//       tabsMode: 'line',
//       className: 'editor-prop-config-tabs',
//       linksClassName: 'editor-prop-config-tabs-links',
//       contentClassName: 'no-border editor-prop-config-tabs-cont',
//       tabs: [
//         {
//           title: i18n('24d67862f87f439db7ca957aecb77cce'), //'属性',
//           className: 'p-none',
//           body: [
//             {
//               type: 'collapse-group',
//               expandIconPosition: 'right',
//               expandIcon: {
//                 type: 'icon',
//                 icon: 'chevron-right',
//               },
//               className: 'ae-formItemControl',
//               activeKey: collapseGroupBody.map((group: any) => group.key),
//               body: collapseGroupBody,
//             },
//           ],
//         },
//         {
//           title: i18n('afcde2611bdd13c1e65b4fb6a2f13425'), //'外观',
//           body: normalizeBodySchema(
//             [
//               getSchemaTpl('formItemMode'),
//               getSchemaTpl('horizontalMode'),
//               getSchemaTpl('horizontal', {
//                 label: '',
//                 visibleOn: 'this.mode == "horizontal" && this.label !== false && this.horizontal',
//               }),
//               // renderer.sizeMutable !== false
//               //   ? getSchemaTpl('formItemSize')
//               //   : null,
//               getSchemaTpl('formItemInline'),
//               getSchemaTpl('className'),
//               getSchemaTpl('className', {
//                 label: 'Label CSS 类名',
//                 name: 'labelClassName',
//               }),
//               getSchemaTpl('className', {
//                 label: '控件 CSS 类名',
//                 name: 'inputClassName',
//               }),
//               getSchemaTpl('className', {
//                 label: '描述 CSS 类名',
//                 name: 'descriptionClassName',
//                 visibleOn: 'this.description',
//               }),
//               ...(!supportStatic
//                 ? []
//                 : [
//                     getSchemaTpl('className', {
//                       label: '静态 CSS 类名',
//                       name: 'staticClassName',
//                     }),
//                   ]),
//             ],
//             panels?.style?.body,
//             panels?.style?.replace,
//             panels?.style?.reverse,
//           ),
//         },
//         ...(isObject(context) && !panels?.event?.hidden
//           ? [
//               {
//                 title: i18n('10b2761db5a8e089049df39675abc550'), //'事件',
//                 className: 'p-none',
//                 body: normalizeBodySchema(
//                   [
//                     getSchemaTpl('eventControl', {
//                       name: 'onEvent',
//                       ...getEventControlConfig(context!.info.plugin.manager, context!),
//                     }),
//                   ],
//                   panels?.event?.body,
//                   panels?.event?.replace,
//                 ),
//               },
//             ]
//           : []),
//       ],
//     },
//   ]
// }

/**
 * 属性栏：数据字典
 * @param content
 * @returns
 */
export const dictIdProp = (content: any) => ({
  type: 'select',
  label: getI18N(i18nExtendEnum.数据字典),
  name: 'dictId',
  multiple: false,
  source: '${ls:AG_NEPTUNE_LOWCODE_DICT_NAME_LIST}',
  // source: {
  //   url: 'https://mock.apifox.com/m1/3546534-0-default/dictList',
  //   method: 'get',
  //   requestAdaptor: '',
  //   adaptor: '',
  //   messages: {},
  // },
  labelField: 'name',
  valueField: 'id',
  clearable: true,
  searchable: true,
  removable: false,
  placeholder: getI18N(i18nExtendEnum.数据字典),
  onEvent: {
    change: {
      weight: 0,
      actions: [
        {
          ignoreError: false,
          script: async (_ctx: any, _ac: any, event: any) => {
            const dictId = event.data.dictId
            if (dictId) {
              content.node.updateSchema({
                ...content.node.schema,
                source: "${'" + dictId + "'|getDictById}",
                valueField: 'dictValue',
                labelField: 'label',
              })
            } else {
              content.node.updateSchema({
                ...content.node.schema,
                source: '',
                valueField: '',
                labelField: '',
              })
            }
          },
          actionType: 'custom',
        },
      ],
    },
  },
})

/**
 * 右侧编辑事件，i8n显示问题，
 */
export const OPTION_EDIT_EVENTS_REFACTOR = [
  {
    eventName: 'addConfirm',
    eventLabel: '确认新增',
    description: '新增提交时触发',
    dataSchema: (manager: EditorManager) => {
      const { value, items, itemSchema } = resolveOptionEventDataSchame(manager)

      return [
        {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              title: '数据',
              properties: {
                item: {
                  type: 'object',
                  title: '新增的选项',
                  properties: itemSchema,
                },
                value,
                items,
              },
            },
          },
        },
      ]
    },
  },
  {
    eventName: 'editConfirm',
    eventLabel: getI18N(i18nExtendEnum.确认编辑), //'确认编辑',
    description: '编辑提交时触发',
    dataSchema: (manager: EditorManager) => {
      const { value, items, itemSchema } = resolveOptionEventDataSchame(manager)

      return [
        {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              title: '数据',
              properties: {
                item: {
                  type: 'object',
                  title: '编辑的选项',
                  properties: itemSchema,
                },
                value,
                items,
              },
            },
          },
        },
      ]
    },
  },
  {
    eventName: 'deleteConfirm',
    eventLabel: getI18N(i18nExtendEnum.确认删除), //'确认删除',
    description: '删除提交时触发',
    dataSchema: (manager: EditorManager) => {
      const { value, items, itemSchema } = resolveOptionEventDataSchame(manager)

      return [
        {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              title: '数据',
              properties: {
                item: {
                  type: 'object',
                  title: '删除的选项',
                  properties: itemSchema,
                },
                value,
                items,
              },
            },
          },
        },
      ]
    },
  },
]
