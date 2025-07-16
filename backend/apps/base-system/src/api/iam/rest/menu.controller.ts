import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { MenuRoute } from '@app/base-system/lib/bounded-contexts/iam/menu/application/dto/route.dto';
import { MenuService } from '@app/base-system/lib/bounded-contexts/iam/menu/application/service/menu.service';
import { MenuCreateCommand } from '@app/base-system/lib/bounded-contexts/iam/menu/commands/menu-create.command';
import { MenuDeleteCommand } from '@app/base-system/lib/bounded-contexts/iam/menu/commands/menu-delete.command';
import { MenuUpdateCommand } from '@app/base-system/lib/bounded-contexts/iam/menu/commands/menu-update.command';
import { MenuTreeProperties } from '@app/base-system/lib/bounded-contexts/iam/menu/domain/menu.read.model';
import { MenuIdsByRoleIdAndDomainQuery } from '@app/base-system/lib/bounded-contexts/iam/menu/queries/menu-ids.by-role_id&domain.query';
import { MenusByIdsQuery } from '@app/base-system/lib/bounded-contexts/iam/menu/queries/menus.by-ids.query';
import { MenusQuery } from '@app/base-system/lib/bounded-contexts/iam/menu/queries/menus.query';
import { MenusTreeQuery } from '@app/base-system/lib/bounded-contexts/iam/menu/queries/menus.tree.query';

import { Public } from '@lib/infra/decorators/public.decorator';
import { ApiJwtAuth } from '@lib/infra/decorators/api-bearer-auth.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';

import { RouteCreateDto, RouteUpdateDto } from '../dto/route.dto';

@ApiTags('Menu - Module')
@ApiJwtAuth() // 添加Bearer认证装饰器
@Controller('route')
export class MenuController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly menuService: MenuService,
  ) {}

  @Public()
  @Get('getConstantRoutes')
  @ApiOperation({
    summary: 'Get constant routes',
    description: 'Retrieve all constant routes available in the system.',
  })
  async getConstantRoutes(): Promise<ApiRes<MenuRoute[]>> {
    const result = await this.menuService.getConstantRoutes();
    return ApiRes.success(result);
  }

  @Get()
  @ApiOperation({
    summary: 'Routes',
  })
  async routes() {
    const result = await this.queryBus.execute<
      MenusQuery,
      MenuTreeProperties[]
    >(new MenusQuery());
    return ApiRes.success(result);
  }

  @Get('tree')
  @ApiOperation({
    summary: 'Routes',
  })
  async treeRoute() {
    const result = await this.queryBus.execute<
      MenusTreeQuery,
      MenuTreeProperties[]
    >(new MenusTreeQuery());
    return ApiRes.success(result);
  }

  @Post()
  @ApiOperation({ summary: 'Create a New Route' })
  @ApiResponse({
    status: 201,
    description: 'The route has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createRoute(
    @Body() dto: RouteCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new MenuCreateCommand(
        dto.menuName,
        dto.menuType,
        dto.iconType,
        dto.icon,
        dto.routeName,
        dto.routePath,
        dto.component,
        dto.pathParam ?? null,
        dto.status,
        dto.activeMenu,
        dto.hideInMenu,
        dto.pid,
        dto.order,
        dto.i18nKey,
        dto.keepAlive,
        dto.constant,
        dto.href,
        dto.multiTab,
        null, // lowcodePageId 将由系统自动生成
        req.user.uid,
      ),
    );
    return ApiRes.ok();
  }

  @Put()
  @ApiOperation({ summary: 'Update a Route' })
  @ApiResponse({
    status: 201,
    description: 'The route has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateRoute(
    @Body() dto: RouteUpdateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new MenuUpdateCommand(
        dto.id,
        dto.menuName,
        dto.menuType,
        dto.iconType,
        dto.icon,
        dto.routeName,
        dto.routePath,
        dto.component,
        dto.pathParam ?? null,
        dto.status,
        dto.activeMenu,
        dto.hideInMenu,
        dto.pid,
        dto.order,
        dto.i18nKey,
        dto.keepAlive,
        dto.constant,
        dto.href,
        dto.multiTab,
        null, // lowcodePageId 不允许修改，将使用现有值
        req.user.uid,
      ),
    );
    return ApiRes.ok();
  }

  @Get(':id/lowcode-page-id')
  @ApiOperation({ summary: 'Get lowcode page ID for a menu' })
  @ApiResponse({
    status: 200,
    description: 'Returns the lowcode page ID if the menu is of type lowcode.',
  })
  @ApiResponse({ status: 404, description: 'Menu not found.' })
  async getLowcodePageId(@Param('id') id: number): Promise<ApiRes<{ lowcodePageId: string | null }>> {
    // 使用 MenusByIdsQuery 来获取菜单信息
    const menus = await this.queryBus.execute(new MenusByIdsQuery([id]));
    if (!menus || menus.length === 0) {
      throw new BadRequestException(`Menu with id ${id} not found.`);
    }

    const menu = menus[0];
    return ApiRes.success({
      lowcodePageId: menu.lowcodePageId
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Route' })
  @ApiResponse({
    status: 201,
    description: 'The route has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteRoute(@Param('id') id: number): Promise<ApiRes<null>> {
    await this.commandBus.execute(new MenuDeleteCommand(id));
    return ApiRes.ok();
  }

  @Get('auth-route/:roleId')
  @ApiOperation({
    summary: 'Authorized Routes',
  })
  async authRoute(@Param('roleId') roleId: string, @Request() req: any) {
    const result = await this.queryBus.execute<
      MenuIdsByRoleIdAndDomainQuery,
      number[]
    >(new MenuIdsByRoleIdAndDomainQuery(roleId, req.user.domain));
    return ApiRes.success(result);
  }
}
