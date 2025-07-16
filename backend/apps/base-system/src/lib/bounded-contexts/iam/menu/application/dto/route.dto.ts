export type RouteMeta = {
  title: string;
  i18nKey: string | null;
  keepAlive: boolean | null;
  constant: boolean;
  icon: string | null;
  order: number;
  href: string | null;
  hideInMenu: boolean | null;
  activeMenu: string | null;
  multiTab: boolean | null;
  menuId: string; // 添加菜单ID到meta中
};

export type MenuRoute = {
  id: string;
  name: string;
  path: string;
  component: string;
  meta: RouteMeta;
  children?: MenuRoute[];
};

export type UserRoute = {
  routes: MenuRoute[];
  home: string;
};
