import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface TargetProject {
  id: string;
  name: string;
  displayName: string;
  description: string;
  path: string;
  type: 'nestjs' | 'react' | 'vue' | 'angular' | 'other';
  framework: string;
  language: 'typescript' | 'javascript' | 'other';
  status: 'active' | 'inactive';
  config: {
    outputPaths: {
      controllers: string;
      services: string;
      modules: string;
      dto: string;
      schemas: string;
      pages: string;
    };
    templates: string[];
    features: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTargetProjectDto {
  name: string;
  displayName: string;
  description?: string;
  path: string;
  type: 'nestjs' | 'react' | 'vue' | 'angular' | 'other';
  framework: string;
  language: 'typescript' | 'javascript' | 'other';
  config?: any;
}

export interface UpdateTargetProjectDto {
  displayName?: string;
  description?: string;
  path?: string;
  type?: 'nestjs' | 'react' | 'vue' | 'angular' | 'other';
  framework?: string;
  language?: 'typescript' | 'javascript' | 'other';
  status?: 'active' | 'inactive';
  config?: any;
}

@Injectable()
export class TargetProjectService {
  private readonly logger = new Logger(TargetProjectService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all target projects
   */
  async findAll(): Promise<TargetProject[]> {
    try {
      // For now, return predefined projects
      // In the future, this could be stored in database
      return this.getPredefinedProjects();
    } catch (error) {
      this.logger.error('Failed to get target projects:', error);
      throw error;
    }
  }

  /**
   * Get target project by ID
   */
  async findById(id: string): Promise<TargetProject | null> {
    try {
      const projects = await this.findAll();
      return projects.find(p => p.id === id) || null;
    } catch (error) {
      this.logger.error(`Failed to get target project ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get target project by name
   */
  async findByName(name: string): Promise<TargetProject | null> {
    try {
      const projects = await this.findAll();
      return projects.find(p => p.name === name) || null;
    } catch (error) {
      this.logger.error(`Failed to get target project ${name}:`, error);
      throw error;
    }
  }

  /**
   * Create new target project
   */
  async create(dto: CreateTargetProjectDto): Promise<TargetProject> {
    try {
      // Validate project path
      if (!fs.existsSync(dto.path)) {
        throw new Error(`Project path does not exist: ${dto.path}`);
      }

      // Generate project config based on type
      const config = this.generateProjectConfig(dto.type, dto.path);

      const project: TargetProject = {
        id: this.generateId(),
        name: dto.name,
        displayName: dto.displayName,
        description: dto.description || '',
        path: dto.path,
        type: dto.type,
        framework: dto.framework,
        language: dto.language,
        status: 'active',
        config: { ...config, ...dto.config },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: Store in database when target project model is available
      this.logger.log(`Created target project: ${project.name}`);
      return project;

    } catch (error) {
      this.logger.error('Failed to create target project:', error);
      throw error;
    }
  }

  /**
   * Update target project
   */
  async update(id: string, dto: UpdateTargetProjectDto): Promise<TargetProject> {
    try {
      const project = await this.findById(id);
      if (!project) {
        throw new Error(`Target project not found: ${id}`);
      }

      // Update project properties
      const updatedProject: TargetProject = {
        ...project,
        ...dto,
        updatedAt: new Date(),
      };

      // TODO: Update in database when target project model is available
      this.logger.log(`Updated target project: ${updatedProject.name}`);
      return updatedProject;

    } catch (error) {
      this.logger.error(`Failed to update target project ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete target project
   */
  async delete(id: string): Promise<void> {
    try {
      const project = await this.findById(id);
      if (!project) {
        throw new Error(`Target project not found: ${id}`);
      }

      // TODO: Delete from database when target project model is available
      this.logger.log(`Deleted target project: ${project.name}`);

    } catch (error) {
      this.logger.error(`Failed to delete target project ${id}:`, error);
      throw error;
    }
  }

  /**
   * Validate target project
   */
  async validate(id: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const project = await this.findById(id);
      if (!project) {
        return { valid: false, errors: ['Project not found'] };
      }

      const errors: string[] = [];

      // Check if project path exists
      if (!fs.existsSync(project.path)) {
        errors.push(`Project path does not exist: ${project.path}`);
      }

      // Check if required directories exist
      for (const [key, relativePath] of Object.entries(project.config.outputPaths)) {
        const fullPath = path.join(project.path, relativePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          errors.push(`Output directory does not exist: ${dir} (${key})`);
        }
      }

      // Check if package.json exists for Node.js projects
      if (project.type === 'nestjs') {
        const packageJsonPath = path.join(project.path, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
          errors.push('package.json not found in project root');
        }
      }

      return { valid: errors.length === 0, errors };

    } catch (error) {
      this.logger.error(`Failed to validate target project ${id}:`, error);
      return { valid: false, errors: [error.message] };
    }
  }

  /**
   * Get project statistics
   */
  async getStatistics(id: string): Promise<any> {
    try {
      const project = await this.findById(id);
      if (!project) {
        throw new Error(`Target project not found: ${id}`);
      }

      const stats = {
        projectName: project.name,
        projectPath: project.path,
        type: project.type,
        framework: project.framework,
        language: project.language,
        status: project.status,
        outputPaths: project.config.outputPaths,
        supportedTemplates: project.config.templates.length,
        features: project.config.features,
      };

      return stats;

    } catch (error) {
      this.logger.error(`Failed to get statistics for project ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get predefined projects
   */
  private getPredefinedProjects(): TargetProject[] {
    const baseDir = path.join(__dirname, '../../../..');
    
    return [
      {
        id: 'amis-lowcode-backend',
        name: 'amis-lowcode-backend',
        displayName: 'Amis Low-Code Backend',
        description: 'NestJS backend application for Amis low-code platform',
        path: path.join(baseDir, 'amis-lowcode-backend'),
        type: 'nestjs',
        framework: 'NestJS',
        language: 'typescript',
        status: 'active',
        config: {
          outputPaths: {
            controllers: 'src/biz/controllers',
            services: 'src/biz/services',
            modules: 'src/biz/modules',
            dto: 'src/base/dto',
            schemas: 'prisma/schema.prisma',
            pages: 'src/config/pages',
          },
          templates: [
            'entity-controller.hbs',
            'entity-base-controller.hbs',
            'entity-base-service.hbs',
            'entity-module.hbs',
            'amis-page.hbs',
          ],
          features: [
            'crud-operations',
            'batch-operations',
            'amis-integration',
            'prisma-orm',
            'swagger-docs',
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'generated-output',
        name: 'generated-output',
        displayName: 'Generated Output',
        description: 'Default output directory for generated code',
        path: path.join(baseDir, 'generated'),
        type: 'other',
        framework: 'Generic',
        language: 'typescript',
        status: 'active',
        config: {
          outputPaths: {
            controllers: 'controllers',
            services: 'services',
            modules: 'modules',
            dto: 'dto',
            schemas: 'schemas',
            pages: 'pages',
          },
          templates: [
            'entity-controller.hbs',
            'entity-base-controller.hbs',
            'entity-base-service.hbs',
            'entity-module.hbs',
            'amis-page.hbs',
          ],
          features: [
            'crud-operations',
            'batch-operations',
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Generate project configuration based on type
   */
  private generateProjectConfig(type: string, projectPath: string): any {
    switch (type) {
      case 'nestjs':
        return {
          outputPaths: {
            controllers: 'src/biz/controllers',
            services: 'src/biz/services',
            modules: 'src/biz/modules',
            dto: 'src/base/dto',
            schemas: 'prisma/schema.prisma',
            pages: 'src/config/pages',
          },
          templates: [
            'entity-controller.hbs',
            'entity-base-controller.hbs',
            'entity-base-service.hbs',
            'entity-module.hbs',
            'amis-page.hbs',
          ],
          features: [
            'crud-operations',
            'batch-operations',
            'amis-integration',
            'prisma-orm',
            'swagger-docs',
          ],
        };
      default:
        return {
          outputPaths: {
            controllers: 'controllers',
            services: 'services',
            modules: 'modules',
            dto: 'dto',
            schemas: 'schemas',
            pages: 'pages',
          },
          templates: [
            'entity-controller.hbs',
            'entity-base-controller.hbs',
            'entity-base-service.hbs',
            'entity-module.hbs',
          ],
          features: [
            'crud-operations',
          ],
        };
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
