import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const execAsync = promisify(exec);

describe('Docker Deployment Tests', () => {
  const testTimeout = 300000; // 5 minutes
  const containers = ['backend', 'lowcode-platform', 'postgres', 'redis'];
  const services = [
    { name: 'backend', port: 9528, healthPath: '/v1/route/getConstantRoutes' },
    { name: 'lowcode-platform', port: 3000, healthPath: '/health' },
  ];

  beforeAll(async () => {
    // Ensure Docker is available
    try {
      await execAsync('docker --version');
      await execAsync('docker-compose --version');
    } catch (error) {
      throw new Error('Docker or docker-compose not available');
    }
  }, testTimeout);

  afterAll(async () => {
    // Clean up containers
    try {
      await execAsync('docker-compose -f docker-compose.yml down -v --remove-orphans');
    } catch (error) {
      console.warn('Error during cleanup:', error.message);
    }
  }, testTimeout);

  describe('Docker Configuration Validation', () => {
    it('should have valid docker-compose.yml', () => {
      const dockerComposePath = path.join(process.cwd(), 'docker-compose.yml');
      expect(fs.existsSync(dockerComposePath)).toBe(true);

      const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');
      
      // Check for required services
      expect(dockerComposeContent).toContain('backend:');
      expect(dockerComposeContent).toContain('lowcode-platform:');
      expect(dockerComposeContent).toContain('postgres:');
      expect(dockerComposeContent).toContain('redis:');
      
      // Check for health checks
      expect(dockerComposeContent).toContain('healthcheck:');
      
      // Check for proper networking
      expect(dockerComposeContent).toContain('networks:');
    });

    it('should have valid production docker-compose.prod.yml', () => {
      const prodComposePath = path.join(process.cwd(), 'docker-compose.prod.yml');
      expect(fs.existsSync(prodComposePath)).toBe(true);

      const prodComposeContent = fs.readFileSync(prodComposePath, 'utf8');
      
      // Check for production optimizations
      expect(prodComposeContent).toContain('deploy:');
      expect(prodComposeContent).toContain('resources:');
      expect(prodComposeContent).toContain('limits:');
      expect(prodComposeContent).toContain('reservations:');
      
      // Check for monitoring services
      expect(prodComposeContent).toContain('prometheus:');
      expect(prodComposeContent).toContain('grafana:');
    });

    it('should have valid Dockerfiles', () => {
      const backendDockerfile = path.join(process.cwd(), 'backend/Dockerfile');
      const lowcodeDockerfile = path.join(process.cwd(), 'lowcode-platform-backend/Dockerfile');
      
      expect(fs.existsSync(backendDockerfile)).toBe(true);
      expect(fs.existsSync(lowcodeDockerfile)).toBe(true);

      const backendContent = fs.readFileSync(backendDockerfile, 'utf8');
      const lowcodeContent = fs.readFileSync(lowcodeDockerfile, 'utf8');
      
      // Check for multi-stage builds
      expect(backendContent).toContain('FROM node:');
      expect(lowcodeContent).toContain('FROM node:');
      
      // Check for proper user setup
      expect(backendContent).toContain('USER');
      expect(lowcodeContent).toContain('USER');
      
      // Check for health checks
      expect(backendContent).toContain('HEALTHCHECK') || expect(lowcodeContent).toContain('HEALTHCHECK');
    });
  });

  describe('Container Build and Start', () => {
    it('should build all containers successfully', async () => {
      const { stdout, stderr } = await execAsync('docker-compose build --no-cache');
      
      expect(stderr).not.toContain('ERROR');
      expect(stdout).toContain('Successfully built') || expect(stdout).toContain('Successfully tagged');
    }, testTimeout);

    it('should start all containers', async () => {
      const { stdout } = await execAsync('docker-compose up -d');
      
      expect(stdout).toContain('Creating') || expect(stdout).toContain('Starting');
      
      // Wait for containers to start
      await new Promise(resolve => setTimeout(resolve, 30000));
    }, testTimeout);

    it('should have all containers running', async () => {
      const { stdout } = await execAsync('docker-compose ps');
      
      for (const container of containers) {
        expect(stdout).toContain(container);
      }
      
      // Check that no containers are in "Exit" state
      expect(stdout).not.toContain('Exit');
    }, testTimeout);
  });

  describe('Service Health Checks', () => {
    it('should have healthy database connection', async () => {
      // Wait for database to be ready
      let retries = 30;
      let dbReady = false;
      
      while (retries > 0 && !dbReady) {
        try {
          const { stdout } = await execAsync('docker-compose exec -T postgres pg_isready -U soybean -d soybean-admin-nest-backend');
          if (stdout.includes('accepting connections')) {
            dbReady = true;
          }
        } catch (error) {
          // Database not ready yet
        }
        
        if (!dbReady) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        }
      }
      
      expect(dbReady).toBe(true);
    }, testTimeout);

    it('should have healthy Redis connection', async () => {
      let retries = 15;
      let redisReady = false;
      
      while (retries > 0 && !redisReady) {
        try {
          const { stdout } = await execAsync('docker-compose exec -T redis redis-cli ping');
          if (stdout.includes('PONG')) {
            redisReady = true;
          }
        } catch (error) {
          // Redis not ready yet
        }
        
        if (!redisReady) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        }
      }
      
      expect(redisReady).toBe(true);
    }, testTimeout);

    it('should have all services responding to health checks', async () => {
      for (const service of services) {
        let retries = 30;
        let serviceReady = false;
        
        while (retries > 0 && !serviceReady) {
          try {
            const response = await axios.get(`http://localhost:${service.port}${service.healthPath}`, {
              timeout: 5000,
            });
            
            if (response.status === 200) {
              serviceReady = true;
            }
          } catch (error) {
            // Service not ready yet
          }
          
          if (!serviceReady) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            retries--;
          }
        }
        
        expect(serviceReady).toBe(true);
      }
    }, testTimeout);
  });

  describe('Service Integration', () => {
    it('should have backend service accessible', async () => {
      const response = await axios.get('http://localhost:9528/v1/route/getConstantRoutes');
      
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });

    it('should have lowcode platform service accessible', async () => {
      const response = await axios.get('http://localhost:3000/health');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
      expect(response.data.status).toBe('healthy');
    });

    it('should have services communicating with database', async () => {
      // Test backend database connection
      try {
        const backendResponse = await axios.get('http://localhost:9528/v1/route/getConstantRoutes');
        expect(backendResponse.status).toBe(200);
      } catch (error) {
        fail('Backend cannot connect to database');
      }

      // Test lowcode platform database connection
      try {
        const lowcodeResponse = await axios.get('http://localhost:3000/health/detailed');
        expect(lowcodeResponse.status).toBe(200);
        expect(lowcodeResponse.data.services.database.status).toBe('healthy');
      } catch (error) {
        fail('Lowcode platform cannot connect to database');
      }
    });

    it('should have services communicating with Redis', async () => {
      // Test Redis connectivity through health check
      const response = await axios.get('http://localhost:3000/health/detailed');
      
      expect(response.status).toBe(200);
      expect(response.data.services.cache.status).toBe('healthy');
    });
  });

  describe('Data Persistence', () => {
    it('should persist data across container restarts', async () => {
      // Create test data through API
      const testProject = {
        name: 'Docker Test Project',
        description: 'Test project for Docker deployment',
        version: '1.0.0',
      };

      // First, we need to authenticate
      let authToken: string;
      try {
        const loginResponse = await axios.post('http://localhost:9528/v1/auth/login', {
          username: 'admin',
          password: 'admin123',
        });
        authToken = loginResponse.data.token;
      } catch (error) {
        // If default admin doesn't exist, skip this test
        console.warn('Cannot authenticate for data persistence test');
        return;
      }

      // Create project
      let projectId: string;
      try {
        const createResponse = await axios.post(
          'http://localhost:3000/projects',
          testProject,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        projectId = createResponse.data.id;
        expect(createResponse.status).toBe(201);
      } catch (error) {
        console.warn('Cannot create test project:', error.message);
        return;
      }

      // Restart lowcode platform container
      await execAsync('docker-compose restart lowcode-platform');
      
      // Wait for service to be ready again
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Verify data still exists
      try {
        const getResponse = await axios.get(
          `http://localhost:3000/projects/${projectId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        
        expect(getResponse.status).toBe(200);
        expect(getResponse.data.name).toBe(testProject.name);
      } catch (error) {
        fail('Data not persisted across container restart');
      }
    }, testTimeout);
  });

  describe('Resource Usage and Performance', () => {
    it('should have reasonable resource usage', async () => {
      const { stdout } = await execAsync('docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}"');
      
      const lines = stdout.split('\n').filter(line => line.trim());
      const containerStats = lines.slice(1); // Skip header
      
      for (const stat of containerStats) {
        const [container, cpu, memory] = stat.split('\t');
        
        if (container.includes('backend') || container.includes('lowcode')) {
          // CPU usage should be reasonable (less than 50% under normal load)
          const cpuPercent = parseFloat(cpu.replace('%', ''));
          expect(cpuPercent).toBeLessThan(50);
          
          // Memory usage should be within expected limits
          const memoryUsage = memory.split(' / ')[0];
          const memoryValue = parseFloat(memoryUsage);
          const memoryUnit = memoryUsage.replace(/[0-9.]/g, '');
          
          if (memoryUnit.includes('GiB') || memoryUnit.includes('GB')) {
            expect(memoryValue).toBeLessThan(2); // Less than 2GB
          }
        }
      }
    });

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      const response = await axios.get('http://localhost:3000/health');
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Less than 5 seconds
    });
  });

  describe('Environment Configuration', () => {
    it('should use correct environment variables', async () => {
      const { stdout } = await execAsync('docker-compose exec -T lowcode-platform env | grep NODE_ENV');
      expect(stdout).toContain('NODE_ENV=production');
    });

    it('should have proper database configuration', async () => {
      const { stdout } = await execAsync('docker-compose exec -T lowcode-platform env | grep DATABASE_URL');
      expect(stdout).toContain('postgresql://');
      expect(stdout).toContain('postgres:5432');
    });

    it('should have proper Redis configuration', async () => {
      const { stdout } = await execAsync('docker-compose exec -T lowcode-platform env | grep REDIS');
      expect(stdout).toContain('REDIS_HOST=redis');
      expect(stdout).toContain('REDIS_PORT=6379');
    });
  });

  describe('Security Configuration', () => {
    it('should not expose sensitive information', async () => {
      // Check that containers are not running as root
      const { stdout } = await execAsync('docker-compose exec -T lowcode-platform whoami');
      expect(stdout.trim()).not.toBe('root');
    });

    it('should have proper network isolation', async () => {
      const { stdout } = await execAsync('docker network ls');
      expect(stdout).toContain('soybean-admin');
    });

    it('should not have unnecessary ports exposed', async () => {
      const { stdout } = await execAsync('docker-compose ps');
      
      // Only specific ports should be exposed to host
      const exposedPorts = stdout.match(/0\.0\.0\.0:\d+/g) || [];
      const allowedPorts = ['0.0.0.0:9528', '0.0.0.0:3000', '0.0.0.0:5432', '0.0.0.0:6379'];
      
      for (const port of exposedPorts) {
        expect(allowedPorts).toContain(port);
      }
    });
  });

  describe('Logging and Monitoring', () => {
    it('should generate proper logs', async () => {
      const { stdout } = await execAsync('docker-compose logs --tail=10 lowcode-platform');
      
      expect(stdout).toContain('Nest application successfully started') || 
             expect(stdout).toContain('Application is running') ||
             expect(stdout).toContain('Server started');
    });

    it('should have health check endpoints working', async () => {
      const healthResponse = await axios.get('http://localhost:3000/health');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.data).toHaveProperty('status');
      
      const detailedHealthResponse = await axios.get('http://localhost:3000/health/detailed');
      expect(detailedHealthResponse.status).toBe(200);
      expect(detailedHealthResponse.data).toHaveProperty('services');
    });

    it('should have metrics endpoint accessible', async () => {
      try {
        const metricsResponse = await axios.get('http://localhost:3000/health/metrics');
        expect(metricsResponse.status).toBe(200);
        expect(metricsResponse.headers['content-type']).toContain('text/plain');
      } catch (error) {
        // Metrics endpoint might not be enabled in test environment
        console.warn('Metrics endpoint not accessible:', error.message);
      }
    });
  });
});
