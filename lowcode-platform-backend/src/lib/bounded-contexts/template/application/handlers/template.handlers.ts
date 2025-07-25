import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import {
  CreateTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
  CreateTemplateVersionCommand,
  RestoreTemplateVersionCommand,
} from '../commands/template.commands';

@Injectable()
@CommandHandler(CreateTemplateCommand)
export class CreateTemplateHandler implements ICommandHandler<CreateTemplateCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateTemplateCommand) {
    const { data } = command;

    // 检查代码是否已存在
    const existingTemplate = await (this.prisma as any).codeTemplate.findUnique({
      where: { code: data.code },
    });

    if (existingTemplate) {
      throw new ConflictException(`Template with code '${data.code}' already exists`);
    }

    // 创建模板
    const template = await (this.prisma as any).codeTemplate.create({
      data: {
        ...data,
        variables: JSON.stringify(data.variables || []),
        tags: JSON.stringify(data.tags || []),
        version: '1.0.0',
        status: 'ACTIVE',
      },
    });

    // 创建初始版本
    await (this.prisma as any).templateVersion.create({
      data: {
        templateId: template.id,
        version: '1.0.0',
        content: data.content,
        variables: JSON.stringify(data.variables || []),
        changelog: 'Initial version',
        createdBy: data.createdBy,
      },
    });

    return {
      ...template,
      variables: typeof template.variables === 'string' 
        ? JSON.parse(template.variables) 
        : template.variables,
      tags: typeof template.tags === 'string'
        ? JSON.parse(template.tags)
        : template.tags,
    };
  }
}

@Injectable()
@CommandHandler(UpdateTemplateCommand)
export class UpdateTemplateHandler implements ICommandHandler<UpdateTemplateCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateTemplateCommand) {
    const { id, data } = command;

    // 检查模板是否存在
    const existingTemplate = await (this.prisma as any).codeTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      throw new NotFoundException(`Template with id '${id}' not found`);
    }

    // 如果内容发生变化，创建新版本
    if (data.content && data.content !== existingTemplate.content) {
      const currentVersion = existingTemplate.version || '1.0.0';
      const versionParts = currentVersion.split('.').map(Number);
      versionParts[2] += 1; // 增加补丁版本号
      const newVersion = versionParts.join('.');

      await (this.prisma as any).templateVersion.create({
        data: {
          templateId: id,
          version: newVersion,
          content: data.content,
          variables: JSON.stringify(data.variables || []),
          changelog: `Updated to version ${newVersion}`,
          createdBy: data.updatedBy,
        },
      });

      data.version = newVersion;
    }

    // 更新模板
    const updatedTemplate = await (this.prisma as any).codeTemplate.update({
      where: { id },
      data: {
        ...data,
        variables: data.variables ? JSON.stringify(data.variables) : undefined,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
        updatedAt: new Date(),
      },
    });

    return {
      ...updatedTemplate,
      variables: typeof updatedTemplate.variables === 'string' 
        ? JSON.parse(updatedTemplate.variables) 
        : updatedTemplate.variables,
      tags: typeof updatedTemplate.tags === 'string'
        ? JSON.parse(updatedTemplate.tags)
        : updatedTemplate.tags,
    };
  }
}

@Injectable()
@CommandHandler(DeleteTemplateCommand)
export class DeleteTemplateHandler implements ICommandHandler<DeleteTemplateCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteTemplateCommand) {
    const { id } = command;

    // 检查模板是否存在
    const existingTemplate = await (this.prisma as any).codeTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      throw new NotFoundException(`Template with id '${id}' not found`);
    }

    // 软删除：更新状态为INACTIVE
    await (this.prisma as any).codeTemplate.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedAt: new Date(),
      },
    });

    return { success: true };
  }
}

@Injectable()
@CommandHandler(CreateTemplateVersionCommand)
export class CreateTemplateVersionHandler implements ICommandHandler<CreateTemplateVersionCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateTemplateVersionCommand) {
    const { templateId, data } = command;

    // 检查模板是否存在
    const template = await (this.prisma as any).codeTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template with id '${templateId}' not found`);
    }

    // 检查版本是否已存在
    const existingVersion = await (this.prisma as any).templateVersion.findUnique({
      where: {
        templateId_version: {
          templateId,
          version: data.version,
        },
      },
    });

    if (existingVersion) {
      throw new ConflictException(`Version '${data.version}' already exists for this template`);
    }

    // 创建新版本
    const version = await (this.prisma as any).templateVersion.create({
      data: {
        templateId,
        ...data,
        variables: JSON.stringify(data.variables || []),
      },
    });

    // 更新模板的当前版本
    await (this.prisma as any).codeTemplate.update({
      where: { id: templateId },
      data: {
        version: data.version,
        content: data.content,
        variables: JSON.stringify(data.variables || []),
        updatedAt: new Date(),
      },
    });

    return {
      ...version,
      variables: typeof version.variables === 'string' 
        ? JSON.parse(version.variables) 
        : version.variables,
    };
  }
}

@Injectable()
@CommandHandler(RestoreTemplateVersionCommand)
export class RestoreTemplateVersionHandler implements ICommandHandler<RestoreTemplateVersionCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: RestoreTemplateVersionCommand) {
    const { templateId, versionId, restoredBy } = command;

    // 获取要恢复的版本
    const version = await (this.prisma as any).templateVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.templateId !== templateId) {
      throw new NotFoundException('Template version not found');
    }

    // 恢复到指定版本
    const updatedTemplate = await (this.prisma as any).codeTemplate.update({
      where: { id: templateId },
      data: {
        content: version.content,
        variables: version.variables,
        version: version.version,
        updatedAt: new Date(),
      },
    });

    return {
      ...updatedTemplate,
      variables: typeof updatedTemplate.variables === 'string' 
        ? JSON.parse(updatedTemplate.variables) 
        : updatedTemplate.variables,
      tags: typeof updatedTemplate.tags === 'string'
        ? JSON.parse(updatedTemplate.tags)
        : updatedTemplate.tags,
    };
  }
}
