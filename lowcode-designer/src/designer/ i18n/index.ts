import { extendLocale } from 'amis-core'

/**
 * 注册多语言
 */
export function registerCustomI18n() {
  extendLocale(
    'zh-CN',
    {
      i18n_ag_amis_editor_form_reset: '重置',
      i18n_ag_amis_editor_form_submit: '提交',
      i18n_ag_amis_editor_form_cancel: '取消',
      i18n_ag_data_dictionary: '数据字典',
      i18n_ag_refresh_data: '刷新数据',
      i18n_ag_models_list: '模型列表',
      i18n_ag_model_field: '模型字段',
      i8n_ag_generate_model_data_columns: '生成模型数据列',
      '55d4790c5d819cd0462cbe89561b0dd4': '数字',
      ed3dd0bfa89500c5feb306cd4d9db56c: '正则',
      b457177c184722b655954a08cf3f71ca: '自定义正则',
      d3927ffde0fdefc47f910e70226d6a4e: '自定义正则2',
      '0ebee58f4f2a0f807f08a6427dc58497': '自定义正则3',
      '15f52cddb226421e68c70488fff3db5b': '自定义正则4',
      '271b01959e09c0771760f59964baed56': '自定义正则5',
      a9400c408441f1f7f6d6954deb05ae9a: '表达式',
      b457177c184722b655954a08cf3f71ca1: '自定义正则1',
      b457177c184722b655954a08cf3f71ca2: '自定义正则2',
      b457177c184722b655954a08cf3f71ca3: '自定义正则3',
      b457177c184722b655954a08cf3f71ca4: '自定义正则4',
      '92448a35f41de3a1fa69135acfed5ce9': '手机号码',
      '537b39a8b56fdc27a5fdd70aa032d3bc': '必填',
      eb242bc7524c797fb1aee2344dec92da: '与指定值相同',
      a4313469fd7361486fe47076629c76ac: '新增记录',
    },
    true,
  )
  extendLocale(
    'en-US',
    {
      i18n_ag_amis_editor_form_reset: 'reset',
      i18n_ag_amis_editor_form_submit: 'submit',
      i18n_ag_amis_editor_form_cancel: 'cancel',
      i18n_ag_data_dictionary: 'Dictionary',
      i18n_ag_refresh_data: 'refresh data',
      i18n_ag_models_list: 'Models List',
      i18n_ag_model_field: 'model field',
      i8n_ag_generate_model_data_columns: 'generate data columns',
      '55d4790c5d819cd0462cbe89561b0dd4': 'Number',
      ed3dd0bfa89500c5feb306cd4d9db56c: 'Regular expressions',
      b457177c184722b655954a08cf3f71ca: 'Custom regular',
      d3927ffde0fdefc47f910e70226d6a4e: 'Custom regular2',
      '0ebee58f4f2a0f807f08a6427dc58497': 'Custom regular3',
      '15f52cddb226421e68c70488fff3db5b': 'Custom regular4',
      '271b01959e09c0771760f59964baed56': 'Custom regular5',
      a9400c408441f1f7f6d6954deb05ae9a: 'expression',
      b457177c184722b655954a08cf3f71ca1: 'Custom regular1',
      b457177c184722b655954a08cf3f71ca2: 'Custom regular2',
      b457177c184722b655954a08cf3f71ca3: 'Custom regular3',
      b457177c184722b655954a08cf3f71ca4: 'Custom regular4',
      ab90c616dd114af087b31b90d3cb4063: 'Number of characters',
      '92448a35f41de3a1fa69135acfed5ce9': 'Mobile phone number',
      '537b39a8b56fdc27a5fdd70aa032d3bc': 'Required',
      eb242bc7524c797fb1aee2344dec92da: 'Identical to the specified value',
      a4313469fd7361486fe47076629c76ac: 'Add record',
    },
    true,
  )
}
