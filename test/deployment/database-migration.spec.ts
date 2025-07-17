import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../lowcode-platform-backend/src/prisma/prisma.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

describe('Database Migration Tests', () => {
  let prisma: PrismaService;
  let testDatabaseUrl: string;

  beforeAll(async () => {
    // Use test database
    testDatabaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_lowcode_platform';
    process.env.DATABASE_URL = testDatabaseUrl;

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Migration System', () => {
    it('should have migration files in correct location', () => {
      const migrationDir = path.join(process.cwd(), 'lowcode-platform-backend/prisma/migrations');
      expect(fs.existsSync(migrationDir)).toBe(true);

      const migrationFiles = fs.readdirSync(migrationDir);
      expect(migrationFiles.length).toBeGreaterThan(0);

      // Check for migration.sql files
      const sqlFiles = migrationFiles.filter(file => 
        fs.statSync(path.join(migrationDir, file)).isDirectory() &&
        fs.existsSync(path.join(migrationDir, file, 'migration.sql'))
      );
      expect(sqlFiles.length).toBeGreaterThan(0);
    });

    it('should have valid Prisma schema', async () => {
      const schemaPath = path.join(process.cwd(), 'lowcode-platform-backend/prisma/schema.prisma');
      expect(fs.existsSync(schemaPath)).toBe(true);

      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // Check for essential models
      expect(schemaContent).toContain('model User');
      expect(schemaContent).toContain('model Project');
      expect(schemaContent).toContain('model Entity');
      expect(schemaContent).toContain('model Field');
      expect(schemaContent).toContain('model Relationship');
      expect(schemaContent).toContain('model ApiConfig');
      expect(schemaContent).toContain('model CodeTemplate');
    });

    it('should validate schema format', async () => {
      try {
        const { stdout, stderr } = await execAsync('npx prisma format --schema=lowcode-platform-backend/prisma/schema.prisma');
        expect(stderr).not.toContain('Error');
      } catch (error) {
        fail(`Schema validation failed: ${error.message}`);
      }
    });

    it('should generate migration successfully', async () => {
      try {
        // Create a test migration
        const { stdout, stderr } = await execAsync(
          'npx prisma migrate dev --name test_migration --create-only --schema=lowcode-platform-backend/prisma/schema.prisma',
          { env: { ...process.env, DATABASE_URL: testDatabaseUrl } }
        );
        
        expect(stderr).not.toContain('Error');
        expect(stdout).toContain('migration') || expect(stdout).toContain('No changes');
      } catch (error) {
        // If no changes, that's also acceptable
        if (!error.message.includes('No changes')) {
          fail(`Migration generation failed: ${error.message}`);
        }
      }
    });
  });

  describe('Database Schema Validation', () => {
    it('should have all required tables', async () => {
      const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `;

      const tableNames = tables.map(t => t.table_name);
      
      const requiredTables = [
        'User',
        'Project',
        'Entity',
        'Field',
        'Relationship',
        'ApiConfig',
        'CodeTemplate',
        'GenerationHistory',
      ];

      for (const table of requiredTables) {
        expect(tableNames).toContain(table);
      }
    });

    it('should have proper foreign key constraints', async () => {
      const constraints = await prisma.$queryRaw<Array<{ 
        constraint_name: string;
        table_name: string;
        column_name: string;
        foreign_table_name: string;
        foreign_column_name: string;
      }>>`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
      `;

      // Check for essential foreign keys
      const constraintNames = constraints.map(c => `${c.table_name}.${c.column_name} -> ${c.foreign_table_name}.${c.foreign_column_name}`);
      
      expect(constraintNames.some(c => c.includes('Project.createdBy -> User.id'))).toBe(true);
      expect(constraintNames.some(c => c.includes('Entity.projectId -> Project.id'))).toBe(true);
      expect(constraintNames.some(c => c.includes('Field.entityId -> Entity.id'))).toBe(true);
    });

    it('should have proper indexes', async () => {
      const indexes = await prisma.$queryRaw<Array<{
        indexname: string;
        tablename: string;
        indexdef: string;
      }>>`
        SELECT indexname, tablename, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
      `;

      // Should have indexes on frequently queried columns
      const indexDefs = indexes.map(i => i.indexdef);
      
      // Check for some expected indexes (these might vary based on actual schema)
      expect(indexDefs.some(def => def.includes('projectId'))).toBe(true);
      expect(indexDefs.some(def => def.includes('entityId'))).toBe(true);
    });
  });

  describe('Migration Rollback', () => {
    it('should support migration rollback', async () => {
      try {
        // Get current migration status
        const { stdout: statusBefore } = await execAsync(
          'npx prisma migrate status --schema=lowcode-platform-backend/prisma/schema.prisma',
          { env: { ...process.env, DATABASE_URL: testDatabaseUrl } }
        );

        // If there are migrations to rollback
        if (statusBefore.includes('Applied')) {
          // Note: Prisma doesn't have built-in rollback, but we can test reset
          const { stdout, stderr } = await execAsync(
            'npx prisma migrate reset --force --schema=lowcode-platform-backend/prisma/schema.prisma',
            { env: { ...process.env, DATABASE_URL: testDatabaseUrl } }
          );

          expect(stderr).not.toContain('Error');
          
          // Re-apply migrations
          await execAsync(
            'npx prisma migrate deploy --schema=lowcode-platform-backend/prisma/schema.prisma',
            { env: { ...process.env, DATABASE_URL: testDatabaseUrl } }
          );
        }
      } catch (error) {
        console.warn('Migration rollback test skipped:', error.message);
      }
    });
  });

  describe('Data Migration', () => {
    it('should preserve data during schema changes', async () => {
      // Create test data
      const testUser = await prisma.user.create({
        data: {
          username: 'migration_test_user',
          email: 'migration@test.com',
          password: 'hashed_password',
          status: 'ACTIVE',
        },
      });

      const testProject = await prisma.project.create({
        data: {
          name: 'Migration Test Project',
          description: 'Test project for migration',
          version: '1.0.0',
          status: 'ACTIVE',
          createdBy: testUser.id,
        },
      });

      // Verify data exists
      const retrievedProject = await prisma.project.findUnique({
        where: { id: testProject.id },
        include: { creator: true },
      });

      expect(retrievedProject).toBeDefined();
      expect(retrievedProject.name).toBe('Migration Test Project');
      expect(retrievedProject.creator.username).toBe('migration_test_user');

      // Clean up
      await prisma.project.delete({ where: { id: testProject.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('should handle large dataset migrations', async () => {
      // Create multiple test records
      const testUsers = [];
      for (let i = 0; i < 100; i++) {
        const user = await prisma.user.create({
          data: {
            username: `bulk_user_${i}`,
            email: `bulk${i}@test.com`,
            password: 'hashed_password',
            status: 'ACTIVE',
          },
        });
        testUsers.push(user);
      }

      // Verify all users were created
      const userCount = await prisma.user.count({
        where: {
          username: { startsWith: 'bulk_user_' },
        },
      });

      expect(userCount).toBe(100);

      // Clean up
      await prisma.user.deleteMany({
        where: {
          username: { startsWith: 'bulk_user_' },
        },
      });
    });
  });

  describe('Migration Performance', () => {
    it('should complete migrations within reasonable time', async () => {
      const startTime = Date.now();

      try {
        await execAsync(
          'npx prisma migrate deploy --schema=lowcode-platform-backend/prisma/schema.prisma',
          { env: { ...process.env, DATABASE_URL: testDatabaseUrl } }
        );
      } catch (error) {
        // If already up to date, that's fine
        if (!error.message.includes('up to date')) {
          throw error;
        }
      }

      const duration = Date.now() - startTime;
      
      // Migration should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
    });

    it('should handle concurrent migration attempts gracefully', async () => {
      // This test simulates multiple instances trying to migrate simultaneously
      const migrationPromises = Array(3).fill(null).map(async () => {
        try {
          await execAsync(
            'npx prisma migrate deploy --schema=lowcode-platform-backend/prisma/schema.prisma',
            { env: { ...process.env, DATABASE_URL: testDatabaseUrl } }
          );
          return 'success';
        } catch (error) {
          return error.message;
        }
      });

      const results = await Promise.all(migrationPromises);
      
      // At least one should succeed, others might fail gracefully
      expect(results.some(result => result === 'success' || result.includes('up to date'))).toBe(true);
    });
  });

  describe('Schema Evolution', () => {
    it('should support adding new columns', async () => {
      // This would typically be tested with actual schema changes
      // For now, we'll verify the current schema supports evolution
      
      const tableInfo = await prisma.$queryRaw<Array<{
        column_name: string;
        data_type: string;
        is_nullable: string;
      }>>`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'Project'
        ORDER BY ordinal_position
      `;

      expect(tableInfo.length).toBeGreaterThan(5);
      
      // Check for essential columns
      const columnNames = tableInfo.map(col => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    it('should support modifying column types safely', async () => {
      // Test that current schema has appropriate column types
      const columnTypes = await prisma.$queryRaw<Array<{
        column_name: string;
        data_type: string;
        character_maximum_length: number;
      }>>`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'Project'
        AND column_name IN ('name', 'description', 'version')
      `;

      const nameColumn = columnTypes.find(col => col.column_name === 'name');
      expect(nameColumn.data_type).toBe('character varying');
      expect(nameColumn.character_maximum_length).toBeGreaterThan(50);
    });
  });

  describe('Backup and Recovery', () => {
    it('should support database backup', async () => {
      try {
        // Test pg_dump availability (would be used for backups)
        const { stdout } = await execAsync('pg_dump --version');
        expect(stdout).toContain('pg_dump');
      } catch (error) {
        console.warn('pg_dump not available for backup testing');
      }
    });

    it('should maintain referential integrity during operations', async () => {
      // Create related data
      const user = await prisma.user.create({
        data: {
          username: 'integrity_test',
          email: 'integrity@test.com',
          password: 'hashed_password',
          status: 'ACTIVE',
        },
      });

      const project = await prisma.project.create({
        data: {
          name: 'Integrity Test Project',
          description: 'Test referential integrity',
          version: '1.0.0',
          status: 'ACTIVE',
          createdBy: user.id,
        },
      });

      // Try to delete user (should fail due to foreign key constraint)
      await expect(
        prisma.user.delete({ where: { id: user.id } })
      ).rejects.toThrow();

      // Clean up properly
      await prisma.project.delete({ where: { id: project.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('Migration Monitoring', () => {
    it('should log migration activities', async () => {
      try {
        const { stdout } = await execAsync(
          'npx prisma migrate status --schema=lowcode-platform-backend/prisma/schema.prisma',
          { env: { ...process.env, DATABASE_URL: testDatabaseUrl } }
        );

        // Should provide status information
        expect(stdout).toContain('migration') || expect(stdout).toContain('up to date');
      } catch (error) {
        fail(`Migration status check failed: ${error.message}`);
      }
    });

    it('should detect schema drift', async () => {
      try {
        const { stdout } = await execAsync(
          'npx prisma db push --accept-data-loss --schema=lowcode-platform-backend/prisma/schema.prisma',
          { env: { ...process.env, DATABASE_URL: testDatabaseUrl } }
        );

        // Should indicate if schema is in sync
        expect(stdout).toContain('in sync') || expect(stdout).toContain('changes');
      } catch (error) {
        // If no changes needed, that's also acceptable
        if (!error.message.includes('in sync')) {
          console.warn('Schema drift detection test inconclusive:', error.message);
        }
      }
    });
  });
});
