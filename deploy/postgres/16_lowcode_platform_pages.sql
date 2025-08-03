-- 低代码平台页面配置
-- Low-code Platform Pages Configuration
SET search_path TO backend, public;

-- 插入低代码平台功能页面配置
INSERT INTO
    backend.sys_lowcode_page (
        id,
        name,
        title,
        code,
        description,
        schema,
        status,
        created_by,
        created_at
    )
VALUES

-- 项目管理页面
(
    'lowcode-project-page',
    '项目管理',
    '项目管理',
    'lowcode-project',
    '创建项目：定义项目基本信息和配置',
    '{
   "type": "page",
   "title": "项目管理",
   "subTitle": "创建项目：定义项目基本信息和配置",
   "body": [
     {
       "type": "crud",
       "title": "项目列表",
       "api": {
         "method": "get",
         "url": "/api/v1/projects"
       },
       "headerToolbar": [
         {
           "type": "button",
           "label": "新增项目",
           "actionType": "dialog",
           "level": "primary",
           "dialog": {
             "title": "新增项目",
             "body": {
               "type": "form",
               "api": {
                 "method": "post",
                 "url": "/api/v1/projects"
               },
               "body": [
                 {
                   "type": "input-text",
                   "name": "name",
                   "label": "项目名称",
                   "required": true
                 },
                 {
                   "type": "input-text",
                   "name": "code",
                   "label": "项目代码",
                   "required": true
                 },
                 {
                   "type": "textarea",
                   "name": "description",
                   "label": "项目描述"
                 },
                 {
                   "type": "input-text",
                   "name": "version",
                   "label": "版本号",
                   "value": "1.0.0"
                 }
               ]
             }
           }
         }
       ],
       "columns": [
         {
           "name": "name",
           "label": "项目名称",
           "type": "text"
         },
         {
           "name": "code",
           "label": "项目代码",
           "type": "text"
         },
         {
           "name": "description",
           "label": "描述",
           "type": "text"
         },
         {
           "name": "version",
           "label": "版本",
           "type": "text"
         },
         {
           "name": "status",
           "label": "状态",
           "type": "mapping",
           "map": {
             "ACTIVE": "<span class=\"label label-success\">活跃</span>",
             "INACTIVE": "<span class=\"label label-default\">非活跃</span>",
             "ARCHIVED": "<span class=\"label label-warning\">已归档</span>"
           }
         },
         {
           "type": "operation",
           "label": "操作",
           "buttons": [
             {
               "type": "button",
               "label": "编辑",
               "level": "link",
               "actionType": "dialog",
               "dialog": {
                 "title": "编辑项目",
                 "body": {
                   "type": "form",
                   "api": {
                     "method": "put",
                     "url": "/api/v1/projects/${id}"
                   },
                   "initApi": {
                     "method": "get",
                     "url": "/api/v1/projects/${id}"
                   }
                 }
               }
             },
             {
               "type": "button",
               "label": "删除",
               "level": "link",
               "className": "text-danger",
               "actionType": "ajax",
               "confirmText": "确定要删除这个项目吗？",
               "api": {
                 "method": "delete",
                 "url": "/api/v1/projects/${id}"
               }
             }
           ]
         }
       ]
     }
   ]
 }',
    'ENABLED',
    'system',
    NOW()
),

-- 实体管理页面
(
    'lowcode-entity-page',
    '实体管理',
    '实体管理',
    'lowcode-entity',
    '设计实体：创建业务实体和数据模型',
    '{
   "type": "page",
   "title": "实体管理",
   "subTitle": "设计实体：创建业务实体和数据模型",
   "body": [
     {
       "type": "crud",
       "title": "实体列表",
       "api": {
         "method": "get",
         "url": "/api/v1/entities/project/demo-project-1/paginated"
       },
       "headerToolbar": [
         {
           "type": "button",
           "label": "新增实体",
           "actionType": "dialog",
           "level": "primary",
           "dialog": {
             "title": "新增实体",
             "size": "lg",
             "body": {
               "type": "form",
               "api": {
                 "method": "post",
                 "url": "/api/v1/entities"
               },
               "body": [
                 {
                   "type": "select",
                   "name": "projectId",
                   "label": "所属项目",
                   "required": true,
                   "source": {
                     "method": "get",
                     "url": "/api/v1/projects?size=100"
                   }
                 },
                 {
                   "type": "input-text",
                   "name": "name",
                   "label": "实体名称",
                   "required": true
                 },
                 {
                   "type": "input-text",
                   "name": "code",
                   "label": "实体代码",
                   "required": true
                 },
                 {
                   "type": "input-text",
                   "name": "tableName",
                   "label": "表名",
                   "required": true
                 },
                 {
                   "type": "textarea",
                   "name": "description",
                   "label": "描述"
                 },
                 {
                   "type": "input-text",
                   "name": "category",
                   "label": "分类"
                 }
               ]
             }
           }
         }
       ],
       "columns": [
         {
           "name": "name",
           "label": "实体名称",
           "type": "text"
         },
         {
           "name": "code",
           "label": "实体代码",
           "type": "text"
         },
         {
           "name": "tableName",
           "label": "表名",
           "type": "text"
         },
         {
           "name": "category",
           "label": "分类",
           "type": "text"
         },
         {
           "name": "status",
           "label": "状态",
           "type": "mapping",
           "map": {
             "DRAFT": "<span class=\"label label-info\">草稿</span>",
             "PUBLISHED": "<span class=\"label label-success\">已发布</span>",
             "DEPRECATED": "<span class=\"label label-warning\">已废弃</span>"
           }
         },
         {
           "type": "operation",
           "label": "操作",
           "buttons": [
             {
               "type": "button",
               "label": "字段管理",
               "level": "link",
               "actionType": "url",
               "url": "/lowcode/field?entityId=${id}"
             },
             {
               "type": "button",
               "label": "编辑",
               "level": "link",
               "actionType": "dialog"
             },
             {
               "type": "button",
               "label": "删除",
               "level": "link",
               "className": "text-danger",
               "actionType": "ajax",
               "confirmText": "确定要删除这个实体吗？",
               "api": {
                 "method": "delete",
                 "url": "/api/v1/entities/${id}"
               }
             }
           ]
         }
       ]
     }
   ]
 }',
    'ENABLED',
    'system',
    NOW()
),

-- 字段管理页面
(
    'lowcode-field-page',
    '字段管理',
    '字段管理',
    'lowcode-field',
    '管理字段：定义字段类型、验证规则、UI配置',
    '{
   "type": "page",
   "title": "字段管理",
   "subTitle": "管理字段：定义字段类型、验证规则、UI配置",
   "body": [
     {
       "type": "crud",
       "title": "字段列表",
       "api": {
         "method": "get",
         "url": "/api/v1/fields"
       },
       "headerToolbar": [
         {
           "type": "button",
           "label": "新增字段",
           "actionType": "dialog",
           "level": "primary",
           "dialog": {
             "title": "新增字段",
             "size": "lg",
             "body": {
               "type": "form",
               "api": {
                 "method": "post",
                 "url": "/api/v1/fields"
               },
               "body": [
                 {
                   "type": "select",
                   "name": "entityId",
                   "label": "所属实体",
                   "required": true,
                   "source": {
                     "method": "get",
                     "url": "/api/v1/entities?size=100"
                   }
                 },
                 {
                   "type": "input-text",
                   "name": "name",
                   "label": "字段名称",
                   "required": true
                 },
                 {
                   "type": "input-text",
                   "name": "code",
                   "label": "字段代码",
                   "required": true
                 },
                 {
                   "type": "select",
                   "name": "type",
                   "label": "字段类型",
                   "required": true,
                   "options": [
                     {"label": "字符串", "value": "STRING"},
                     {"label": "整数", "value": "INTEGER"},
                     {"label": "小数", "value": "DECIMAL"},
                     {"label": "布尔值", "value": "BOOLEAN"},
                     {"label": "日期", "value": "DATE"},
                     {"label": "日期时间", "value": "DATETIME"},
                     {"label": "时间", "value": "TIME"},
                     {"label": "UUID", "value": "UUID"},
                     {"label": "JSON", "value": "JSON"},
                     {"label": "文本", "value": "TEXT"}
                   ]
                 },
                 {
                   "type": "input-number",
                   "name": "length",
                   "label": "长度"
                 },
                 {
                   "type": "switch",
                   "name": "nullable",
                   "label": "允许为空",
                   "value": true
                 },
                 {
                   "type": "switch",
                   "name": "uniqueConstraint",
                   "label": "唯一约束"
                 },
                 {
                   "type": "switch",
                   "name": "primaryKey",
                   "label": "主键"
                 },
                 {
                   "type": "textarea",
                   "name": "comment",
                   "label": "注释"
                 }
               ]
             }
           }
         }
       ]
     }
   ]
 }',
    'ENABLED',
    'system',
    NOW()
),

-- 关系管理页面
(
    'lowcode-relationship-page',
    '关系管理',
    '关系管理',
    'lowcode-relationship',
    '配置关系：设置实体间的关联关系',
    '{
   "type": "page",
   "title": "关系管理",
   "subTitle": "配置关系：设置实体间的关联关系",
   "body": [
     {
       "type": "crud",
       "title": "关系列表",
       "api": {
         "method": "get",
         "url": "/api/v1/relations"
       },
       "headerToolbar": [
         {
           "type": "button",
           "label": "新增关系",
           "actionType": "dialog",
           "level": "primary",
           "dialog": {
             "title": "新增关系",
             "size": "lg",
             "body": {
               "type": "form",
               "api": {
                 "method": "post",
                 "url": "/api/v1/relations"
               },
               "body": [
                 {
                   "type": "input-text",
                   "name": "name",
                   "label": "关系名称",
                   "required": true
                 },
                 {
                   "type": "select",
                   "name": "type",
                   "label": "关系类型",
                   "required": true,
                   "options": [
                     {"label": "一对一", "value": "ONE_TO_ONE"},
                     {"label": "一对多", "value": "ONE_TO_MANY"},
                     {"label": "多对一", "value": "MANY_TO_ONE"},
                     {"label": "多对多", "value": "MANY_TO_MANY"}
                   ]
                 },
                 {
                   "type": "select",
                   "name": "sourceEntityId",
                   "label": "源实体",
                   "required": true,
                   "source": {
                     "method": "get",
                     "url": "/api/v1/entities?size=100"
                   }
                 },
                 {
                   "type": "select",
                   "name": "targetEntityId",
                   "label": "目标实体",
                   "required": true,
                   "source": {
                     "method": "get",
                     "url": "/api/v1/entities?size=100"
                   }
                 }
               ]
             }
           }
         }
       ],
       "columns": [
         {
           "name": "name",
           "label": "关系名称",
           "type": "text"
         },
         {
           "name": "type",
           "label": "关系类型",
           "type": "mapping",
           "map": {
             "ONE_TO_ONE": "一对一",
             "ONE_TO_MANY": "一对多",
             "MANY_TO_ONE": "多对一",
             "MANY_TO_MANY": "多对多"
           }
         },
         {
           "name": "sourceEntity.name",
           "label": "源实体",
           "type": "text"
         },
         {
           "name": "targetEntity.name",
           "label": "目标实体",
           "type": "text"
         },
         {
           "name": "status",
           "label": "状态",
           "type": "mapping",
           "map": {
             "ACTIVE": "<span class=\"label label-success\">活跃</span>",
             "INACTIVE": "<span class=\"label label-default\">非活跃</span>"
           }
         }
       ]
     }
   ]
 }',
    'ENABLED',
    'system',
    NOW()
),

-- 查询管理页面
(
    'lowcode-query-page',
    '查询管理',
    '查询管理',
    'lowcode-query',
    '编写查询：创建复杂的数据查询逻辑',
    '{
   "type": "page",
   "title": "查询管理",
   "subTitle": "编写查询：创建复杂的数据查询逻辑",
   "body": [
     {
       "type": "crud",
       "title": "查询列表",
       "api": {
         "method": "get",
         "url": "/api/v1/queries"
       },
       "headerToolbar": [
         {
           "type": "button",
           "label": "新增查询",
           "actionType": "dialog",
           "level": "primary",
           "dialog": {
             "title": "新增查询",
             "size": "lg",
             "body": {
               "type": "form",
               "api": {
                 "method": "post",
                 "url": "/api/v1/queries"
               },
               "body": [
                 {
                   "type": "input-text",
                   "name": "name",
                   "label": "查询名称",
                   "required": true
                 },
                 {
                   "type": "textarea",
                   "name": "description",
                   "label": "查询描述"
                 },
                 {
                   "type": "select",
                   "name": "baseEntityId",
                   "label": "基础实体",
                   "required": true,
                   "source": {
                     "method": "get",
                     "url": "/api/v1/entities?size=100"
                   }
                 }
               ]
             }
           }
         }
       ],
       "columns": [
         {
           "name": "name",
           "label": "查询名称",
           "type": "text"
         },
         {
           "name": "description",
           "label": "描述",
           "type": "text"
         },
         {
           "name": "baseEntity.name",
           "label": "基础实体",
           "type": "text"
         },
         {
           "name": "status",
           "label": "状态",
           "type": "mapping",
           "map": {
             "DRAFT": "<span class=\"label label-info\">草稿</span>",
             "PUBLISHED": "<span class=\"label label-success\">已发布</span>",
             "DEPRECATED": "<span class=\"label label-warning\">已废弃</span>"
           }
         }
       ]
     }
   ]
 }',
    'ENABLED',
    'system',
    NOW()
),

-- API配置页面
(
    'lowcode-api-config-page',
    'API配置',
    'API配置',
    'lowcode-api-config',
    '配置API：定义RESTful API接口',
    '{
   "type": "page",
   "title": "API配置",
   "subTitle": "配置API：定义RESTful API接口",
   "body": [
     {
       "type": "crud",
       "title": "API配置列表",
       "api": {
         "method": "get",
         "url": "/api/v1/api-configs"
       },
       "headerToolbar": [
         {
           "type": "button",
           "label": "新增API",
           "actionType": "dialog",
           "level": "primary",
           "dialog": {
             "title": "新增API配置",
             "size": "lg",
             "body": {
               "type": "form",
               "api": {
                 "method": "post",
                 "url": "/api/v1/api-configs"
               },
               "body": [
                 {
                   "type": "input-text",
                   "name": "name",
                   "label": "API名称",
                   "required": true
                 },
                 {
                   "type": "select",
                   "name": "method",
                   "label": "HTTP方法",
                   "required": true,
                   "options": [
                     {"label": "GET", "value": "GET"},
                     {"label": "POST", "value": "POST"},
                     {"label": "PUT", "value": "PUT"},
                     {"label": "DELETE", "value": "DELETE"},
                     {"label": "PATCH", "value": "PATCH"}
                   ]
                 },
                 {
                   "type": "input-text",
                   "name": "path",
                   "label": "API路径",
                   "required": true,
                   "placeholder": "/api/v1/users"
                 },
                 {
                   "type": "select",
                   "name": "entityId",
                   "label": "关联实体",
                   "source": {
                     "method": "get",
                     "url": "/api/v1/entities?size=100"
                   }
                 },
                 {
                   "type": "textarea",
                   "name": "description",
                   "label": "API描述"
                 }
               ]
             }
           }
         }
       ],
       "columns": [
         {
           "name": "name",
           "label": "API名称",
           "type": "text"
         },
         {
           "name": "method",
           "label": "方法",
           "type": "mapping",
           "map": {
             "GET": "<span class=\"label label-info\">GET</span>",
             "POST": "<span class=\"label label-success\">POST</span>",
             "PUT": "<span class=\"label label-warning\">PUT</span>",
             "DELETE": "<span class=\"label label-danger\">DELETE</span>",
             "PATCH": "<span class=\"label label-primary\">PATCH</span>"
           }
         },
         {
           "name": "path",
           "label": "路径",
           "type": "text"
         },
         {
           "name": "entity.name",
           "label": "关联实体",
           "type": "text"
         },
         {
           "name": "status",
           "label": "状态",
           "type": "mapping",
           "map": {
             "DRAFT": "<span class=\"label label-info\">草稿</span>",
             "PUBLISHED": "<span class=\"label label-success\">已发布</span>",
             "DEPRECATED": "<span class=\"label label-warning\">已废弃</span>"
           }
         }
       ]
     }
   ]
 }',
    'ENABLED',
    'system',
    NOW()
),

-- API测试页面
(
    'lowcode-api-test-page',
    'API测试',
    'API测试',
    'lowcode-api-test',
    '测试API：在线测试API功能',
    '{
   "type": "page",
   "title": "API测试",
   "subTitle": "测试API：在线测试API功能",
   "body": [
     {
       "type": "form",
       "title": "API测试工具",
       "mode": "horizontal",
       "body": [
         {
           "type": "select",
           "name": "apiId",
           "label": "选择API",
           "required": true,
           "source": {
             "method": "get",
             "url": "/api/v1/api-configs?size=100"
           },
           "description": "选择要测试的API接口"
         },
         {
           "type": "select",
           "name": "method",
           "label": "HTTP方法",
           "required": true,
           "options": [
             {"label": "GET", "value": "GET"},
             {"label": "POST", "value": "POST"},
             {"label": "PUT", "value": "PUT"},
             {"label": "DELETE", "value": "DELETE"}
           ]
         },
         {
           "type": "input-text",
           "name": "url",
           "label": "请求URL",
           "required": true,
           "placeholder": "http://localhost:3000/api/v1/users"
         },
         {
           "type": "json-editor",
           "name": "headers",
           "label": "请求头",
           "value": "{\"Content-Type\": \"application/json\"}"
         },
         {
           "type": "json-editor",
           "name": "body",
           "label": "请求体",
           "visibleOn": "${method !== \"GET\"}"
         }
       ],
       "actions": [
         {
           "type": "button",
           "actionType": "submit",
           "label": "发送请求",
           "level": "primary",
           "size": "lg"
         }
       ]
     },
     {
       "type": "divider"
     },
     {
       "type": "panel",
       "title": "响应结果",
       "body": [
         {
           "type": "json",
           "name": "response",
           "label": "响应数据"
         }
       ]
     }
   ]
 }',
    'ENABLED',
    'system',
    NOW()
),

-- 模板管理页面
(
    'lowcode-template-page',
    '模板管理',
    '模板管理',
    'lowcode-template',
    '管理模板：维护代码生成模板',
    '{
   "type": "page",
   "title": "模板管理",
   "subTitle": "管理模板：维护代码生成模板",
   "body": [
     {
       "type": "crud",
       "title": "模板列表",
       "api": {
         "method": "get",
         "url": "/api/v1/templates"
       },
       "headerToolbar": [
         {
           "type": "button",
           "label": "新增模板",
           "actionType": "dialog",
           "level": "primary",
           "dialog": {
             "title": "新增模板",
             "size": "xl",
             "body": {
               "type": "form",
               "api": {
                 "method": "post",
                 "url": "/api/v1/templates"
               },
               "body": [
                 {
                   "type": "input-text",
                   "name": "name",
                   "label": "模板名称",
                   "required": true
                 },
                 {
                   "type": "input-text",
                   "name": "code",
                   "label": "模板代码",
                   "required": true
                 },
                 {
                   "type": "select",
                   "name": "type",
                   "label": "模板类型",
                   "required": true,
                   "options": [
                     {"label": "实体模型", "value": "ENTITY_MODEL"},
                     {"label": "实体DTO", "value": "ENTITY_DTO"},
                     {"label": "实体服务", "value": "ENTITY_SERVICE"},
                     {"label": "实体控制器", "value": "ENTITY_CONTROLLER"},
                     {"label": "实体仓储", "value": "ENTITY_REPOSITORY"},
                     {"label": "API控制器", "value": "API_CONTROLLER"}
                   ]
                 },
                 {
                   "type": "select",
                   "name": "language",
                   "label": "编程语言",
                   "required": true,
                   "options": [
                     {"label": "TypeScript", "value": "TYPESCRIPT"},
                     {"label": "JavaScript", "value": "JAVASCRIPT"},
                     {"label": "Java", "value": "JAVA"},
                     {"label": "Python", "value": "PYTHON"}
                   ]
                 },
                 {
                   "type": "select",
                   "name": "framework",
                   "label": "框架",
                   "required": true,
                   "options": [
                     {"label": "NestJS", "value": "NESTJS"},
                     {"label": "Express", "value": "EXPRESS"},
                     {"label": "Spring Boot", "value": "SPRING_BOOT"},
                     {"label": "FastAPI", "value": "FASTAPI"}
                   ]
                 },
                 {
                   "type": "textarea",
                   "name": "description",
                   "label": "模板描述"
                 },
                 {
                   "type": "code-editor",
                   "name": "template",
                   "label": "模板内容",
                   "language": "handlebars",
                   "required": true,
                   "size": "xxl"
                 }
               ]
             }
           }
         }
       ]
     }
   ]
 }',
    'ENABLED',
    'system',
    NOW()
);

-- 插入低代码页面版本数据
INSERT INTO
    backend.sys_lowcode_page_version (
        id,
        page_id,
        version,
        schema,
        changelog,
        created_by,
        created_at
    )
VALUES (
        'lowcode-project-version-1',
        'lowcode-project-page',
        '1.0.0',
        '{"type":"page","title":"项目管理","body":[{"type":"crud","api":"/api/v1/projects"}]}',
        '初始版本 - 项目管理功能',
        'system',
        NOW()
    ),
    (
        'lowcode-entity-version-1',
        'lowcode-entity-page',
        '1.0.0',
        '{"type":"page","title":"实体管理","body":[{"type":"crud","api":"/api/v1/entities"}]}',
        '初始版本 - 实体管理功能',
        'system',
        NOW()
    ),
    (
        'lowcode-field-version-1',
        'lowcode-field-page',
        '1.0.0',
        '{"type":"page","title":"字段管理","body":[{"type":"crud","api":"/api/v1/fields"}]}',
        '初始版本 - 字段管理功能',
        'system',
        NOW()
    ),
    (
        'lowcode-relationship-version-1',
        'lowcode-relationship-page',
        '1.0.0',
        '{"type":"page","title":"关系管理","body":[{"type":"crud","api":"/api/v1/relations"}]}',
        '初始版本 - 关系管理功能',
        'system',
        NOW()
    ),
    (
        'lowcode-query-version-1',
        'lowcode-query-page',
        '1.0.0',
        '{"type":"page","title":"查询管理","body":[{"type":"crud","api":"/api/v1/queries"}]}',
        '初始版本 - 查询管理功能',
        'system',
        NOW()
    ),
    (
        'lowcode-api-config-version-1',
        'lowcode-api-config-page',
        '1.0.0',
        '{"type":"page","title":"API配置","body":[{"type":"crud","api":"/api/v1/api-configs"}]}',
        '初始版本 - API配置功能',
        'system',
        NOW()
    ),
    (
        'lowcode-api-test-version-1',
        'lowcode-api-test-page',
        '1.0.0',
        '{"type":"page","title":"API测试","body":[{"type":"form","api":"/api/v1/api-test"}]}',
        '初始版本 - API测试功能',
        'system',
        NOW()
    ),
    (
        'lowcode-template-version-1',
        'lowcode-template-page',
        '1.0.0',
        '{"type":"page","title":"模板管理","body":[{"type":"crud","api":"/api/v1/templates"}]}',
        '初始版本 - 模板管理功能',
        'system',
        NOW()
    );

-- 更新菜单项，关联到新创建的低代码页面
UPDATE backend.sys_menu
SET
    lowcode_page_id = 'lowcode-project-page'
WHERE
    route_name = 'lowcode_project';

UPDATE backend.sys_menu
SET
    lowcode_page_id = 'lowcode-entity-page'
WHERE
    route_name = 'lowcode_entity';

UPDATE backend.sys_menu
SET
    lowcode_page_id = 'lowcode-field-page'
WHERE
    route_name = 'lowcode_field';

UPDATE backend.sys_menu
SET
    lowcode_page_id = 'lowcode-relationship-page'
WHERE
    route_name = 'lowcode_relationship';

UPDATE backend.sys_menu
SET
    lowcode_page_id = 'lowcode-query-page'
WHERE
    route_name = 'lowcode_query';

UPDATE backend.sys_menu
SET
    lowcode_page_id = 'lowcode-api-config-page'
WHERE
    route_name = 'lowcode_api-config';

UPDATE backend.sys_menu
SET
    lowcode_page_id = 'lowcode-api-test-page'
WHERE
    route_name = 'lowcode_api-test';

UPDATE backend.sys_menu
SET
    lowcode_page_id = 'lowcode-template-page'
WHERE
    route_name = 'lowcode_template';

-- 插入完成提示
DO $$
BEGIN
    RAISE NOTICE '✅ 低代码平台页面配置初始化完成！';
    RAISE NOTICE '📋 已创建以下功能页面：';
    RAISE NOTICE '   - 项目管理页面 - 创建项目：定义项目基本信息和配置';
    RAISE NOTICE '   - 实体管理页面 - 设计实体：创建业务实体和数据模型';
    RAISE NOTICE '   - 字段管理页面 - 管理字段：定义字段类型、验证规则、UI配置';
    RAISE NOTICE '   - 关系管理页面 - 配置关系：设置实体间的关联关系';
    RAISE NOTICE '   - 查询管理页面 - 编写查询：创建复杂的数据查询逻辑';
    RAISE NOTICE '   - API配置页面 - 配置API：定义RESTful API接口';
    RAISE NOTICE '   - API测试页面 - 测试API：在线测试API功能';
    RAISE NOTICE '   - 模板管理页面 - 管理模板：维护代码生成模板';
    RAISE NOTICE '🔗 已关联菜单项到对应的低代码页面';
    RAISE NOTICE '🎯 低代码平台功能页面配置完整，支持完整的开发流程！';
END $$;