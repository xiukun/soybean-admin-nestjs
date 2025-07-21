import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoleService } from '@services/role.service';
import { AmisResponse } from '@decorators/amis-response.decorator';

@ApiTags('roles')
@Controller('roles')
@AmisResponse()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
  })
  async findAll(@Query() query: any) {
    const { page = 1, pageSize = 10, ...filters } = query;
    const result = await this.roleService.findAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      filters,
    });

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  async findOne(@Param('id') id: string) {
    return await this.roleService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new role' })
  async create(@Body() createRoleDto: any) {
    return await this.roleService.create(createRoleDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role' })
  async update(@Param('id') id: string, @Body() updateRoleDto: any) {
    return await this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  async remove(@Param('id') id: string) {
    await this.roleService.remove(id);
    return { message: 'Role deleted successfully' };
  }
}
