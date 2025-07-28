// 临时国际化键值扩展，用于解决TypeScript错误
declare module '@/typings/app' {
  namespace App {
    namespace I18n {
      interface Schema {
        common: {
          actions: string;
          open: string;
          view: string;
          duplicate: string;
          archive: string;
          exportSuccess: string;
          exportFailed: string;
          createSuccess: string;
          createFailed: string;
          importSuccess: string;
          deleteFailed: string;
          loadFailed: string;
          saveError: string;
        };
        page: {
          lowcode: {
            project: {
              entities: string;
              templates: string;
              createdBy: string;
              createdAt: string;
              framework: string;
              nameRequired: string;
              codeRequired: string;
              frameworkRequired: string;
              invalidJsonFormat: string;
              gitImportNotImplemented: string;
              fileImportNotImplemented: string;
              status: {
                active: string;
                inactive: string;
                archived: string;
              };
            };
          };
        };
      }
    }
  }
}

// 临时的翻译函数，用于避免类型错误
export function $t(key: string): string {
  // 这是一个临时的实现，实际应该使用真正的i18n函数
  const translations: Record<string, string> = {
    'common.actions': '操作',
    'common.open': '打开',
    'common.view': '查看',
    'common.duplicate': '复制',
    'common.archive': '归档',
    'common.exportSuccess': '导出成功',
    'common.exportFailed': '导出失败',
    'common.createSuccess': '创建成功',
    'common.createFailed': '创建失败',
    'common.importSuccess': '导入成功',
    'common.deleteFailed': '删除失败',
    'common.loadFailed': '加载失败',
    'common.saveError': '保存失败',
    'page.lowcode.project.entities': '实体数量',
    'page.lowcode.project.templates': '模板数量',
    'page.lowcode.project.createdBy': '创建者',
    'page.lowcode.project.createdAt': '创建时间',
    'page.lowcode.project.framework': '开发框架',
    'page.lowcode.project.nameRequired': '请输入项目名称',
    'page.lowcode.project.codeRequired': '请输入项目代码',
    'page.lowcode.project.frameworkRequired': '请选择开发框架',
    'page.lowcode.project.invalidJsonFormat': 'JSON格式无效',
    'page.lowcode.project.gitImportNotImplemented': 'Git导入功能暂未实现',
    'page.lowcode.project.fileImportNotImplemented': '文件导入功能暂未实现',
    'page.lowcode.project.status.active': '活跃',
    'page.lowcode.project.status.inactive': '非活跃',
    'page.lowcode.project.status.archived': '已归档'
  };
  
  return translations[key] || key;
}