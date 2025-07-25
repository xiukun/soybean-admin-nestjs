import { setIconVendor } from 'amis'
import { registerEditorPlugin, unRegisterEditorPlugin } from 'amis-editor-core'

// 设计器左侧新增的功能菜单
import LeftCommonTemplate from './plugins/plugin-left-common-template/plugin'
import LeftBlockComponent from './plugins/plugin-left-block-component/plugin'
// import './plugins/plugin-disabled-editor' // 隐藏部分基础组件

// 重构扩展amis的plugin
import initRefactorBasePlugin from './refactor'
import iconsList from '@/utils/icons'
import LeftDatabaseApi from './plugins/plugin-left-database-api/plugin'

// import { TableCRUDPluginRefactor } from '@/components/CustomCrud2/plugin'
// import CrudRendererRefactor from '@/components/CustomCrud/renderer'

import setTplApi from './refactor/tpl-api'
// import { AgCrudPluginRefactor } from '@/components/CustomAgCrud/plugin'
import { CrudPluginRefactor } from '@/components/CustomCrud/plugin'
import { FormPluginRefactor } from '@/components/CustomForm/plugin'
import { id as textID, TextPluginRefactor } from '@/components/CustomInputText/plugin'
import { id as emailID, EmailControlPluginRefactor } from '@/components/CustomInputEmail/plugin'
import { id as numberID, NumberControlPluginRefactor } from '@/components/CustomInputNumber/plugin'
import {
  id as passwordID,
  PasswordControlPluginRefactor,
} from '@/components/CustomInputPassword/plugin'

import { id as urlID, URLControlPluginRefactor } from '@/components/CustomInputUrl/plugin'
import { TextareaControlPluginRefactor } from '@/components/CustomTextarea/plugin'
import { SelectControlPluginRefactor } from '@/components/CustomSelect/plugin'
import { ChainedSelectControlPluginRefactor } from '@/components/CustomChainedSelect/plugin'
import { NestedSelectControlPluginRefacotr } from '@/components/CustomNestedSelect/plugin'
import { CheckboxControlPluginRefactor } from '@/components/CustomCheckbox/plugin'
import { CheckboxesControlPluginRefacotr } from '@/components/CustomCheckboxes/plugin'
import { RadiosControlPluginRefactor } from '@/components/CustomRadios/plugin'
import { DateControlPluginRefactor } from '@/components/CustomInputDate/plugin'
import { DateTimeControlPluginRefactor } from '@/components/CustomInputDateTime/plugin'
import { DateRangeControlPluginRefactor } from '@/components/CustomInputDateRange/plugin'
import { FileControlPluginRefactor } from '@/components/CustomFile/plugin'
import { ImageControlPluginRefactor } from '@/components/CustomInputImage/plugin'
import { ExcelControlPluginRefactor } from '@/components/CustomExcel/plugin'
import { TreeControlPluginRefactor } from '@/components/CustomInputTree/plugin'
import { TagControlPluginRefactor } from '@/components/CustomInputTag/plugin'
import { ListControlPluginRefactor } from '@/components/CustomListSelect/plugin'
import { ButtonGroupControlPluginRefactor } from '@/components/CustomButtonGroupSelect/plugin'
import { PickerControlPluginRefactor } from '@/components/CustomPicker/plugin'
import { SwitchControlPluginRefactor } from '@/components/CustomSwitch/plugin'
import { RangeControlPluginRefactor } from '@/components/CustomInputRange/plugin'
import { RateControlPluginRefactor } from '@/components/CustomInputRating/plugin'
import { CityControlPluginRefacotr } from '@/components/CustomInputCity/plugin'
import { TransferPluginRefactor } from '@/components/CustomTransfer/plugin'
import { TabsTransferPluginRefactor } from '@/components/CustomTabsTransfer/plugin'
import { ColorControlPluginRefactor } from '@/components/CustomInputColor/plugin'
import { ComboControlPluginRefactor } from '@/components/CustomCombo/plugin'
import { TableControlPluginRefactor } from '@/components/CustomInputTable/plugin'
import { RichTextControlPluginRefactor } from '@/components/CustomInputRichText/plugin'
import { SearchBoxPluginRefactor } from '@/components/CustomSearchBox/plugin'
import { RepeatControlPluginRefactor } from '@/components/CustomInputRepeat/plugin'
import { StaticControlPluginRefactor } from '@/components/CustomStatic/plugin'
import { TableCellPluginRefactor } from '@/components/CustomTableCell/plugin'
import { TableCell2PluginRefactor } from '@/components/CustomTableCell2/plugin'
import { ServicePluginRefactor } from '@/components/CustomService/plugin'
import { MappingPluginRefactor } from '@/components/CustomMapping/plugin'
import { NavPluginRefactor } from '@/components/CustomNav/plugin'
import { ButtonPluginRefactor } from '@/components/CustomButton/plugin'
import { TabsPluginRefactor } from '@/components/CustomTabs/plugin'
import { TablePluginRefactor } from '@/components/CustomTable/plugin'
import { FormulaControlPluginRender } from '@/components/CustomFormula/plugin'
import { DialogPluginRefactor } from '@/components/CustomDialog/plugin'

import LeftVersionsManage from './plugins/plugin-left-versions-manage/plugin'
import RightCommonProperties from './plugins/plugin-right-common-properties/plugin'
import { GlobalVarPlugin } from 'amis-editor'

const registerCompoments = () => {
  initRefactorBasePlugin()
  setTplApi()
  // editor left menu
  registerEditorPlugin(GlobalVarPlugin)

  registerEditorPlugin(LeftCommonTemplate)
  registerEditorPlugin(LeftBlockComponent)
  registerEditorPlugin(LeftDatabaseApi)
  registerEditorPlugin(LeftVersionsManage)
  registerEditorPlugin(RightCommonProperties as any)
  

  // base component
//   unRegisterEditorPlugin(AgCrudPluginRefactor.id)
//   registerEditorPlugin(AgCrudPluginRefactor)
  unRegisterEditorPlugin(CrudPluginRefactor.id)
  registerEditorPlugin(CrudPluginRefactor)
  //crud2 table
  // unRegisterEditorPlugin(TableCRUDPluginRefactor.id)
  // registerEditorPlugin(TableCRUDPluginRefactor as any)
  unRegisterEditorPlugin(FormPluginRefactor.id)
  registerEditorPlugin(FormPluginRefactor as any)
  unRegisterEditorPlugin(textID)
  registerEditorPlugin(TextPluginRefactor as any)
  unRegisterEditorPlugin(emailID)
  registerEditorPlugin(EmailControlPluginRefactor as any)
  unRegisterEditorPlugin(passwordID)
  registerEditorPlugin(PasswordControlPluginRefactor as any)
  unRegisterEditorPlugin(numberID)
  registerEditorPlugin(NumberControlPluginRefactor as any)
  unRegisterEditorPlugin(urlID)
  registerEditorPlugin(URLControlPluginRefactor as any)
  unRegisterEditorPlugin(TextareaControlPluginRefactor.id)
  registerEditorPlugin(TextareaControlPluginRefactor as any)

  unRegisterEditorPlugin(SelectControlPluginRefactor.id)
  registerEditorPlugin(SelectControlPluginRefactor as any)

  unRegisterEditorPlugin(ChainedSelectControlPluginRefactor.id)
  registerEditorPlugin(ChainedSelectControlPluginRefactor as any)

  unRegisterEditorPlugin(NestedSelectControlPluginRefacotr.id)
  registerEditorPlugin(NestedSelectControlPluginRefacotr as any)

  unRegisterEditorPlugin(CheckboxControlPluginRefactor.id)
  registerEditorPlugin(CheckboxControlPluginRefactor as any)

  unRegisterEditorPlugin(CheckboxesControlPluginRefacotr.id)
  registerEditorPlugin(CheckboxesControlPluginRefacotr as any)

  unRegisterEditorPlugin(RadiosControlPluginRefactor.id)
  registerEditorPlugin(RadiosControlPluginRefactor as any)

  unRegisterEditorPlugin(DateControlPluginRefactor.id)
  registerEditorPlugin(DateControlPluginRefactor as any)

  unRegisterEditorPlugin(DateTimeControlPluginRefactor.id)
  registerEditorPlugin(DateTimeControlPluginRefactor)

  unRegisterEditorPlugin(DateRangeControlPluginRefactor.id)
  registerEditorPlugin(DateRangeControlPluginRefactor as any)

  unRegisterEditorPlugin(FileControlPluginRefactor.id)
  registerEditorPlugin(FileControlPluginRefactor as any)

  unRegisterEditorPlugin(ImageControlPluginRefactor.id)
  registerEditorPlugin(ImageControlPluginRefactor as any)

  unRegisterEditorPlugin(ExcelControlPluginRefactor.id)
  registerEditorPlugin(ExcelControlPluginRefactor as any)

  unRegisterEditorPlugin(TreeControlPluginRefactor.id)
  registerEditorPlugin(TreeControlPluginRefactor as any)

  unRegisterEditorPlugin(TagControlPluginRefactor.id)
  registerEditorPlugin(TagControlPluginRefactor as any)

  unRegisterEditorPlugin(ListControlPluginRefactor.id)
  registerEditorPlugin(ListControlPluginRefactor as any)

  unRegisterEditorPlugin(ButtonGroupControlPluginRefactor.id)
  registerEditorPlugin(ButtonGroupControlPluginRefactor as any)

  unRegisterEditorPlugin(PickerControlPluginRefactor.id)
  registerEditorPlugin(PickerControlPluginRefactor as any)

  unRegisterEditorPlugin(SwitchControlPluginRefactor.id)
  registerEditorPlugin(SwitchControlPluginRefactor as any)

  unRegisterEditorPlugin(RangeControlPluginRefactor.id)
  registerEditorPlugin(RangeControlPluginRefactor as any)

  unRegisterEditorPlugin(RateControlPluginRefactor.id)
  registerEditorPlugin(RateControlPluginRefactor as any)

  unRegisterEditorPlugin(CityControlPluginRefacotr.id)
  registerEditorPlugin(CityControlPluginRefacotr as any)

  unRegisterEditorPlugin(TransferPluginRefactor.id)
  registerEditorPlugin(TransferPluginRefactor as any)

  unRegisterEditorPlugin(TabsTransferPluginRefactor.id)
  registerEditorPlugin(TabsTransferPluginRefactor as any)

  unRegisterEditorPlugin(ColorControlPluginRefactor.id)
  registerEditorPlugin(ColorControlPluginRefactor as any)

  unRegisterEditorPlugin(ComboControlPluginRefactor.id)
  registerEditorPlugin(ComboControlPluginRefactor as any)

  unRegisterEditorPlugin(TableControlPluginRefactor.id)
  registerEditorPlugin(TableControlPluginRefactor as any)

  unRegisterEditorPlugin(RichTextControlPluginRefactor.id)
  registerEditorPlugin(RichTextControlPluginRefactor as any)

  unRegisterEditorPlugin(SearchBoxPluginRefactor.id)
  registerEditorPlugin(SearchBoxPluginRefactor as any)

  unRegisterEditorPlugin(RepeatControlPluginRefactor.id)
  registerEditorPlugin(RepeatControlPluginRefactor as any)

  unRegisterEditorPlugin(StaticControlPluginRefactor.id)
  registerEditorPlugin(StaticControlPluginRefactor as any)

  unRegisterEditorPlugin(TableCellPluginRefactor.id)
  registerEditorPlugin(TableCellPluginRefactor as any)

  unRegisterEditorPlugin(TableCell2PluginRefactor.id)
  registerEditorPlugin(TableCell2PluginRefactor as any)

  unRegisterEditorPlugin(ServicePluginRefactor.id)
  registerEditorPlugin(ServicePluginRefactor as any)

  unRegisterEditorPlugin(MappingPluginRefactor.id)
  registerEditorPlugin(MappingPluginRefactor as any)

  unRegisterEditorPlugin(NavPluginRefactor.id)
  registerEditorPlugin(NavPluginRefactor as any)

  unRegisterEditorPlugin(ButtonPluginRefactor.id)
  registerEditorPlugin(ButtonPluginRefactor as any)

  unRegisterEditorPlugin(TabsPluginRefactor.id)
  registerEditorPlugin(TabsPluginRefactor as any)

  unRegisterEditorPlugin(TablePluginRefactor.id)
  registerEditorPlugin(TablePluginRefactor as any)

  unRegisterEditorPlugin(FormulaControlPluginRender.id)
  registerEditorPlugin(FormulaControlPluginRender as any)

  unRegisterEditorPlugin(DialogPluginRefactor.id)
  registerEditorPlugin(DialogPluginRefactor as any)

  // Renderer({ type: 'ag-tag', autoVar: true })(AnjiTag as any)
  // registerEditorPlugin(TagPluginRefactor as any)
  // Renderer({ type: 'ag-split-pane' })(SplitPane as any)
  // registerEditorPlugin(AgSplitPane as any)

  setIconVendor(iconsList)
}

export default registerCompoments
