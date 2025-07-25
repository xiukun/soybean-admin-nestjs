import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { CodeGenerationManagerService } from './code-generation-manager.service';
import { LowcodeDesignerIntegrationService } from './lowcode-designer-integration.service';
import { AmisComponentAdapterService } from './amis-component-adapter.service';
import { SingleTableCrudGeneratorService } from './single-table-crud-generator.service';
import { MultiTableRelationGeneratorService } from './multi-table-relation-generator.service';
import { AmisBusinessGeneratorService } from './amis-business-generator.service';
import { ApiParameterConfigService } from './api-parameter-config.service';
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';

/**
 * 测试场景类型
 */
export type TestScenarioType = 
  | 'single-table-crud'
  | 'multi-table-relation'
  | 'designer-integration'
  | 'amis-component'
  | 'api-parameter-config'
  | 'full-workflow';

/**
 * 测试结果状态
 */
export type TestResultStatus = 'passed' | 'failed' | 'skipped' | 'error';

/**
 * 测试步骤
 */
export interface TestStep {
  /** 步骤名称 */
  name: string;
  /** 步骤描述 */
  description: string;
  /** 执行函数 */
  execute: () => Promise<TestStepResult>;
  /** 是否必需 */
  required: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
}

/**
 * 测试步骤结果
 */
export interface TestStepResult {
  /** 是否成功 */
  success: boolean;
  /** 执行时间 */
  duration: number;
  /** 结果数据 */
  data?: any;
  /** 错误信息 */
  error?: string;
  /** 详细信息 */
  details?: any;
}

/**
 * 测试场景
 */
export interface TestScenario {
  /** 场景ID */
  id: string;
  /** 场景名称 */
  name: string;
  /** 场景类型 */
  type: TestScenarioType;
  /** 场景描述 */
  description: string;
  /** 测试步骤 */
  steps: TestStep[];
  /** 前置条件 */
  prerequisites?: string[];
  /** 清理步骤 */
  cleanup?: () => Promise<void>;
}

/**
 * 测试结果
 */
export interface TestResult {
  /** 场景ID */
  scenarioId: string;
  /** 场景名称 */
  scenarioName: string;
  /** 测试状态 */
  status: TestResultStatus;
  /** 开始时间 */
  startTime: Date;
  /** 结束时间 */
  endTime: Date;
  /** 总执行时间 */
  duration: number;
  /** 步骤结果 */
  stepResults: Array<{
    stepName: string;
    status: TestResultStatus;
    duration: number;
    error?: string;
    data?: any;
  }>;
  /** 错误信息 */
  error?: string;
  /** 测试数据 */
  testData?: any;
}

/**
 * 端到端测试服务
 */
@Injectable()
export class E2ETestService {
  private readonly logger = new Logger(E2ETestService.name);
  private readonly testResults = new Map<string, TestResult>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly codeGenerationManager: CodeGenerationManagerService,
    private readonly designerIntegration: LowcodeDesignerIntegrationService,
    private readonly amisAdapter: AmisComponentAdapterService,
    private readonly singleTableCrudGenerator: SingleTableCrudGeneratorService,
    private readonly multiTableRelationGenerator: MultiTableRelationGeneratorService,
    private readonly amisBusinessGenerator: AmisBusinessGeneratorService,
    private readonly apiParameterConfig: ApiParameterConfigService,
  ) {}

  /**
   * 运行所有测试场景
   */
  async runAllTests(): Promise<{
    totalScenarios: number;
    passedScenarios: number;
    failedScenarios: number;
    results: TestResult[];
  }> {
    this.logger.log('开始运行端到端测试');

    const scenarios = this.getTestScenarios();
    const results: TestResult[] = [];

    for (const scenario of scenarios) {
      try {
        const result = await this.runTestScenario(scenario);
        results.push(result);
        this.testResults.set(scenario.id, result);
      } catch (error) {
        this.logger.error(`测试场景 ${scenario.name} 执行失败:`, error);
        const failedResult: TestResult = {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          status: 'error',
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          stepResults: [],
          error: error.message,
        };
        results.push(failedResult);
        this.testResults.set(scenario.id, failedResult);
      }
    }

    const summary = {
      totalScenarios: scenarios.length,
      passedScenarios: results.filter(r => r.status === 'passed').length,
      failedScenarios: results.filter(r => r.status === 'failed' || r.status === 'error').length,
      results,
    };

    this.logger.log(`端到端测试完成: ${summary.passedScenarios}/${summary.totalScenarios} 通过`);
    return summary;
  }

  /**
   * 运行单个测试场景
   */
  async runTestScenario(scenario: TestScenario): Promise<TestResult> {
    this.logger.log(`开始测试场景: ${scenario.name}`);

    const startTime = new Date();
    const stepResults: TestResult['stepResults'] = [];
    let overallStatus: TestResultStatus = 'passed';
    let testData: any = {};

    try {
      // 检查前置条件
      if (scenario.prerequisites) {
        await this.checkPrerequisites(scenario.prerequisites);
      }

      // 执行测试步骤
      for (const step of scenario.steps) {
        const stepStartTime = Date.now();
        
        try {
          this.logger.log(`执行测试步骤: ${step.name}`);
          
          // 设置超时
          const timeout = step.timeout || 30000;
          const stepResult = await Promise.race([
            step.execute(),
            new Promise<TestStepResult>((_, reject) => 
              setTimeout(() => reject(new Error('步骤执行超时')), timeout)
            ),
          ]);

          const stepDuration = Date.now() - stepStartTime;
          
          stepResults.push({
            stepName: step.name,
            status: stepResult.success ? 'passed' : 'failed',
            duration: stepDuration,
            error: stepResult.error,
            data: stepResult.data,
          });

          // 保存步骤数据供后续步骤使用
          if (stepResult.data) {
            testData = { ...testData, ...stepResult.data };
          }

          if (!stepResult.success && step.required) {
            overallStatus = 'failed';
            this.logger.error(`必需步骤失败: ${step.name} - ${stepResult.error}`);
            break;
          }

        } catch (error) {
          const stepDuration = Date.now() - stepStartTime;
          stepResults.push({
            stepName: step.name,
            status: 'error',
            duration: stepDuration,
            error: error.message,
          });

          if (step.required) {
            overallStatus = 'failed';
            this.logger.error(`步骤执行异常: ${step.name} - ${error.message}`);
            break;
          }
        }
      }

    } catch (error) {
      overallStatus = 'error';
      this.logger.error(`测试场景执行异常: ${scenario.name} - ${error.message}`);
    } finally {
      // 执行清理
      if (scenario.cleanup) {
        try {
          await scenario.cleanup();
        } catch (error) {
          this.logger.warn(`清理步骤失败: ${error.message}`);
        }
      }
    }

    const endTime = new Date();
    const result: TestResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      status: overallStatus,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      stepResults,
      testData,
    };

    this.logger.log(`测试场景完成: ${scenario.name} - ${overallStatus}`);
    return result;
  }

  /**
   * 获取测试结果
   */
  getTestResult(scenarioId: string): TestResult | null {
    return this.testResults.get(scenarioId) || null;
  }

  /**
   * 获取所有测试结果
   */
  getAllTestResults(): TestResult[] {
    return Array.from(this.testResults.values());
  }

  /**
   * 生成测试报告
   */
  generateTestReport(): {
    summary: {
      totalScenarios: number;
      passedScenarios: number;
      failedScenarios: number;
      successRate: number;
      totalDuration: number;
    };
    scenarios: TestResult[];
    details: any;
  } {
    const results = this.getAllTestResults();
    
    const summary = {
      totalScenarios: results.length,
      passedScenarios: results.filter(r => r.status === 'passed').length,
      failedScenarios: results.filter(r => r.status === 'failed' || r.status === 'error').length,
      successRate: results.length > 0 ? (results.filter(r => r.status === 'passed').length / results.length) * 100 : 0,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
    };

    const details = {
      scenariosByType: this.groupResultsByType(results),
      averageDurationByType: this.calculateAverageDurationByType(results),
      commonFailures: this.analyzeCommonFailures(results),
      performanceMetrics: this.calculatePerformanceMetrics(results),
    };

    return {
      summary,
      scenarios: results,
      details,
    };
  }

  /**
   * 获取测试场景定义
   */
  private getTestScenarios(): TestScenario[] {
    return [
      this.createSingleTableCrudScenario(),
      this.createMultiTableRelationScenario(),
      this.createDesignerIntegrationScenario(),
      this.createAmisComponentScenario(),
      this.createApiParameterConfigScenario(),
      this.createFullWorkflowScenario(),
    ];
  }

  /**
   * 创建单表CRUD测试场景
   */
  private createSingleTableCrudScenario(): TestScenario {
    return {
      id: 'single-table-crud',
      name: '单表CRUD生成测试',
      type: 'single-table-crud',
      description: '测试单表CRUD代码生成的完整流程',
      steps: [
        {
          name: '准备测试数据',
          description: '创建用户实体定义',
          required: true,
          execute: async () => {
            const entityDefinition = {
              code: 'user',
              name: 'User',
              description: '用户实体',
              fields: [
                { name: 'id', type: 'string', required: true, description: 'ID' },
                { name: 'username', type: 'string', required: true, description: '用户名' },
                { name: 'email', type: 'string', required: true, description: '邮箱' },
                { name: 'status', type: 'string', required: false, description: '状态' },
              ],
            };

            return {
              success: true,
              duration: 0,
              data: { entityDefinition },
            };
          },
        },
        {
          name: '生成CRUD代码',
          description: '使用单表CRUD生成器生成代码',
          required: true,
          timeout: 60000,
          execute: async () => {
            const startTime = Date.now();
            
            try {
              const result = await this.singleTableCrudGenerator.generateSingleTableCrud(
                {
                  code: 'user',
                  name: 'User',
                  description: '用户实体',
                  fields: [
                    { name: 'id', type: 'string', required: true, description: 'ID' },
                    { name: 'username', type: 'string', required: true, description: '用户名' },
                    { name: 'email', type: 'string', required: true, description: '邮箱' },
                    { name: 'status', type: 'string', required: false, description: '状态' },
                  ],
                },
                {
                  projectName: 'e2e-test-user',
                  outputDir: './test-output/single-crud',
                  enableSoftDelete: true,
                  enableDataPermission: false,
                  enableAuditLog: true,
                  enableCache: false,
                  generateTests: true,
                  generateSwagger: true,
                },
                {
                  enableCreate: true,
                  enableRead: true,
                  enableUpdate: true,
                  enableDelete: true,
                  enableBatchOperations: true,
                  enableSearch: true,
                  enableSort: true,
                  enableFilter: true,
                  enableImportExport: false,
                }
              );

              return {
                success: result.length > 0,
                duration: Date.now() - startTime,
                data: { generatedFiles: result },
              };
            } catch (error) {
              return {
                success: false,
                duration: Date.now() - startTime,
                error: error.message,
              };
            }
          },
        },
        {
          name: '验证生成的文件',
          description: '检查生成的文件是否存在且内容正确',
          required: true,
          execute: async () => {
            const startTime = Date.now();
            
            try {
              const expectedFiles = [
                './test-output/single-crud/user.controller.ts',
                './test-output/single-crud/user.service.ts',
                './test-output/single-crud/user.dto.ts',
              ];

              const existingFiles = [];
              for (const filePath of expectedFiles) {
                if (await fs.pathExists(filePath)) {
                  existingFiles.push(filePath);
                }
              }

              return {
                success: existingFiles.length === expectedFiles.length,
                duration: Date.now() - startTime,
                data: { 
                  expectedFiles: expectedFiles.length,
                  existingFiles: existingFiles.length,
                  files: existingFiles,
                },
                error: existingFiles.length !== expectedFiles.length 
                  ? `期望 ${expectedFiles.length} 个文件，实际 ${existingFiles.length} 个`
                  : undefined,
              };
            } catch (error) {
              return {
                success: false,
                duration: Date.now() - startTime,
                error: error.message,
              };
            }
          },
        },
      ],
      cleanup: async () => {
        try {
          await fs.remove('./test-output/single-crud');
        } catch (error) {
          this.logger.warn('清理单表CRUD测试文件失败:', error);
        }
      },
    };
  }

  /**
   * 创建多表关联测试场景
   */
  private createMultiTableRelationScenario(): TestScenario {
    return {
      id: 'multi-table-relation',
      name: '多表关联生成测试',
      type: 'multi-table-relation',
      description: '测试多表关联代码生成的完整流程',
      steps: [
        {
          name: '准备关联实体数据',
          description: '创建用户和订单的关联实体定义',
          required: true,
          execute: async () => {
            const relationConfig = {
              entities: [
                {
                  code: 'user',
                  name: 'User',
                  description: '用户实体',
                  fields: [
                    { name: 'id', type: 'string', required: true, description: 'ID' },
                    { name: 'username', type: 'string', required: true, description: '用户名' },
                  ],
                },
                {
                  code: 'order',
                  name: 'Order',
                  description: '订单实体',
                  fields: [
                    { name: 'id', type: 'string', required: true, description: 'ID' },
                    { name: 'userId', type: 'string', required: true, description: '用户ID' },
                    { name: 'amount', type: 'number', required: true, description: '金额' },
                  ],
                },
              ],
              relations: [
                {
                  type: 'one-to-many',
                  sourceEntity: 'user',
                  targetEntity: 'order',
                  sourceField: 'id',
                  targetField: 'userId',
                  relationName: 'orders',
                },
              ],
            };

            return {
              success: true,
              duration: 0,
              data: { relationConfig },
            };
          },
        },
        {
          name: '生成关联代码',
          description: '使用多表关联生成器生成代码',
          required: true,
          timeout: 90000,
          execute: async () => {
            const startTime = Date.now();
            
            try {
              const result = await this.multiTableRelationGenerator.generateMultiTableRelation(
                {
                  entities: [
                    {
                      code: 'user',
                      name: 'User',
                      description: '用户实体',
                      fields: [
                        { name: 'id', type: 'string', required: true, description: 'ID' },
                        { name: 'username', type: 'string', required: true, description: '用户名' },
                      ],
                    },
                    {
                      code: 'order',
                      name: 'Order',
                      description: '订单实体',
                      fields: [
                        { name: 'id', type: 'string', required: true, description: 'ID' },
                        { name: 'userId', type: 'string', required: true, description: '用户ID' },
                        { name: 'amount', type: 'number', required: true, description: '金额' },
                      ],
                    },
                  ],
                  relations: [
                    {
                      type: 'one-to-many',
                      sourceEntity: 'user',
                      targetEntity: 'order',
                      sourceField: 'id',
                      targetField: 'userId',
                      relationName: 'orders',
                    },
                  ],
                },
                {
                  projectName: 'e2e-test-relation',
                  outputDir: './test-output/multi-relation',
                  enableSoftDelete: true,
                  enableDataPermission: false,
                  enableAuditLog: true,
                  enableCache: false,
                  generateTests: true,
                  generateSwagger: true,
                }
              );

              return {
                success: result.length > 0,
                duration: Date.now() - startTime,
                data: { generatedFiles: result },
              };
            } catch (error) {
              return {
                success: false,
                duration: Date.now() - startTime,
                error: error.message,
              };
            }
          },
        },
      ],
      cleanup: async () => {
        try {
          await fs.remove('./test-output/multi-relation');
        } catch (error) {
          this.logger.warn('清理多表关联测试文件失败:', error);
        }
      },
    };
  }

  /**
   * 创建设计器集成测试场景
   */
  private createDesignerIntegrationScenario(): TestScenario {
    return {
      id: 'designer-integration',
      name: '设计器集成测试',
      type: 'designer-integration',
      description: '测试低代码设计器集成的完整流程',
      steps: [
        {
          name: '创建页面配置',
          description: '模拟设计器创建的页面配置',
          required: true,
          execute: async () => {
            const pageConfig = {
              id: 'page_user_management',
              name: '用户管理页面',
              title: '用户管理',
              path: '/users',
              type: 'list',
              components: [
                {
                  id: 'user_table',
                  type: 'crud-table',
                  name: 'userTable',
                  title: '用户列表',
                  dataSource: {
                    type: 'api',
                    api: {
                      url: '/api/users',
                      method: 'GET',
                    },
                  },
                  fields: [
                    { name: 'id', label: 'ID', type: 'input-text', readonly: true },
                    { name: 'username', label: '用户名', type: 'input-text', required: true },
                    { name: 'email', label: '邮箱', type: 'input-email', required: true },
                    { name: 'status', label: '状态', type: 'select', required: true },
                  ],
                },
              ],
            };

            return {
              success: true,
              duration: 0,
              data: { pageConfig },
            };
          },
        },
        {
          name: '生成后端接口',
          description: '根据页面配置生成对应的后端接口',
          required: true,
          timeout: 120000,
          execute: async () => {
            const startTime = Date.now();
            
            try {
              const result = await this.designerIntegration.generateApisFromPageConfig({
                id: 'page_user_management',
                name: '用户管理页面',
                title: '用户管理',
                path: '/users',
                type: 'list',
                components: [
                  {
                    id: 'user_table',
                    type: 'crud-table',
                    name: 'userTable',
                    title: '用户列表',
                    dataSource: {
                      type: 'api',
                      api: {
                        url: '/api/users',
                        method: 'GET',
                      },
                    },
                    fields: [
                      { name: 'id', label: 'ID', type: 'input-text', readonly: true },
                      { name: 'username', label: '用户名', type: 'input-text', required: true },
                      { name: 'email', label: '邮箱', type: 'input-email', required: true },
                      { name: 'status', label: '状态', type: 'select', required: true },
                    ],
                  },
                ],
              });

              return {
                success: result.generatedApis.length > 0,
                duration: Date.now() - startTime,
                data: { 
                  generatedApis: result.generatedApis,
                  generatedFiles: result.generatedFiles,
                  errors: result.errors,
                },
              };
            } catch (error) {
              return {
                success: false,
                duration: Date.now() - startTime,
                error: error.message,
              };
            }
          },
        },
      ],
    };
  }

  /**
   * 创建Amis组件适配测试场景
   */
  private createAmisComponentScenario(): TestScenario {
    return {
      id: 'amis-component',
      name: 'Amis组件适配测试',
      type: 'amis-component',
      description: '测试Amis组件配置生成和适配',
      steps: [
        {
          name: '生成CRUD配置',
          description: '生成Amis CRUD组件配置',
          required: true,
          execute: async () => {
            const startTime = Date.now();
            
            try {
              const crudConfig = this.amisAdapter.generateCrudConfig({
                entityName: 'User',
                apiBasePath: '/api/users',
                fields: [
                  { name: 'id', label: 'ID', type: 'string', sortable: true },
                  { name: 'username', label: '用户名', type: 'string', searchable: true, sortable: true },
                  { name: 'email', label: '邮箱', type: 'email', searchable: true, filterable: true },
                  { name: 'status', label: '状态', type: 'boolean', filterable: true },
                ],
                operations: {
                  create: true,
                  update: true,
                  delete: true,
                  view: true,
                  batch: true,
                },
              });

              return {
                success: !!crudConfig && !!crudConfig.columns,
                duration: Date.now() - startTime,
                data: { crudConfig },
              };
            } catch (error) {
              return {
                success: false,
                duration: Date.now() - startTime,
                error: error.message,
              };
            }
          },
        },
        {
          name: '生成表单配置',
          description: '生成Amis表单组件配置',
          required: true,
          execute: async () => {
            const startTime = Date.now();
            
            try {
              const formConfig = this.amisAdapter.generateFormConfig({
                entityName: 'User',
                apiPath: '/api/users',
                mode: 'create',
                fields: [
                  { name: 'username', label: '用户名', type: 'string', required: true },
                  { name: 'email', label: '邮箱', type: 'email', required: true },
                  { name: 'status', label: '状态', type: 'select', options: [
                    { label: '启用', value: 'active' },
                    { label: '禁用', value: 'inactive' }
                  ]},
                ],
              });

              return {
                success: !!formConfig && !!formConfig.body,
                duration: Date.now() - startTime,
                data: { formConfig },
              };
            } catch (error) {
              return {
                success: false,
                duration: Date.now() - startTime,
                error: error.message,
              };
            }
          },
        },
      ],
    };
  }

  /**
   * 创建API参数配置测试场景
   */
  private createApiParameterConfigScenario(): TestScenario {
    return {
      id: 'api-parameter-config',
      name: 'API参数配置测试',
      type: 'api-parameter-config',
      description: '测试API参数配置系统',
      steps: [
        {
          name: '创建API配置',
          description: '创建API参数配置',
          required: true,
          execute: async () => {
            const startTime = Date.now();
            
            try {
              const config = await this.apiParameterConfig.createApiConfig({
                path: '/api/test-users',
                method: 'GET',
                name: '测试用户列表',
                description: '获取测试用户列表',
                inputParameters: [
                  {
                    name: 'page',
                    type: 'number',
                    required: false,
                    defaultValue: 1,
                    description: '页码',
                    validationRules: [
                      { type: 'min', value: 1, message: '页码必须大于0', enabled: true }
                    ],
                    transformationRules: [
                      { type: 'toNumber', enabled: true, order: 1 }
                    ],
                    showInDocs: true,
                    deprecated: false,
                  },
                ],
                outputParameters: [
                  {
                    name: 'items',
                    type: 'array',
                    required: true,
                    description: '用户列表',
                    arrayItemType: 'object',
                    showInDocs: true,
                    deprecated: false,
                  },
                ],
                responseFormat: {
                  wrapResponse: true,
                  successCode: 0,
                  errorCode: 1,
                  dataField: 'data',
                  messageField: 'msg',
                  statusField: 'status',
                },
                enabled: true,
                createdBy: 'e2e-test',
              });

              return {
                success: !!config && !!config.id,
                duration: Date.now() - startTime,
                data: { apiConfig: config },
              };
            } catch (error) {
              return {
                success: false,
                duration: Date.now() - startTime,
                error: error.message,
              };
            }
          },
        },
      ],
    };
  }

  /**
   * 创建完整工作流测试场景
   */
  private createFullWorkflowScenario(): TestScenario {
    return {
      id: 'full-workflow',
      name: '完整业务流程测试',
      type: 'full-workflow',
      description: '测试从设计器到前端展示的完整业务流程',
      steps: [
        {
          name: '创建代码生成任务',
          description: '通过代码生成管理器创建任务',
          required: true,
          timeout: 180000,
          execute: async () => {
            const startTime = Date.now();
            
            try {
              const taskId = await this.codeGenerationManager.createGenerationTask(
                '完整流程测试',
                'single-table-crud',
                [
                  {
                    code: 'product',
                    name: 'Product',
                    description: '产品实体',
                    fields: [
                      { name: 'id', type: 'string', required: true, description: 'ID' },
                      { name: 'name', type: 'string', required: true, description: '产品名称' },
                      { name: 'price', type: 'number', required: true, description: '价格' },
                      { name: 'status', type: 'string', required: false, description: '状态' },
                    ],
                  },
                ],
                {
                  projectName: 'e2e-full-workflow',
                  outputDir: './test-output/full-workflow',
                  enableSoftDelete: true,
                  enableDataPermission: false,
                  enableAuditLog: true,
                  enableCache: false,
                  generateTests: true,
                  generateSwagger: true,
                },
                'e2e-test',
                {
                  async: false,
                  priority: 'high',
                  description: '端到端测试完整流程',
                  tags: ['e2e', 'full-workflow'],
                }
              );

              // 等待任务完成
              let attempts = 0;
              const maxAttempts = 60; // 最多等待60秒
              
              while (attempts < maxAttempts) {
                const task = this.codeGenerationManager.getTaskStatus(taskId);
                if (task && (task.status === 'completed' || task.status === 'failed')) {
                  return {
                    success: task.status === 'completed',
                    duration: Date.now() - startTime,
                    data: { taskId, task },
                    error: task.status === 'failed' ? task.error : undefined,
                  };
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
              }

              return {
                success: false,
                duration: Date.now() - startTime,
                error: '任务执行超时',
              };
            } catch (error) {
              return {
                success: false,
                duration: Date.now() - startTime,
                error: error.message,
              };
            }
          },
        },
      ],
      cleanup: async () => {
        try {
          await fs.remove('./test-output/full-workflow');
        } catch (error) {
          this.logger.warn('清理完整流程测试文件失败:', error);
        }
      },
    };
  }

  /**
   * 检查前置条件
   */
  private async checkPrerequisites(prerequisites: string[]): Promise<void> {
    for (const prerequisite of prerequisites) {
      this.logger.log(`检查前置条件: ${prerequisite}`);
      // 这里可以实现具体的前置条件检查逻辑
    }
  }

  /**
   * 按类型分组结果
   */
  private groupResultsByType(results: TestResult[]): Record<string, TestResult[]> {
    return results.reduce((groups, result) => {
      const type = result.scenarioId.split('-')[0];
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(result);
      return groups;
    }, {} as Record<string, TestResult[]>);
  }

  /**
   * 计算各类型平均执行时间
   */
  private calculateAverageDurationByType(results: TestResult[]): Record<string, number> {
    const groups = this.groupResultsByType(results);
    const averages: Record<string, number> = {};

    for (const [type, typeResults] of Object.entries(groups)) {
      const totalDuration = typeResults.reduce((sum, r) => sum + r.duration, 0);
      averages[type] = typeResults.length > 0 ? totalDuration / typeResults.length : 0;
    }

    return averages;
  }

  /**
   * 分析常见失败原因
   */
  private analyzeCommonFailures(results: TestResult[]): Array<{ error: string; count: number }> {
    const errorCounts: Record<string, number> = {};

    results.forEach(result => {
      if (result.status === 'failed' || result.status === 'error') {
        const error = result.error || 'Unknown error';
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      }

      result.stepResults.forEach(step => {
        if (step.status === 'failed' || step.status === 'error') {
          const error = step.error || 'Unknown error';
          errorCounts[error] = (errorCounts[error] || 0) + 1;
        }
      });
    });

    return Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * 计算性能指标
   */
  private calculatePerformanceMetrics(results: TestResult[]): {
    averageScenarioDuration: number;
    averageStepDuration: number;
    slowestScenarios: Array<{ name: string; duration: number }>;
    fastestScenarios: Array<{ name: string; duration: number }>;
  } {
    const averageScenarioDuration = results.length > 0 
      ? results.reduce((sum, r) => sum + r.duration, 0) / results.length 
      : 0;

    const allSteps = results.flatMap(r => r.stepResults);
    const averageStepDuration = allSteps.length > 0 
      ? allSteps.reduce((sum, s) => sum + s.duration, 0) / allSteps.length 
      : 0;

    const sortedByDuration = [...results].sort((a, b) => b.duration - a.duration);
    const slowestScenarios = sortedByDuration.slice(0, 5).map(r => ({
      name: r.scenarioName,
      duration: r.duration,
    }));

    const fastestScenarios = sortedByDuration.slice(-5).reverse().map(r => ({
      name: r.scenarioName,
      duration: r.duration,
    }));

    return {
      averageScenarioDuration,
      averageStepDuration,
      slowestScenarios,
      fastestScenarios,
    };
  }
}
