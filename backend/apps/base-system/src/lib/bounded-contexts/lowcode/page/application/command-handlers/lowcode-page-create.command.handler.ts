import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Inject } from '@nestjs/common';
import { LowcodePageCreateCommand } from '@lowcode/page/commands/lowcode-page-create.command';
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LOWCODE_PAGE_REPOSITORY } from '@lowcode/page/lowcode-page.tokens';

@CommandHandler(LowcodePageCreateCommand)
export class LowcodePageCreateCommandHandler implements ICommandHandler<LowcodePageCreateCommand> {
  constructor(
    @Inject(LOWCODE_PAGE_REPOSITORY)
    private readonly lowcodePageRepository: ILowcodePageRepository
  ) {}

  async execute(command: LowcodePageCreateCommand): Promise<{ pageId: string; versionId: string }> {
    // Check if page with the same code already exists
    const existingPage = await this.lowcodePageRepository.findByCode(command.code);
    if (existingPage) {
      throw new ConflictException(`Page with code '${command.code}' already exists`);
    }

    // Create the page
    const page = await this.lowcodePageRepository.create({
      name: command.name,
      title: command.title,
      code: command.code,
      description: command.description,
      schema: command.schema,
      status: command.status,
      createdAt: new Date(),
      createdBy: command.uid,
    });

    // Create initial version
    const version = await this.lowcodePageRepository.createVersion({
      pageId: page.id!,
      version: '1.0.0', // Initial version
      schema: command.schema,
      changelog: command.changelog || 'Initial version',
      createdAt: new Date(),
      createdBy: command.uid,
    });

    return { pageId: page.id!, versionId: version.id! };
  }
}
