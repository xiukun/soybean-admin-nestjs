// 国际化类型修复
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
          createSuccess: string;
          createFailed: string;
          saveError: string;
          exportSuccess: string;
          exportFailed: string;
          deleteFailed: string;
          loadFailed: string;
          importSuccess: string;
        };
        page: {
          lowcode: {
            project: {
              status: {
                active: string;
                inactive: string;
                archived: string;
              };
              nameRequired: string;
              codeRequired: string;
              frameworkRequired: string;
              framework: string;
              entities: string;
              templates: string;
              createdBy: string;
              createdAt: string;
              invalidJsonFormat: string;
              gitImportNotImplemented: string;
              fileImportNotImplemented: string;
            };
          };
        };
      }
    }
  }
}

// 临时类型安全函数
export const safeT = (key: string): string => {
  try {
    // @ts-ignore
    return window.$t?.(key) || key;
  } catch {
    return key;
  }
};
