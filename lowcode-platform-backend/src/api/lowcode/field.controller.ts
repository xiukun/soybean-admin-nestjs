import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CreateFieldCommand } from '@field/application/commands/create-field.command';
import { UpdateFieldCommand } from '@field/application/commands/update-field.command';
import { DeleteFieldCommand } from '@field/application/commands/delete-field.command';
import { MoveFieldCommand } from '@field/application/commands/move-field.command';
import {
  GetFieldQuery,
  GetFieldsByEntityQuery,
  GetFieldsPaginatedQuery,
} from '@field/application/queries/get-field.query';
import { Field } from '@field/domain/field.model';
import { CreateFieldDto, UpdateFieldDto, MoveFieldDto, FieldResponseDto } from './dto/field.dto';

@ApiTags('fields')
@ApiBearerAuth()
@Controller({ path: 'fields', version: '1' })
export class FieldController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new field' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Field created successfully',
    type: FieldResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Field with the same code already exists in this entity',
  })
  async createField(@Body() createFieldDto: CreateFieldDto): Promise<FieldResponseDto> {
    const command = new CreateFieldCommand(
      createFieldDto.entityId,
      createFieldDto.name,
      createFieldDto.code,
      createFieldDto.dataType,
      createFieldDto.description,
      createFieldDto.length,
      createFieldDto.precision,
      createFieldDto.required,
      createFieldDto.unique,
      createFieldDto.defaultValue,
      createFieldDto.config,
      createFieldDto.displayOrder,
      createFieldDto.createdBy || 'system',
    );
    const field = await this.commandBus.execute(command);
    return this.mapToResponseDto(field);
  }

  @Get()
  @ApiOperation({ summary: 'Get all fields by project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fields found',
    type: [FieldResponseDto],
  })
  async getAllFields(@Query('projectId') projectId: string): Promise<FieldResponseDto[]> {
    // 这里需要实现根据项目ID获取所有字段的逻辑
    // 暂时返回空数组，需要后续实现具体的查询逻辑
    return [];
  }

  @Get('entity/:entityId')
  @ApiOperation({ summary: 'Get fields by entity ID' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fields found',
    type: [FieldResponseDto],
  })
  async getFieldsByEntity(@Param('entityId') entityId: string): Promise<FieldResponseDto[]> {
    const query = new GetFieldsByEntityQuery(entityId);
    const fields = await this.queryBus.execute(query);
    return fields.map((field: Field) => this.mapToResponseDto(field));
  }

  @Get('entity/:entityId/paginated')
  @ApiOperation({ summary: 'Get paginated fields by entity ID' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated fields found',
  })
  async getFieldsPaginated(
    @Param('entityId') entityId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query() filters?: any,
  ): Promise<any> {
    const query = new GetFieldsPaginatedQuery(entityId, page, limit, filters);
    const result = await this.queryBus.execute(query);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get field by ID' })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Field found',
    type: FieldResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Field not found',
  })
  async getField(@Param('id') id: string): Promise<FieldResponseDto> {
    const query = new GetFieldQuery(id);
    const field = await this.queryBus.execute(query);
    return this.mapToResponseDto(field);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update field' })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Field updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Field not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Field with the same code already exists in this entity',
  })
  async updateField(
    @Param('id') id: string,
    @Body() updateFieldDto: UpdateFieldDto,
  ): Promise<FieldResponseDto> {
    const command = new UpdateFieldCommand(
      id,
      updateFieldDto.name,
      updateFieldDto.code,
      updateFieldDto.dataType,
      updateFieldDto.description,
      updateFieldDto.length,
      updateFieldDto.precision,
      updateFieldDto.required,
      updateFieldDto.unique,
      updateFieldDto.defaultValue,
      updateFieldDto.config,
      updateFieldDto.displayOrder,
      updateFieldDto.updatedBy || 'system',
    );
    const field = await this.commandBus.execute(command);
    return this.mapToResponseDto(field);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete field' })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Field deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Field not found',
  })
  async deleteField(@Param('id') id: string): Promise<void> {
    const command = new DeleteFieldCommand(id);
    await this.commandBus.execute(command);
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Move field order' })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Field moved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Field not found',
  })
  async moveField(
    @Param('id') id: string,
    @Body() moveDto: MoveFieldDto,
  ): Promise<void> {
    const command = new MoveFieldCommand(id, moveDto.direction);
    await this.commandBus.execute(command);
  }

  private mapToResponseDto(field: Field): FieldResponseDto {
    return {
      id: field.id,
      entityId: field.entityId,
      name: field.name,
      code: field.code,
      dataType: field.dataType,
      description: field.description,
      length: field.length,
      precision: field.precision,
      required: field.required,
      unique: field.unique,
      defaultValue: field.defaultValue,
      config: field.config,
      displayOrder: field.displayOrder,
      createdBy: field.createdBy,
      createdAt: field.createdAt,
      updatedBy: field.updatedBy,
      updatedAt: field.updatedAt,
    };
  }
}
