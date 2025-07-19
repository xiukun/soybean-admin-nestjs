import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import {
  GetFieldQuery,
  GetFieldsByEntityQuery,
  GetFieldsPaginatedQuery,
} from '@field/application/queries/get-field.query';
import { Field } from '@field/domain/field.model';
import { FieldRepository } from '@field/domain/field.repository';

@QueryHandler(GetFieldQuery)
export class GetFieldHandler implements IQueryHandler<GetFieldQuery> {
  constructor(
    @Inject('FieldRepository')
    private readonly fieldRepository: FieldRepository,
  ) {}

  async execute(query: GetFieldQuery): Promise<Field> {
    const field = await this.fieldRepository.findById(query.id);
    if (!field) {
      throw new NotFoundException(`Field with id '${query.id}' not found`);
    }
    return field;
  }
}

@QueryHandler(GetFieldsByEntityQuery)
export class GetFieldsByEntityHandler implements IQueryHandler<GetFieldsByEntityQuery> {
  constructor(
    @Inject('FieldRepository')
    private readonly fieldRepository: FieldRepository,
  ) {}

  async execute(query: GetFieldsByEntityQuery): Promise<Field[]> {
    return await this.fieldRepository.findByEntityId(query.entityId);
  }
}

@QueryHandler(GetFieldsPaginatedQuery)
export class GetFieldsPaginatedHandler implements IQueryHandler<GetFieldsPaginatedQuery> {
  constructor(
    @Inject('FieldRepository')
    private readonly fieldRepository: FieldRepository,
  ) {}

  async execute(query: GetFieldsPaginatedQuery): Promise<any> {
    return await this.fieldRepository.findPaginated(
      query.entityId,
      query.page,
      query.limit,
      query.filters,
    );
  }
}
