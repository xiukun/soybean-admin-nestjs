import { Test, TestingModule } from '@nestjs/testing';
import { Status } from '@prisma/client';
import { LowcodePageCreateCommand } from '../commands/lowcode-page-create.command';
import { LowcodePageUpdateCommand } from '../commands/lowcode-page-update.command';
import { LowcodePageDeleteCommand } from '../commands/lowcode-page-delete.command';
import { GetLowcodePagesQuery } from '../queries/get-lowcode-pages.query';
import { GetLowcodePageByIdQuery } from '../queries/get-lowcode-page-by-id.query';
import { GetLowcodePageByCodeQuery } from '../queries/get-lowcode-page-by-code.query';
import { LowcodePageCreateCommandHandler } from '../application/command-handlers/lowcode-page-create.command.handler';
import { LowcodePageUpdateCommandHandler } from '../application/command-handlers/lowcode-page-update.command.handler';
import { LowcodePageDeleteCommandHandler } from '../application/command-handlers/lowcode-page-delete.command.handler';
import { GetLowcodePagesQueryHandler } from '../application/query-handlers/get-lowcode-pages.query.handler';
import { GetLowcodePageByIdQueryHandler } from '../application/query-handlers/get-lowcode-page-by-id.query.handler';
import { GetLowcodePageByCodeQueryHandler } from '../application/query-handlers/get-lowcode-page-by-code.query.handler';
import { ILowcodePageRepository } from '../domain/lowcode-page.repository';
import { LowcodePagePrismaRepository } from '../infrastructure/lowcode-page-prisma.repository';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

describe('LowcodePage Integration Tests', () => {
  let module: TestingModule;
  let createHandler: LowcodePageCreateCommandHandler;
  let updateHandler: LowcodePageUpdateCommandHandler;
  let deleteHandler: LowcodePageDeleteCommandHandler;
  let getPagesHandler: GetLowcodePagesQueryHandler;
  let getByIdHandler: GetLowcodePageByIdQueryHandler;
  let getByCodeHandler: GetLowcodePageByCodeQueryHandler;
  let repository: ILowcodePageRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        LowcodePageCreateCommandHandler,
        LowcodePageUpdateCommandHandler,
        LowcodePageDeleteCommandHandler,
        GetLowcodePagesQueryHandler,
        GetLowcodePageByIdQueryHandler,
        GetLowcodePageByCodeQueryHandler,
        {
          provide: ILowcodePageRepository,
          useClass: LowcodePagePrismaRepository,
        },
        {
          provide: PrismaService,
          useValue: {
            sysLowcodePage: {
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
            sysLowcodePageVersion: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    createHandler = module.get<LowcodePageCreateCommandHandler>(LowcodePageCreateCommandHandler);
    updateHandler = module.get<LowcodePageUpdateCommandHandler>(LowcodePageUpdateCommandHandler);
    deleteHandler = module.get<LowcodePageDeleteCommandHandler>(LowcodePageDeleteCommandHandler);
    getPagesHandler = module.get<GetLowcodePagesQueryHandler>(GetLowcodePagesQueryHandler);
    getByIdHandler = module.get<GetLowcodePageByIdQueryHandler>(GetLowcodePageByIdQueryHandler);
    getByCodeHandler = module.get<GetLowcodePageByCodeQueryHandler>(GetLowcodePageByCodeQueryHandler);
    repository = module.get<ILowcodePageRepository>(ILowcodePageRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('LowcodePageCreateCommandHandler', () => {
    it('should create a lowcode page successfully', async () => {
      const mockPage = {
        id: 'test-id',
        name: 'Test Page',
        title: 'Test Page Title',
        code: 'test-page',
        description: 'Test description',
        schema: { type: 'page', body: [] },
        status: Status.ENABLED,
        createdAt: new Date(),
        createdBy: 'test-user',
        updatedAt: null,
        updatedBy: null,
      };

      const mockVersion = {
        id: 'version-id',
        pageId: 'test-id',
        version: '1.0.0',
        schema: { type: 'page', body: [] },
        changelog: 'Initial version',
        createdAt: new Date(),
        createdBy: 'test-user',
      };

      (prisma.sysLowcodePage.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.sysLowcodePage.create as jest.Mock).mockResolvedValue(mockPage);
      (prisma.sysLowcodePageVersion.create as jest.Mock).mockResolvedValue(mockVersion);

      const command = new LowcodePageCreateCommand(
        'Test Page',
        'Test Page Title',
        'test-page',
        'Test description',
        { type: 'page', body: [] },
        Status.ENABLED,
        'Initial version',
        'test-user',
      );

      const result = await createHandler.execute(command);

      expect(result).toEqual({
        pageId: 'test-id',
        versionId: 'version-id',
      });
    });
  });

  describe('GetLowcodePagesQueryHandler', () => {
    it('should return paginated lowcode pages', async () => {
      const mockPages = [
        {
          id: 'test-id-1',
          name: 'Test Page 1',
          title: 'Test Page Title 1',
          code: 'test-page-1',
          description: 'Test description 1',
          schema: { type: 'page', body: [] },
          status: Status.ENABLED,
          createdAt: new Date(),
          createdBy: 'test-user',
          updatedAt: null,
          updatedBy: null,
        },
      ];

      (prisma.sysLowcodePage.findMany as jest.Mock).mockResolvedValue(mockPages);
      (prisma.sysLowcodePage.count as jest.Mock).mockResolvedValue(1);

      const query = new GetLowcodePagesQuery(1, 10);
      const result = await getPagesHandler.execute(query);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(10);
    });
  });
});
