/** The global namespace for the app */
declare namespace App {
  /** Theme namespace */
  namespace Theme {
    type ColorPaletteNumber = import('@sa/color').ColorPaletteNumber;

    /** Theme setting */
    interface ThemeSetting {
      /** Theme scheme */
      themeScheme: UnionKey.ThemeScheme;
      /** grayscale mode */
      grayscale: boolean;
      /** colour weakness mode */
      colourWeakness: boolean;
      /** Whether to recommend color */
      recommendColor: boolean;
      /** Theme color */
      themeColor: string;
      /** Other color */
      otherColor: OtherColor;
      /** Whether info color is followed by the primary color */
      isInfoFollowPrimary: boolean;
      /** Reset cache strategy */
      resetCacheStrategy: UnionKey.ResetCacheStrategy;
      /** Layout */
      layout: {
        /** Layout mode */
        mode: UnionKey.ThemeLayoutMode;
        /** Scroll mode */
        scrollMode: UnionKey.ThemeScrollMode;
        /**
         * Whether to reverse the horizontal mix
         *
         * if true, the vertical child level menus in left and horizontal first level menus in top
         */
        reverseHorizontalMix: boolean;
      };
      /** Page */
      page: {
        /** Whether to show the page transition */
        animate: boolean;
        /** Page animate mode */
        animateMode: UnionKey.ThemePageAnimateMode;
      };
      /** Header */
      header: {
        /** Header height */
        height: number;
        /** Header breadcrumb */
        breadcrumb: {
          /** Whether to show the breadcrumb */
          visible: boolean;
          /** Whether to show the breadcrumb icon */
          showIcon: boolean;
        };
        /** Multilingual */
        multilingual: {
          /** Whether to show the multilingual */
          visible: boolean;
        };
        globalSearch: {
          /** Whether to show the GlobalSearch */
          visible: boolean;
        };
      };
      /** Tab */
      tab: {
        /** Whether to show the tab */
        visible: boolean;
        /**
         * Whether to cache the tab
         *
         * If cache, the tabs will get from the local storage when the page is refreshed
         */
        cache: boolean;
        /** Tab height */
        height: number;
        /** Tab mode */
        mode: UnionKey.ThemeTabMode;
      };
      /** Fixed header and tab */
      fixedHeaderAndTab: boolean;
      /** Sider */
      sider: {
        /** Inverted sider */
        inverted: boolean;
        /** Sider width */
        width: number;
        /** Collapsed sider width */
        collapsedWidth: number;
        /** Sider width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixWidth: number;
        /** Collapsed sider width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixCollapsedWidth: number;
        /** Child menu width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixChildMenuWidth: number;
      };
      /** Footer */
      footer: {
        /** Whether to show the footer */
        visible: boolean;
        /** Whether fixed the footer */
        fixed: boolean;
        /** Footer height */
        height: number;
        /** Whether float the footer to the right when the layout is 'horizontal-mix' */
        right: boolean;
      };
      /** Watermark */
      watermark: {
        /** Whether to show the watermark */
        visible: boolean;
        /** Watermark text */
        text: string;
        /** Whether to use user name as watermark text */
        enableUserName: boolean;
      };
      /** define some theme settings tokens, will transform to css variables */
      tokens: {
        light: ThemeSettingToken;
        dark?: {
          [K in keyof ThemeSettingToken]?: Partial<ThemeSettingToken[K]>;
        };
      };
    }

    interface OtherColor {
      info: string;
      success: string;
      warning: string;
      error: string;
    }

    interface ThemeColor extends OtherColor {
      primary: string;
    }

    type ThemeColorKey = keyof ThemeColor;

    type ThemePaletteColor = {
      [key in ThemeColorKey | `${ThemeColorKey}-${ColorPaletteNumber}`]: string;
    };

    type BaseToken = Record<string, Record<string, string>>;

    interface ThemeSettingTokenColor {
      /** the progress bar color, if not set, will use the primary color */
      nprogress?: string;
      container: string;
      layout: string;
      inverted: string;
      'base-text': string;
    }

    interface ThemeSettingTokenBoxShadow {
      header: string;
      sider: string;
      tab: string;
    }

    interface ThemeSettingToken {
      colors: ThemeSettingTokenColor;
      boxShadow: ThemeSettingTokenBoxShadow;
    }

    type ThemeTokenColor = ThemePaletteColor & ThemeSettingTokenColor;

    /** Theme token CSS variables */
    type ThemeTokenCSSVars = {
      colors: ThemeTokenColor & { [key: string]: string };
      boxShadow: ThemeSettingTokenBoxShadow & { [key: string]: string };
    };
  }

  /** Global namespace */
  namespace Global {
    type VNode = import('vue').VNode;
    type RouteLocationNormalizedLoaded = import('vue-router').RouteLocationNormalizedLoaded;
    type RouteKey = import('@elegant-router/types').RouteKey;
    type RouteMap = import('@elegant-router/types').RouteMap;
    type RoutePath = import('@elegant-router/types').RoutePath;
    type LastLevelRouteKey = import('@elegant-router/types').LastLevelRouteKey;

    /** The router push options */
    type RouterPushOptions = {
      query?: Record<string, string>;
      params?: Record<string, string>;
    };

    /** The global header props */
    interface HeaderProps {
      /** Whether to show the logo */
      showLogo?: boolean;
      /** Whether to show the menu toggler */
      showMenuToggler?: boolean;
      /** Whether to show the menu */
      showMenu?: boolean;
    }

    /** The global menu */
    type Menu = {
      /**
       * The menu key
       *
       * Equal to the route key
       */
      key: string;
      /** The menu label */
      label: string;
      /** The menu i18n key */
      i18nKey?: I18n.I18nKey | null;
      /** The route key */
      routeKey: RouteKey;
      /** The route path */
      routePath: RoutePath;
      /** The menu icon */
      icon?: () => VNode;
      /** The menu children */
      children?: Menu[];
      /** The menu database ID */
      id?: string;
    };

    type Breadcrumb = Omit<Menu, 'children'> & {
      options?: Breadcrumb[];
    };

    /** Tab route */
    type TabRoute = Pick<RouteLocationNormalizedLoaded, 'name' | 'path' | 'meta'> &
      Partial<Pick<RouteLocationNormalizedLoaded, 'fullPath' | 'query' | 'matched'>>;

    /** The global tab */
    type Tab = {
      /** The tab id */
      id: string;
      /** The tab label */
      label: string;
      /**
       * The new tab label
       *
       * If set, the tab label will be replaced by this value
       */
      newLabel?: string;
      /**
       * The old tab label
       *
       * when reset the tab label, the tab label will be replaced by this value
       */
      oldLabel?: string;
      /** The tab route key */
      routeKey: LastLevelRouteKey;
      /** The tab route path */
      routePath: RouteMap[LastLevelRouteKey];
      /** The tab route full path */
      fullPath: string;
      /** The tab fixed index */
      fixedIndex?: number | null;
      /**
       * Tab icon
       *
       * Iconify icon
       */
      icon?: string;
      /**
       * Tab local icon
       *
       * Local icon
       */
      localIcon?: string;
      /** I18n key */
      i18nKey?: I18n.I18nKey | null;
    };

    /** Form rule */
    type FormRule = import('naive-ui').FormItemRule;

    /** The global dropdown key */
    type DropdownKey = 'closeCurrent' | 'closeOther' | 'closeLeft' | 'closeRight' | 'closeAll';
  }

  /**
   * I18n namespace
   *
   * Locales type
   */
  namespace I18n {
    type RouteKey = import('@elegant-router/types').RouteKey;

    type LangType = 'en-US' | 'zh-CN';

    type LangOption = {
      label: string;
      key: LangType;
    };

    type I18nRouteKey = Exclude<RouteKey, 'root' | 'not-found'>;

    type FormMsg = {
      required: string;
      invalid: string;
    };

    type Schema = {
      system: {
        title: string;
        updateTitle: string;
        updateContent: string;
        updateConfirm: string;
        updateCancel: string;
      };
      common: {
        status: string;
        createdAt: string;
        updatedAt: string;
        updateFailed: string;
        action: string;
        add: string;
        addSuccess: string;
        backToHome: string;
        batchDelete: string;
        cancel: string;
        clear: string;
        close: string;
        check: string;
        expandColumn: string;
        columnSetting: string;
        config: string;
        confirm: string;
        delete: string;
        deleteSuccess: string;
        confirmDelete: string;
        edit: string;
        export: string;
        warning: string;
        error: string;
        index: string;
        keywordSearch: string;
        logout: string;
        logoutConfirm: string;
        lookForward: string;
        modify: string;
        modifySuccess: string;
        noData: string;
        operate: string;
        pleaseCheckValue: string;
        pleaseSelect: string;
        refresh: string;
        reset: string;
        search: string;
        switch: string;
        tip: string;
        trigger: string;
        update: string;
        updateSuccess: string;
        userCenter: string;
        yesOrNo: {
          yes: string;
          no: string;
        };
      };
      request: {
        logout: string;
        logoutMsg: string;
        logoutWithModal: string;
        logoutWithModalMsg: string;
        refreshToken: string;
        tokenExpired: string;
      };
      theme: {
        themeSchema: { title: string } & Record<UnionKey.ThemeScheme, string>;
        grayscale: string;
        colourWeakness: string;
        layoutMode: { title: string; reverseHorizontalMix: string } & Record<UnionKey.ThemeLayoutMode, string>;
        recommendColor: string;
        recommendColorDesc: string;
        themeColor: {
          title: string;
          followPrimary: string;
        } & Theme.ThemeColor;
        scrollMode: { title: string } & Record<UnionKey.ThemeScrollMode, string>;
        page: {
          animate: string;
          mode: { title: string } & Record<UnionKey.ThemePageAnimateMode, string>;
        };
        fixedHeaderAndTab: string;
        header: {
          height: string;
          breadcrumb: {
            visible: string;
            showIcon: string;
          };
          multilingual: {
            visible: string;
          };
          globalSearch: {
            visible: string;
          };
        };
        tab: {
          visible: string;
          cache: string;
          height: string;
          mode: { title: string } & Record<UnionKey.ThemeTabMode, string>;
        };
        sider: {
          inverted: string;
          width: string;
          collapsedWidth: string;
          mixWidth: string;
          mixCollapsedWidth: string;
          mixChildMenuWidth: string;
        };
        footer: {
          visible: string;
          fixed: string;
          height: string;
          right: string;
        };
        watermark: {
          visible: string;
          text: string;
          enableUserName: string;
        };
        themeDrawerTitle: string;
        pageFunTitle: string;
        resetCacheStrategy: { title: string } & Record<UnionKey.ResetCacheStrategy, string>;
        configOperation: {
          copyConfig: string;
          copySuccessMsg: string;
          resetConfig: string;
          resetSuccessMsg: string;
        };
      };
      route: Record<I18nRouteKey, string>;
      page: {
        login: {
          common: {
            loginOrRegister: string;
            userNamePlaceholder: string;
            phonePlaceholder: string;
            codePlaceholder: string;
            passwordPlaceholder: string;
            confirmPasswordPlaceholder: string;
            codeLogin: string;
            confirm: string;
            back: string;
            validateSuccess: string;
            loginSuccess: string;
            welcomeBack: string;
          };
          pwdLogin: {
            title: string;
            rememberMe: string;
            forgetPassword: string;
            register: string;
            otherAccountLogin: string;
            otherLoginMode: string;
            superAdmin: string;
            admin: string;
            user: string;
          };
          codeLogin: {
            title: string;
            getCode: string;
            reGetCode: string;
            sendCodeSuccess: string;
            imageCodePlaceholder: string;
          };
          register: {
            title: string;
            agreement: string;
            protocol: string;
            policy: string;
          };
          resetPwd: {
            title: string;
          };
          bindWeChat: {
            title: string;
          };
        };
        home: {
          branchDesc: string;
          greeting: string;
          weatherDesc: string;
          projectCount: string;
          todo: string;
          message: string;
          downloadCount: string;
          registerCount: string;
          schedule: string;
          study: string;
          work: string;
          rest: string;
          entertainment: string;
          visitCount: string;
          turnover: string;
          dealCount: string;
          projectNews: {
            title: string;
            moreNews: string;
            desc1: string;
            desc2: string;
            desc3: string;
            desc4: string;
            desc5: string;
          };
          creativity: string;
        };
        manage: {
          common: {
            status: {
              enable: string;
              disable: string;
            };
          };
          role: {
            title: string;
            roleName: string;
            roleCode: string;
            roleStatus: string;
            roleDesc: string;
            form: {
              roleName: string;
              roleCode: string;
              roleStatus: string;
              roleDesc: string;
            };
            addRole: string;
            editRole: string;
            menuAuth: string;
            buttonAuth: string;
            permissionAuth: string;
          };
          accessKey: {
            title: string;
            domain: string;
            accessKeyId: string;
            description: string;
            status: string;
            form: {
              domain: string;
              description: string;
              status: string;
            };
            addAccessKey: string;
            editAccessKey: string;
          };
          log: {
            login: {
              title: string;
              username: string;
              domain: string;
              loginTime: string;
              port: string;
              address: string;
              userAgent: string;
              requestId: string;
              type: string;
            };
            operation: {
              title: string;
              userId: string;
              username: string;
              domain: string;
              moduleName: string;
              description: string;
              requestId: string;
              method: string;
              url: string;
              ip: string;
              userAgent: string;
              params: string;
              duration: string;
              startTime: string;
              endTime: string;
            };
          };
          user: {
            title: string;
            userName: string;
            password: string;
            domain: string;
            avatar: string;
            userGender: string;
            nickName: string;
            userPhone: string;
            userEmail: string;
            userStatus: string;
            userRole: string;
            form: {
              userName: string;
              password: string;
              domain: string;
              userGender: string;
              nickName: string;
              userPhone: string;
              userEmail: string;
              userStatus: string;
              userRole: string;
            };
            addUser: string;
            editUser: string;
            gender: {
              male: string;
              female: string;
            };
          };
          menu: {
            home: string;
            title: string;
            id: string;
            parentId: string;
            menuType: string;
            menuName: string;
            routeName: string;
            routePath: string;
            pathParam: string;
            layout: string;
            page: string;
            i18nKey: string;
            icon: string;
            localIcon: string;
            iconTypeTitle: string;
            order: string;
            constant: string;
            keepAlive: string;
            href: string;
            hideInMenu: string;
            activeMenu: string;
            multiTab: string;
            fixedIndexInTab: string;
            lowcodePage: string;
            query: string;
            button: string;
            buttonCode: string;
            buttonDesc: string;
            menuStatus: string;
            form: {
              home: string;
              menuType: string;
              menuName: string;
              routeName: string;
              routePath: string;
              pathParam: string;
              layout: string;
              page: string;
              i18nKey: string;
              icon: string;
              localIcon: string;
              order: string;
              keepAlive: string;
              href: string;
              hideInMenu: string;
              activeMenu: string;
              multiTab: string;
              fixedInTab: string;
              fixedIndexInTab: string;
              lowcodePage: string;
              queryKey: string;
              queryValue: string;
              button: string;
              buttonCode: string;
              buttonDesc: string;
              menuStatus: string;
            };
            addMenu: string;
            editMenu: string;
            addChildMenu: string;
            type: {
              directory: string;
              menu: string;
              lowcode: string;
            };
            iconType: {
              iconify: string;
              local: string;
            };
          };
        };
        lowcode: {
          project: {
            title: string;
            management: string;
            managementDesc: string;
            addProject: string;
            editProject: string;
            create: string;
            edit: string;
            import: string;
            export: string;
            open: string;
            duplicate: string;
            archive: string;
            name: string;
            code: string;
            description: string;
            version: string;
            framework: string;
            architecture: string;
            language: string;
            database: string;
            packageName: string;
            basePackage: string;
            author: string;
            outputPath: string;
            entities: string;
            templates: string;
            createdBy: string;
            createdAt: string;
            statusLabel: string;
            searchPlaceholder: string;
            filterByStatus: string;
            filterByFramework: string;
            gridView: string;
            tableView: string;
            noDescription: string;
            advancedConfig: string;
            importFromJson: string;
            importFromGit: string;
            importFromFile: string;
            gitUrl: string;
            gitUrlPlaceholder: string;
            branch: string;
            branchPlaceholder: string;
            uploadFile: string;
            supportedFormats: string;
            importJsonPlaceholder: string;
            nameRequired: string;
            codeRequired: string;
            frameworkRequired: string;
            loadFailed: string;
            archiveConfirm: string;
            deleteConfirm: string;
            archiveSuccess: string;
            invalidJsonFormat: string;
            gitImportNotImplemented: string;
            fileImportNotImplemented: string;
            detail: string;
            basicInfo: string;
            techStackConfig: string;
            packageConfig: string;
            databaseConfig: string;
            generationConfig: string;
            openDesigner: string;
            apis: string;
            codeGeneration: string;
            configuration: string;
            dbHost: string;
            dbPort: string;
            dbName: string;
            dbUsername: string;
            dbPassword: string;
            dbSchema: string;
            testConnection: string;
            connectionSuccess: string;
            connectionFailed: string;
            enableSwagger: string;
            enableValidation: string;
            enableAudit: string;
            enableSoftDelete: string;
            enablePagination: string;
            enableCaching: string;
            relationships: string;
            generatedFiles: string;
            lastUpdated: string;
            techStack: string;
            progress: string;
            design: string;
            designEntities: string;
            generate: string;
            generateCode: string;
            yesterday: string;
            daysAgo: string;
            configure: string;
            view: string;
            generated: string;
            status: {
              ACTIVE: string;
              INACTIVE: string;
              ARCHIVED: string;
            };
            deploymentStatus: {
              inactive: string;
              deploying: string;
              deployed: string;
              failed: string;
            };
            form: {
              name: {
                placeholder: string;
                required: string;
              };
              code: {
                placeholder: string;
                required: string;
              };
              description: {
                placeholder: string;
              };
              version: {
                placeholder: string;
                required: string;
              };
              status: {
                placeholder: string;
              };
            };
          };
          entity: {
            title: string;
            addEntity: string;
            editEntity: string;
            name: string;
            code: string;
            description: string;
            tableName: string;
            category: string;
            management: string;
            managementDesc: string;
            listView: string;
            designerView: string;
            fieldDesigner: string;
            fieldList: string;
            addField: string;
            importFields: string;
            fieldProperties: string;
            fieldName: string;
            fieldCode: string;
            dataType: string;
            length: string;
            precision: string;
            required: string;
            unique: string;
            primaryKey: string;
            autoIncrement: string;
            defaultValue: string;
            comment: string;
            displayOrder: string;
            selectFieldToEdit: string;
            entityPreview: string;
            sqlPreview: string;
            exportSQL: string;
            fieldNameRequired: string;
            fieldCodeRequired: string;
            dataTypeRequired: string;
            deleteFieldConfirm: string;
            fieldValidationFailed: string;
            relationshipDesigner: string;
            relationshipDesignerDesc: string;
            autoLayout: string;
            entityList: string;
            designCanvas: string;
            properties: string;
            entityProperties: string;
            relationshipProperties: string;
            selectEntityOrRelationship: string;
            createRelationship: string;
            relationshipType: string;
            sourceEntity: string;
            targetEntity: string;
            sourceField: string;
            targetField: string;
            relationshipName: string;
            relationshipTypeRequired: string;
            sourceEntityRequired: string;
            targetEntityRequired: string;
            sourceFieldRequired: string;
            targetFieldRequired: string;
            relationshipNameRequired: string;
            searchPlaceholder: string;
            filterByCategory: string;
            nameRequired: string;
            codeRequired: string;
            tableNameRequired: string;
            categoryRequired: string;
            deleteConfirm: string;
            loadFailed: string;
            noDescription: string;
            preview: string;
            create: string;
            edit: string;
            import: string;
            designFields: string;
            fieldCount: string;
            createdAt: string;
            status: {
              DRAFT: string;
              PUBLISHED: string;
              DEPRECATED: string;
            };
            categories: {
              core: string;
              business: string;
              system: string;
              config: string;
            };
            dataTypes: {
              STRING: string;
              INTEGER: string;
              BIGINT: string;
              DECIMAL: string;
              BOOLEAN: string;
              DATE: string;
              DATETIME: string;
              TEXT: string;
              JSON: string;
            };
            relationshipTypes: {
              ONE_TO_ONE: string;
              ONE_TO_MANY: string;
              MANY_TO_ONE: string;
              MANY_TO_MANY: string;
            };
            form: {
              name: {
                placeholder: string;
                required: string;
              };
              code: {
                placeholder: string;
                required: string;
              };
              description: {
                placeholder: string;
              };
              tableName: {
                placeholder: string;
                required: string;
              };
              category: {
                placeholder: string;
                required: string;
              };
              status: {
                placeholder: string;
              };
            };
          };
          field: {
            title: string;
            addField: string;
            editField: string;
            name: string;
            code: string;
            description: string;
            dataType: string;
            length: string;
            precision: string;
            required: string;
            unique: string;
            defaultValue: string;
            displayOrder: string;
            dataTypes: {
              STRING: string;
              INTEGER: string;
              DECIMAL: string;
              BOOLEAN: string;
              DATE: string;
              DATETIME: string;
              TEXT: string;
              JSON: string;
            };
            form: {
              name: {
                placeholder: string;
                required: string;
              };
              code: {
                placeholder: string;
                required: string;
              };
              description: {
                placeholder: string;
              };
              dataType: {
                placeholder: string;
                required: string;
              };
              length: {
                placeholder: string;
              };
              precision: {
                placeholder: string;
              };
              defaultValue: {
                placeholder: string;
              };
              displayOrder: {
                placeholder: string;
                required: string;
              };
            };
          };
          api: {
            title: string;
            addApi: string;
            editApi: string;
            name: string;
            code: string;
            path: string;
            method: string;
            description: string;
            version: string;
            status: {
              DRAFT: string;
              PUBLISHED: string;
              DEPRECATED: string;
            };
            methods: {
              GET: string;
              POST: string;
              PUT: string;
              DELETE: string;
              PATCH: string;
            };
            form: {
              name: {
                placeholder: string;
                required: string;
              };
              code: {
                placeholder: string;
                required: string;
              };
              path: {
                placeholder: string;
                required: string;
              };
              method: {
                placeholder: string;
                required: string;
              };
              description: {
                placeholder: string;
              };
              version: {
                placeholder: string;
                required: string;
              };
              status: {
                placeholder: string;
              };
            };
          };
          relation: {
            title: string;
            addRelation: string;
            editRelation: string;
            name: string;
            code: string;
            description: string;
            sourceEntity: string;
            targetEntity: string;
            sourceField: string;
            targetField: string;
            relationType: string;
            onDelete: string;
            onUpdate: string;
            relationTypes: {
              ONE_TO_ONE: string;
              ONE_TO_MANY: string;
              MANY_TO_ONE: string;
              MANY_TO_MANY: string;
            };
            cascadeActions: {
              CASCADE: string;
              SET_NULL: string;
              RESTRICT: string;
              NO_ACTION: string;
            };
            form: {
              name: {
                placeholder: string;
                required: string;
              };
              code: {
                placeholder: string;
                required: string;
              };
              description: {
                placeholder: string;
              };
              sourceEntity: {
                placeholder: string;
                required: string;
              };
              targetEntity: {
                placeholder: string;
                required: string;
              };
              sourceField: {
                placeholder: string;
                required: string;
              };
              targetField: {
                placeholder: string;
                required: string;
              };
              relationType: {
                placeholder: string;
                required: string;
              };
              onDelete: {
                placeholder: string;
              };
              onUpdate: {
                placeholder: string;
              };
            };
          };
          template: {
            title: string;
            selectProject: string;
            currentProject: string;
            addTemplate: string;
            editTemplate: string;
            name: string;
            code: string;
            description: string;
            category: string;
            language: string;
            framework: string;
            content: string;
            variables: string;
            tags: string;
            isPublic: string;
            usageCount: string;
            publish: string;
            publishSuccess: string;
            publishFailed: string;
            management: string;
            managementDesc: string;
            gridView: string;
            listView: string;
            marketplace: string;
            marketplaceComingSoon: string;
            searchPlaceholder: string;
            filterByCategory: string;
            filterByLanguage: string;
            create: string;
            import: string;
            export: string;
            noDescription: string;
            noTemplates: string;
            createFirst: string;
            preview: string;
            unpublish: string;
            duplicate: string;
            duplicated: string;
            statusUpdated: string;
            deleteConfirm: string;
            loadFailed: string;
            batchOperations: string;
            selectedTemplatesCount: string;
            batchPublish: string;
            batchUnpublish: string;
            batchExport: string;
            batchDelete: string;
            batchPublishSuccess: string;
            batchUnpublishSuccess: string;
            batchDeleteConfirm: string;
            editor: string;
            newTemplate: string;
            settings: string;
            templateVariables: string;
            addVariable: string;
            variableName: string;
            variableType: string;
            defaultValue: string;
            required: string;
            noVariables: string;
            lines: string;
            format: string;
            insertVariable: string;
            selectVariableToInsert: string;
            commonVariables: string;
            clickPreviewToGenerate: string;
            previewGenerated: string;
            previewFailed: string;
            validationPassed: string;
            validationFailed: string;
            tagsPlaceholder: string;
            validate: string;
            test: string;
            previewResult: string;
            output: string;
            validation: string;
            testResult: string;
            validationSuccess: string;
            testPassed: string;
            testFailed: string;
            errors: string;
            warnings: string;
            suggestions: string;
            extractedVariables: string;
            usedVariables: string;
            unusedVariables: string;
            variableAnalysis: string;
            actualOutput: string;
            newVariable: string;
            variableName: string;
            variableType: string;
            variableValue: string;
            status: {
              DRAFT: string;
              PUBLISHED: string;
              DEPRECATED: string;
            };
            categories: {
              CONTROLLER: string;
              SERVICE: string;
              MODEL: string;
              DTO: string;
              COMPONENT: string;
              PAGE: string;
              CONFIG: string;
              TEST: string;
            };
            languages: {
              TYPESCRIPT: string;
              JAVASCRIPT: string;
              JAVA: string;
              PYTHON: string;
              CSHARP: string;
              GO: string;
            };
            frameworks: {
              NESTJS: string;
              EXPRESS: string;
              SPRING: string;
              DJANGO: string;
              DOTNET: string;
              GIN: string;
            };
            form: {
              name: {
                placeholder: string;
                required: string;
              };
              code: {
                placeholder: string;
                required: string;
              };
              description: {
                placeholder: string;
              };
              category: {
                placeholder: string;
                required: string;
              };
              language: {
                placeholder: string;
                required: string;
              };
              framework: {
                placeholder: string;
                required: string;
              };
              content: {
                placeholder: string;
                required: string;
              };
              variables: {
                placeholder: string;
              };
              tags: {
                placeholder: string;
              };
              status: {
                placeholder: string;
              };
              project: {
                placeholder: string;
              };
              variableValue: {
                stringPlaceholder: string;
                numberPlaceholder: string;
                arrayPlaceholder: string;
                objectPlaceholder: string;
              };
            };
          };
          codeGeneration: {
            title: string;
            project: string;
            entity: string;
            template: string;
            outputPath: string;
            generate: string;
            progress: string;
            logs: string;
            result: string;
            fileList: string;
            fileContent: string;
            batchGeneration: string;
            batchMode: string;
            concurrency: string;
            batchByProjects: string;
            batchByEntities: string;
            batchByTemplates: string;
            selectProjects: string;
            selectEntities: string;
            selectTemplates: string;
            outputStrategy: string;
            separateDirectories: string;
            separateDirectoriesDesc: string;
            mergedDirectory: string;
            mergedDirectoryDesc: string;
            baseOutputPath: string;
            startBatchGeneration: string;
            batchProgress: string;
            batchResults: string;
            batchModeRequired: string;
            baseOutputPathRequired: string;
            batchGenerationCompleted: string;
            batchGenerationFailed: string;
            downloadAll: string;
            openOutputDirectory: string;
            clearResults: string;
            createGitRepo: string;
            autoCommit: string;
            status: {
              PENDING: string;
              RUNNING: string;
              SUCCESS: string;
              FAILED: string;
            };
            form: {
              project: {
                placeholder: string;
                required: string;
              };
              entity: {
                placeholder: string;
              };
              template: {
                placeholder: string;
                required: string;
              };
              outputPath: {
                placeholder: string;
                required: string;
              };
            };
          };
          query: {
            title: string;
            addQuery: string;
            editQuery: string;
            name: string;
            code: string;
            description: string;
            sql: string;
            parameters: string;
            result: string;
            execute: string;
            save: string;
            baseEntity: string;
            baseEntityAlias: string;
            joinCount: string;
            fieldCount: string;
            filterCount: string;
            lastExecuted: string;
            executeSuccess: string;
            executeFailed: string;
            noDataToExport: string;
            exportComingSoon: string;
            generateSQLFailed: string;
            basicInfo: string;
            joins: string;
            fields: string;
            filters: string;
            sorting: string;
            joinType: string;
            targetEntity: string;
            sourceField: string;
            targetField: string;
            alias: string;
            fieldName: string;
            fieldAlias: string;
            entityAlias: string;
            aggregation: string;
            operator: string;
            value: string;
            direction: string;
            addJoin: string;
            join: string;
            addField: string;
            field: string;
            addFilter: string;
            filter: string;
            addSort: string;
            sort: string;
            sqlPreview: string;
            generateSQL: string;
            noSQL: string;
            executeError: string;
            noData: string;
            info: string;
            executeTime: string;
            rowCount: string;
            columnCount: string;
            status: {
              DRAFT: string;
              PUBLISHED: string;
              DEPRECATED: string;
            };
            form: {
              name: {
                placeholder: string;
                required: string;
              };
              code: {
                placeholder: string;
                required: string;
              };
              description: {
                placeholder: string;
              };
              sql: {
                placeholder: string;
                required: string;
              };
              baseEntity: {
                placeholder: string;
                required: string;
              };
              baseEntityAlias: {
                placeholder: string;
                required: string;
              };
              joinType: {
                placeholder: string;
              };
              targetEntity: {
                placeholder: string;
              };
              sourceField: {
                placeholder: string;
              };
              targetField: {
                placeholder: string;
              };
              alias: {
                placeholder: string;
              };
              fieldName: {
                placeholder: string;
              };
              fieldAlias: {
                placeholder: string;
              };
              entityAlias: {
                placeholder: string;
              };
              aggregation: {
                placeholder: string;
              };
              operator: {
                placeholder: string;
              };
              value: {
                placeholder: string;
              };
              direction: {
                placeholder: string;
              };
            };
          };
          apiConfig: {
            title: string;
            addApiConfig: string;
            editApiConfig: string;
            selectProject: string;
            currentProject: string;
            changeProject: string;
            test: string;
            quickExport: string;
            advancedSearch: string;
            advancedSearchOptions: string;
            selectMethod: string;
            selectStatus: string;
            selectAuth: string;
            dateRange: string;
            totalCount: string;
            selectedCount: string;
            testSuccess: string;
            testFailed: string;
            name: string;
            code: string;
            path: string;
            method: string;
            description: string;
            version: string;
            entity: string;
            authRequired: string;
            queryConfig: string;
            paginationEnabled: string;
            defaultPageSize: string;
            maxPageSize: string;
            responseConfig: string;
            responseFormat: string;
            responseWrapper: string;
            securityConfig: string;
            rateLimitEnabled: string;
            rateLimitRequests: string;
            rateLimitWindow: string;
            status: {
              ACTIVE: string;
              INACTIVE: string;
            };
            methods: {
              GET: string;
              POST: string;
              PUT: string;
              DELETE: string;
              PATCH: string;
            };
            form: {
              name: {
                placeholder: string;
                required: string;
              };
              code: {
                placeholder: string;
                required: string;
              };
              path: {
                placeholder: string;
                required: string;
                invalid: string;
              };
              method: {
                placeholder: string;
                required: string;
              };
              description: {
                placeholder: string;
              };
              version: {
                placeholder: string;
                required: string;
              };
              entity: {
                placeholder: string;
              };
              authRequired: {
                placeholder: string;
              };
              status: {
                placeholder: string;
              };
              responseFormat: {
                placeholder: string;
                required: string;
              };
              defaultPageSize: {
                placeholder: string;
              };
              maxPageSize: {
                placeholder: string;
              };
              responseWrapper: {
                placeholder: string;
              };
              rateLimitRequests: {
                placeholder: string;
              };
              rateLimitWindow: {
                placeholder: string;
              };
              search: {
                placeholder: string;
              };
            };
            selector: {
              title: string;
              platformFormat: string;
              lowcodeFormat: string;
              selectApi: string;
              selectApiPlaceholder: string;
              selectedApi: string;
              amisConfig: string;
            };
            tabs: {
              management: string;
              selector: string;
              batchOperations: string;
              onlineTest: string;
              versionManagement: string;
              documentation: string;
            };
            batchOperations: {
              title: string;
              export: {
                title: string;
                all: string;
                selected: string;
                allSuccess: string;
                selectedSuccess: string;
              };
              import: {
                title: string;
                button: string;
                dragText: string;
                hintText: string;
                overwrite: string;
                invalidFormat: string;
                success: string;
              };
              delete: {
                title: string;
                selected: string;
                confirm: string;
                success: string;
              };
              template: {
                title: string;
                json: string;
                yaml: string;
                downloaded: string;
              };
            };
            onlineTest: {
              title: string;
              history: string;
              selectApi: string;
              apiInfo: string;
              testConfig: string;
              headers: string;
              headerKey: string;
              headerValue: string;
              addHeader: string;
              queryParams: string;
              paramKey: string;
              paramValue: string;
              addParam: string;
              requestBody: string;
              jsonPlaceholder: string;
              fieldKey: string;
              fieldValue: string;
              addField: string;
              rawPlaceholder: string;
              execute: string;
              saveCase: string;
              result: string;
              status: string;
              time: string;
              responseHeaders: string;
              responseBody: string;
              formatted: string;
              raw: string;
              testHistory: string;
              envVariables: string;
              variableKey: string;
              variableValue: string;
              addVariable: string;
              testCases: string;
              savedCases: string;
              noCases: string;
              load: string;
              createdAt: string;
              caseSaved: string;
              caseLoaded: string;
              caseDeleted: string;
            };
            versionManagement: {
              title: string;
              selectApi: string;
              currentVersion: string;
              versionHistory: string;
              versionCompare: string;
              createVersion: string;
              version: string;
              versionNumber: string;
              versionPlaceholder: string;
              changeLog: string;
              changeLogPlaceholder: string;
              compare: string;
              rollback: string;
              viewVersion: string;
              selectSecondVersion: string;
              compareReady: string;
              sameVersion: string;
              versionCreated: string;
              createFailed: string;
              rollbackSuccess: string;
              rollbackFailed: string;
              loadFailed: string;
            };
            documentation: {
              title: string;
              generate: string;
              exportSwagger: string;
              selectProject: string;
              selectProjectFirst: string;
              includeInactive: string;
              config: string;
              docTitle: string;
              docVersion: string;
              docDescription: string;
              docBaseUrl: string;
              titlePlaceholder: string;
              versionPlaceholder: string;
              descriptionPlaceholder: string;
              baseUrlPlaceholder: string;
              statistics: string;
              totalApis: string;
              activeApis: string;
              inactiveApis: string;
              methods: string;
              methodDistribution: string;
              preview: string;
              swaggerFormat: string;
              markdownFormat: string;
              htmlFormat: string;
              export: string;
              exportMarkdown: string;
              exportHtml: string;
              exportPostman: string;
              exportOpenAPI: string;
              exportInsomnia: string;
              generateSuccess: string;
              generateFailed: string;
              exportSuccess: string;
              exportFailed: string;
            };
          };
          common: {
            search: {
              placeholder: string;
            };
            actions: {
              add: string;
              edit: string;
              delete: string;
              view: string;
              copy: string;
              export: string;
              import: string;
              refresh: string;
              reset: string;
              submit: string;
              cancel: string;
              confirm: string;
              save: string;
              back: string;
              next: string;
              previous: string;
              finish: string;
            };
            status: {
              enabled: string;
              disabled: string;
              active: string;
              inactive: string;
              draft: string;
              published: string;
              archived: string;
              deprecated: string;
            };
            messages: {
              success: string;
              error: string;
              loading: string;
              noData: string;
              confirmDelete: string;
              deleteSuccess: string;
              saveSuccess: string;
              updateSuccess: string;
              createSuccess: string;
            };
            validation: {
              required: string;
              minLength: string;
              maxLength: string;
              email: string;
              phone: string;
              url: string;
              number: string;
              integer: string;
              positive: string;
              unique: string;
            };
          };
          apiTest: {
            title: string;
            project: string;
            apiConfig: string;
            requestConfig: string;
            method: string;
            url: string;
            headers: string;
            params: string;
            body: string;
            response: string;
            status: string;
            time: string;
            responseHeaders: string;
            responseData: string;
            requestInfo: string;
            testApi: string;
            clearResult: string;
            saveAsTemplate: string;
            addHeader: string;
            addParam: string;
            testSuccess: string;
            testFailed: string;
            saveAsTemplateNotImplemented: string;
            queryParams: string;
            test: string;
            form: {
              project: {
                placeholder: string;
                required: string;
              };
              apiConfig: {
                placeholder: string;
                required: string;
              };
              url: {
                placeholder: string;
              };
              headerKey: {
                placeholder: string;
              };
              headerValue: {
                placeholder: string;
              };
              paramKey: {
                placeholder: string;
              };
              paramValue: {
                placeholder: string;
              };
              body: {
                placeholder: string;
              };
            };
          };
          relationship: {
            title: string;
            addRelationship: string;
            editRelationship: string;
            sourceEntity: string;
            targetEntity: string;
            relationType: string;
            relationshipName: string;
            description: string;
            cascadeDelete: string;
            required: string;
            form: {
              sourceEntity: {
                placeholder: string;
                required: string;
              };
              targetEntity: {
                placeholder: string;
                required: string;
              };
              relationType: {
                placeholder: string;
                required: string;
              };
              relationshipName: {
                placeholder: string;
                required: string;
              };
              description: {
                placeholder: string;
              };
            };
            relationTypes: {
              oneToOne: string;
              oneToMany: string;
              manyToOne: string;
              manyToMany: string;
            };
          };
        };
      };
      form: {
        required: string;
        userName: FormMsg;
        phone: FormMsg;
        pwd: FormMsg;
        confirmPwd: FormMsg;
        code: FormMsg;
        email: FormMsg;
      };
      dropdown: Record<Global.DropdownKey, string>;
      icon: {
        themeConfig: string;
        themeSchema: string;
        lang: string;
        fullscreen: string;
        fullscreenExit: string;
        reload: string;
        collapse: string;
        expand: string;
        pin: string;
        unpin: string;
      };
      datatable: {
        itemCount: string;
      };
    };

    type GetI18nKey<T extends Record<string, unknown>, K extends keyof T = keyof T> = K extends string
      ? T[K] extends Record<string, unknown>
        ? `${K}.${GetI18nKey<T[K]>}`
        : K
      : never;

    type I18nKey = GetI18nKey<Schema>;

    type TranslateOptions<Locales extends string> = import('vue-i18n').TranslateOptions<Locales>;

    interface $T {
      (key: I18nKey): string;
      (key: I18nKey, plural: number, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, defaultMsg: string, options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], plural: number): string;
      (key: I18nKey, list: unknown[], defaultMsg: string): string;
      (key: I18nKey, named: Record<string, unknown>, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, named: Record<string, unknown>, plural: number): string;
      (key: I18nKey, named: Record<string, unknown>, defaultMsg: string): string;
    }
  }

  /** Service namespace */
  namespace Service {
    /** Other baseURL key */
    type OtherBaseURLKey = 'demo' | 'amisService' | 'lowcodeService';

    interface ServiceConfigItem {
      /** The backend service base url */
      baseURL: string;
      /** The proxy pattern of the backend service base url */
      proxyPattern: string;
    }

    interface OtherServiceConfigItem extends ServiceConfigItem {
      key: OtherBaseURLKey;
    }

    /** The backend service config */
    interface ServiceConfig extends ServiceConfigItem {
      /** Other backend service config */
      other: OtherServiceConfigItem[];
    }

    interface SimpleServiceConfig extends Pick<ServiceConfigItem, 'baseURL'> {
      other: Record<OtherBaseURLKey, string>;
    }

    /** The backend service response data */
    type Response<T = unknown> = {
      /** The backend service response code */
      code: string;
      /** The backend service response message */
      msg: string;
      /** The backend service response data */
      data: T;
    };

    /** The demo backend service response data */
    type DemoResponse<T = unknown> = {
      /** The backend service response code */
      status: string;
      /** The backend service response message */
      message: string;
      /** The backend service response data */
      result: T;
    };
  }
}
