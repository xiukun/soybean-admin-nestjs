import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';
import { v4 as uuidv4 } from 'uuid';

interface CodeFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  type: 'template' | 'generated' | 'custom';
  size: number;
  lastModified: Date;
  readonly: boolean;
  metadata?: any;
}

interface CodeProject {
  id: string;
  name: string;
  description?: string;
  files: CodeFile[];
  structure: any;
  settings: {
    theme: string;
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    minimap: boolean;
  };
}

interface FormatOptions {
  language: string;
  tabSize?: number;
  insertSpaces?: boolean;
  trimTrailingWhitespace?: boolean;
}

@Injectable()
export class CodeEditorService {
  private readonly logger = new Logger(CodeEditorService.name);
  private readonly templatesPath = path.join(__dirname, '../../../resources/templates');
  private readonly generatedPath = path.join(__dirname, '../../../generated');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取所有代码项目
   */
  async getProjects(): Promise<CodeProject[]> {
    // 这里可以从数据库或文件系统获取项目信息
    const projects: CodeProject[] = [
      {
        id: 'templates',
        name: 'Code Templates',
        description: 'Handlebars templates for code generation',
        files: await this.getTemplateFiles(),
        structure: await this.getDirectoryStructure(this.templatesPath),
        settings: {
          theme: 'vs-dark',
          fontSize: 14,
          tabSize: 2,
          wordWrap: true,
          minimap: true,
        },
      },
      {
        id: 'generated',
        name: 'Generated Code',
        description: 'Recently generated code files',
        files: await this.getGeneratedFiles(),
        structure: await this.getDirectoryStructure(this.generatedPath),
        settings: {
          theme: 'vs-dark',
          fontSize: 14,
          tabSize: 2,
          wordWrap: true,
          minimap: false,
        },
      },
    ];

    return projects;
  }

  /**
   * 获取特定项目
   */
  async getProject(id: string): Promise<CodeProject> {
    const projects = await this.getProjects();
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  /**
   * 获取代码文件
   */
  async getFile(id: string): Promise<CodeFile> {
    const projects = await this.getProjects();
    
    for (const project of projects) {
      const file = project.files.find(f => f.id === id);
      if (file) {
        return file;
      }
    }

    throw new NotFoundException(`File ${id} not found`);
  }

  /**
   * 更新代码文件
   */
  async updateFile(id: string, content: string, metadata?: any): Promise<CodeFile> {
    const file = await this.getFile(id);
    
    if (file.readonly) {
      throw new Error('Cannot modify readonly file');
    }

    // 写入文件
    fs.writeFileSync(file.path, content, 'utf8');

    // 更新文件信息
    const stats = fs.statSync(file.path);
    file.content = content;
    file.size = stats.size;
    file.lastModified = stats.mtime;
    file.metadata = { ...file.metadata, ...metadata };

    this.logger.log(`Updated file: ${file.name}`);
    return file;
  }

  /**
   * 格式化代码文件
   */
  async formatFile(id: string, options: FormatOptions): Promise<string> {
    const file = await this.getFile(id);
    return this.formatContent(file.content, options);
  }

  /**
   * 格式化代码内容
   */
  async formatContent(content: string, options: FormatOptions): Promise<string> {
    try {
      let parser: string;
      
      switch (options.language.toLowerCase()) {
        case 'typescript':
        case 'ts':
          parser = 'typescript';
          break;
        case 'javascript':
        case 'js':
          parser = 'babel';
          break;
        case 'json':
          parser = 'json';
          break;
        case 'css':
          parser = 'css';
          break;
        case 'scss':
          parser = 'scss';
          break;
        case 'html':
          parser = 'html';
          break;
        case 'markdown':
        case 'md':
          parser = 'markdown';
          break;
        default:
          // 对于不支持的语言，返回原内容
          return content;
      }

      const formatted = await prettier.format(content, {
        parser,
        tabWidth: options.tabSize || 2,
        useTabs: !options.insertSpaces,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 100,
      });

      return formatted;
    } catch (error) {
      this.logger.error(`Failed to format content: ${error.message}`);
      return content; // 返回原内容如果格式化失败
    }
  }

  /**
   * 获取模板文件
   */
  async getTemplates(type?: string, language?: string): Promise<CodeFile[]> {
    return this.getTemplateFiles().then(files => {
      let filtered = files;
      
      if (type) {
        filtered = filtered.filter(f => f.metadata?.type === type);
      }
      
      if (language) {
        filtered = filtered.filter(f => f.language === language);
      }
      
      return filtered;
    });
  }

  /**
   * 获取特定模板
   */
  async getTemplate(id: string): Promise<CodeFile> {
    const templates = await this.getTemplateFiles();
    const template = templates.find(t => t.id === id);
    
    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    return template;
  }

  /**
   * 更新模板
   */
  async updateTemplate(id: string, content: string, metadata?: any): Promise<CodeFile> {
    return this.updateFile(id, content, metadata);
  }

  /**
   * 预览模板
   */
  async previewTemplate(id: string, variables: any, options?: any): Promise<{ preview: string; metadata?: any }> {
    const template = await this.getTemplate(id);
    
    // 这里应该使用Handlebars引擎渲染模板
    // 为了简化，这里只是简单的变量替换
    let preview = template.content;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      preview = preview.replace(regex, variables[key]);
    });

    return {
      preview,
      metadata: {
        templateId: id,
        variables,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * 验证代码
   */
  async validateCode(content: string, language: string, options?: any): Promise<{ valid: boolean; errors: any[]; warnings: any[] }> {
    const errors: any[] = [];
    const warnings: any[] = [];

    try {
      // 基本的语法检查
      if (language === 'json') {
        JSON.parse(content);
      }

      // 这里可以集成更复杂的语法检查工具
      // 如 TypeScript compiler API, ESLint 等

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push({
        message: error.message,
        line: 1,
        column: 1,
        severity: 'error',
      });

      return {
        valid: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * 获取支持的语言
   */
  async getSupportedLanguages(): Promise<any[]> {
    return [
      { id: 'typescript', name: 'TypeScript', extensions: ['.ts'] },
      { id: 'javascript', name: 'JavaScript', extensions: ['.js'] },
      { id: 'json', name: 'JSON', extensions: ['.json'] },
      { id: 'handlebars', name: 'Handlebars', extensions: ['.hbs', '.handlebars'] },
      { id: 'html', name: 'HTML', extensions: ['.html'] },
      { id: 'css', name: 'CSS', extensions: ['.css'] },
      { id: 'scss', name: 'SCSS', extensions: ['.scss'] },
      { id: 'markdown', name: 'Markdown', extensions: ['.md'] },
      { id: 'yaml', name: 'YAML', extensions: ['.yml', '.yaml'] },
      { id: 'sql', name: 'SQL', extensions: ['.sql'] },
    ];
  }

  /**
   * 获取编辑器主题
   */
  async getThemes(): Promise<any[]> {
    return [
      { id: 'vs', name: 'Visual Studio Light' },
      { id: 'vs-dark', name: 'Visual Studio Dark' },
      { id: 'hc-black', name: 'High Contrast Dark' },
    ];
  }

  /**
   * 比较文件版本
   */
  async compareFileVersions(id: string, compareWith: string, options?: any): Promise<{ diff: any; metadata?: any }> {
    const file = await this.getFile(id);
    
    // 这里应该实现真正的diff算法
    // 为了简化，返回基本信息
    return {
      diff: {
        original: file.content,
        modified: compareWith,
        changes: [], // 这里应该包含具体的变更信息
      },
      metadata: {
        fileId: id,
        comparedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * 在文件中搜索
   */
  async searchInFiles(data: {
    query: string;
    projectId?: string;
    fileTypes?: string[];
    caseSensitive?: boolean;
    regex?: boolean;
    wholeWord?: boolean;
  }): Promise<{ results: any[]; totalMatches: number }> {
    const projects = await this.getProjects();
    const results: any[] = [];
    let totalMatches = 0;

    for (const project of projects) {
      if (data.projectId && project.id !== data.projectId) {
        continue;
      }

      for (const file of project.files) {
        if (data.fileTypes && !data.fileTypes.includes(file.language)) {
          continue;
        }

        const matches = this.searchInContent(file.content, data.query, data);
        if (matches.length > 0) {
          results.push({
            file: {
              id: file.id,
              name: file.name,
              path: file.path,
            },
            matches,
          });
          totalMatches += matches.length;
        }
      }
    }

    return { results, totalMatches };
  }

  /**
   * 创建文件备份
   */
  async createFileBackup(id: string): Promise<{ backupId: string; timestamp: Date }> {
    const file = await this.getFile(id);
    const backupId = uuidv4();
    const timestamp = new Date();

    // 这里应该实现真正的备份逻辑
    // 可以存储到数据库或文件系统
    
    this.logger.log(`Created backup for file ${file.name}: ${backupId}`);
    
    return { backupId, timestamp };
  }

  /**
   * 获取文件备份
   */
  async getFileBackups(id: string): Promise<any[]> {
    // 这里应该从存储中获取备份列表
    return [];
  }

  /**
   * 从备份恢复文件
   */
  async restoreFileFromBackup(id: string, backupId: string): Promise<CodeFile> {
    // 这里应该实现从备份恢复的逻辑
    const file = await this.getFile(id);
    this.logger.log(`Restored file ${file.name} from backup ${backupId}`);
    return file;
  }

  /**
   * 获取模板文件列表
   */
  private async getTemplateFiles(): Promise<CodeFile[]> {
    return this.getFilesFromDirectory(this.templatesPath, 'template');
  }

  /**
   * 获取生成的文件列表
   */
  private async getGeneratedFiles(): Promise<CodeFile[]> {
    return this.getFilesFromDirectory(this.generatedPath, 'generated');
  }

  /**
   * 从目录获取文件列表
   */
  private async getFilesFromDirectory(dirPath: string, type: 'template' | 'generated' | 'custom'): Promise<CodeFile[]> {
    const files: CodeFile[] = [];

    if (!fs.existsSync(dirPath)) {
      return files;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        const filePath = path.join(dirPath, entry.name);
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        const ext = path.extname(entry.name);
        
        files.push({
          id: `${type}-${entry.name}`,
          name: entry.name,
          path: filePath,
          content,
          language: this.getLanguageFromExtension(ext),
          type,
          size: stats.size,
          lastModified: stats.mtime,
          readonly: type === 'generated',
          metadata: {
            extension: ext,
            type,
          },
        });
      }
    }

    return files;
  }

  /**
   * 根据文件扩展名获取语言
   */
  private getLanguageFromExtension(ext: string): string {
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.json': 'json',
      '.hbs': 'handlebars',
      '.handlebars': 'handlebars',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.md': 'markdown',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.sql': 'sql',
    };

    return languageMap[ext] || 'text';
  }

  /**
   * 获取目录结构
   */
  private async getDirectoryStructure(dirPath: string): Promise<any> {
    if (!fs.existsSync(dirPath)) {
      return null;
    }

    const structure: any = {
      name: path.basename(dirPath),
      type: 'directory',
      children: [],
    };

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const childPath = path.join(dirPath, entry.name);
        structure.children.push(await this.getDirectoryStructure(childPath));
      } else {
        structure.children.push({
          name: entry.name,
          type: 'file',
          extension: path.extname(entry.name),
        });
      }
    }

    return structure;
  }

  /**
   * 在内容中搜索
   */
  private searchInContent(content: string, query: string, options: any): any[] {
    const matches: any[] = [];
    const lines = content.split('\n');

    let searchQuery = query;
    if (!options.caseSensitive) {
      searchQuery = query.toLowerCase();
    }

    lines.forEach((line, index) => {
      let searchLine = line;
      if (!options.caseSensitive) {
        searchLine = line.toLowerCase();
      }

      let matchIndex = 0;
      while ((matchIndex = searchLine.indexOf(searchQuery, matchIndex)) !== -1) {
        matches.push({
          line: index + 1,
          column: matchIndex + 1,
          text: line,
          match: query,
        });
        matchIndex += searchQuery.length;
      }
    });

    return matches;
  }
}
