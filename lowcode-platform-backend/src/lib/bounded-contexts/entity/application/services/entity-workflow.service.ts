import { Injectable } from '@nestjs/common';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';

export interface WorkflowDefinition {
  id: string;
  entityCode: string;
  name: string;
  description?: string;
  version: string;
  isActive: boolean;
  trigger: WorkflowTrigger;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  variables: WorkflowVariable[];
  permissions: WorkflowPermission[];
  notifications: WorkflowNotification[];
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface WorkflowState {
  id: string;
  name: string;
  description?: string;
  type: 'start' | 'intermediate' | 'end' | 'parallel' | 'exclusive';
  isInitial?: boolean;
  isFinal?: boolean;
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  timeouts: WorkflowTimeout[];
  metadata: Record<string, any>;
}

export interface WorkflowTransition {
  id: string;
  name: string;
  fromStateId: string;
  toStateId: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  permissions: string[];
  priority: number;
  isAutomatic: boolean;
  metadata: Record<string, any>;
}

export interface WorkflowTrigger {
  type: 'manual' | 'automatic' | 'scheduled' | 'event';
  event?: 'create' | 'update' | 'delete' | 'field_change' | 'status_change';
  conditions: WorkflowCondition[];
  schedule?: {
    cron: string;
    timezone: string;
  };
  fieldTriggers?: {
    fieldCode: string;
    operation: 'change' | 'equals' | 'not_equals' | 'greater_than' | 'less_than';
    value?: any;
  }[];
}

export interface WorkflowAction {
  id: string;
  type: 'field_update' | 'notification' | 'api_call' | 'script' | 'approval' | 'assignment' | 'validation';
  name: string;
  description?: string;
  parameters: Record<string, any>;
  conditions: WorkflowCondition[];
  order: number;
  isAsync: boolean;
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
}

export interface WorkflowCondition {
  id: string;
  type: 'field' | 'user' | 'role' | 'time' | 'custom' | 'expression';
  field?: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value?: any;
  expression?: string;
  logicalOperator?: 'and' | 'or';
}

export interface WorkflowVariable {
  name: string;
  type: FieldDataType;
  defaultValue?: any;
  description?: string;
  isRequired: boolean;
  scope: 'global' | 'instance' | 'state';
}

export interface WorkflowPermission {
  stateId?: string;
  transitionId?: string;
  actionId?: string;
  roles: string[];
  users: string[];
  conditions: WorkflowCondition[];
  type: 'allow' | 'deny';
}

export interface WorkflowNotification {
  id: string;
  name: string;
  trigger: 'state_enter' | 'state_exit' | 'transition' | 'action' | 'timeout' | 'error';
  stateId?: string;
  transitionId?: string;
  actionId?: string;
  recipients: {
    type: 'user' | 'role' | 'field' | 'email';
    value: string;
  }[];
  template: {
    subject: string;
    body: string;
    format: 'text' | 'html' | 'markdown';
  };
  channels: ('email' | 'sms' | 'push' | 'webhook')[];
  conditions: WorkflowCondition[];
}

export interface WorkflowTimeout {
  id: string;
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
  action: 'transition' | 'notification' | 'escalation';
  targetStateId?: string;
  escalationRoles?: string[];
  conditions: WorkflowCondition[];
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  entityCode: string;
  recordId: string;
  currentStateId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'suspended';
  variables: Record<string, any>;
  history: WorkflowHistoryEntry[];
  startedBy: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata: Record<string, any>;
}

export interface WorkflowHistoryEntry {
  id: string;
  instanceId: string;
  type: 'state_change' | 'transition' | 'action' | 'error' | 'timeout';
  fromStateId?: string;
  toStateId?: string;
  transitionId?: string;
  actionId?: string;
  userId: string;
  timestamp: Date;
  duration?: number;
  data: Record<string, any>;
  comment?: string;
  error?: string;
}

export interface WorkflowTask {
  id: string;
  instanceId: string;
  workflowId: string;
  stateId: string;
  actionId?: string;
  type: 'approval' | 'assignment' | 'review' | 'input' | 'notification';
  title: string;
  description?: string;
  assignedTo: string[];
  assignedRoles: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  data: Record<string, any>;
  result?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
  completedBy?: string;
  comments: WorkflowTaskComment[];
}

export interface WorkflowTaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  type: 'comment' | 'approval' | 'rejection' | 'request_change';
  createdAt: Date;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
}

export interface WorkflowMetrics {
  workflowId: string;
  totalInstances: number;
  completedInstances: number;
  failedInstances: number;
  averageCompletionTime: number;
  averageStateTime: Record<string, number>;
  bottleneckStates: {
    stateId: string;
    stateName: string;
    averageTime: number;
    instanceCount: number;
  }[];
  taskMetrics: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    averageTaskTime: number;
  };
  errorRate: number;
  throughput: number;
}

export interface WorkflowOptimizationSuggestion {
  type: 'bottleneck' | 'redundant_state' | 'missing_transition' | 'timeout_optimization' | 'permission_simplification';
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
  recommendation: string;
  estimatedImprovement: {
    timeReduction?: number;
    errorReduction?: number;
    throughputIncrease?: number;
  };
  affectedStates?: string[];
  affectedTransitions?: string[];
}

@Injectable()
export class EntityWorkflowService {
  private workflows = new Map<string, WorkflowDefinition>();
  private instances = new Map<string, WorkflowInstance>();
  private tasks = new Map<string, WorkflowTask>();
  private history = new Map<string, WorkflowHistoryEntry[]>();
  private activeTimers = new Map<string, NodeJS.Timeout>();

  /**
   * 创建工作流定义
   */
  async createWorkflow(
    data: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<WorkflowDefinition> {
    const workflow: WorkflowDefinition = {
      id: this.generateId('workflow'),
      ...data,
      createdBy,
      createdAt: new Date(),
    };

    // 验证工作流定义
    this.validateWorkflowDefinition(workflow);

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  /**
   * 更新工作流定义
   */
  async updateWorkflow(
    workflowId: string,
    data: Partial<Omit<WorkflowDefinition, 'id' | 'createdAt' | 'createdBy'>>,
    updatedBy: string
  ): Promise<WorkflowDefinition> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`工作流 ${workflowId} 不存在`);
    }

    const updatedWorkflow: WorkflowDefinition = {
      ...workflow,
      ...data,
      updatedBy,
      updatedAt: new Date(),
    };

    // 验证更新后的工作流定义
    this.validateWorkflowDefinition(updatedWorkflow);

    this.workflows.set(workflowId, updatedWorkflow);
    return updatedWorkflow;
  }

  /**
   * 获取工作流定义
   */
  getWorkflow(workflowId: string): WorkflowDefinition | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * 获取实体的工作流列表
   */
  getEntityWorkflows(entityCode: string): WorkflowDefinition[] {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.entityCode === entityCode);
  }

  /**
   * 删除工作流定义
   */
  async deleteWorkflow(workflowId: string): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return false;
    }

    // 检查是否有运行中的实例
    const runningInstances = Array.from(this.instances.values())
      .filter(instance => instance.workflowId === workflowId && instance.status === 'running');

    if (runningInstances.length > 0) {
      throw new Error(`工作流 ${workflowId} 有 ${runningInstances.length} 个运行中的实例，无法删除`);
    }

    this.workflows.delete(workflowId);
    return true;
  }

  /**
   * 启动工作流实例
   */
  async startWorkflow(
    workflowId: string,
    entityCode: string,
    recordId: string,
    variables: Record<string, any> = {},
    startedBy: string
  ): Promise<WorkflowInstance> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`工作流 ${workflowId} 不存在`);
    }

    if (!workflow.isActive) {
      throw new Error(`工作流 ${workflowId} 未激活`);
    }

    // 找到初始状态
    const initialState = workflow.states.find(state => state.isInitial);
    if (!initialState) {
      throw new Error(`工作流 ${workflowId} 没有定义初始状态`);
    }

    const instance: WorkflowInstance = {
      id: this.generateId('instance'),
      workflowId,
      entityCode,
      recordId,
      currentStateId: initialState.id,
      status: 'running',
      variables: { ...this.getDefaultVariables(workflow), ...variables },
      history: [],
      startedBy,
      startedAt: new Date(),
      metadata: {},
    };

    this.instances.set(instance.id, instance);

    // 记录历史
    this.addHistoryEntry(instance.id, {
      type: 'state_change',
      toStateId: initialState.id,
      userId: startedBy,
      timestamp: new Date(),
      data: { variables },
    });

    // 执行初始状态的动作
    await this.executeStateActions(instance, initialState);

    // 设置超时
    this.setupStateTimeouts(instance, initialState);

    return instance;
  }

  /**
   * 执行工作流转换
   */
  async executeTransition(
    instanceId: string,
    transitionId: string,
    userId: string,
    data: Record<string, any> = {},
    comment?: string
  ): Promise<WorkflowInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`工作流实例 ${instanceId} 不存在`);
    }

    if (instance.status !== 'running') {
      throw new Error(`工作流实例 ${instanceId} 状态为 ${instance.status}，无法执行转换`);
    }

    const workflow = this.workflows.get(instance.workflowId);
    if (!workflow) {
      throw new Error(`工作流 ${instance.workflowId} 不存在`);
    }

    const transition = workflow.transitions.find(t => t.id === transitionId);
    if (!transition) {
      throw new Error(`转换 ${transitionId} 不存在`);
    }

    // 验证转换条件
    if (!this.evaluateConditions(transition.conditions, instance, data)) {
      throw new Error(`转换 ${transitionId} 条件不满足`);
    }

    // 验证权限
    if (!this.checkTransitionPermission(transition, userId, instance)) {
      throw new Error(`用户 ${userId} 没有执行转换 ${transitionId} 的权限`);
    }

    const fromState = workflow.states.find(s => s.id === transition.fromStateId);
    const toState = workflow.states.find(s => s.id === transition.toStateId);

    if (!fromState || !toState) {
      throw new Error(`转换 ${transitionId} 的状态不存在`);
    }

    const startTime = new Date();

    try {
      // 执行转换动作
      await this.executeTransitionActions(instance, transition, data);

      // 更新实例状态
      instance.currentStateId = transition.toStateId;
      instance.variables = { ...instance.variables, ...data };

      // 清除当前状态的超时
      this.clearStateTimeouts(instance.id);

      // 记录历史
      this.addHistoryEntry(instance.id, {
        type: 'transition',
        fromStateId: transition.fromStateId,
        toStateId: transition.toStateId,
        transitionId,
        userId,
        timestamp: new Date(),
        duration: Date.now() - startTime.getTime(),
        data,
        comment,
      });

      // 检查是否到达最终状态
      if (toState.isFinal) {
        instance.status = 'completed';
        instance.completedAt = new Date();
      } else {
        // 执行新状态的动作
        await this.executeStateActions(instance, toState);
        
        // 设置新状态的超时
        this.setupStateTimeouts(instance, toState);
      }

      this.instances.set(instanceId, instance);
      return instance;
    } catch (error) {
      // 记录错误
      this.addHistoryEntry(instance.id, {
        type: 'error',
        fromStateId: transition.fromStateId,
        transitionId,
        userId,
        timestamp: new Date(),
        data,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * 获取工作流实例
   */
  getInstance(instanceId: string): WorkflowInstance | null {
    return this.instances.get(instanceId) || null;
  }

  /**
   * 获取实体记录的工作流实例
   */
  getRecordInstances(entityCode: string, recordId: string): WorkflowInstance[] {
    return Array.from(this.instances.values())
      .filter(instance => instance.entityCode === entityCode && instance.recordId === recordId);
  }

  /**
   * 获取用户的待办任务
   */
  getUserTasks(userId: string, status?: WorkflowTask['status']): WorkflowTask[] {
    return Array.from(this.tasks.values())
      .filter(task => {
        const isAssigned = task.assignedTo.includes(userId);
        const statusMatch = !status || task.status === status;
        return isAssigned && statusMatch;
      });
  }

  /**
   * 完成任务
   */
  async completeTask(
    taskId: string,
    userId: string,
    result: Record<string, any> = {},
    comment?: string
  ): Promise<WorkflowTask> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    if (task.status !== 'pending' && task.status !== 'in_progress') {
      throw new Error(`任务 ${taskId} 状态为 ${task.status}，无法完成`);
    }

    if (!task.assignedTo.includes(userId)) {
      throw new Error(`用户 ${userId} 没有完成任务 ${taskId} 的权限`);
    }

    task.status = 'completed';
    task.result = result;
    task.completedAt = new Date();
    task.completedBy = userId;

    if (comment) {
      task.comments.push({
        id: this.generateId('comment'),
        taskId,
        userId,
        content: comment,
        type: 'comment',
        createdAt: new Date(),
      });
    }

    this.tasks.set(taskId, task);

    // 如果任务关联了工作流实例，尝试继续执行工作流
    const instance = this.instances.get(task.instanceId);
    if (instance && task.actionId) {
      await this.handleTaskCompletion(instance, task);
    }

    return task;
  }

  /**
   * 拒绝任务
   */
  async rejectTask(
    taskId: string,
    userId: string,
    reason: string
  ): Promise<WorkflowTask> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    if (task.status !== 'pending' && task.status !== 'in_progress') {
      throw new Error(`任务 ${taskId} 状态为 ${task.status}，无法拒绝`);
    }

    if (!task.assignedTo.includes(userId)) {
      throw new Error(`用户 ${userId} 没有拒绝任务 ${taskId} 的权限`);
    }

    task.status = 'rejected';
    task.completedAt = new Date();
    task.completedBy = userId;

    task.comments.push({
      id: this.generateId('comment'),
      taskId,
      userId,
      content: reason,
      type: 'rejection',
      createdAt: new Date(),
    });

    this.tasks.set(taskId, task);

    // 处理任务拒绝
    const instance = this.instances.get(task.instanceId);
    if (instance) {
      await this.handleTaskRejection(instance, task);
    }

    return task;
  }

  /**
   * 暂停工作流实例
   */
  async suspendInstance(instanceId: string, userId: string, reason?: string): Promise<WorkflowInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`工作流实例 ${instanceId} 不存在`);
    }

    if (instance.status !== 'running') {
      throw new Error(`工作流实例 ${instanceId} 状态为 ${instance.status}，无法暂停`);
    }

    instance.status = 'suspended';
    
    // 清除超时
    this.clearStateTimeouts(instanceId);

    // 记录历史
    this.addHistoryEntry(instanceId, {
      type: 'state_change',
      userId,
      timestamp: new Date(),
      data: { action: 'suspend', reason },
    });

    this.instances.set(instanceId, instance);
    return instance;
  }

  /**
   * 恢复工作流实例
   */
  async resumeInstance(instanceId: string, userId: string): Promise<WorkflowInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`工作流实例 ${instanceId} 不存在`);
    }

    if (instance.status !== 'suspended') {
      throw new Error(`工作流实例 ${instanceId} 状态为 ${instance.status}，无法恢复`);
    }

    instance.status = 'running';

    const workflow = this.workflows.get(instance.workflowId);
    if (workflow) {
      const currentState = workflow.states.find(s => s.id === instance.currentStateId);
      if (currentState) {
        // 重新设置超时
        this.setupStateTimeouts(instance, currentState);
      }
    }

    // 记录历史
    this.addHistoryEntry(instanceId, {
      type: 'state_change',
      userId,
      timestamp: new Date(),
      data: { action: 'resume' },
    });

    this.instances.set(instanceId, instance);
    return instance;
  }

  /**
   * 取消工作流实例
   */
  async cancelInstance(instanceId: string, userId: string, reason?: string): Promise<WorkflowInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`工作流实例 ${instanceId} 不存在`);
    }

    if (instance.status === 'completed' || instance.status === 'cancelled') {
      throw new Error(`工作流实例 ${instanceId} 已经结束，无法取消`);
    }

    instance.status = 'cancelled';
    instance.completedAt = new Date();
    
    // 清除超时
    this.clearStateTimeouts(instanceId);

    // 取消相关任务
    const instanceTasks = Array.from(this.tasks.values())
      .filter(task => task.instanceId === instanceId && 
                     (task.status === 'pending' || task.status === 'in_progress'));
    
    for (const task of instanceTasks) {
      task.status = 'cancelled';
      task.completedAt = new Date();
      this.tasks.set(task.id, task);
    }

    // 记录历史
    this.addHistoryEntry(instanceId, {
      type: 'state_change',
      userId,
      timestamp: new Date(),
      data: { action: 'cancel', reason },
    });

    this.instances.set(instanceId, instance);
    return instance;
  }

  /**
   * 获取工作流指标
   */
  getWorkflowMetrics(workflowId: string): WorkflowMetrics {
    const instances = Array.from(this.instances.values())
      .filter(instance => instance.workflowId === workflowId);
    
    const tasks = Array.from(this.tasks.values())
      .filter(task => task.workflowId === workflowId);

    const completedInstances = instances.filter(i => i.status === 'completed');
    const failedInstances = instances.filter(i => i.status === 'failed');
    
    const completionTimes = completedInstances
      .filter(i => i.completedAt)
      .map(i => i.completedAt!.getTime() - i.startedAt.getTime());
    
    const averageCompletionTime = completionTimes.length > 0 ? 
      completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length : 0;

    // 计算状态平均时间
    const stateTimeMap = new Map<string, number[]>();
    for (const instance of instances) {
      const history = this.history.get(instance.id) || [];
      for (let i = 0; i < history.length - 1; i++) {
        const current = history[i];
        const next = history[i + 1];
        if (current.type === 'state_change' && current.toStateId) {
          const duration = next.timestamp.getTime() - current.timestamp.getTime();
          if (!stateTimeMap.has(current.toStateId)) {
            stateTimeMap.set(current.toStateId, []);
          }
          stateTimeMap.get(current.toStateId)!.push(duration);
        }
      }
    }

    const averageStateTime: Record<string, number> = {};
    const bottleneckStates: WorkflowMetrics['bottleneckStates'] = [];
    
    for (const [stateId, times] of stateTimeMap) {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      averageStateTime[stateId] = avgTime;
      
      const workflow = this.workflows.get(workflowId);
      const state = workflow?.states.find(s => s.id === stateId);
      
      bottleneckStates.push({
        stateId,
        stateName: state?.name || stateId,
        averageTime: avgTime,
        instanceCount: times.length,
      });
    }

    // 按平均时间排序，找出瓶颈状态
    bottleneckStates.sort((a, b) => b.averageTime - a.averageTime);

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < new Date() && 
                                          (t.status === 'pending' || t.status === 'in_progress'));
    
    const taskCompletionTimes = completedTasks
      .filter(t => t.completedAt)
      .map(t => t.completedAt!.getTime() - t.createdAt.getTime());
    
    const averageTaskTime = taskCompletionTimes.length > 0 ? 
      taskCompletionTimes.reduce((sum, time) => sum + time, 0) / taskCompletionTimes.length : 0;

    const errorRate = instances.length > 0 ? (failedInstances.length / instances.length) * 100 : 0;
    
    // 计算吞吐量（每天完成的实例数）
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentCompletedInstances = completedInstances
      .filter(i => i.completedAt && i.completedAt >= thirtyDaysAgo);
    const throughput = recentCompletedInstances.length / 30;

    return {
      workflowId,
      totalInstances: instances.length,
      completedInstances: completedInstances.length,
      failedInstances: failedInstances.length,
      averageCompletionTime,
      averageStateTime,
      bottleneckStates: bottleneckStates.slice(0, 5), // 只返回前5个瓶颈状态
      taskMetrics: {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        averageTaskTime,
      },
      errorRate,
      throughput,
    };
  }

  /**
   * 获取工作流优化建议
   */
  getOptimizationSuggestions(workflowId: string): WorkflowOptimizationSuggestion[] {
    const metrics = this.getWorkflowMetrics(workflowId);
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      return [];
    }

    const suggestions: WorkflowOptimizationSuggestion[] = [];

    // 检查瓶颈状态
    if (metrics.bottleneckStates.length > 0) {
      const topBottleneck = metrics.bottleneckStates[0];
      if (topBottleneck.averageTime > 24 * 60 * 60 * 1000) { // 超过1天
        suggestions.push({
          type: 'bottleneck',
          severity: 'high',
          description: `状态 "${topBottleneck.stateName}" 是主要瓶颈`,
          impact: `平均停留时间 ${Math.round(topBottleneck.averageTime / (60 * 60 * 1000))} 小时`,
          recommendation: '考虑添加自动化动作、并行处理或简化审批流程',
          estimatedImprovement: {
            timeReduction: 30,
            throughputIncrease: 20,
          },
          affectedStates: [topBottleneck.stateId],
        });
      }
    }

    // 检查错误率
    if (metrics.errorRate > 10) {
      suggestions.push({
        type: 'bottleneck',
        severity: 'high',
        description: `工作流错误率过高 (${metrics.errorRate.toFixed(1)}%)`,
        impact: '影响工作流可靠性和用户体验',
        recommendation: '检查条件设置、权限配置和动作参数',
        estimatedImprovement: {
          errorReduction: 50,
        },
      });
    }

    // 检查冗余状态
    const statesWithNoActions = workflow.states.filter(state => 
      state.actions.length === 0 && !state.isFinal && !state.isInitial
    );
    
    if (statesWithNoActions.length > 0) {
      suggestions.push({
        type: 'redundant_state',
        severity: 'medium',
        description: `发现 ${statesWithNoActions.length} 个可能冗余的状态`,
        impact: '增加工作流复杂度，影响执行效率',
        recommendation: '考虑合并或删除没有实际动作的中间状态',
        estimatedImprovement: {
          timeReduction: 15,
        },
        affectedStates: statesWithNoActions.map(s => s.id),
      });
    }

    // 检查缺失的转换
    const statesWithoutOutgoingTransitions = workflow.states.filter(state => {
      if (state.isFinal) return false;
      return !workflow.transitions.some(t => t.fromStateId === state.id);
    });
    
    if (statesWithoutOutgoingTransitions.length > 0) {
      suggestions.push({
        type: 'missing_transition',
        severity: 'high',
        description: `发现 ${statesWithoutOutgoingTransitions.length} 个没有出口转换的状态`,
        impact: '可能导致工作流实例卡死',
        recommendation: '为每个非最终状态添加至少一个出口转换',
        estimatedImprovement: {
          errorReduction: 30,
        },
        affectedStates: statesWithoutOutgoingTransitions.map(s => s.id),
      });
    }

    // 检查超时优化
    if (metrics.taskMetrics.overdueTasks > metrics.taskMetrics.totalTasks * 0.2) {
      suggestions.push({
        type: 'timeout_optimization',
        severity: 'medium',
        description: `超时任务比例过高 (${((metrics.taskMetrics.overdueTasks / metrics.taskMetrics.totalTasks) * 100).toFixed(1)}%)`,
        impact: '影响工作流及时性',
        recommendation: '调整任务截止时间或添加自动升级机制',
        estimatedImprovement: {
          timeReduction: 25,
        },
      });
    }

    return suggestions;
  }

  /**
   * 获取工作流历史
   */
  getInstanceHistory(instanceId: string): WorkflowHistoryEntry[] {
    return this.history.get(instanceId) || [];
  }

  /**
   * 验证工作流定义
   */
  private validateWorkflowDefinition(workflow: WorkflowDefinition): void {
    // 检查是否有初始状态
    const initialStates = workflow.states.filter(state => state.isInitial);
    if (initialStates.length === 0) {
      throw new Error('工作流必须有一个初始状态');
    }
    if (initialStates.length > 1) {
      throw new Error('工作流只能有一个初始状态');
    }

    // 检查是否有最终状态
    const finalStates = workflow.states.filter(state => state.isFinal);
    if (finalStates.length === 0) {
      throw new Error('工作流必须至少有一个最终状态');
    }

    // 检查转换的状态是否存在
    for (const transition of workflow.transitions) {
      const fromState = workflow.states.find(s => s.id === transition.fromStateId);
      const toState = workflow.states.find(s => s.id === transition.toStateId);
      
      if (!fromState) {
        throw new Error(`转换 ${transition.id} 的源状态 ${transition.fromStateId} 不存在`);
      }
      if (!toState) {
        throw new Error(`转换 ${transition.id} 的目标状态 ${transition.toStateId} 不存在`);
      }
    }

    // 检查状态ID的唯一性
    const stateIds = workflow.states.map(s => s.id);
    const uniqueStateIds = new Set(stateIds);
    if (stateIds.length !== uniqueStateIds.size) {
      throw new Error('工作流状态ID必须唯一');
    }

    // 检查转换ID的唯一性
    const transitionIds = workflow.transitions.map(t => t.id);
    const uniqueTransitionIds = new Set(transitionIds);
    if (transitionIds.length !== uniqueTransitionIds.size) {
      throw new Error('工作流转换ID必须唯一');
    }
  }

  /**
   * 获取默认变量值
   */
  private getDefaultVariables(workflow: WorkflowDefinition): Record<string, any> {
    const variables: Record<string, any> = {};
    
    for (const variable of workflow.variables) {
      if (variable.defaultValue !== undefined) {
        variables[variable.name] = variable.defaultValue;
      }
    }
    
    return variables;
  }

  /**
   * 执行状态动作
   */
  private async executeStateActions(instance: WorkflowInstance, state: WorkflowState): Promise<void> {
    for (const action of state.actions.sort((a, b) => a.order - b.order)) {
      if (this.evaluateConditions(action.conditions, instance)) {
        await this.executeAction(instance, action);
      }
    }
  }

  /**
   * 执行转换动作
   */
  private async executeTransitionActions(
    instance: WorkflowInstance,
    transition: WorkflowTransition,
    data: Record<string, any>
  ): Promise<void> {
    for (const action of transition.actions.sort((a, b) => a.order - b.order)) {
      if (this.evaluateConditions(action.conditions, instance, data)) {
        await this.executeAction(instance, action, data);
      }
    }
  }

  /**
   * 执行动作
   */
  private async executeAction(
    instance: WorkflowInstance,
    action: WorkflowAction,
    data: Record<string, any> = {}
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'field_update':
          await this.executeFieldUpdateAction(instance, action, data);
          break;
        case 'notification':
          await this.executeNotificationAction(instance, action, data);
          break;
        case 'api_call':
          await this.executeApiCallAction(instance, action, data);
          break;
        case 'script':
          await this.executeScriptAction(instance, action, data);
          break;
        case 'approval':
          await this.executeApprovalAction(instance, action, data);
          break;
        case 'assignment':
          await this.executeAssignmentAction(instance, action, data);
          break;
        case 'validation':
          await this.executeValidationAction(instance, action, data);
          break;
        default:
          console.warn(`未知的动作类型: ${action.type}`);
      }
    } catch (error) {
      if (action.retryPolicy) {
        // 这里可以实现重试逻辑
        console.warn(`动作 ${action.id} 执行失败，需要重试: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 执行字段更新动作
   */
  private async executeFieldUpdateAction(
    instance: WorkflowInstance,
    action: WorkflowAction,
    data: Record<string, any>
  ): Promise<void> {
    const { field, value, operation = 'set' } = action.parameters;
    
    // 这里应该调用实际的实体更新服务
    console.log(`更新实体 ${instance.entityCode} 记录 ${instance.recordId} 的字段 ${field} 为 ${value}`);
  }

  /**
   * 执行通知动作
   */
  private async executeNotificationAction(
    instance: WorkflowInstance,
    action: WorkflowAction,
    data: Record<string, any>
  ): Promise<void> {
    const { recipients, subject, body, channels = ['email'] } = action.parameters;
    
    // 这里应该调用实际的通知服务
    console.log(`发送通知: ${subject} 给 ${recipients.join(', ')}`);
  }

  /**
   * 执行API调用动作
   */
  private async executeApiCallAction(
    instance: WorkflowInstance,
    action: WorkflowAction,
    data: Record<string, any>
  ): Promise<void> {
    const { url, method = 'POST', headers = {}, body } = action.parameters;
    
    // 这里应该执行实际的API调用
    console.log(`调用API: ${method} ${url}`);
  }

  /**
   * 执行脚本动作
   */
  private async executeScriptAction(
    instance: WorkflowInstance,
    action: WorkflowAction,
    data: Record<string, any>
  ): Promise<void> {
    const { script, language = 'javascript' } = action.parameters;
    
    // 这里应该执行脚本
    console.log(`执行脚本: ${script}`);
  }

  /**
   * 执行审批动作
   */
  private async executeApprovalAction(
    instance: WorkflowInstance,
    action: WorkflowAction,
    data: Record<string, any>
  ): Promise<void> {
    const { approvers, title, description, dueDate } = action.parameters;
    
    const task: WorkflowTask = {
      id: this.generateId('task'),
      instanceId: instance.id,
      workflowId: instance.workflowId,
      stateId: instance.currentStateId,
      actionId: action.id,
      type: 'approval',
      title: title || '审批任务',
      description,
      assignedTo: Array.isArray(approvers) ? approvers : [approvers],
      assignedRoles: [],
      status: 'pending',
      priority: 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      data,
      createdAt: new Date(),
      comments: [],
    };
    
    this.tasks.set(task.id, task);
  }

  /**
   * 执行分配动作
   */
  private async executeAssignmentAction(
    instance: WorkflowInstance,
    action: WorkflowAction,
    data: Record<string, any>
  ): Promise<void> {
    const { assignees, title, description, dueDate } = action.parameters;
    
    const task: WorkflowTask = {
      id: this.generateId('task'),
      instanceId: instance.id,
      workflowId: instance.workflowId,
      stateId: instance.currentStateId,
      actionId: action.id,
      type: 'assignment',
      title: title || '分配任务',
      description,
      assignedTo: Array.isArray(assignees) ? assignees : [assignees],
      assignedRoles: [],
      status: 'pending',
      priority: 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      data,
      createdAt: new Date(),
      comments: [],
    };
    
    this.tasks.set(task.id, task);
  }

  /**
   * 执行验证动作
   */
  private async executeValidationAction(
    instance: WorkflowInstance,
    action: WorkflowAction,
    data: Record<string, any>
  ): Promise<void> {
    const { rules } = action.parameters;
    
    // 这里应该执行验证逻辑
    console.log(`执行验证: ${JSON.stringify(rules)}`);
  }

  /**
   * 评估条件
   */
  private evaluateConditions(
    conditions: WorkflowCondition[],
    instance: WorkflowInstance,
    data: Record<string, any> = {}
  ): boolean {
    if (conditions.length === 0) {
      return true;
    }

    let result = true;
    let currentLogicalOperator: 'and' | 'or' = 'and';

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, instance, data);
      
      if (currentLogicalOperator === 'and') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }
      
      currentLogicalOperator = condition.logicalOperator || 'and';
    }

    return result;
  }

  /**
   * 评估单个条件
   */
  private evaluateCondition(
    condition: WorkflowCondition,
    instance: WorkflowInstance,
    data: Record<string, any>
  ): boolean {
    let actualValue: any;
    
    switch (condition.type) {
      case 'field':
        actualValue = data[condition.field!] || instance.variables[condition.field!];
        break;
      case 'user':
        actualValue = instance.startedBy;
        break;
      case 'time':
        actualValue = new Date();
        break;
      case 'expression':
        // 这里应该实现表达式求值
        return true;
      default:
        return true;
    }

    switch (condition.operator) {
      case 'equals':
        return actualValue === condition.value;
      case 'not_equals':
        return actualValue !== condition.value;
      case 'greater_than':
        return actualValue > condition.value;
      case 'less_than':
        return actualValue < condition.value;
      case 'contains':
        return String(actualValue).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(actualValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(actualValue);
      case 'exists':
        return actualValue !== undefined && actualValue !== null;
      case 'not_exists':
        return actualValue === undefined || actualValue === null;
      default:
        return true;
    }
  }

  /**
   * 检查转换权限
   */
  private checkTransitionPermission(
    transition: WorkflowTransition,
    userId: string,
    instance: WorkflowInstance
  ): boolean {
    // 这里应该实现实际的权限检查逻辑
    // 目前简化为总是返回true
    return true;
  }

  /**
   * 设置状态超时
   */
  private setupStateTimeouts(instance: WorkflowInstance, state: WorkflowState): void {
    for (const timeout of state.timeouts) {
      if (this.evaluateConditions(timeout.conditions, instance)) {
        const timeoutMs = this.convertTimeoutToMs(timeout.duration, timeout.unit);
        
        const timer = setTimeout(async () => {
          await this.handleStateTimeout(instance.id, timeout);
        }, timeoutMs);
        
        this.activeTimers.set(`${instance.id}:${timeout.id}`, timer);
      }
    }
  }

  /**
   * 清除状态超时
   */
  private clearStateTimeouts(instanceId: string): void {
    for (const [key, timer] of this.activeTimers) {
      if (key.startsWith(`${instanceId}:`)) {
        clearTimeout(timer);
        this.activeTimers.delete(key);
      }
    }
  }

  /**
   * 处理状态超时
   */
  private async handleStateTimeout(instanceId: string, timeout: WorkflowTimeout): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'running') {
      return;
    }

    try {
      switch (timeout.action) {
        case 'transition':
          if (timeout.targetStateId) {
            // 查找到目标状态的转换
            const workflow = this.workflows.get(instance.workflowId);
            if (workflow) {
              const transition = workflow.transitions.find(t => 
                t.fromStateId === instance.currentStateId && 
                t.toStateId === timeout.targetStateId
              );
              
              if (transition) {
                await this.executeTransition(instanceId, transition.id, 'system', {}, '超时自动转换');
              }
            }
          }
          break;
        case 'notification':
          // 发送超时通知
          console.log(`状态超时通知: 实例 ${instanceId}`);
          break;
        case 'escalation':
          // 升级处理
          console.log(`状态超时升级: 实例 ${instanceId}`);
          break;
      }
    } catch (error) {
      console.error(`处理状态超时失败: ${error.message}`);
    }
  }

  /**
   * 转换超时时间为毫秒
   */
  private convertTimeoutToMs(duration: number, unit: WorkflowTimeout['unit']): number {
    switch (unit) {
      case 'seconds':
        return duration * 1000;
      case 'minutes':
        return duration * 60 * 1000;
      case 'hours':
        return duration * 60 * 60 * 1000;
      case 'days':
        return duration * 24 * 60 * 60 * 1000;
      default:
        return duration * 1000;
    }
  }

  /**
   * 处理任务完成
   */
  private async handleTaskCompletion(instance: WorkflowInstance, task: WorkflowTask): Promise<void> {
    // 这里可以根据任务结果决定下一步动作
    // 例如，如果是审批任务，可以根据审批结果执行不同的转换
    console.log(`任务 ${task.id} 完成，结果: ${JSON.stringify(task.result)}`);
  }

  /**
   * 处理任务拒绝
   */
  private async handleTaskRejection(instance: WorkflowInstance, task: WorkflowTask): Promise<void> {
    // 这里可以处理任务拒绝的逻辑
    // 例如，回退到上一个状态或者结束工作流
    console.log(`任务 ${task.id} 被拒绝`);
  }

  /**
   * 添加历史记录
   */
  private addHistoryEntry(instanceId: string, entry: Omit<WorkflowHistoryEntry, 'id' | 'instanceId'>): void {
    const historyEntry: WorkflowHistoryEntry = {
      id: this.generateId('history'),
      instanceId,
      ...entry,
    };
    
    if (!this.history.has(instanceId)) {
      this.history.set(instanceId, []);
    }
    
    this.history.get(instanceId)!.push(historyEntry);
  }

  /**
   * 生成ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}