import { registerFormItem, unRegisterRenderer } from 'amis'
import AeApiControlRefactor from './ae-api-control'
import { AgModelBindingControlRenderer } from './model-binding/ag-model-binding-control'
import { ApiDSBuilderRefactor } from './api-ds-builder'
import { registerDSBuilder } from 'amis-editor'
import AeValidationControlRenderer from './validation/ae-validation-control'
import AeFieldSettingRefactor from './ae-field-setting'
import { CRUDToolbarControlRenderer } from './ae-crud-toolbar-control'
import { AgCRUDColumnControlRenderer } from '@/components/CustomTable/AgCRUDColumnControl'

registerDSBuilder(ApiDSBuilderRefactor as any)
/**
 * 重构扩展amis的plugin
 */
export default function initRefactorBasePlugin() {
  //注销原有组件
  unRegister()

  //注册重构组件
  registerFormItem({
    type: 'ag-ae-crud-column-control',
    renderLabel: false,
    wrap: false,
    component: AgCRUDColumnControlRenderer as any,
  })
  registerFormItem({
    type: 'ag-modelBindingControl',
    // renderLabel: false,
    component: AgModelBindingControlRenderer as any,
  })
  registerFormItem({
    type: 'ae-apiControl',
    renderLabel: false,
    component: AeApiControlRefactor as any,
  })

  registerFormItem({
    type: 'ae-field-setting',
    renderLabel: false,
    component: AeFieldSettingRefactor as any,
  })

  registerFormItem({
    type: 'ae-crud-toolbar-control',
    renderLabel: false,
    wrap: false,
    component: CRUDToolbarControlRenderer as any,
  })

  // 基础组件 右侧 校验 i18n无效，重写相关方法
  registerFormItem({
    type: 'ag-ae-validationControl',
    renderLabel: false,
    component: AeValidationControlRenderer as any,
  })
}
/**
 * 注销原有组件
 */
function unRegister() {
  unRegisterRenderer('ae-DataBindingControl')
  unRegisterRenderer('ae-apicontrol')
  unRegisterRenderer('ae-field-setting')
  unRegisterRenderer('ae-crud-toolbar-control')
}
