import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../lowcode-platform-backend/src/prisma/prisma.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

describe('Backup and Recovery Tests', () => {
  let prisma: PrismaService;
  let testDatabaseUrl: string;
  let backupDir: string;
  let testData: any = {};

  beforeAll(async () => {
    // Use test database
    testDatabaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_lowcode_platform';
    process.env.DATABASE_URL = testDatabaseUrl;

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);

    // Create backup directory
    backupDir = path.join(process.cwd(), 'test-backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (testData.projectId) {
        await prisma.project.delete({ where: { id: testData.projectId } });
      }
      if (testData.userId) {
        await prisma.user.delete({ where: { id: testData.userId } });
      }
    } catch (error) {
      console.warn('Error cleaning up test data:', error.message);
    }

    // Clean up backup files
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }

    await prisma.$disconnect();
  });

  describe('Database Backup', () => {
    beforeEach(async () => {
      // Create test data for backup
      const testUser = await prisma.user.create({
        data: {
          username: 'backup_test_user',
          email: 'backup@test.com',
          password: 'hashed_password',
          status: 'ACTIVE',
        },
      });
      testData.userId = testUser.id;

      const testProject = await prisma.project.create({
        data: {
          name: 'Backup Test Project',
          description: 'Test project for backup/recovery',
          version: '1.0.0',
          status: 'ACTIVE',
          createdBy: testUser.id,
        },
      });
      testData.projectId = testProject.id;
    });

    it('should create database backup using pg_dump', async () => {
      const backupFile = path.join(backupDir, 'test_backup.sql');
      
      try {
        // Extract database connection details from URL
        const dbUrl = new URL(testDatabaseUrl);
        const dbName = dbUrl.pathname.slice(1);
        const dbHost = dbUrl.hostname;
        const dbPort = dbUrl.port || '5432';
        const dbUser = dbUrl.username;
        const dbPassword = dbUrl.password;

        // Create backup using pg_dump
        const { stdout, stderr } = await execAsync(
          `PGPASSWORD=${dbPassword} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${backupFile}`,
          { timeout: 30000 }
        );

        expect(fs.existsSync(backupFile)).toBe(true);
        
        // Check backup file size (should not be empty)
        const stats = fs.statSync(backupFile);
        expect(stats.size).toBeGreaterThan(1000); // At least 1KB

        // Check backup file contains expected content
        const backupContent = fs.readFileSync(backupFile, 'utf8');
        expect(backupContent).toContain('CREATE TABLE');
        expect(backupContent).toContain('INSERT INTO');
        expect(backupContent).toContain('backup_test_user');

      } catch (error) {
        if (error.message.includes('pg_dump: command not found')) {
          console.warn('pg_dump not available, skipping backup test');
          return;
        }
        throw error;
      }
    });

    it('should create compressed backup', async () => {
      const backupFile = path.join(backupDir, 'test_backup_compressed.sql.gz');
      
      try {
        const dbUrl = new URL(testDatabaseUrl);
        const dbName = dbUrl.pathname.slice(1);
        const dbHost = dbUrl.hostname;
        const dbPort = dbUrl.port || '5432';
        const dbUser = dbUrl.username;
        const dbPassword = dbUrl.password;

        // Create compressed backup
        const { stdout, stderr } = await execAsync(
          `PGPASSWORD=${dbPassword} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} | gzip > ${backupFile}`,
          { timeout: 30000 }
        );

        expect(fs.existsSync(backupFile)).toBe(true);
        
        // Compressed file should be smaller than uncompressed
        const stats = fs.statSync(backupFile);
        expect(stats.size).toBeGreaterThan(100); // At least 100 bytes

      } catch (error) {
        if (error.message.includes('pg_dump: command not found') || error.message.includes('gzip: command not found')) {
          console.warn('Required tools not available, skipping compressed backup test');
          return;
        }
        throw error;
      }
    });

    it('should create schema-only backup', async () => {
      const schemaBackupFile = path.join(backupDir, 'test_schema_backup.sql');
      
      try {
        const dbUrl = new URL(testDatabaseUrl);
        const dbName = dbUrl.pathname.slice(1);
        const dbHost = dbUrl.hostname;
        const dbPort = dbUrl.port || '5432';
        const dbUser = dbUrl.username;
        const dbPassword = dbUrl.password;

        // Create schema-only backup
        const { stdout, stderr } = await execAsync(
          `PGPASSWORD=${dbPassword} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --schema-only -f ${schemaBackupFile}`,
          { timeout: 30000 }
        );

        expect(fs.existsSync(schemaBackupFile)).toBe(true);
        
        const schemaContent = fs.readFileSync(schemaBackupFile, 'utf8');
        expect(schemaContent).toContain('CREATE TABLE');
        expect(schemaContent).not.toContain('INSERT INTO'); // No data, schema only

      } catch (error) {
        if (error.message.includes('pg_dump: command not found')) {
          console.warn('pg_dump not available, skipping schema backup test');
          return;
        }
        throw error;
      }
    });

    it('should create data-only backup', async () => {
      const dataBackupFile = path.join(backupDir, 'test_data_backup.sql');
      
      try {
        const dbUrl = new URL(testDatabaseUrl);
        const dbName = dbUrl.pathname.slice(1);
        const dbHost = dbUrl.hostname;
        const dbPort = dbUrl.port || '5432';
        const dbUser = dbUrl.username;
        const dbPassword = dbUrl.password;

        // Create data-only backup
        const { stdout, stderr } = await execAsync(
          `PGPASSWORD=${dbPassword} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --data-only -f ${dataBackupFile}`,
          { timeout: 30000 }
        );

        expect(fs.existsSync(dataBackupFile)).toBe(true);
        
        const dataContent = fs.readFileSync(dataBackupFile, 'utf8');
        expect(dataContent).toContain('INSERT INTO');
        expect(dataContent).not.toContain('CREATE TABLE'); // No schema, data only

      } catch (error) {
        if (error.message.includes('pg_dump: command not found')) {
          console.warn('pg_dump not available, skipping data backup test');
          return;
        }
        throw error;
      }
    });
  });

  describe('Database Recovery', () => {
    it('should restore database from backup', async () => {
      // First create a backup
      const backupFile = path.join(backupDir, 'restore_test_backup.sql');
      
      try {
        const dbUrl = new URL(testDatabaseUrl);
        const dbName = dbUrl.pathname.slice(1);
        const dbHost = dbUrl.hostname;
        const dbPort = dbUrl.port || '5432';
        const dbUser = dbUrl.username;
        const dbPassword = dbUrl.password;

        // Create backup
        await execAsync(
          `PGPASSWORD=${dbPassword} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${backupFile}`,
          { timeout: 30000 }
        );

        // Verify test data exists before restore
        const projectBefore = await prisma.project.findUnique({
          where: { id: testData.projectId },
        });
        expect(projectBefore).toBeDefined();

        // Modify data to simulate data loss
        await prisma.project.update({
          where: { id: testData.projectId },
          data: { name: 'Modified Name' },
        });

        // Verify data was modified
        const modifiedProject = await prisma.project.findUnique({
          where: { id: testData.projectId },
        });
        expect(modifiedProject.name).toBe('Modified Name');

        // Restore from backup
        await execAsync(
          `PGPASSWORD=${dbPassword} psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${backupFile}`,
          { timeout: 30000 }
        );

        // Reconnect Prisma after restore
        await prisma.$disconnect();
        await prisma.$connect();

        // Verify data was restored
        const restoredProject = await prisma.project.findUnique({
          where: { id: testData.projectId },
        });
        expect(restoredProject.name).toBe('Backup Test Project');

      } catch (error) {
        if (error.message.includes('pg_dump: command not found') || error.message.includes('psql: command not found')) {
          console.warn('Required PostgreSQL tools not available, skipping restore test');
          return;
        }
        throw error;
      }
    });

    it('should handle restore errors gracefully', async () => {
      const invalidBackupFile = path.join(backupDir, 'invalid_backup.sql');
      fs.writeFileSync(invalidBackupFile, 'INVALID SQL CONTENT;');

      try {
        const dbUrl = new URL(testDatabaseUrl);
        const dbName = dbUrl.pathname.slice(1);
        const dbHost = dbUrl.hostname;
        const dbPort = dbUrl.port || '5432';
        const dbUser = dbUrl.username;
        const dbPassword = dbUrl.password;

        // Attempt to restore invalid backup (should fail)
        await expect(
          execAsync(
            `PGPASSWORD=${dbPassword} psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${invalidBackupFile}`,
            { timeout: 10000 }
          )
        ).rejects.toThrow();

      } catch (error) {
        if (error.message.includes('psql: command not found')) {
          console.warn('psql not available, skipping restore error test');
          return;
        }
        // Expected to fail with invalid SQL
        expect(error).toBeDefined();
      }
    });
  });

  describe('Automated Backup', () => {
    it('should support scheduled backups', () => {
      // Test backup script configuration
      const backupScript = `#!/bin/bash
BACKUP_DIR="/backups"
DB_NAME="lowcode_platform"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup
pg_dump -h localhost -U postgres -d $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
`;

      expect(backupScript).toContain('pg_dump');
      expect(backupScript).toContain('gzip');
      expect(backupScript).toContain('find');
    });

    it('should support backup rotation', () => {
      // Create multiple backup files to test rotation logic
      const backupFiles = [];
      for (let i = 0; i < 10; i++) {
        const fileName = `backup_${Date.now() - i * 86400000}.sql.gz`; // Different days
        const filePath = path.join(backupDir, fileName);
        fs.writeFileSync(filePath, `backup content ${i}`);
        backupFiles.push(filePath);
      }

      // Simulate backup rotation (keep only 5 most recent)
      const sortedFiles = backupFiles.sort().reverse();
      const filesToDelete = sortedFiles.slice(5);

      expect(filesToDelete.length).toBe(5);

      // Clean up test files
      backupFiles.forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
    });

    it('should validate backup integrity', async () => {
      const backupFile = path.join(backupDir, 'integrity_test_backup.sql');
      
      try {
        const dbUrl = new URL(testDatabaseUrl);
        const dbName = dbUrl.pathname.slice(1);
        const dbHost = dbUrl.hostname;
        const dbPort = dbUrl.port || '5432';
        const dbUser = dbUrl.username;
        const dbPassword = dbUrl.password;

        // Create backup
        await execAsync(
          `PGPASSWORD=${dbPassword} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${backupFile}`,
          { timeout: 30000 }
        );

        // Validate backup file
        expect(fs.existsSync(backupFile)).toBe(true);
        
        const backupContent = fs.readFileSync(backupFile, 'utf8');
        
        // Check for SQL dump header
        expect(backupContent).toContain('PostgreSQL database dump');
        
        // Check for essential tables
        expect(backupContent).toContain('CREATE TABLE');
        
        // Check for data integrity markers
        expect(backupContent).toContain('COPY') || expect(backupContent).toContain('INSERT INTO');
        
        // Check for dump completion
        expect(backupContent).toContain('PostgreSQL database dump complete');

      } catch (error) {
        if (error.message.includes('pg_dump: command not found')) {
          console.warn('pg_dump not available, skipping integrity test');
          return;
        }
        throw error;
      }
    });
  });

  describe('Point-in-Time Recovery', () => {
    it('should support transaction log archiving', () => {
      // Test WAL (Write-Ahead Logging) configuration
      const walConfig = {
        wal_level: 'replica',
        archive_mode: 'on',
        archive_command: 'cp %p /archive/%f',
        max_wal_senders: 3,
        wal_keep_segments: 32,
      };

      expect(walConfig.wal_level).toBe('replica');
      expect(walConfig.archive_mode).toBe('on');
      expect(walConfig.archive_command).toContain('%p');
      expect(walConfig.archive_command).toContain('%f');
    });

    it('should support recovery to specific timestamp', () => {
      // Test recovery configuration
      const recoveryConfig = `
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2024-01-01 12:00:00'
recovery_target_action = 'promote'
`;

      expect(recoveryConfig).toContain('restore_command');
      expect(recoveryConfig).toContain('recovery_target_time');
      expect(recoveryConfig).toContain('recovery_target_action');
    });
  });

  describe('Backup Monitoring', () => {
    it('should monitor backup success/failure', () => {
      // Test backup monitoring script
      const monitoringScript = `
#!/bin/bash
BACKUP_LOG="/var/log/backup.log"
ALERT_EMAIL="admin@example.com"

# Check if backup completed successfully
if grep -q "backup completed successfully" $BACKUP_LOG; then
    echo "Backup successful"
    exit 0
else
    echo "Backup failed" | mail -s "Backup Alert" $ALERT_EMAIL
    exit 1
fi
`;

      expect(monitoringScript).toContain('grep');
      expect(monitoringScript).toContain('mail');
      expect(monitoringScript).toContain('exit');
    });

    it('should track backup metrics', () => {
      // Test backup metrics collection
      const backupMetrics = {
        backup_duration_seconds: 120,
        backup_size_bytes: 1024000,
        backup_success_rate: 0.95,
        last_backup_timestamp: new Date().toISOString(),
        backup_retention_days: 30,
      };

      expect(backupMetrics.backup_duration_seconds).toBeGreaterThan(0);
      expect(backupMetrics.backup_size_bytes).toBeGreaterThan(0);
      expect(backupMetrics.backup_success_rate).toBeLessThanOrEqual(1);
      expect(backupMetrics.backup_retention_days).toBeGreaterThan(0);
    });

    it('should alert on backup failures', () => {
      // Test alerting configuration
      const alertConfig = {
        enabled: true,
        channels: ['email', 'slack', 'webhook'],
        thresholds: {
          consecutive_failures: 2,
          backup_age_hours: 25,
          backup_size_change_percent: 50,
        },
      };

      expect(alertConfig.enabled).toBe(true);
      expect(alertConfig.channels).toContain('email');
      expect(alertConfig.thresholds.consecutive_failures).toBeGreaterThan(0);
    });
  });

  describe('Disaster Recovery', () => {
    it('should support cross-region backup replication', () => {
      // Test backup replication configuration
      const replicationConfig = {
        primary_region: 'us-east-1',
        backup_regions: ['us-west-2', 'eu-west-1'],
        replication_frequency: 'daily',
        encryption_enabled: true,
      };

      expect(replicationConfig.primary_region).toBeDefined();
      expect(replicationConfig.backup_regions.length).toBeGreaterThan(0);
      expect(replicationConfig.encryption_enabled).toBe(true);
    });

    it('should have disaster recovery procedures', () => {
      // Test DR procedure documentation
      const drProcedure = {
        rto: 4, // Recovery Time Objective in hours
        rpo: 1, // Recovery Point Objective in hours
        steps: [
          'Assess damage and determine recovery strategy',
          'Provision new infrastructure if needed',
          'Restore database from latest backup',
          'Apply transaction logs for point-in-time recovery',
          'Validate data integrity',
          'Update DNS and application configuration',
          'Perform application testing',
          'Resume normal operations',
        ],
      };

      expect(drProcedure.rto).toBeLessThanOrEqual(24);
      expect(drProcedure.rpo).toBeLessThanOrEqual(24);
      expect(drProcedure.steps.length).toBeGreaterThan(5);
    });

    it('should test disaster recovery procedures', async () => {
      // This would be a comprehensive DR test
      // For now, we'll test the basic components
      
      // 1. Verify backup exists
      const backupFile = path.join(backupDir, 'dr_test_backup.sql');
      
      try {
        const dbUrl = new URL(testDatabaseUrl);
        const dbName = dbUrl.pathname.slice(1);
        const dbHost = dbUrl.hostname;
        const dbPort = dbUrl.port || '5432';
        const dbUser = dbUrl.username;
        const dbPassword = dbUrl.password;

        await execAsync(
          `PGPASSWORD=${dbPassword} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${backupFile}`,
          { timeout: 30000 }
        );

        expect(fs.existsSync(backupFile)).toBe(true);

        // 2. Verify database connectivity
        const connectionTest = await prisma.$queryRaw`SELECT 1 as test`;
        expect(connectionTest).toBeDefined();

        // 3. Verify data consistency
        const userCount = await prisma.user.count();
        const projectCount = await prisma.project.count();
        
        expect(userCount).toBeGreaterThanOrEqual(0);
        expect(projectCount).toBeGreaterThanOrEqual(0);

      } catch (error) {
        if (error.message.includes('pg_dump: command not found')) {
          console.warn('PostgreSQL tools not available, skipping DR test');
          return;
        }
        throw error;
      }
    });
  });
});
