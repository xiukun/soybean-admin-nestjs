import { Injectable, Logger } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as net from 'net';
import { Project } from '../domain/project.model';
import { 
  IDeploymentService, 
  DeploymentConfig, 
  DeploymentResult 
} from '../domain/deployment.service.interface';

@Injectable()
export class DeploymentService implements IDeploymentService {
  private readonly logger = new Logger(DeploymentService.name);
  private readonly deployedProjects = new Map<string, ChildProcess>();
  private readonly amisBackendPath = path.resolve(process.cwd(), '../amis-lowcode-backend');

  async deploy(project: Project, config?: DeploymentConfig): Promise<DeploymentResult> {
    try {
      this.logger.log(`Starting deployment for project: ${project.name}`);

      // 检查amis-lowcode-backend是否存在
      const amisBackendExists = await this.checkAmisBackendExists();
      if (!amisBackendExists) {
        throw new Error('amis-lowcode-backend directory not found');
      }

      // 获取可用端口
      const port = await this.getAvailablePort(config?.port || 4000);

      // 生成项目代码
      await this.generateProjectCode(project);

      // 启动项目服务
      const childProcess = await this.startProjectService(project, port, config);
      
      // 存储进程引用
      this.deployedProjects.set(project.id!, childProcess);

      this.logger.log(`Project ${project.name} deployed successfully on port ${port}`);

      return {
        success: true,
        port,
        logs: `Project deployed successfully on port ${port}`
      };

    } catch (error) {
      this.logger.error(`Failed to deploy project ${project.name}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async stop(project: Project): Promise<DeploymentResult> {
    try {
      const childProcess = this.deployedProjects.get(project.id!);
      
      if (!childProcess) {
        return {
          success: false,
          error: 'Project is not currently deployed'
        };
      }

      // 优雅关闭进程
      childProcess.kill('SIGTERM');
      
      // 等待进程结束
      await new Promise((resolve) => {
        childProcess.on('exit', resolve);
        // 如果5秒后还没结束，强制杀死
        setTimeout(() => {
          if (!childProcess.killed) {
            childProcess.kill('SIGKILL');
          }
          resolve(null);
        }, 5000);
      });

      this.deployedProjects.delete(project.id!);

      this.logger.log(`Project ${project.name} stopped successfully`);

      return {
        success: true,
        logs: 'Project stopped successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to stop project ${project.name}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkStatus(project: Project): Promise<{
    isRunning: boolean;
    port?: number;
    uptime?: number;
  }> {
    const childProcess = this.deployedProjects.get(project.id!);
    
    if (!childProcess || childProcess.killed) {
      return { isRunning: false };
    }

    return {
      isRunning: true,
      port: project.deploymentPort,
      uptime: Date.now() - (childProcess as any).startTime
    };
  }

  async getAvailablePort(preferredPort: number = 4000): Promise<number> {
    for (let port = preferredPort; port < preferredPort + 100; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error('No available ports found');
  }

  private async checkAmisBackendExists(): Promise<boolean> {
    try {
      await fs.access(this.amisBackendPath);
      return true;
    } catch {
      return false;
    }
  }

  private async generateProjectCode(project: Project): Promise<void> {
    // 这里应该调用代码生成器来生成项目代码
    // 暂时先创建一个简单的占位符实现
    this.logger.log(`Generating code for project: ${project.name}`);
    
    const projectDir = path.join(this.amisBackendPath, 'generated', project.code);
    
    try {
      await fs.mkdir(projectDir, { recursive: true });
      
      // 创建基本的项目文件
      const packageJson = {
        name: project.code,
        version: project.version,
        description: project.description,
        main: 'index.js',
        scripts: {
          start: 'node index.js'
        },
        dependencies: {
          express: '^4.18.0',
          cors: '^2.8.5'
        }
      };

      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // 创建基本的服务器文件
      const serverCode = `
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: '${project.name}' });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: '${project.name}',
    code: '${project.code}',
    version: '${project.version}',
    description: '${project.description}'
  });
});

app.listen(port, () => {
  console.log(\`Project ${project.name} is running on port \${port}\`);
});
`;

      await fs.writeFile(path.join(projectDir, 'index.js'), serverCode);

    } catch (error) {
      this.logger.error(`Failed to generate code for project ${project.name}:`, error);
      throw error;
    }
  }

  private async startProjectService(
    project: Project, 
    port: number, 
    config?: DeploymentConfig
  ): Promise<ChildProcess> {
    const projectDir = path.join(this.amisBackendPath, 'generated', project.code);

    // 安装依赖
    await this.runCommand('npm', ['install'], projectDir);

    // 启动服务
    const childProcess = spawn('npm', ['start'], {
      cwd: projectDir,
      env: {
        ...process.env,
        PORT: port.toString(),
        NODE_ENV: config?.environment || 'development'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    (childProcess as any).startTime = Date.now();

    // 监听进程输出
    childProcess.stdout?.on('data', (data) => {
      this.logger.log(`[${project.name}] ${data.toString()}`);
    });

    childProcess.stderr?.on('data', (data) => {
      this.logger.error(`[${project.name}] ${data.toString()}`);
    });

    childProcess.on('exit', (code) => {
      this.logger.log(`Project ${project.name} exited with code ${code}`);
      this.deployedProjects.delete(project.id!);
    });

    // 等待服务启动
    await this.waitForService(port);

    return childProcess;
  }

  private async runCommand(command: string, args: string[], cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command, args, { cwd, stdio: 'inherit' });
      
      childProcess.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      childProcess.on('error', reject);
    });
  }

  private async waitForService(port: number, timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await this.isPortInUse(port)) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Service did not start within ${timeout}ms`);
  }

  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      
      server.on('error', () => resolve(false));
    });
  }

  private async isPortInUse(port: number): Promise<boolean> {
    return !(await this.isPortAvailable(port));
  }
}
