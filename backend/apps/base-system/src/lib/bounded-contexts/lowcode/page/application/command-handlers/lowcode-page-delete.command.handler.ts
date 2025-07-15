import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, Inject } from '@nestjs/common';
import { LowcodePageDeleteCommand } from '@lowcode/page/commands/lowcode-page-delete.command';
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LOWCODE_PAGE_REPOSITORY } from '@lowcode/page/lowcode-page.tokens';

@CommandHandler(LowcodePageDeleteCommand)
export class LowcodePageDeleteCommandHandler implements ICommandHandler<LowcodePageDeleteCommand> {
  constructor(
    @Inject(LOWCODE_PAGE_REPOSITORY)
    private readonly lowcodePageRepository: ILowcodePageRepository
  ) {}

  async execute(command: LowcodePageDeleteCommand): Promise<void> {
    // Check if page exists
    const existingPage = await this.lowcodePageRepository.findById(command.id);
    if (!existingPage) {
      throw new NotFoundException(`Page with id '${command.id}' not found`);
    }

    // Delete the page (versions will be cascade deleted due to foreign key constraint)
    await this.lowcodePageRepository.delete(command.id);
  }
}
