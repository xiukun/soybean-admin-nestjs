import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { EndpointProperties } from '@app/base-system/lib/bounded-contexts/api-endpoint/api-endpoint/domain/endpoint.read.model';
import { FindEndpointsByIdsQuery } from '@app/base-system/lib/bounded-contexts/api-endpoint/api-endpoint/queries/endpoints.by-ids.query';
import { DomainProperties } from '@app/base-system/lib/bounded-contexts/iam/domain/domain/domain.read.model';
import { FindDomainByCodeQuery } from '@app/base-system/lib/bounded-contexts/iam/domain/queries/domain.by-code.query';
import { MenuProperties } from '@app/base-system/lib/bounded-contexts/iam/menu/domain/menu.read.model';
import { MenuIdsByUserIdAndDomainQuery } from '@app/base-system/lib/bounded-contexts/iam/menu/queries/menu-ids.by-user_id&domain.query';
import { MenusByIdsQuery } from '@app/base-system/lib/bounded-contexts/iam/menu/queries/menus.by-ids.query';
import { RoleProperties } from '@app/base-system/lib/bounded-contexts/iam/role/domain/role.read.model';
import { FindRoleByIdQuery } from '@app/base-system/lib/bounded-contexts/iam/role/queries/role.by-id.query';

import { AuthZRBACService } from '@lib/infra/casbin';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

import { RoleAssignPermissionCommand } from '../../commands/role-assign-permission.command';
import { RoleAssignRouteCommand } from '../../commands/role-assign-route.command';
import { RoleAssignUserCommand } from '../../commands/role-assign-user.command';
import { UserProperties } from '../../domain/user.read.model';
import { UserIdsByRoleIdQuery } from '../../queries/user-ids.by-role_id.query';
import { UsersByIdsQuery } from '../../queries/users.by-ids.query';

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly authZRBACService: AuthZRBACService,
    private readonly prisma: PrismaService,
  ) {}

  async assignButtons(domain: string, roleId: string, buttonIds: string[]): Promise<void> {
    const { domainCode, roleId: checkedRoleId } = await this.checkDomainAndRole(domain, roleId);

    const existingButtonIds = await this.prisma.sysRoleButton
      .findMany({
        where: { roleId: checkedRoleId, domain: domainCode },
        select: { buttonId: true },
      })
      .then((rows) => rows.map((r) => r.buttonId));

    const newButtonIds = buttonIds.filter((id) => !existingButtonIds.includes(id));
    const buttonIdsToDelete = existingButtonIds.filter((id) => !buttonIds.includes(id));

    const operations = [
      ...newButtonIds.map((buttonId) =>
        this.prisma.sysRoleButton.create({
          data: {
            roleId: checkedRoleId,
            buttonId,
            domain: domainCode,
          },
        }),
      ),
      ...buttonIdsToDelete.map((buttonId) =>
        this.prisma.sysRoleButton.deleteMany({
          where: { roleId: checkedRoleId, buttonId, domain: domainCode },
        }),
      ),
    ];

    await this.prisma.$transaction(operations);
  }

  async getUserButtonCodes(roleCodes: string[], domain: string): Promise<string[]> {
    const domainEntity = await this.queryBus.execute<
      FindDomainByCodeQuery,
      Readonly<DomainProperties> | null
    >(new FindDomainByCodeQuery(domain));
    if (!domainEntity) {
      throw new NotFoundException('Domain not found.');
    }

    const roles = await this.prisma.sysRole.findMany({
      where: { code: { in: roleCodes } },
      select: { id: true },
    });

    const roleIds = roles.map((r) => r.id);
    if (roleIds.length === 0) return [];

    const bindings = await this.prisma.sysRoleButton.findMany({
      where: {
        roleId: { in: roleIds },
        domain: domainEntity.code,
      },
      select: { buttonId: true },
      distinct: ['buttonId'],
    });

    const buttonIds = bindings.map((b) => b.buttonId);
    if (buttonIds.length === 0) return [];

    const buttons = await this.prisma.sysButton.findMany({
      where: {
        id: { in: buttonIds },
        status: 'ENABLED',
      },
      select: { code: true },
    });

    return buttons.map((b) => b.code);
  }

  async assignPermission(command: RoleAssignPermissionCommand) {
    const { domainCode, roleCode } = await this.checkDomainAndRole(
      command.domain,
      command.roleId,
    );

    const permissions = await this.queryBus.execute<
      FindEndpointsByIdsQuery,
      EndpointProperties[]
    >(new FindEndpointsByIdsQuery(command.permissions));
    if (!permissions.length) {
      throw new NotFoundException('One or more permissions not found.');
    }

    const existingPermissions =
      await this.authZRBACService.enforcer.getFilteredPolicy(
        0,
        roleCode,
        '',
        '',
        domainCode,
      );

    await this.syncRolePermissions(
      roleCode,
      domainCode,
      permissions,
      existingPermissions,
    );
  }

  async assignRoutes(command: RoleAssignRouteCommand) {
    const { domainCode, roleId } = await this.checkDomainAndRole(
      command.domain,
      command.roleId,
    );

    const routes = await this.queryBus.execute<
      MenusByIdsQuery,
      MenuProperties[]
    >(new MenusByIdsQuery(command.menuIds));
    if (!routes.length) {
      throw new NotFoundException('One or more routes not found.');
    }

    const existingRouteIds = await this.queryBus.execute<
      MenuIdsByUserIdAndDomainQuery,
      number[]
    >(new MenuIdsByUserIdAndDomainQuery(roleId, domainCode));

    const newRouteIds = command.menuIds.filter(
      (id) => !existingRouteIds.includes(id),
    );
    const routeIdsToDelete = existingRouteIds.filter(
      (id) => !command.menuIds.includes(id),
    );

    const operations = [
      ...newRouteIds.map((routeId) =>
        this.prisma.sysRoleMenu.create({
          data: {
            roleId: roleId,
            menuId: routeId,
            domain: domainCode,
          },
        }),
      ),
      ...routeIdsToDelete.map((routeId) =>
        this.prisma.sysRoleMenu.deleteMany({
          where: {
            roleId: roleId,
            menuId: routeId,
            domain: domainCode,
          },
        }),
      ),
    ];

    await this.prisma.$transaction(operations);
  }

  async assignUsers(command: RoleAssignUserCommand) {
    await this.checkRole(command.roleId);

    const users = await this.queryBus.execute<
      UsersByIdsQuery,
      UserProperties[]
    >(new UsersByIdsQuery(command.userIds));
    if (!users.length) {
      throw new NotFoundException('One or more users not found.');
    }

    const existingUserIds = await this.queryBus.execute<
      UserIdsByRoleIdQuery,
      string[]
    >(new UserIdsByRoleIdQuery(command.roleId));

    const newUserIds = command.userIds.filter(
      (id) => !existingUserIds.includes(id),
    );
    const userIdsToDelete = existingUserIds.filter(
      (id) => !command.userIds.includes(id),
    );

    const operations = [
      ...newUserIds.map((userId) =>
        this.prisma.sysUserRole.create({
          data: {
            roleId: command.roleId,
            userId: userId,
          },
        }),
      ),
      ...userIdsToDelete.map((userId) =>
        this.prisma.sysUserRole.deleteMany({
          where: {
            roleId: command.roleId,
            userId: userId,
          },
        }),
      ),
    ];

    await this.prisma.$transaction(operations);
  }

  private async checkDomainAndRole(domainCode: string, roleId: string) {
    const domain = await this.queryBus.execute<
      FindDomainByCodeQuery,
      Readonly<DomainProperties> | null
    >(new FindDomainByCodeQuery(domainCode));
    if (!domain) {
      throw new NotFoundException('Domain not found.');
    }

    const { roleCode } = await this.checkRole(roleId);

    return { domainCode: domain.code, roleId, roleCode };
  }

  private async checkRole(roleId: string) {
    const role = await this.queryBus.execute<
      FindRoleByIdQuery,
      Readonly<RoleProperties> | null
    >(new FindRoleByIdQuery(roleId));
    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    return { roleCode: role.code };
  }

  private async syncRolePermissions(
    roleCode: string,
    domain: string,
    newPermissions: EndpointProperties[],
    existingPermissions: string[][],
  ): Promise<void> {
    // 转换新权限为 Casbin 策略格式
    const newPermSet = new Set(
      newPermissions.map((perm) =>
        JSON.stringify([roleCode, perm.resource, perm.action, domain, 'allow']),
      ),
    );

    const existingPermSet = new Set(
      existingPermissions.map((perm) => JSON.stringify(perm)),
    );

    // 删除在新权限中不存在的现有权限
    for (const perm of existingPermissions) {
      if (!newPermSet.has(JSON.stringify(perm))) {
        await this.authZRBACService.enforcer.removeFilteredPolicy(
          0,
          roleCode,
          perm[1],
          perm[2],
          domain,
        );
      }
    }

    // 添加不存在的新权限
    for (const perm of newPermissions) {
      const permArray = [roleCode, perm.resource, perm.action, domain, 'allow'];
      if (!existingPermSet.has(JSON.stringify(permArray))) {
        await this.authZRBACService.enforcer.addPermissionForUser(
          roleCode,
          perm.resource,
          perm.action,
          domain,
        );
      }
    }
  }
}
