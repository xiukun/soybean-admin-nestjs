import { EntityStatus } from '@entity/domain/entity.model';

export class UpdateEntityCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly code?: string,
    public readonly tableName?: string,
    public readonly description?: string,
    public readonly category?: string,
    public readonly diagramPosition?: any,
    public readonly config?: any,
    public readonly status?: EntityStatus,
    public readonly updatedBy?: string,
  ) {}
}
