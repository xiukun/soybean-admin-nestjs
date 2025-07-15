import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { RoleReadRepoPortToken } from '../../constants';
import { RoleProperties } from '../../domain/role.read.model';
import { RoleReadRepoPort } from '../../ports/role.read.repo-port';
import { AllRolesQuery } from '../../queries/all-roles.query';

@QueryHandler(AllRolesQuery)
export class AllRolesQueryHandler
  implements IQueryHandler<AllRolesQuery, RoleProperties[]>
{
  @Inject(RoleReadRepoPortToken) private readonly repository: RoleReadRepoPort;

  async execute(query: AllRolesQuery): Promise<RoleProperties[]> {
    return this.repository.getAllRoles();
  }
}
