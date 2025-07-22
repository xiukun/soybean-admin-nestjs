import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AmisResponse } from '@decorators/amis-response.decorator';
import { CodeEditorService } from './code-editor.service';

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

@ApiTags('Code Editor')
@Controller('api/v1/code-editor')
export class CodeEditorController {
  constructor(private readonly codeEditorService: CodeEditorService) {}

  @Get('projects')
  @AmisResponse()
  @ApiOperation({
    summary: 'Get code editor projects',
    description: 'Retrieve all code editor projects',
  })
  @ApiResponse({
    status: 200,
    description: 'Projects retrieved successfully',
  })
  async getProjects(): Promise<{ projects: CodeProject[] }> {
    const projects = await this.codeEditorService.getProjects();
    return { projects };
  }

  @Get('projects/:id')
  @AmisResponse()
  @ApiOperation({
    summary: 'Get code editor project',
    description: 'Retrieve a specific code editor project',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project retrieved successfully',
  })
  async getProject(@Param('id') id: string): Promise<{ project: CodeProject }> {
    const project = await this.codeEditorService.getProject(id);
    return { project };
  }

  @Get('files/:id')
  @AmisResponse()
  @ApiOperation({
    summary: 'Get code file',
    description: 'Retrieve a specific code file',
  })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({
    status: 200,
    description: 'File retrieved successfully',
  })
  async getFile(@Param('id') id: string): Promise<{ file: CodeFile }> {
    const file = await this.codeEditorService.getFile(id);
    return { file };
  }

  @Put('files/:id')
  @AmisResponse()
  @ApiOperation({
    summary: 'Update code file',
    description: 'Update the content of a code file',
  })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({
    status: 200,
    description: 'File updated successfully',
  })
  async updateFile(
    @Param('id') id: string,
    @Body() updateData: { content: string; metadata?: any }
  ): Promise<{ file: CodeFile }> {
    const file = await this.codeEditorService.updateFile(id, updateData.content, updateData.metadata);
    return { file };
  }

  @Post('files/:id/format')
  @AmisResponse()
  @ApiOperation({
    summary: 'Format code file',
    description: 'Format the content of a code file',
  })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({
    status: 200,
    description: 'File formatted successfully',
  })
  async formatFile(
    @Param('id') id: string,
    @Body() options: FormatOptions
  ): Promise<{ formattedContent: string }> {
    const formattedContent = await this.codeEditorService.formatFile(id, options);
    return { formattedContent };
  }

  @Post('format')
  @AmisResponse()
  @ApiOperation({
    summary: 'Format code content',
    description: 'Format arbitrary code content',
  })
  @ApiResponse({
    status: 200,
    description: 'Content formatted successfully',
  })
  async formatContent(
    @Body() data: { content: string; options: FormatOptions }
  ): Promise<{ formattedContent: string }> {
    const formattedContent = await this.codeEditorService.formatContent(data.content, data.options);
    return { formattedContent };
  }

  @Get('templates')
  @AmisResponse()
  @ApiOperation({
    summary: 'Get code templates',
    description: 'Retrieve all available code templates',
  })
  @ApiQuery({ name: 'type', required: false, description: 'Template type filter' })
  @ApiQuery({ name: 'language', required: false, description: 'Language filter' })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
  })
  async getTemplates(
    @Query('type') type?: string,
    @Query('language') language?: string
  ): Promise<{ templates: CodeFile[] }> {
    const templates = await this.codeEditorService.getTemplates(type, language);
    return { templates };
  }

  @Get('templates/:id')
  @AmisResponse()
  @ApiOperation({
    summary: 'Get code template',
    description: 'Retrieve a specific code template',
  })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
  })
  async getTemplate(@Param('id') id: string): Promise<{ template: CodeFile }> {
    const template = await this.codeEditorService.getTemplate(id);
    return { template };
  }

  @Put('templates/:id')
  @AmisResponse()
  @ApiOperation({
    summary: 'Update code template',
    description: 'Update a code template',
  })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
  })
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateData: { content: string; metadata?: any }
  ): Promise<{ template: CodeFile }> {
    const template = await this.codeEditorService.updateTemplate(id, updateData.content, updateData.metadata);
    return { template };
  }

  @Post('templates/:id/preview')
  @AmisResponse()
  @ApiOperation({
    summary: 'Preview template with data',
    description: 'Generate preview of template with provided data',
  })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Preview generated successfully',
  })
  async previewTemplate(
    @Param('id') id: string,
    @Body() data: { variables: any; options?: any }
  ): Promise<{ preview: string; metadata?: any }> {
    const result = await this.codeEditorService.previewTemplate(id, data.variables, data.options);
    return result;
  }

  @Post('validate')
  @AmisResponse()
  @ApiOperation({
    summary: 'Validate code content',
    description: 'Validate code content for syntax errors',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation completed',
  })
  async validateCode(
    @Body() data: { content: string; language: string; options?: any }
  ): Promise<{ valid: boolean; errors: any[]; warnings: any[] }> {
    const result = await this.codeEditorService.validateCode(data.content, data.language, data.options);
    return result;
  }

  @Get('languages')
  @AmisResponse()
  @ApiOperation({
    summary: 'Get supported languages',
    description: 'Get list of supported programming languages',
  })
  @ApiResponse({
    status: 200,
    description: 'Languages retrieved successfully',
  })
  async getSupportedLanguages(): Promise<{ languages: any[] }> {
    const languages = await this.codeEditorService.getSupportedLanguages();
    return { languages };
  }

  @Get('themes')
  @AmisResponse()
  @ApiOperation({
    summary: 'Get editor themes',
    description: 'Get list of available editor themes',
  })
  @ApiResponse({
    status: 200,
    description: 'Themes retrieved successfully',
  })
  async getThemes(): Promise<{ themes: any[] }> {
    const themes = await this.codeEditorService.getThemes();
    return { themes };
  }

  @Post('files/:id/diff')
  @AmisResponse()
  @ApiOperation({
    summary: 'Compare file versions',
    description: 'Compare current file content with another version',
  })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({
    status: 200,
    description: 'Diff generated successfully',
  })
  async compareFileVersions(
    @Param('id') id: string,
    @Body() data: { compareWith: string; options?: any }
  ): Promise<{ diff: any; metadata?: any }> {
    const result = await this.codeEditorService.compareFileVersions(id, data.compareWith, data.options);
    return result;
  }

  @Post('search')
  @AmisResponse()
  @ApiOperation({
    summary: 'Search in code files',
    description: 'Search for text patterns in code files',
  })
  @ApiResponse({
    status: 200,
    description: 'Search completed successfully',
  })
  async searchInFiles(
    @Body() data: {
      query: string;
      projectId?: string;
      fileTypes?: string[];
      caseSensitive?: boolean;
      regex?: boolean;
      wholeWord?: boolean;
    }
  ): Promise<{ results: any[]; totalMatches: number }> {
    const result = await this.codeEditorService.searchInFiles(data);
    return result;
  }

  @Post('files/:id/backup')
  @AmisResponse()
  @ApiOperation({
    summary: 'Create file backup',
    description: 'Create a backup of the current file state',
  })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({
    status: 200,
    description: 'Backup created successfully',
  })
  async createFileBackup(@Param('id') id: string): Promise<{ backupId: string; timestamp: Date }> {
    const result = await this.codeEditorService.createFileBackup(id);
    return result;
  }

  @Get('files/:id/backups')
  @AmisResponse()
  @ApiOperation({
    summary: 'Get file backups',
    description: 'Get list of file backups',
  })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({
    status: 200,
    description: 'Backups retrieved successfully',
  })
  async getFileBackups(@Param('id') id: string): Promise<{ backups: any[] }> {
    const backups = await this.codeEditorService.getFileBackups(id);
    return { backups };
  }

  @Post('files/:id/restore/:backupId')
  @AmisResponse()
  @ApiOperation({
    summary: 'Restore file from backup',
    description: 'Restore file content from a backup',
  })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiParam({ name: 'backupId', description: 'Backup ID' })
  @ApiResponse({
    status: 200,
    description: 'File restored successfully',
  })
  async restoreFileFromBackup(
    @Param('id') id: string,
    @Param('backupId') backupId: string
  ): Promise<{ file: CodeFile }> {
    const file = await this.codeEditorService.restoreFileFromBackup(id, backupId);
    return { file };
  }
}
