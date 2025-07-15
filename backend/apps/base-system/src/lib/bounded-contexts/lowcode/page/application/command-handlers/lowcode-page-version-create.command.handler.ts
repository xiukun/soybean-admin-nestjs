import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, Inject } from '@nestjs/common';
import { LowcodePageVersionCreateCommand } from '@lowcode/page/commands/lowcode-page-version-create.command';
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LOWCODE_PAGE_REPOSITORY } from '@lowcode/page/lowcode-page.tokens';

@CommandHandler(LowcodePageVersionCreateCommand)
export class LowcodePageVersionCreateCommandHandler implements ICommandHandler<LowcodePageVersionCreateCommand> {
  constructor(
    @Inject(LOWCODE_PAGE_REPOSITORY)
    private readonly lowcodePageRepository: ILowcodePageRepository
  ) {}

  async execute(command: LowcodePageVersionCreateCommand): Promise<{ versionId: string }> {
    // Check if page exists
    const existingPage = await this.lowcodePageRepository.findById(command.pageId);
    if (!existingPage) {
      throw new NotFoundException(`Page with id '${command.pageId}' not found`);
    }

    // Create the version
    const version = await this.lowcodePageRepository.createVersion({
      pageId: command.pageId,
      version: command.version,
      schema: command.schema,
      changelog: command.changelog,
      createdAt: new Date(),
      createdBy: command.uid,
    });

    return { versionId: version.id! };
  }
}
