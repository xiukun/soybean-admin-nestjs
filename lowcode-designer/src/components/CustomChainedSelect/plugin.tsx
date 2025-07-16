import { Schema } from 'amis-core'
import { ChainedSelectControlPlugin } from 'amis-editor'
import { BaseEventContext, tipedLabel, getSchemaTpl, defaultValue } from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
import { inputStateTpl } from 'amis-editor/lib/renderer/style-control/helper'
export class ChainedSelectControlPluginRefactor extends ChainedSelectControlPlugin {
  // static id = 'ChainedSelectControlPlugin'

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

              getSchemaTpl('valueFormula', {
                rendererSchema: (schema: Schema) => schema,
                mode: 'vertical', // 改成上下展示模式
                rendererWrapper: true,
                label: tipedLabel('默认值', '请填入选项 Options 中 value 值'),
              }),

              getSchemaTpl('switch', {
                label: tipedLabel(
                  '拼接值',
                  '开启后将选中的选项 value 的值用连接符拼接起来，作为当前表单项的值',
                ),
                name: 'joinValues',
                pipeIn: defaultValue(true),
              }),

              getSchemaTpl('delimiter', {
                visibleOn: 'this.joinValues !== false',
                clearValueOnHidden: true,
              }),

              getSchemaTpl('extractValue', {
                visibleOn: 'this.joinValues === false',
                clearValueOnHidden: true,
              }),

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
              getSchemaTpl('apiControl', {
                name: 'source',
                mode: 'normal',
                label: tipedLabel(
                  '获取选项接口',
                  `<div>可用变量说明</div><ul>
                      <li><code>value</code>当前值</li>
                      <li><code>level</code>拉取级别，从 <code>1</code>开始。</li>
                      <li><code>parentId</code>上一层选中的 <code>value</code> 值</li>
                      <li><code>parent</code>上一层选中选项，包含 <code>label</code> 和 <code>value</code> 的值。</li>
                  </ul>`,
                  {
                    maxWidth: 'unset',
                  },
                ),
              }),

              getSchemaTpl(
                'loadingConfig',
                {
                  visibleOn: 'this.source || !this.options',
                },
                { context },
              ),

              {
                type: 'input-text',
                name: 'labelField',
                label: tipedLabel(
                  '选项标签字段',
                  '默认渲染选项组，会获取每一项中的label变量作为展示文本',
                ),
                pipeIn: defaultValue('label'),
              },

              {
                type: 'input-text',
                name: 'valueField',
                label: tipedLabel(
                  '选项值字段',
                  '默认渲染选项组，会获取每一项中的value变量作为表单项值',
                ),
                pipeIn: defaultValue('value'),
              },
            ],
          },
          getSchemaTpl('status', { isFormItem: true }),
          getSchemaTpl('agValidation', { tag: ValidatorTag.MultiSelect }),
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
                  'themeCss.chainedSelectControlClassName',
                  '--select-base'
                )
              ]
            },
            {
              title: '下拉框样式',
              body: [
                ...inputStateTpl(
                  'themeCss.chainedSelectPopoverClassName',
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
