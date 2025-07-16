import { Schema } from 'amis-core'
import { ButtonGroupControlPlugin } from 'amis-editor'
import { getSchemaTpl, defaultValue, BaseEventContext, tipedLabel } from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'

export class ButtonGroupControlPluginRefactor extends ButtonGroupControlPlugin {
  // static id = 'ButtonGroupControlPlugin';
  // // 关联渲染器名字
  // rendererName = 'button-group-select';

  panelBodyCreator = (context: BaseEventContext) => {
    return getSchemaTpl('tabs', [
      {
        title: '属性',
        body: [
          getSchemaTpl('collapseGroup', [
            {
              title: '基本',
              body: [
                getSchemaTpl('layout:originPosition', { value: 'left-top' }),
                ...dataModelItemPlugin,
                // getSchemaTpl('formItemName', {
                //   required: true,
                // }),
                getSchemaTpl('label'),
                getSchemaTpl('multiple'),
                getSchemaTpl('valueFormula', {
                  rendererSchema: (schema: Schema) => schema,
                  useSelectMode: true, // 改用 Select 设置模式
                  visibleOn: 'this.options && this.options.length > 0',
                }),
                getSchemaTpl('description'),
              ],
            },
            {
              title: '按钮管理',
              body: [getSchemaTpl('nav-badge'), getSchemaTpl('optionControlV2')],
            },
            getSchemaTpl('status', {
              isFormItem: true,
            }),
            getSchemaTpl('agValidation', { tag: ValidatorTag.MultiSelect }),
          ]),
        ],
      },
      {
        title: '外观',
        body: [
          getSchemaTpl('collapseGroup', [
            {
              title: '基本',
              body: [
                getSchemaTpl('formItemMode'),
                getSchemaTpl('horizontal', {
                  label: '',
                  visibleOn: 'this.mode == "horizontal" && this.label !== false && this.horizontal',
                }),
                getSchemaTpl('switch', {
                  name: 'tiled',
                  label: tipedLabel('平铺模式', '使按钮宽度占满父容器，各按钮宽度自适应'),
                  pipeIn: defaultValue(false),
                  visibleOn: 'this.mode !== "inline"',
                }),
                getSchemaTpl('size'),
                getSchemaTpl('buttonLevel', {
                  label: '按钮样式',
                  name: 'btnLevel',
                }),
                getSchemaTpl('buttonLevel', {
                  label: '按钮选中样式',
                  name: 'btnActiveLevel',
                  pipeIn: defaultValue('primary'),
                }),
              ],
            },
            getSchemaTpl('style:classNames', {
              isFormItem: true,
              schema: [
                getSchemaTpl('className', {
                  label: '按钮',
                  name: 'btnClassName',
                }),
              ],
            }),
          ]),
        ],
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
