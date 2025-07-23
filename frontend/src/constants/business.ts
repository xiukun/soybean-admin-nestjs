import { transformRecordToOption } from '@/utils/common';

export const enableStatusRecord: Record<Api.Common.EnableStatus, App.I18n.I18nKey> = {
  ENABLED: 'page.manage.common.status.enable',
  DISABLED: 'page.manage.common.status.disable'
};

export const enableStatusOptions = transformRecordToOption(enableStatusRecord);

export const userGenderRecord: Record<Api.SystemManage.UserGender, App.I18n.I18nKey> = {
  '1': 'page.manage.user.gender.male',
  '2': 'page.manage.user.gender.female'
};

export const userGenderOptions = transformRecordToOption(userGenderRecord);

export const queryStatusRecord: Record<Api.Lowcode.QueryStatus, App.I18n.I18nKey> = {
  DRAFT: 'page.lowcode.query.status.DRAFT',
  PUBLISHED: 'page.lowcode.query.status.PUBLISHED',
  DEPRECATED: 'page.lowcode.query.status.DEPRECATED'
};

export const queryStatusOptions = transformRecordToOption(queryStatusRecord);

export const entityStatusRecord: Record<Api.Lowcode.EntityStatus, App.I18n.I18nKey> = {
  DRAFT: 'page.lowcode.entity.status.DRAFT',
  PUBLISHED: 'page.lowcode.entity.status.PUBLISHED',
  DEPRECATED: 'page.lowcode.entity.status.DEPRECATED'
};

export const entityStatusOptions = transformRecordToOption(entityStatusRecord);

export const menuTypeRecord: Record<Api.SystemManage.MenuType, App.I18n.I18nKey> = {
  directory: 'page.manage.menu.type.directory',
  menu: 'page.manage.menu.type.menu',
  lowcode: 'page.manage.menu.type.lowcode'
};

export const menuTypeOptions = transformRecordToOption(menuTypeRecord);

export const menuIconTypeRecord: Record<Api.SystemManage.IconType, App.I18n.I18nKey> = {
  1: 'page.manage.menu.iconType.iconify',
  2: 'page.manage.menu.iconType.local'
};

export const menuIconTypeOptions = transformRecordToOption(menuIconTypeRecord);
