import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Amis组件类型
 */
export type AmisComponentType = 
  | 'crud'
  | 'form'
  | 'page'
  | 'dialog'
  | 'drawer'
  | 'table'
  | 'cards'
  | 'list'
  | 'chart'
  | 'tabs'
  | 'wizard'
  | 'service';

/**
 * Amis数据格式规范
 */
export interface AmisDataFormat {
  /** 状态码，0表示成功 */
  status: number;
  /** 响应消息 */
  msg: string;
  /** 响应数据 */
  data: any;
}

/**
 * Amis分页格式
 */
export interface AmisPaginationFormat {
  /** 当前页数据 */
  items: any[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page?: number;
  /** 每页数量 */
  perPage?: number;
  /** 总页数 */
  totalPage?: number;
  /** 是否有下一页 */
  hasNext?: boolean;
}

/**
 * Amis表格列配置
 */
export interface AmisTableColumn {
  /** 列名 */
  name: string;
  /** 列标签 */
  label: string;
  /** 列类型 */
  type?: string;
  /** 是否可排序 */
  sortable?: boolean;
  /** 是否可搜索 */
  searchable?: boolean;
  /** 是否可筛选 */
  filterable?: boolean;
  /** 列宽 */
  width?: number;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 是否固定 */
  fixed?: 'left' | 'right';
  /** 格式化函数 */
  tpl?: string;
  /** 快速编辑 */
  quickEdit?: any;
  /** 复制功能 */
  copyable?: boolean;
}

/**
 * Amis表单字段配置
 */
export interface AmisFormField {
  /** 字段名 */
  name: string;
  /** 字段标签 */
  label: string;
  /** 字段类型 */
  type: string;
  /** 是否必填 */
  required?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 描述信息 */
  description?: string;
  /** 验证规则 */
  validations?: any;
  /** 字段选项 */
  options?: Array<{ label: string; value: any }>;
  /** 字段属性 */
  [key: string]: any;
}

/**
 * Amis CRUD配置
 */
export interface AmisCrudConfig {
  /** API配置 */
  api: {
    /** 列表API */
    url: string;
    /** 请求方法 */
    method?: string;
    /** 数据映射 */
    dataMapping?: any;
  };
  /** 表格列配置 */
  columns: AmisTableColumn[];
  /** 工具栏配置 */
  headerToolbar?: any[];
  /** 底部工具栏配置 */
  footerToolbar?: any[];
  /** 批量操作 */
  bulkActions?: any[];
  /** 行操作 */
  itemActions?: any[];
  /** 筛选配置 */
  filter?: any;
  /** 分页配置 */
  pagination?: any;
  /** 其他配置 */
  [key: string]: any;
}

/**
 * Amis表单配置
 */
export interface AmisFormConfig {
  /** API配置 */
  api?: {
    /** 提交API */
    url: string;
    /** 请求方法 */
    method?: string;
    /** 数据映射 */
    dataMapping?: any;
  };
  /** 初始化API */
  initApi?: {
    /** 初始化API */
    url: string;
    /** 请求方法 */
    method?: string;
    /** 数据映射 */
    dataMapping?: any;
  };
  /** 表单字段 */
  body: AmisFormField[];
  /** 表单模式 */
  mode?: 'normal' | 'horizontal' | 'inline';
  /** 提交按钮 */
  actions?: any[];
  /** 其他配置 */
  [key: string]: any;
}

/**
 * Amis组件适配器服务
 */
@Injectable()
export class AmisComponentAdapterService {
  private readonly logger = new Logger(AmisComponentAdapterService.name);

  constructor(
    private readonly configService: ConfigService,
  ) {}

  /**
   * 生成Amis CRUD组件配置
   */
  generateCrudConfig(options: {
    /** 实体名称 */
    entityName: string;
    /** API基础路径 */
    apiBasePath: string;
    /** 字段配置 */
    fields: Array<{
      name: string;
      label: string;
      type: string;
      required?: boolean;
      searchable?: boolean;
      sortable?: boolean;
      filterable?: boolean;
    }>;
    /** 操作配置 */
    operations?: {
      create?: boolean;
      update?: boolean;
      delete?: boolean;
      view?: boolean;
      batch?: boolean;
    };
    /** 分页配置 */
    pagination?: {
      pageSize?: number;
      pageSizeOptions?: number[];
    };
  }): AmisCrudConfig {
    const { entityName, apiBasePath, fields, operations = {}, pagination = {} } = options;

    // 生成表格列配置
    const columns: AmisTableColumn[] = fields.map(field => ({
      name: field.name,
      label: field.label,
      type: this.mapFieldTypeToAmisColumn(field.type),
      sortable: field.sortable,
      searchable: field.searchable,
      filterable: field.filterable,
      ...this.getColumnExtraConfig(field.type, field.name),
    }));

    // 添加操作列
    if (operations.update || operations.delete || operations.view) {
      columns.push({
        name: 'operation',
        label: '操作',
        type: 'operation',
        width: 150,
        buttons: this.generateOperationButtons(apiBasePath, operations),
      } as any);
    }

    // 生成工具栏配置
    const headerToolbar: any[] = [
      'bulkActions',
      {
        type: 'columns-toggler',
        align: 'right',
      },
      {
        type: 'drag-toggler',
        align: 'right',
      },
      {
        type: 'reload',
        align: 'right',
      },
    ];

    // 添加新增按钮
    if (operations.create) {
      headerToolbar.unshift({
        type: 'button',
        label: '新增',
        actionType: 'dialog',
        level: 'primary',
        className: 'mr-2',
        dialog: this.generateCreateDialog(entityName, apiBasePath, fields),
      });
    }

    // 生成筛选配置
    const filter = this.generateFilterConfig(fields);

    // 生成分页配置
    const paginationConfig = {
      enable: true,
      layout: ['total', 'perPage', 'pager'],
      perPage: pagination.pageSize || 10,
      perPageAvailable: pagination.pageSizeOptions || [10, 20, 50, 100],
      maxButtons: 7,
      showPerPage: true,
      showPageInput: true,
    };

    // 生成批量操作
    const bulkActions: any[] = [];
    if (operations.batch && operations.delete) {
      bulkActions.push({
        label: '批量删除',
        actionType: 'ajax',
        level: 'danger',
        confirmText: '确定要删除选中的记录吗？',
        api: {
          method: 'delete',
          url: `${apiBasePath}/batch`,
          data: {
            ids: '${ids}',
          },
        },
      });
    }

    return {
      api: {
        url: apiBasePath,
        method: 'get',
        dataMapping: {
          '&': '$$',
        },
      },
      columns,
      headerToolbar,
      footerToolbar: ['statistics', 'pagination'],
      bulkActions,
      filter,
      pagination: paginationConfig,
      perPageField: 'limit',
      pageField: 'page',
      orderField: 'sortBy',
      orderDirField: 'sortOrder',
      defaultParams: {
        limit: pagination.pageSize || 10,
        page: 1,
      },
    };
  }

  /**
   * 生成Amis表单配置
   */
  generateFormConfig(options: {
    /** 实体名称 */
    entityName: string;
    /** API路径 */
    apiPath: string;
    /** 表单模式 */
    mode: 'create' | 'edit' | 'view';
    /** 字段配置 */
    fields: Array<{
      name: string;
      label: string;
      type: string;
      required?: boolean;
      options?: Array<{ label: string; value: any }>;
      validation?: any;
    }>;
  }): AmisFormConfig {
    const { entityName, apiPath, mode, fields } = options;

    // 生成表单字段
    const body: AmisFormField[] = fields.map(field => ({
      name: field.name,
      label: field.label,
      type: this.mapFieldTypeToAmisForm(field.type),
      required: field.required,
      placeholder: `请输入${field.label}`,
      validations: field.validation,
      options: field.options,
      ...this.getFormFieldExtraConfig(field.type, field.name, mode),
    }));

    // 生成API配置
    const apiConfig: any = {};
    const initApiConfig: any = {};

    if (mode === 'create') {
      apiConfig.url = apiPath;
      apiConfig.method = 'post';
    } else if (mode === 'edit') {
      apiConfig.url = `${apiPath}/\${id}`;
      apiConfig.method = 'put';
      initApiConfig.url = `${apiPath}/\${id}`;
      initApiConfig.method = 'get';
    } else if (mode === 'view') {
      initApiConfig.url = `${apiPath}/\${id}`;
      initApiConfig.method = 'get';
      // 视图模式下所有字段都是只读的
      body.forEach(field => {
        field.disabled = true;
      });
    }

    // 生成操作按钮
    const actions: any[] = [];
    if (mode !== 'view') {
      actions.push(
        {
          type: 'submit',
          label: mode === 'create' ? '创建' : '更新',
          level: 'primary',
        },
        {
          type: 'button',
          label: '取消',
          actionType: 'cancel',
        }
      );
    } else {
      actions.push({
        type: 'button',
        label: '关闭',
        actionType: 'cancel',
      });
    }

    return {
      api: Object.keys(apiConfig).length > 0 ? apiConfig : undefined,
      initApi: Object.keys(initApiConfig).length > 0 ? initApiConfig : undefined,
      body,
      mode: 'horizontal',
      actions,
      labelWidth: 120,
    };
  }

  /**
   * 生成Amis页面配置
   */
  generatePageConfig(options: {
    /** 页面标题 */
    title: string;
    /** 页面类型 */
    type: 'crud' | 'form' | 'custom';
    /** 组件配置 */
    componentConfig: any;
    /** 面包屑 */
    breadcrumb?: Array<{ label: string; url?: string }>;
  }): any {
    const { title, type, componentConfig, breadcrumb } = options;

    const pageConfig: any = {
      type: 'page',
      title,
      body: [],
    };

    // 添加面包屑
    if (breadcrumb && breadcrumb.length > 0) {
      pageConfig.breadcrumb = breadcrumb;
    }

    // 根据页面类型添加组件
    switch (type) {
      case 'crud':
        pageConfig.body.push({
          type: 'crud',
          ...componentConfig,
        });
        break;
      case 'form':
        pageConfig.body.push({
          type: 'form',
          ...componentConfig,
        });
        break;
      case 'custom':
        pageConfig.body = componentConfig;
        break;
    }

    return pageConfig;
  }

  /**
   * 格式化API响应为Amis格式
   */
  formatApiResponse(data: any, success: boolean = true, message: string = 'success'): AmisDataFormat {
    return {
      status: success ? 0 : 1,
      msg: message,
      data,
    };
  }

  /**
   * 格式化分页数据为Amis格式
   */
  formatPaginationData(options: {
    items: any[];
    total: number;
    page: number;
    limit: number;
  }): AmisPaginationFormat {
    const { items, total, page, limit } = options;
    const totalPage = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      perPage: limit,
      totalPage,
      hasNext: page < totalPage,
    };
  }

  /**
   * 生成Amis图表配置
   */
  generateChartConfig(options: {
    /** 图表类型 */
    chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    /** 数据API */
    apiUrl: string;
    /** 图表配置 */
    chartOptions: any;
  }): any {
    const { chartType, apiUrl, chartOptions } = options;

    return {
      type: 'chart',
      api: apiUrl,
      config: {
        type: chartType,
        ...chartOptions,
      },
    };
  }

  /**
   * 生成Amis服务配置
   */
  generateServiceConfig(options: {
    /** 服务API */
    api: string;
    /** 数据映射 */
    dataMapping?: any;
    /** 子组件 */
    body: any[];
  }): any {
    const { api, dataMapping, body } = options;

    return {
      type: 'service',
      api,
      dataMapping,
      body,
    };
  }

  /**
   * 映射字段类型到Amis表格列类型
   */
  private mapFieldTypeToAmisColumn(fieldType: string): string {
    const typeMapping: Record<string, string> = {
      'string': 'text',
      'number': 'number',
      'boolean': 'status',
      'date': 'date',
      'datetime': 'datetime',
      'text': 'text',
      'email': 'text',
      'url': 'link',
      'image': 'image',
      'file': 'file',
      'json': 'json',
      'array': 'list',
    };

    return typeMapping[fieldType] || 'text';
  }

  /**
   * 映射字段类型到Amis表单字段类型
   */
  private mapFieldTypeToAmisForm(fieldType: string): string {
    const typeMapping: Record<string, string> = {
      'string': 'input-text',
      'number': 'input-number',
      'boolean': 'switch',
      'date': 'input-date',
      'datetime': 'input-datetime',
      'text': 'textarea',
      'email': 'input-email',
      'url': 'input-url',
      'password': 'input-password',
      'select': 'select',
      'radio': 'radios',
      'checkbox': 'checkboxes',
      'file': 'input-file',
      'image': 'input-image',
      'rich-text': 'input-rich-text',
      'json': 'json-editor',
    };

    return typeMapping[fieldType] || 'input-text';
  }

  /**
   * 获取列额外配置
   */
  private getColumnExtraConfig(fieldType: string, fieldName: string): any {
    const config: any = {};

    switch (fieldType) {
      case 'boolean':
        config.type = 'status';
        config.map = {
          true: '<span class="label label-success">是</span>',
          false: '<span class="label label-default">否</span>',
        };
        break;
      case 'date':
        config.format = 'YYYY-MM-DD';
        break;
      case 'datetime':
        config.format = 'YYYY-MM-DD HH:mm:ss';
        break;
      case 'image':
        config.type = 'image';
        config.enlargeAble = true;
        config.thumbMode = 'cover';
        config.thumbRatio = '1:1';
        break;
      case 'url':
        config.type = 'link';
        config.blank = true;
        break;
      case 'email':
        config.type = 'link';
        config.href = 'mailto:${' + fieldName + '}';
        break;
    }

    // 特殊字段名处理
    if (fieldName === 'id') {
      config.width = 80;
      config.copyable = true;
    } else if (fieldName.includes('status') || fieldName.includes('state')) {
      config.type = 'mapping';
      config.map = {
        'active': '<span class="label label-success">启用</span>',
        'inactive': '<span class="label label-warning">禁用</span>',
        'deleted': '<span class="label label-danger">删除</span>',
      };
    }

    return config;
  }

  /**
   * 获取表单字段额外配置
   */
  private getFormFieldExtraConfig(fieldType: string, fieldName: string, mode: string): any {
    const config: any = {};

    // 根据字段类型设置配置
    switch (fieldType) {
      case 'number':
        config.min = 0;
        config.precision = 0;
        break;
      case 'textarea':
        config.minRows = 3;
        config.maxRows = 6;
        break;
      case 'select':
        config.clearable = true;
        config.searchable = true;
        break;
      case 'file':
        config.accept = '*';
        config.maxSize = 10 * 1024 * 1024; // 10MB
        break;
      case 'image':
        config.accept = '.jpg,.jpeg,.png,.gif';
        config.maxSize = 5 * 1024 * 1024; // 5MB
        config.crop = true;
        break;
    }

    // 根据字段名设置配置
    if (fieldName === 'id') {
      config.disabled = true;
    } else if (fieldName === 'password') {
      config.type = 'input-password';
      config.clearValueOnHidden = true;
    } else if (fieldName.includes('email')) {
      config.validations = {
        isEmail: true,
      };
    } else if (fieldName.includes('phone')) {
      config.validations = {
        matchRegexp: '/^1[3-9]\\d{9}$/',
      };
    }

    // 根据模式设置配置
    if (mode === 'view') {
      config.disabled = true;
    }

    return config;
  }

  /**
   * 生成操作按钮
   */
  private generateOperationButtons(apiBasePath: string, operations: any): any[] {
    const buttons: any[] = [];

    if (operations.view) {
      buttons.push({
        type: 'button',
        label: '查看',
        actionType: 'dialog',
        level: 'info',
        size: 'sm',
        dialog: {
          title: '查看详情',
          size: 'lg',
          body: {
            type: 'form',
            initApi: `${apiBasePath}/\${id}`,
            mode: 'horizontal',
            disabled: true,
            body: [], // 这里需要根据实际字段配置
          },
        },
      });
    }

    if (operations.update) {
      buttons.push({
        type: 'button',
        label: '编辑',
        actionType: 'dialog',
        level: 'primary',
        size: 'sm',
        dialog: {
          title: '编辑',
          size: 'lg',
          body: {
            type: 'form',
            api: `${apiBasePath}/\${id}`,
            initApi: `${apiBasePath}/\${id}`,
            mode: 'horizontal',
            body: [], // 这里需要根据实际字段配置
          },
        },
      });
    }

    if (operations.delete) {
      buttons.push({
        type: 'button',
        label: '删除',
        actionType: 'ajax',
        level: 'danger',
        size: 'sm',
        confirmText: '确定要删除这条记录吗？',
        api: {
          method: 'delete',
          url: `${apiBasePath}/\${id}`,
        },
      });
    }

    return buttons;
  }

  /**
   * 生成创建对话框
   */
  private generateCreateDialog(entityName: string, apiBasePath: string, fields: any[]): any {
    return {
      title: `新增${entityName}`,
      size: 'lg',
      body: {
        type: 'form',
        api: apiBasePath,
        mode: 'horizontal',
        body: fields
          .filter(field => field.name !== 'id' && !field.name.includes('At'))
          .map(field => ({
            name: field.name,
            label: field.label,
            type: this.mapFieldTypeToAmisForm(field.type),
            required: field.required,
            placeholder: `请输入${field.label}`,
          })),
      },
    };
  }

  /**
   * 生成筛选配置
   */
  private generateFilterConfig(fields: any[]): any {
    const filterFields = fields.filter(field => field.filterable);

    if (filterFields.length === 0) {
      return undefined;
    }

    return {
      title: '筛选',
      body: filterFields.map(field => ({
        type: this.mapFieldTypeToAmisForm(field.type),
        name: field.name,
        label: field.label,
        placeholder: `请输入${field.label}`,
        clearable: true,
      })),
    };
  }
}
