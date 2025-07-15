import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, Inject } from '@nestjs/common';
import { LowcodePageUpdateCommand } from '@lowcode/page/commands/lowcode-page-update.command';
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LOWCODE_PAGE_REPOSITORY } from '@lowcode/page/lowcode-page.tokens';

@CommandHandler(LowcodePageUpdateCommand)
export class LowcodePageUpdateCommandHandler implements ICommandHandler<LowcodePageUpdateCommand> {
  constructor(
    @Inject(LOWCODE_PAGE_REPOSITORY)
    private readonly lowcodePageRepository: ILowcodePageRepository
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
      
      // Simple version increment logic (you might want to make this more sophisticated)
      const versionParts = latestVersion ? latestVersion.version.split('.').map(Number) : [0, 0, 0];
      versionParts[2]++; // Increment patch version
      const newVersion = versionParts.join('.');

      const version = await this.lowcodePageRepository.createVersion({
        pageId: command.id,
        version: newVersion,
        schema: command.schema,
        changelog: command.changelog || `Updated to version ${newVersion}`,
        createdAt: new Date(),
        createdBy: command.uid!,
      });

      versionId = version.id;
    }

    return { pageId: updatedPage.id!, versionId };
  }
}
