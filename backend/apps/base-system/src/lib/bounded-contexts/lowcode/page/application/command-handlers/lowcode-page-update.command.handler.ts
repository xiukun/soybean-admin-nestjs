import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, Inject } from '@nestjs/common';
import { LowcodePageUpdateCommand } from '@lowcode/page/commands/lowcode-page-update.command';
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LOWCODE_PAGE_REPOSITORY } from '@lowcode/page/lowcode-page.tokens';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { Status } from '@prisma/client';

@CommandHandler(LowcodePageUpdateCommand)
export class LowcodePageUpdateCommandHandler implements ICommandHandler<LowcodePageUpdateCommand> {
  constructor(
    @Inject(LOWCODE_PAGE_REPOSITORY)
    private readonly lowcodePageRepository: ILowcodePageRepository,
    private readonly prismaService: PrismaService
  ) {}

  async execute(command: LowcodePageUpdateCommand): Promise<{ pageId: string; versionId?: string }> {
    // Check if page exists
    const existingPage = await this.lowcodePageRepository.findById(command.id);
    if (!existingPage) {
      throw new NotFoundException(`Page with id '${command.id}' not found`);
    }

    // Update the page
    const updateData: any = {
      id: command.id,
      updatedAt: new Date(),
      updatedBy: command.uid,
    };

    if (command.name !== undefined) updateData.name = command.name;
    if (command.title !== undefined) updateData.title = command.title;
    if (command.description !== undefined) updateData.description = command.description;
    if (command.status !== undefined) updateData.status = command.status;

    // If schema is updated, also update the page schema and create a new version
    if (command.schema !== undefined) {
      updateData.schema = command.schema;
    }

    const updatedPage = await this.lowcodePageRepository.update(updateData);

    let versionId: string | undefined;

    // Create a new version if schema was updated
    if (command.schema !== undefined) {
      // Get the latest version to increment version number
      const versions = await this.lowcodePageRepository.findVersionsByPageId(command.id);
      const latestVersion = versions[0]; // Versions are ordered by createdAt desc
      
      // Calculate new version number
      let newVersion = '1.0.0'; // Default initial version
      if (latestVersion) {
        const versionParts = latestVersion.version.split('.').map(Number);
        if (versionParts.length === 3) {
          versionParts[2]++; // Increment patch version
          newVersion = versionParts.join('.');
        }
      }

      // 获取当前启用的产品版本
      const currentProductVersion = await this.prismaService.sysProductVersion.findFirst({
        where: { status: Status.ENABLED },
      });

      // 创建新版本记录
      const version = await this.lowcodePageRepository.createVersion({
        pageId: command.id,
        version: newVersion,
        schema: command.schema,
        changelog: command.changelog || `设计器保存 - ${new Date().toLocaleString()}`,
        createdAt: new Date(),
        createdBy: command.uid!,
        productVersionId: currentProductVersion?.id || null,
      });

      versionId = version.id;
    }

    return { pageId: updatedPage.id!, versionId };
  }
}
