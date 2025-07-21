# Deployment Guide for Enhanced Code Generation System

## Overview

This guide covers deployment strategies for the enhanced code generation system, including Docker deployment, environment configuration, and production best practices.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- Docker & Docker Compose (for containerized deployment)
- Redis (for caching, optional but recommended)

## Environment Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/lowcode_platform
TEST_DATABASE_URL=postgresql://username:password@localhost:5432/lowcode_platform_test

# JWT Authentication
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Code Generation
TEMPLATE_CACHE_ENABLED=true
TEMPLATE_CACHE_TTL=1800
METADATA_CACHE_TTL=3600
METADATA_CACHE_MAX_SIZE=1000

# File System
GENERATED_FILES_PATH=/app/generated
TEMPLATE_FILES_PATH=/app/templates

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# CORS
CORS_ORIGIN=http://localhost:3001,https://yourdomain.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# Health Check
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_DATABASE=true
HEALTH_CHECK_REDIS=true
```

### Production Environment Variables

```bash
# Production specific
NODE_ENV=production
LOG_LEVEL=warn
DEBUG=false

# Security
HELMET_ENABLED=true
CORS_ORIGIN=https://yourdomain.com

# Performance
CLUSTER_MODE=true
CLUSTER_WORKERS=4

# Monitoring
METRICS_ENABLED=true
METRICS_PORT=9090
```

## Docker Deployment

### Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Create directories for generated files
RUN mkdir -p /app/generated /app/templates && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:13-alpine
    environment:
      POSTGRES_DB: lowcode_platform
      POSTGRES_USER: lowcode_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lowcode_user -d lowcode_platform"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Lowcode Platform Backend
  lowcode-backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://lowcode_user:${POSTGRES_PASSWORD}@postgres:5432/lowcode_platform
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
    volumes:
      - generated_files:/app/generated
      - template_files:/app/templates
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - lowcode-backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  generated_files:
  template_files:
```

### Nginx Configuration

```nginx
events {
    worker_connections 1024;
}

http {
    upstream lowcode_backend {
        server lowcode-backend:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://lowcode_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check
        location /health {
            proxy_pass http://lowcode_backend;
            access_log off;
        }

        # Static files (if any)
        location /static/ {
            alias /var/www/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## Database Setup

### Prisma Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

### Database Initialization Script

```sql
-- init-scripts/01-init.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_project_id ON entities(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fields_entity_id ON fields(entity_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_templates_project_id ON code_templates(project_id);

-- Create full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_search ON projects USING gin(to_tsvector('english', name || ' ' || description));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_search ON entities USING gin(to_tsvector('english', name || ' ' || description));
```

## Kubernetes Deployment

### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: lowcode-platform
```

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: lowcode-config
  namespace: lowcode-platform
data:
  NODE_ENV: "production"
  API_PREFIX: "api/v1"
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
  TEMPLATE_CACHE_ENABLED: "true"
  TEMPLATE_CACHE_TTL: "1800"
  METADATA_CACHE_TTL: "3600"
  HEALTH_CHECK_ENABLED: "true"
```

### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: lowcode-secrets
  namespace: lowcode-platform
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  JWT_SECRET: <base64-encoded-jwt-secret>
  REDIS_PASSWORD: <base64-encoded-redis-password>
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lowcode-backend
  namespace: lowcode-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: lowcode-backend
  template:
    metadata:
      labels:
        app: lowcode-backend
    spec:
      containers:
      - name: lowcode-backend
        image: your-registry/lowcode-backend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: lowcode-config
        - secretRef:
            name: lowcode-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: generated-files
          mountPath: /app/generated
        - name: template-files
          mountPath: /app/templates
      volumes:
      - name: generated-files
        persistentVolumeClaim:
          claimName: generated-files-pvc
      - name: template-files
        persistentVolumeClaim:
          claimName: template-files-pvc
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: lowcode-backend-service
  namespace: lowcode-platform
spec:
  selector:
    app: lowcode-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: lowcode-ingress
  namespace: lowcode-platform
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: lowcode-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: lowcode-backend-service
            port:
              number: 80
```

## Monitoring and Logging

### Health Checks

```typescript
// src/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkDiskSpace(),
      this.checkMemory(),
    ]);

    const status = checks.every(check => check.status === 'fulfilled') ? 'healthy' : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
        redis: checks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
        disk: checks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy',
        memory: checks[3].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      },
    };
  }

  private async checkDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  private async checkRedis(): Promise<void> {
    await this.redis.ping();
  }

  private async checkDiskSpace(): Promise<void> {
    // Check available disk space
  }

  private async checkMemory(): Promise<void> {
    // Check memory usage
  }
}
```

### Prometheus Metrics

```typescript
// src/metrics/metrics.service.ts
@Injectable()
export class MetricsService {
  private readonly httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
  });

  private readonly codeGenerationCounter = new prometheus.Counter({
    name: 'code_generation_total',
    help: 'Total number of code generations',
    labelNames: ['project_id', 'template_type', 'status'],
  });

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);
  }

  recordCodeGeneration(projectId: string, templateType: string, status: string) {
    this.codeGenerationCounter
      .labels(projectId, templateType, status)
      .inc();
  }
}
```

## Security Considerations

### Environment Security

1. **Secrets Management**: Use proper secrets management (Kubernetes secrets, AWS Secrets Manager, etc.)
2. **Environment Isolation**: Separate environments for development, staging, and production
3. **Access Control**: Implement proper RBAC for deployment access
4. **Network Security**: Use private networks and security groups

### Application Security

1. **JWT Security**: Use strong secrets and appropriate expiration times
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Input Validation**: Validate all inputs thoroughly
4. **CORS Configuration**: Configure CORS properly for your domain
5. **Security Headers**: Implement security headers (HSTS, CSP, etc.)

## Performance Optimization

### Caching Strategy

1. **Redis Caching**: Use Redis for metadata and template caching
2. **Application-Level Caching**: Implement in-memory caching for frequently accessed data
3. **Database Query Optimization**: Use proper indexes and query optimization
4. **CDN**: Use CDN for static assets

### Scaling

1. **Horizontal Scaling**: Use multiple instances behind a load balancer
2. **Database Scaling**: Consider read replicas for read-heavy workloads
3. **Connection Pooling**: Use connection pooling for database connections
4. **Resource Limits**: Set appropriate resource limits in containers

## Backup and Recovery

### Database Backup

```bash
#!/bin/bash
# backup-database.sh
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/lowcode_platform_$TIMESTAMP.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
gzip $BACKUP_FILE

# Upload to S3 or other storage
aws s3 cp $BACKUP_FILE.gz s3://your-backup-bucket/database/
```

### Automated Backup

```yaml
# backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
  namespace: lowcode-platform
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:13-alpine
            command:
            - /bin/sh
            - -c
            - |
              pg_dump $DATABASE_URL | gzip > /backup/backup_$(date +%Y%m%d_%H%M%S).sql.gz
              # Upload to storage
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: lowcode-secrets
                  key: DATABASE_URL
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**: Check connection strings and network connectivity
2. **Memory Issues**: Monitor memory usage and adjust limits
3. **Performance Issues**: Check database queries and caching
4. **Authentication Issues**: Verify JWT configuration and secrets

### Logging

Configure structured logging for better debugging:

```typescript
// src/logging/logger.service.ts
@Injectable()
export class LoggerService {
  private logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
  });

  log(level: string, message: string, meta?: any) {
    this.logger.log(level, message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    this.logger.error(message, { error: error?.stack, ...meta });
  }
}
```

## Maintenance

### Regular Tasks

1. **Database Maintenance**: Regular VACUUM and ANALYZE operations
2. **Log Rotation**: Implement log rotation to manage disk space
3. **Security Updates**: Regular security updates for dependencies
4. **Performance Monitoring**: Monitor application performance and optimize as needed
5. **Backup Verification**: Regularly test backup and recovery procedures

### Update Strategy

1. **Blue-Green Deployment**: Use blue-green deployment for zero-downtime updates
2. **Database Migrations**: Plan and test database migrations carefully
3. **Rollback Plan**: Always have a rollback plan for deployments
4. **Testing**: Thoroughly test in staging before production deployment
