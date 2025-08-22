import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import * as Handlebars from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface CodeGenerationRequest {
  projectId: string;
  templateIds: string[];
  entityIds: string[];
  outputPath: string;
  variables?: Record<string, any>;
  options?: {
    overwriteExisting?: boolean;
    generateTests?: boolean;
    generateDocs?: boolean;
    architecture?: 'base-biz' | 'ddd';
    framework?: 'nestjs';
  };
}

export interface GeneratedFile {
  name: string;
  path: string;
  content: string;
  size: number;
  language: string;
  type: string;
}

export interface CodeGenerationResult {
  success: boolean;
  files: GeneratedFile[];
  stats: {
    totalFiles: number;
    totalLines: number;
    totalSize: number;
  };
  generatedAt: Date;
}

@Injectable()
export class CompleteCodeGenerationService {
  private readonly logger = new Logger(CompleteCodeGenerationService.name);

  constructor(private readonly prisma: PrismaService) {
    this.setupHandlebarsHelpers();
  }

  async generateFiles(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    try {
      const project = await this.getProjectData(request.projectId);
      const entities = await this.getEntitiesData(request.entityIds);
      const templates = await this.getTemplatesData(request.templateIds);

      const context = this.prepareContext(project, entities, request);
      const files = await this.generateCodeFiles(context, templates, entities);

      if (request.outputPath) {
        await this.writeFilesToDisk(files, request.outputPath);
      }

      return {
        success: true,
        files,
        stats: this.calculateStats(files),
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Code generation failed: ${error.message}`);
      return {
        success: false,
        files: [],
        stats: { totalFiles: 0, totalLines: 0, totalSize: 0 },
        generatedAt: new Date(),
      };
    }
  }

  private async getProjectData(projectId: string) {
    return await this.prisma.project.findUnique({
      where: { id: projectId },
    });
  }

  private async getEntitiesData(entityIds: string[]) {
    return await this.prisma.entity.findMany({
      where: { id: { in: entityIds } },
      include: {
        fields: { orderBy: { sortOrder: 'asc' } },
        sourceRelations: { include: { targetEntity: true } },
        targetRelations: { include: { sourceEntity: true } },
      },
    });
  }

  private async getTemplatesData(templateIds: string[]) {
    if (!templateIds.length) {
      return await this.prisma.codeTemplate.findMany({
        where: { framework: 'nestjs', status: 'ACTIVE' },
      });
    }
    return await this.prisma.codeTemplate.findMany({
      where: { id: { in: templateIds } },
    });
  }

  private prepareContext(project: any, entities: any[], request: CodeGenerationRequest) {
    const config = typeof project.config === 'string' ? JSON.parse(project.config) : project.config || {};
    return {
      project: { ...project, ...config },
      entities: entities.map(entity => ({
        ...entity,
        relationships: [
          ...entity.sourceRelations.map((r: any) => ({ ...r, direction: 'outgoing', relatedEntity: r.targetEntity })),
          ...entity.targetRelations.map((r: any) => ({ ...r, direction: 'incoming', relatedEntity: r.sourceEntity })),
        ],
      })),
      options: request.options || {},
      variables: request.variables || {},
    };
  }

  private async generateCodeFiles(context: any, templates: any[], entities: any[]): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const template of templates) {
      for (const entity of entities) {
        try {
          const compiledTemplate = Handlebars.compile(template.content);
          const entityContext = { ...context, entity, entityName: entity.name, entityCode: entity.code };
          const content = compiledTemplate(entityContext);
          
          files.push({
            name: this.generateFileName(template, entity),
            path: this.generateFilePath(template, entity, context.options.architecture),
            content,
            size: Buffer.byteLength(content, 'utf8'),
            language: template.language || 'typescript',
            type: template.type?.toLowerCase() || 'file',
          });
        } catch (error) {
          this.logger.error(`Failed to generate file for ${template.name}:`, error);
        }
      }
    }

    return files;
  }

  private generateFileName(template: any, entity: any): string {
    const ext = template.language === 'typescript' ? '.ts' : '.js';
    return `${this.kebabCase(entity.code)}.${template.type?.toLowerCase() || 'file'}${ext}`;
  }

  private generateFilePath(template: any, entity: any, architecture = 'base-biz'): string {
    const type = template.type?.toLowerCase() || 'file';
    const entityDir = this.kebabCase(entity.code);
    
    if (architecture === 'base-biz') {
      const paths: Record<string, string> = {
        entity: `src/base/entities/${this.generateFileName(template, entity)}`,
        controller: `src/biz/controllers/${this.generateFileName(template, entity)}`,
        service: `src/biz/services/${this.generateFileName(template, entity)}`,
        dto: `src/base/dto/${this.generateFileName(template, entity)}`,
        module: `src/biz/modules/${this.generateFileName(template, entity)}`,
      };
      return paths[type] || `src/${type}s/${this.generateFileName(template, entity)}`;
    }
    
    return `src/${type}s/${this.generateFileName(template, entity)}`;
  }

  private async writeFilesToDisk(files: GeneratedFile[], outputPath: string): Promise<void> {
    for (const file of files) {
      const fullPath = path.join(outputPath, file.path);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, file.content, 'utf8');
      this.logger.log(`Generated: ${fullPath}`);
    }
  }

  private calculateStats(files: GeneratedFile[]) {
    return {
      totalFiles: files.length,
      totalLines: files.reduce((sum, f) => sum + f.content.split('\n').length, 0),
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
    };
  }

  private setupHandlebarsHelpers(): void {
    Handlebars.registerHelper('pascalCase', (str: string) => this.pascalCase(str));
    Handlebars.registerHelper('camelCase', (str: string) => this.camelCase(str));
    Handlebars.registerHelper('kebabCase', (str: string) => this.kebabCase(str));
    Handlebars.registerHelper('mapTypeToTS', (type: string) => this.mapTypeToTypeScript(type));
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
  }

  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + this.camelCase(str.slice(1));
  }

  private camelCase(str: string): string {
    return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().replace(/[_\s]+/g, '-');
  }

  private mapTypeToTypeScript(type: string): string {
    const typeMap: Record<string, string> = {
      'STRING': 'string',
      'INTEGER': 'number',
      'DECIMAL': 'number',
      'BOOLEAN': 'boolean',
      'DATETIME': 'Date',
      'TEXT': 'string',
      'ENUM': 'string',
      'JSON': 'any',
    };
    return typeMap[type] || 'any';
  }
}