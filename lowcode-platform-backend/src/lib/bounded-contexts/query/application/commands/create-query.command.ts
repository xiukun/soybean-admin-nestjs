import { JoinConfig, FilterCondition, SortConfig, FieldSelection } from '../../domain/multi-table-query.model';

export class CreateQueryCommand {
  constructor(
    public readonly projectId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly baseEntityId: string,
    public readonly baseEntityAlias: string,
    public readonly joins: JoinConfig[],
    public readonly fields: FieldSelection[],
    public readonly filters: FilterCondition[],
    public readonly sorting: SortConfig[],
    public readonly groupBy: string[],
    public readonly having: FilterCondition[],
    public readonly limit?: number,
    public readonly offset?: number,
    public readonly createdBy: string = 'system',
  ) {}
}

export class UpdateQueryCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly baseEntityId: string,
    public readonly baseEntityAlias: string,
    public readonly joins: JoinConfig[],
    public readonly fields: FieldSelection[],
    public readonly filters: FilterCondition[],
    public readonly sorting: SortConfig[],
    public readonly groupBy: string[],
    public readonly having: FilterCondition[],
    public readonly limit?: number,
    public readonly offset?: number,
    public readonly sqlQuery?: string,
    public readonly updatedBy: string = 'system',
  ) {}
}

export class DeleteQueryCommand {
  constructor(
    public readonly id: string,
  ) {}
}

export class ExecuteQueryCommand {
  constructor(
    public readonly id: string,
    public readonly parameters?: Record<string, any>,
  ) {}
}

export class ActivateQueryCommand {
  constructor(
    public readonly id: string,
  ) {}
}

export class DeactivateQueryCommand {
  constructor(
    public readonly id: string,
  ) {}
}
