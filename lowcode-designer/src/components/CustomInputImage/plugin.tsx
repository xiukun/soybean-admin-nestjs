import { ImageControlPlugin } from 'amis-editor'
import { getSchemaTpl, valuePipeOut, BaseEventContext } from 'amis-editor-core'
import { tipedLabel } from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'

const addBtnCssClassName = 'themeCss.addBtnControlClassName'
const IconCssClassName = 'themeCss.iconControlClassName'
const editorPath = 'inputImage.base'
const inputStateFunc = (visibleOn: string, state: string) => {
  return [
    getSchemaTpl('theme:border', {
      name: `${addBtnCssClassName}.border:${state}`,
      visibleOn: visibleOn,
      editorThemePath: `${editorPath}.${state}.body.border`,
    }),
    getSchemaTpl('theme:colorPicker', {
      label: '文字',
      name: `${addBtnCssClassName}.color:${state}`,
      labelMode: 'input',
      visibleOn: visibleOn,
      editorThemePath: `${editorPath}.${state}.body.color`,
    }),
    getSchemaTpl('theme:colorPicker', {
      label: '背景',
      name: `${addBtnCssClassName}.background:${state}`,
      labelMode: 'input',
      needGradient: true,
      needImage: true,
      visibleOn: visibleOn,
      editorThemePath: `${editorPath}.${state}.body.bg-color`,
    }),
    getSchemaTpl('theme:colorPicker', {
      label: '图标',
      name: `${addBtnCssClassName}.icon-color:${state}`,
      labelMode: 'input',
      visibleOn: visibleOn,
      editorThemePath: `${editorPath}.${state}.body.icon-color`,
    }),
  ]
}

export class ImageControlPluginRefactor extends ImageControlPlugin {
  // static id = 'ImageControlPlugin'
  // // 关联渲染器名字
  // rendererName = 'input-image'

  panelBodyCreator = (context: BaseEventContext) => {
    return getSchemaTpl('tabs', [
      {
        title: '属性',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '基本',
            body: [
              getSchemaTpl('layout:originPosition', { value: 'left-top' }),
              ...dataModelItemPlugin,
              // getSchemaTpl('formItemName', {
              //   required: true,
              // }),
              getSchemaTpl('label'),

              {
                type: 'input-text',
                name: 'value',
                label: '默认值',
                visibleOn: 'typeof this.value !== "undefined"',
              },

              {
                type: 'input-text',
                value: '.jpeg, .jpg, .png, .gif',
                name: 'accept',
                label: tipedLabel(
                  '图片类型',
                  '请填入图片的后缀或 <code>MimeType</code>，多个类型用<code>,</code>隔开',
                ),
              },

              {
                type: 'input-text',
                name: 'frameImage',
                label: '占位图片地址',
              },

              getSchemaTpl('uploadType', {
                visibleOn: 'this.submitType === "asUpload" || !this.submitType',
                pipeIn: (value: any, _form: any) => value || 'fileReceptor',
                pipeOut: (value: any, _form: any) => value || 'fileReceptor',
              }),

              getSchemaTpl('apiControl', {
                mode: 'row',
                name: 'receiver',
                label: tipedLabel('文件接收器', '文件接收接口，默认不填则上传到 hiphoto'),
                visibleOn: 'this.uploadType === "fileReceptor"',
                value: '/api/upload',
                __isUpload: true,
              }),

              getSchemaTpl('bos', {
                visibleOn: 'this.uploadType === "bos"',
              }),

              getSchemaTpl('proxy', {
                value: true,
              }),
              // getSchemaTpl('autoFill'),

              getSchemaTpl('multiple', {
                patch: {
                  value: false,
                  visibleOn: '!this.crop',
                  label: tipedLabel('可多选', '开启后，不能同时开启裁剪功能'),
                },
                body: [
                  {
                    name: 'maxLength',
                    label: '最大数量',
                    type: 'input-number',
                  },
                ],
              }),

              getSchemaTpl('switch', {
                name: 'hideUploadButton',
                label: '隐藏上传按钮',
                value: false,
              }),

              getSchemaTpl('switch', {
                name: 'autoUpload',
                label: '自动上传',
                value: false,
              }),

              // getSchemaTpl('switch', {
              //   name: 'compress',
              //   value: true,
              //   label: tipedLabel(
              //     '开启压缩',
              //     '由 hiphoto 实现，自定义接口将无效'
              //   )
              // }),
              // {
              //   type: 'container',
              //   className: 'ae-ExtendMore mb-3',
              //   visibleOn: 'this.compress',
              //   name: 'compressOptions',
              //   body: [
              //     {
              //       type: 'input-number',
              //       label: '最大宽度',
              //       name: 'compressOptions.maxWidth'
              //     },

              //     {
              //       type: 'input-number',
              //       label: '最大高度',
              //       name: 'compressOptions.maxHeight'
              //     }
              //   ]
              // },

              // getSchemaTpl('switch', {
              //   name: 'showCompressOptions',
              //   label: '显示压缩选项'
              // }),

              getSchemaTpl('switch', {
                name: 'crop',
                visibleOn: '!this.multiple',
                label: tipedLabel('开启裁剪', '开启后，不能同时开启多选模式'),
                pipeIn: (value: any) => !!value,
              }),

              {
                type: 'container',
                className: 'ae-ExtendMore mb-3',
                visibleOn: 'this.crop',
                body: [
                  {
                    name: 'crop.aspectRatio',
                    type: 'input-text',
                    label: '裁剪比率',
                    pipeOut: valuePipeOut,
                  },

                  getSchemaTpl('switch', {
                    name: 'crop.rotatable',
                    label: '裁剪时可旋转',
                    pipeOut: valuePipeOut,
                  }),

                  getSchemaTpl('switch', {
                    name: 'crop.scalable',
                    label: '裁剪时可缩放',
                    pipeOut: valuePipeOut,
                  }),

                  {
                    name: 'crop.viewMode',
                    type: 'select',
                    label: '裁剪区域',
                    value: 1,
                    options: [
                      { label: '无限制', value: 0 },
                      { label: '绘图区域', value: 1 },
                    ],
                    pipeOut: valuePipeOut,
                  },
                  {
                    name: 'cropQuality',
                    type: 'input-number',
                    label: tipedLabel(
                      '压缩质量',
                      '裁剪后会重新生成，体积可能会变大，需要设置压缩质量降低体积，数值越小压缩率越高',
                    ),
                    step: 0.1,
                    min: 0.1,
                    max: 1,
                    value: 0.7,
                  },
                ],
              },

              getSchemaTpl('switch', {
                name: 'limit',
                label: '图片限制',
                pipeIn: (value: any) => !!value,
              }),

              {
                type: 'container',
                className: 'ae-ExtendMore mb-3',
                visibleOn: 'this.limit',
                body: [
                  {
                    name: 'maxSize',
                    type: 'input-number',
                    suffix: 'B',
                    label: tipedLabel('最大体积', '超出大小不允许上传，单位字节'),
                  },
                  {
                    type: 'input-number',
                    name: 'limit.width',
                    label: tipedLabel('宽度', '校验优先级比最大宽度和最大宽度高'),
                  },

                  {
                    type: 'input-number',
                    name: 'limit.height',
                    label: tipedLabel('高度', '校验优先级比最大高度和最大高度高'),
                  },

                  {
                    type: 'input-number',
                    name: 'limit.maxWidth',
                    label: '最大宽度',
                  },

                  {
                    type: 'input-number',
                    name: 'limit.maxHeight',
                    label: '最大高度',
                  },

                  {
                    type: 'input-number',
                    name: 'limit.minWidth',
                    label: '最小宽度',
                  },

                  {
                    type: 'input-number',
                    name: 'limit.minHeight',
                    label: '最小高度',
                  },

                  {
                    type: 'input-number',
                    name: 'limit.aspectRatio',
                    label: '宽高比率',
                  },

                  {
                    type: 'input-text',
                    name: 'limit.aspectRatioLabel',
                    label: tipedLabel(
                      '宽高比描述',
                      '当宽高比没有满足条件时，此描述将作为提示信息显示',
                    ),
                  },
                ],
              },
            ],
          },
          getSchemaTpl('status', {
            isFormItem: true,
            unsupportStatic: true,
          }),
          getSchemaTpl('agValidation', { tag: ValidatorTag.File }),
        ]),
      },
      {
        title: '外观',
        body: getSchemaTpl(
          'collapseGroup',
          [
            getSchemaTpl('style:formItem', { renderer: context.info.renderer }),
            {
              title: '基本样式',
              body: [
                {
                  type: 'select',
                  name: '__editorState',
                  label: '状态',
                  selectFirst: true,
                  options: [
                    {
                      label: '常规',
                      value: 'default',
                    },
                    {
                      label: '悬浮',
                      value: 'hover',
                    },
                    {
                      label: '点击',
                      value: 'active',
                    },
                  ],
                },
                ...inputStateFunc("${__editorState == 'default' || !__editorState}", 'default'),
                ...inputStateFunc("${__editorState == 'hover'}", 'hover'),
                ...inputStateFunc("${__editorState == 'active'}", 'active'),
                getSchemaTpl('theme:radius', {
                  name: `${addBtnCssClassName}.border-radius`,
                  label: '圆角',
                  editorThemePath: `${editorPath}.default.body.border`,
                }),
                {
                  name: `${addBtnCssClassName}.--inputImage-base-default-icon`,
                  label: '选择图标',
                  type: 'icon-select',
                  returnSvg: true,
                },
                getSchemaTpl('theme:select', {
                  name: `${IconCssClassName}.iconSize`,
                  label: '图标大小',
                  editorThemePath: `${editorPath}.default.body.icon-size`,
                }),
                getSchemaTpl('theme:select', {
                  name: `${IconCssClassName}.margin-bottom`,
                  label: '图标底边距',
                  editorThemePath: `${editorPath}.default.body.icon-margin`,
                }),
              ],
            },
            getSchemaTpl('theme:cssCode', {
              themeClass: [
                {
                  name: '图片上传按钮',
                  value: 'addOn',
                  className: 'addBtnControlClassName',
                  state: ['default', 'hover', 'active'],
                },
                {
                  name: '上传图标',
                  value: 'icon',
                  className: 'iconControlClassName',
                },
              ],
              isFormItem: true,
            }),
          ],
          { ...context?.schema, configTitle: 'style' },
        ),
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
