import { Schema } from 'amis-core'
import { NestedSelectControlPlugin } from 'amis-editor'
import { BaseEventContext, getSchemaTpl, tipedLabel } from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { inputStateTpl } from 'amis-editor/lib/renderer/style-control/helper'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
export class NestedSelectControlPluginRefacotr extends NestedSelectControlPlugin {
  // static id = 'NestedSelectControlPlugin';
  // // 关联渲染器名字
  // rendererName = 'nested-select';

  panelBodyCreator = (context: BaseEventContext) => {
    const renderer: any = context.info.renderer
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
              getSchemaTpl('clearable'),
              {
                type: 'ae-Switch-More',
                name: 'searchable',
                label: '可检索',
                mode: 'normal',
                value: false,
                hiddenOnDefault: true,
                formType: 'extend',
                form: {
                  body: [
                    {
                      type: 'input-text',
                      name: 'noResultsText',
                      label: tipedLabel('空提示', '检索无结果时的文本'),
                    },
                  ],
                },
              },
              getSchemaTpl('onlyLeaf'),
              [
                {
                  type: 'switch',
                  label: '可多选',
                  name: 'multiple',
                  value: false,
                  inputClassName: 'is-inline',
                },
                {
                  type: 'container',
                  className: 'ae-ExtendMore mb-3',
                  visibleOn: 'this.multiple',
                  body: [
                    {
                      type: 'switch',
                      label: tipedLabel(
                        '父级作为返回值',
                        '开启后选中父级，不会全选子级选项，并且父级作为值返回',
                      ),
                      horizontal: {
                        left: 6,
                        justify: true,
                      },
                      name: 'onlyChildren',
                      inputClassName: 'is-inline',
                      visibleOn: '!this.onlyLeaf',
                      pipeIn: (value: any) => !value,
                      pipeOut: (value: any) => !value,
                      onChange: (value: any, origin: any, item: any, form: any) => {
                        if (!value) {
                          // 父级作为返回值
                          form.setValues({
                            cascade: true,
                            withChildren: false,
                            onlyChildren: true,
                          })
                        } else {
                          form.setValues({
                            withChildren: false,
                            cascade: false,
                            onlyChildren: false,
                          })
                        }
                      },
                    },
                    getSchemaTpl('joinValues'),
                    getSchemaTpl('delimiter', {
                      visibleOn: 'this.joinValues',
                    }),
                    getSchemaTpl('extractValue', {
                      visibleOn: '!this.joinValues',
                    }),
                  ],
                },
              ],
              getSchemaTpl('valueFormula', {
                rendererSchema: (schema: Schema) => schema,
              }),
              getSchemaTpl('hideNodePathLabel'),
              getSchemaTpl('labelRemark'),
              getSchemaTpl('remark'),
              getSchemaTpl('placeholder'),
              getSchemaTpl('description'),
              getSchemaTpl('autoFillApi'),
            ],
          },
          {
            title: '选项',
            body: [
              getSchemaTpl('treeOptionControl'),
              getSchemaTpl(
                'loadingConfig',
                {
                  visibleOn: 'this.source || !this.options',
                },
                { context },
              ),
            ],
          },
          getSchemaTpl('status', { isFormItem: true }),
          getSchemaTpl('agValidation', {
            tag: (_data: any) => {
              return ValidatorTag.MultiSelect
            },
          }),
        ]),
      },
      {
        title: '外观',
        body: [
          getSchemaTpl('collapseGroup', [
            getSchemaTpl('theme:formItem'),
            getSchemaTpl('theme:form-label'),
            getSchemaTpl('theme:form-description'),
            {
              title: '选择框样式',
              body: [
                ...inputStateTpl(
                  'themeCss.nestedSelectControlClassName',
                  '--select-base'
                )
              ]
            },
            {
              title: '下拉框样式',
              body: [
                ...inputStateTpl(
                  'themeCss.nestedSelectPopoverClassName',
                  '--select-base-${state}-option',
                  {
                    state: [
                      {label: '常规', value: 'default'},
                      {label: '悬浮', value: 'hover'},
                      {label: '选中', value: 'focused'}
                    ]
                  }
                )
              ]
            },
            getSchemaTpl('theme:cssCode'),
            getSchemaTpl('style:classNames')
          ])
        ]
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
