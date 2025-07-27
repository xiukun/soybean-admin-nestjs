import { Project } from './project.model';

export interface DeploymentConfig {
  port?: number;
  environment?: 'development' | 'production' | 'staging';
  customConfig?: any;
}

export interface DeploymentResult {
  success: boolean;
  port?: number;
  logs?: string;
  error?: string;
}

export interface IDeploymentService {
  /**
   * 部署项目
   * @param project 要部署的项目
   * @param config 部署配置
   * @returns 部署结果
   */
  deploy(project: Project, config?: DeploymentConfig): Promise<DeploymentResult>;

  /**
   * 停止项目部署
   * @param project 要停止的项目
   * @returns 停止结果
   */
  stop(project: Project): Promise<DeploymentResult>;

  /**
   * 检查项目部署状态
   * @param project 要检查的项目
   * @returns 部署状态信息
   */
  checkStatus(project: Project): Promise<{
    isRunning: boolean;
    port?: number;
    uptime?: number;
  }>;

  /**
   * 获取可用端口
   * @param preferredPort 首选端口
   * @returns 可用端口
   */
  getAvailablePort(preferredPort?: number): Promise<number>;
}
