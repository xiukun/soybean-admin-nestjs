import { Controller, Post, Get, Delete, Body, Param, Query, HttpStatus, HttpCode, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { Public } from '@decorators/public.decorator';
import { GenerateCodeDto, GenerationProgressResponseDto, GenerationHistoryResponseDto } from './dto/code-generation.dto';
import { GenerateCodeCommand } from '@lib/bounded-contexts/code-generation/application/commands/generate-code.command';
import { GetGenerationProgressQuery } from '@lib/bounded-contexts/code-generation/application/queries/get-generation-progress.query';

@ApiTags('code-generation')
@ApiBearerAuth()
@Public() // 临时禁用认证以便测试
@Controller({ path: 'code-generation', version: '1' })
export class CodeGenerationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate code from templates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Code generation started successfully',
  })
  async generateCode(@Body() generateCodeDto: GenerateCodeDto) {
    // 兼容旧版本API，如果只有templateId，转换为templateIds
    const templateIds = generateCodeDto.templateIds ||
      (generateCodeDto.templateId ? [generateCodeDto.templateId] : []);

    const command = new GenerateCodeCommand(
      generateCodeDto.projectId,
      templateIds,
      generateCodeDto.entityIds,
      '../amis-lowcode-backend/src',
      generateCodeDto.variables,
      generateCodeDto.options,
    );

    const result = await this.commandBus.execute(command);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Get('progress/:taskId')
  @ApiOperation({ summary: 'Get generation progress' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Generation progress retrieved successfully',
    type: GenerationProgressResponseDto,
  })
  async getProgress(@Param('taskId') taskId: string) {
    const query = new GetGenerationProgressQuery(taskId);
    const progress = await this.queryBus.execute(query);

    return {
      status: 0,
      msg: 'success',
      data: progress,
    };
  }

  @Get('history/project/:projectId')
  @ApiOperation({ summary: 'Get generation history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Generation history retrieved successfully',
    type: GenerationHistoryResponseDto,
  })
  async getHistory(
    @Param('projectId') projectId: string,
    @Query() query: any,
  ) {
    // TODO: 实现历史记录查询逻辑
    const mockHistory = {
      records: [],
      total: 0,
      current: query.current || 1,
      size: query.size || 10,
    };

    return {
      status: 0,
      msg: 'success',
      data: {
        items: mockHistory.records,
        total: mockHistory.total,
        page: mockHistory.current,
        pageSize: mockHistory.size,
      },
    };
  }

  @Get('download/:taskId')
  @ApiOperation({ summary: 'Download generated code' })
  async downloadCode(
    @Param('taskId') taskId: string,
    @Res() reply: FastifyReply,
  ) {
    // TODO: 实现代码下载逻辑
    reply
      .header('Content-Type', 'application/json')
      .send({
        status: 1,
        msg: 'Download feature not implemented yet',
        data: null,
      });
  }

  @Delete('result/:taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete generation result' })
  async deleteResult(@Param('taskId') taskId: string) {
    // TODO: 实现删除结果逻辑
    return {
      status: 0,
      msg: 'success',
    };
  }
}
