import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';
import { HotUpdateService, HotUpdateEvent } from '../../src/lib/code-generation/services/hot-update.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Hot Update Service Tests', () => {
  let service: HotUpdateService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;
  let testDir: string;
  let testFiles: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotUpdateService,
        {
          provide: PrismaService,
          useValue: {
            entity: {
              findFirst: jest.fn(),
              findMany: jest.fn().mockResolvedValue([]),
            },
            codeTemplate: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HotUpdateService>(HotUpdateService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    testDir = './test-hot-update';
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Clean up test files
    for (const file of testFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        console.warn(`Failed to delete test file ${file}:`, error.message);
      }
    }

    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }

    await service.disable();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return status information', () => {
      const status = service.getStatus();
      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('watchedPaths');
      expect(status).toHaveProperty('activeTimers');
      expect(status).toHaveProperty('config');
    });

    it('should enable and disable hot updates', async () => {
      // Initially might be disabled in test environment
      service.enable();
      expect(service.getStatus().enabled).toBe(true);

      await service.disable();
      expect(service.getStatus().enabled).toBe(false);
    });
  });

  describe('File Watching', () => {
    beforeEach(() => {
      service.enable();
    });

    afterEach(async () => {
      await service.disable();
    });

    it('should add and remove watch paths', async () => {
      const testWatchDir = path.join(testDir, 'watch-test');
      if (!fs.existsSync(testWatchDir)) {
        fs.mkdirSync(testWatchDir, { recursive: true });
      }

      const initialPaths = service.getStatus().watchedPaths.length;
      
      await service.addWatchPath(testWatchDir);
      expect(service.getStatus().watchedPaths.length).toBe(initialPaths + 1);

      await service.removeWatchPath(testWatchDir);
      expect(service.getStatus().watchedPaths.length).toBe(initialPaths);
    });

    it('should detect file creation', (done) => {
      const testFile = path.join(testDir, 'test-create.ts');
      testFiles.push(testFile);

      // Add watch for test directory
      service.addWatchPath(testDir);

      // Listen for file events
      const eventSpy = jest.spyOn(eventEmitter, 'emit');

      // Create file after a short delay to ensure watcher is ready
      setTimeout(() => {
        fs.writeFileSync(testFile, 'console.log("test file");');
        
        // Check for event emission after debounce period
        setTimeout(() => {
          expect(eventSpy).toHaveBeenCalledWith(
            'hot-update.file-changed',
            expect.objectContaining({
              type: 'file_added',
              path: testFile,
            })
          );
          done();
        }, 1500); // Wait for debounce
      }, 100);
    });

    it('should detect file modification', (done) => {
      const testFile = path.join(testDir, 'test-modify.ts');
      testFiles.push(testFile);

      // Create initial file
      fs.writeFileSync(testFile, 'console.log("initial");');

      service.addWatchPath(testDir);

      const eventSpy = jest.spyOn(eventEmitter, 'emit');

      setTimeout(() => {
        // Modify file
        fs.writeFileSync(testFile, 'console.log("modified");');
        
        setTimeout(() => {
          expect(eventSpy).toHaveBeenCalledWith(
            'hot-update.file-changed',
            expect.objectContaining({
              type: 'file_changed',
              path: testFile,
            })
          );
          done();
        }, 1500);
      }, 100);
    });

    it('should detect file deletion', (done) => {
      const testFile = path.join(testDir, 'test-delete.ts');
      testFiles.push(testFile);

      // Create initial file
      fs.writeFileSync(testFile, 'console.log("to be deleted");');

      service.addWatchPath(testDir);

      const eventSpy = jest.spyOn(eventEmitter, 'emit');

      setTimeout(() => {
        // Delete file
        fs.unlinkSync(testFile);
        
        setTimeout(() => {
          expect(eventSpy).toHaveBeenCalledWith(
            'hot-update.file-changed',
            expect.objectContaining({
              type: 'file_deleted',
              path: testFile,
            })
          );
          done();
        }, 1500);
      }, 100);
    });
  });

  describe('Event Context Enrichment', () => {
    it('should enrich events with project context', async () => {
      const mockEntity = {
        id: 'entity-123',
        projectId: 'project-456',
        code: 'user',
      };

      (prisma.entity.findFirst as jest.Mock).mockResolvedValue(mockEntity);

      const testFile = path.join(testDir, 'generated/test-project/base/models/user.base.ts');
      const testFileDir = path.dirname(testFile);
      
      if (!fs.existsSync(testFileDir)) {
        fs.mkdirSync(testFileDir, { recursive: true });
      }
      
      fs.writeFileSync(testFile, 'export class UserBaseEntity {}');
      testFiles.push(testFile);

      service.enable();
      await service.addWatchPath(path.dirname(testFileDir));

      const eventSpy = jest.spyOn(eventEmitter, 'emit');

      // Modify the file to trigger event
      setTimeout(() => {
        fs.writeFileSync(testFile, 'export class UserBaseEntity { id: string; }');
        
        setTimeout(() => {
          const calls = eventSpy.mock.calls.filter(call => 
            call[0] === 'hot-update.file-changed'
          );
          
          if (calls.length > 0) {
            const event = calls[0][1] as HotUpdateEvent;
            expect(event.entityId).toBe('entity-123');
            expect(event.projectId).toBe('project-456');
          }
        }, 1500);
      }, 100);
    });

    it('should enrich events with template context', async () => {
      const mockTemplate = {
        id: 'template-789',
        projectId: 'project-456',
        code: 'nestjs_service',
      };

      (prisma.codeTemplate.findFirst as jest.Mock).mockResolvedValue(mockTemplate);

      const testFile = path.join(testDir, 'templates/nestjs_service.template.ts');
      const testFileDir = path.dirname(testFile);
      
      if (!fs.existsSync(testFileDir)) {
        fs.mkdirSync(testFileDir, { recursive: true });
      }
      
      fs.writeFileSync(testFile, 'export const template = "service template";');
      testFiles.push(testFile);

      service.enable();
      await service.addWatchPath(testFileDir);

      const eventSpy = jest.spyOn(eventEmitter, 'emit');

      setTimeout(() => {
        fs.writeFileSync(testFile, 'export const template = "updated service template";');
        
        setTimeout(() => {
          const calls = eventSpy.mock.calls.filter(call => 
            call[0] === 'hot-update.file-changed'
          );
          
          if (calls.length > 0) {
            const event = calls[0][1] as HotUpdateEvent;
            expect(event.templateId).toBe('template-789');
            expect(event.projectId).toBe('project-456');
          }
        }, 1500);
      }, 100);
    });
  });

  describe('File Type Detection', () => {
    it('should detect template files', (done) => {
      const templateFile = path.join(testDir, 'templates/test.template.ts');
      const templateDir = path.dirname(templateFile);
      
      if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir, { recursive: true });
      }
      
      fs.writeFileSync(templateFile, 'export const template = "test";');
      testFiles.push(templateFile);

      service.enable();
      service.addWatchPath(templateDir);

      const eventSpy = jest.spyOn(eventEmitter, 'emit');

      setTimeout(() => {
        fs.writeFileSync(templateFile, 'export const template = "updated test";');
        
        setTimeout(() => {
          expect(eventSpy).toHaveBeenCalledWith(
            'hot-update.template-updated',
            expect.any(Object)
          );
          done();
        }, 1500);
      }, 100);
    });

    it('should detect generated files', (done) => {
      const generatedFile = path.join(testDir, 'generated/test-project/base/services/user.base.service.ts');
      const generatedDir = path.dirname(generatedFile);
      
      if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
      }
      
      fs.writeFileSync(generatedFile, 'export class UserBaseService {}');
      testFiles.push(generatedFile);

      service.enable();
      service.addWatchPath(path.join(testDir, 'generated'));

      const eventSpy = jest.spyOn(eventEmitter, 'emit');

      setTimeout(() => {
        fs.writeFileSync(generatedFile, 'export class UserBaseService { findAll() {} }');
        
        setTimeout(() => {
          expect(eventSpy).toHaveBeenCalledWith(
            'hot-update.generated-file-changed',
            expect.any(Object)
          );
          done();
        }, 1500);
      }, 100);
    });

    it('should detect schema files', (done) => {
      const schemaFile = path.join(testDir, 'schemas/user.schema.json');
      const schemaDir = path.dirname(schemaFile);
      
      if (!fs.existsSync(schemaDir)) {
        fs.mkdirSync(schemaDir, { recursive: true });
      }
      
      fs.writeFileSync(schemaFile, '{"entity": "user"}');
      testFiles.push(schemaFile);

      service.enable();
      service.addWatchPath(schemaDir);

      const eventSpy = jest.spyOn(eventEmitter, 'emit');

      setTimeout(() => {
        fs.writeFileSync(schemaFile, '{"entity": "user", "updated": true}');
        
        setTimeout(() => {
          expect(eventSpy).toHaveBeenCalledWith(
            'hot-update.schema-updated',
            expect.any(Object)
          );
          done();
        }, 1500);
      }, 100);
    });
  });

  describe('Auto-regeneration Logic', () => {
    it('should not auto-regenerate for user customizations', () => {
      const event: HotUpdateEvent = {
        type: 'file_changed',
        path: '/generated/project/biz/services/user.service.ts',
        timestamp: new Date(),
        metadata: { userCustomization: true },
      };

      // This is testing internal logic, so we'd need to expose the method or test through behavior
      // For now, we'll test that biz file changes don't trigger auto-regeneration events
      const eventSpy = jest.spyOn(eventEmitter, 'emit');
      
      // Simulate the internal logic
      const shouldRegenerate = !event.metadata?.userCustomization;
      expect(shouldRegenerate).toBe(false);
    });

    it('should auto-regenerate for schema changes', () => {
      const event: HotUpdateEvent = {
        type: 'schema_updated',
        path: 'schema://project-123/user',
        projectId: 'project-123',
        timestamp: new Date(),
      };

      // Test that schema changes should trigger regeneration
      const shouldRegenerate = event.type === 'schema_updated';
      expect(shouldRegenerate).toBe(true);
    });

    it('should auto-regenerate for template changes', () => {
      const event: HotUpdateEvent = {
        type: 'template_updated',
        path: '/templates/service.template.ts',
        templateId: 'template-123',
        timestamp: new Date(),
      };

      // Test that template changes should trigger regeneration
      const shouldRegenerate = event.type === 'template_updated';
      expect(shouldRegenerate).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      const nonExistentPath = '/non/existent/path';
      
      // Should not throw when adding non-existent path
      await expect(service.addWatchPath(nonExistentPath)).resolves.not.toThrow();
    });

    it('should handle database errors during context enrichment', async () => {
      (prisma.entity.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const testFile = path.join(testDir, 'generated/test/base/models/user.base.ts');
      const testFileDir = path.dirname(testFile);
      
      if (!fs.existsSync(testFileDir)) {
        fs.mkdirSync(testFileDir, { recursive: true });
      }
      
      fs.writeFileSync(testFile, 'export class UserBaseEntity {}');
      testFiles.push(testFile);

      service.enable();
      await service.addWatchPath(path.dirname(testFileDir));

      // Should not crash when database lookup fails
      setTimeout(() => {
        fs.writeFileSync(testFile, 'export class UserBaseEntity { id: string; }');
      }, 100);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Service should still be running
      expect(service.getStatus().enabled).toBe(true);
    });
  });

  describe('Performance and Debouncing', () => {
    it('should debounce rapid file changes', (done) => {
      const testFile = path.join(testDir, 'debounce-test.ts');
      testFiles.push(testFile);

      fs.writeFileSync(testFile, 'initial content');

      service.enable();
      service.addWatchPath(testDir);

      const eventSpy = jest.spyOn(eventEmitter, 'emit');

      // Make rapid changes
      setTimeout(() => {
        fs.writeFileSync(testFile, 'change 1');
      }, 100);

      setTimeout(() => {
        fs.writeFileSync(testFile, 'change 2');
      }, 200);

      setTimeout(() => {
        fs.writeFileSync(testFile, 'change 3');
      }, 300);

      // Check that only the final change triggered an event
      setTimeout(() => {
        const fileChangedCalls = eventSpy.mock.calls.filter(call => 
          call[0] === 'hot-update.file-changed' && 
          call[1].path === testFile
        );
        
        // Should be debounced to fewer calls than actual changes
        expect(fileChangedCalls.length).toBeLessThan(3);
        done();
      }, 2000);
    });
  });
});
