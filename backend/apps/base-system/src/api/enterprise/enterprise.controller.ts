import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../../../../libs/infra/decorators/src/public.decorator';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { EnterpriseService } from './enterprise.service';

@ApiTags('Enterprise Management')
@ApiBearerAuth()
@Controller('enterprises')
export class EnterpriseController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly enterpriseService: EnterpriseService,
  ) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new enterprise' })
  create(@Body() createEnterpriseDto: CreateEnterpriseDto) {
    return this.enterpriseService.create(createEnterpriseDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all enterprises' })
  findAll() {
    return this.enterpriseService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get enterprise by ID' })
  findOne(@Param('id') id: string) {
    return this.enterpriseService.findOne(id);
  }

  @Public()
  @Patch(':id')
  @ApiOperation({ summary: 'Update enterprise by ID' })
  update(@Param('id') id: string, @Body() updateEnterpriseDto: UpdateEnterpriseDto) {
    return this.enterpriseService.update(id, updateEnterpriseDto);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete enterprise by ID' })
  remove(@Param('id') id: string) {
    return this.enterpriseService.remove(id);
  }
}