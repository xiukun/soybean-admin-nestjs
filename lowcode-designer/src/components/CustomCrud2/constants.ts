/**
 * @file constants.ts
 * @desc CRUD 配置相关常量
 */

import { getI18N, i18nExtendEnum } from '../common/utils'

export const ToolsConfig = {
  groupName: 'tools',
  options: [
    {
      label: getI18N(i18nExtendEnum.新增记录), //'新增记录',
      value: 'Insert',
      align: 'left',
      icon: 'fas fa-layer-group',
      order: 10,
    },
    {
      label: getI18N(i18nExtendEnum.批量编辑), //'批量编辑',
      value: 'BulkEdit',
      align: 'left',
      icon: 'fa fa-layer-group',
      order: 20,
    },
    {
      label: getI18N(i18nExtendEnum.批量删除), //'批量删除',
      value: 'BulkDelete',
      align: 'left',
      icon: 'fa fa-layer-group',
      order: 30,
    },
  ],
}

export const FiltersConfig = {
  groupName: 'filters',
  options: [
    {
      label: getI18N(i18nExtendEnum.模糊查询),
      value: 'FuzzyQuery',
      icon: 'fa fa-search',
      order: 10,
    },
    {
      label: getI18N(i18nExtendEnum.简单查询),
      value: 'SimpleQuery',
      icon: 'fa fa-search',
      order: 20,
    },
    {
      label: getI18N(i18nExtendEnum.高级查询),
      value: 'AdvancedQuery',
      icon: 'fa fa-search',
      order: 30,
    },
  ],
}

export const OperatorsConfig = {
  groupName: 'operators',
  options: [
    { label: getI18N(i18nExtendEnum.查看详情), value: 'View', icon: 'fa fa-database', order: 10 },
    { label: getI18N(i18nExtendEnum.编辑记录), value: 'Edit', icon: 'fa fa-database', order: 20 },
    { label: getI18N(i18nExtendEnum.删除记录), value: 'Delete', icon: 'fa fa-database', order: 30 },
  ],
}

/** 表格数据展示的默认最大行数 */
export const DefaultMaxDisplayRows = 5
