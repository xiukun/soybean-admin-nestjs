# 项目维护和更新指南

## 概述

本文档详细说明了 SoybeanAdmin NestJS 低代码平台的日常维护、更新升级、故障排除和性能优化等相关内容。确保系统的稳定运行和持续改进。

## 日常维护

### 1. 系统监控

#### 1.1 服务状态监控

```bash
#!/bin/bash
# scripts/monitor-services.sh

echo "🔍 检查服务状态..."

# 检查服务函数
check_service() {
    local service_name=$1
    local port=$2
    local health_endpoint=$3
    
    echo "检查 $service_name (端口: $port)..."
    
    # 检查端口是否开放
    if ! nc -z localhost $port; then
        echo "❌ $service_name 端口 $port 未开放"
        return 1
    fi
    
    # 检查健康状态
    if [ -n "$health_endpoint" ]; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$health_endpoint")
        if [ "$response" = "200" ]; then
            echo "✅ $service_name 健康检查通过"
        else
            echo "⚠️  $service_name 健康检查失败 (HTTP $response)"
            return 1
        fi
    fi
    
    return 0
}

# 检查所有服务
services=(
    "Frontend:9527:"
    "Backend:9528:/api/health"
    "Amis Backend:9522:/api/v1/health"
    "Lowcode Platform:3000:/api/v1/health"
    "Lowcode Designer:9555:"
    "PostgreSQL:25432:"
    "Redis:26379:"
)

failed_services=()

for service_info in "${services[@]}"; do
    IFS=':' read -r service_name port health_endpoint <<< "$service_info"
    if ! check_service "$service_name" "$port" "$health_endpoint"; then
        failed_services+=("$service_name")
    fi
done

# 输出结果
echo ""
if [ ${#failed_services[@]} -eq 0 ]; then
    echo "🎉 所有服务运行正常！"
else
    echo "❌ 以下服务存在问题："
    for service in "${failed_services[@]}"; do
        echo "  - $service"
    done
    
    # 发送告警通知
    ./scripts/send-alert.sh "服务异常" "以下服务存在问题: ${failed_services[*]}"
fi
```

#### 1.2 资源使用监控

```bash
#!/bin/bash
# scripts/monitor-resources.sh

echo "📊 检查系统资源使用情况..."

# 检查磁盘使用率
echo "💾 磁盘使用情况:"
df -h | grep -E '^/dev/' | awk '{
    use = $5
    gsub(/%/, "", use)
    if (use > 80) {
        printf "⚠️  %s 使用率过高: %s\n", $1, $5
    } else {
        printf "✅ %s 使用率正常: %s\n", $1, $5
    }
}'

# 检查内存使用率
echo ""
echo "🧠 内存使用情况:"
memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
if (( $(echo "$memory_usage > 80" | bc -l) )); then
    echo "⚠️  内存使用率过高: ${memory_usage}%"
else
    echo "✅ 内存使用率正常: ${memory_usage}%"
fi

# 检查CPU使用率
echo ""
echo "🖥️  CPU 使用情况:"
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
if (( $(echo "$cpu_usage > 80" | bc -l) )); then
    echo "⚠️  CPU 使用率过高: ${cpu_usage}%"
else
    echo "✅ CPU 使用率正常: ${cpu_usage}%"
fi

# 检查数据库连接数
echo ""
echo "🗄️  数据库连接情况:"
db_connections=$(docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs)
if [ -n "$db_connections" ] && [ "$db_connections" -gt 50 ]; then
    echo "⚠️  数据库连接数过多: $db_connections"
else
    echo "✅ 数据库连接数正常: $db_connections"
fi

# 检查Redis内存使用
echo ""
echo "🔴 Redis 内存使用:"
redis_memory=$(docker exec soybean-redis redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
echo "✅ Redis 内存使用: $redis_memory"
```

#### 1.3 日志监控

```bash
#!/bin/bash
# scripts/monitor-logs.sh

echo "📝 检查应用日志..."

# 检查错误日志
check_error_logs() {
    local service=$1
    local log_file=$2
    
    if [ -f "$log_file" ]; then
        local error_count=$(grep -c "ERROR\|FATAL\|Exception" "$log_file" 2>/dev/null || echo "0")
        local warning_count=$(grep -c "WARN" "$log_file" 2>/dev/null || echo "0")
        
        echo "$service:"
        echo "  错误数量: $error_count"
        echo "  警告数量: $warning_count"
        
        if [ "$error_count" -gt 10 ]; then
            echo "  ⚠️  错误数量过多，需要关注"
            # 显示最近的错误
            echo "  最近的错误:"
            grep "ERROR\|FATAL\|Exception" "$log_file" | tail -3 | sed 's/^/    /'
        fi
    else
        echo "$service: 日志文件不存在"
    fi
    echo ""
}

# 检查各服务日志
check_error_logs "Backend" "backend/logs/application.log"
check_error_logs "Amis Backend" "amis-lowcode-backend/logs/application.log"
check_error_logs "Lowcode Platform" "lowcode-platform-backend/logs/application.log"

# 检查Docker容器日志
echo "🐳 检查容器日志错误..."
containers=("soybean-backend" "soybean-amis-backend" "soybean-lowcode-platform")

for container in "${containers[@]}"; do
    if docker ps --format "table {{.Names}}" | grep -q "$container"; then
        error_count=$(docker logs "$container" --since="1h" 2>&1 | grep -c "ERROR\|FATAL\|Exception" || echo "0")
        echo "$container: 最近1小时错误数量: $error_count"
        
        if [ "$error_count" -gt 5 ]; then
            echo "  ⚠️  错误数量较多，最近错误:"
            docker logs "$container" --since="1h" 2>&1 | grep "ERROR\|FATAL\|Exception" | tail -2 | sed 's/^/    /'
        fi
    else
        echo "$container: 容器未运行"
    fi
done
```

### 2. 数据备份

#### 2.1 数据库备份

```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="/backup/database"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "🗄️  开始数据库备份..."

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份主数据库
echo "备份主数据库..."
docker exec soybean-postgres pg_dump -U soybean -d soybean-admin-nest-backend > "$BACKUP_DIR/main_db_$DATE.sql"

if [ $? -eq 0 ]; then
    echo "✅ 主数据库备份成功: main_db_$DATE.sql"
    
    # 压缩备份文件
    gzip "$BACKUP_DIR/main_db_$DATE.sql"
    echo "✅ 备份文件已压缩"
else
    echo "❌ 主数据库备份失败"
    exit 1
fi

# 备份各个schema
schemas=("public" "amis" "lowcode")
for schema in "${schemas[@]}"; do
    echo "备份 $schema schema..."
    docker exec soybean-postgres pg_dump -U soybean -d soybean-admin-nest-backend -n "$schema" > "$BACKUP_DIR/${schema}_schema_$DATE.sql"
    
    if [ $? -eq 0 ]; then
        gzip "$BACKUP_DIR/${schema}_schema_$DATE.sql"
        echo "✅ $schema schema 备份成功"
    else
        echo "❌ $schema schema 备份失败"
    fi
done

# 清理过期备份
echo "🧹 清理过期备份文件..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "✅ 过期备份文件清理完成"

# 备份验证
echo "🔍 验证备份文件..."
latest_backup=$(ls -t "$BACKUP_DIR"/main_db_*.sql.gz | head -1)
if [ -f "$latest_backup" ]; then
    backup_size=$(du -h "$latest_backup" | cut -f1)
    echo "✅ 最新备份文件: $(basename "$latest_backup") (大小: $backup_size)"
else
    echo "❌ 备份验证失败"
    exit 1
fi

echo "🎉 数据库备份完成！"
```

#### 2.2 文件备份

```bash
#!/bin/bash
# scripts/backup-files.sh

BACKUP_DIR="/backup/files"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

echo "📁 开始文件备份..."

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份上传文件
echo "备份上传文件..."
if [ -d "uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" uploads/
    echo "✅ 上传文件备份成功"
else
    echo "⚠️  uploads 目录不存在"
fi

# 备份生成的代码
echo "备份生成的代码..."
if [ -d "generated" ]; then
    tar -czf "$BACKUP_DIR/generated_$DATE.tar.gz" generated/
    echo "✅ 生成代码备份成功"
else
    echo "⚠️  generated 目录不存在"
fi

# 备份配置文件
echo "备份配置文件..."
config_files=(
    ".env*"
    "docker-compose*.yml"
    "nginx.conf"
    "*/prisma/schema.prisma"
)

tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" "${config_files[@]}" 2>/dev/null
echo "✅ 配置文件备份成功"

# 清理过期备份
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "✅ 过期文件备份清理完成"

echo "🎉 文件备份完成！"
```

### 3. 日志管理

#### 3.1 日志轮转配置

```bash
# /etc/logrotate.d/soybean-admin
/path/to/soybean-admin-nestjs/*/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        # 重启相关服务以重新打开日志文件
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
```

#### 3.2 日志清理脚本

```bash
#!/bin/bash
# scripts/cleanup-logs.sh

echo "🧹 开始清理日志文件..."

# 清理应用日志（保留30天）
find . -name "*.log" -mtime +30 -delete
echo "✅ 应用日志清理完成"

# 清理Docker日志
echo "清理Docker容器日志..."
containers=$(docker ps -q)
for container in $containers; do
    docker logs "$container" --since="30d" > /tmp/temp_log 2>&1
    docker exec "$container" sh -c 'echo "" > $(docker inspect --format="{{.LogPath}}" '$container')'
done
echo "✅ Docker日志清理完成"

# 清理系统日志
if [ -f /var/log/syslog ]; then
    sudo truncate -s 0 /var/log/syslog
    echo "✅ 系统日志清理完成"
fi

echo "🎉 日志清理完成！"
```

## 版本更新

### 1. 更新流程

#### 1.1 更新前准备

```bash
#!/bin/bash
# scripts/pre-update.sh

echo "🚀 开始更新前准备..."

# 1. 备份数据
echo "1. 执行数据备份..."
./scripts/backup-database.sh
./scripts/backup-files.sh

# 2. 检查服务状态
echo "2. 检查当前服务状态..."
./scripts/monitor-services.sh

# 3. 记录当前版本
echo "3. 记录当前版本信息..."
echo "更新时间: $(date)" > update_log.txt
echo "更新前版本:" >> update_log.txt
git log --oneline -1 >> update_log.txt

# 4. 停止服务
echo "4. 停止当前服务..."
docker-compose down

echo "✅ 更新前准备完成！"
```

#### 1.2 执行更新

```bash
#!/bin/bash
# scripts/update.sh

echo "🔄 开始执行更新..."

# 1. 拉取最新代码
echo "1. 拉取最新代码..."
git fetch origin
git checkout main
git pull origin main

# 2. 更新依赖
echo "2. 更新项目依赖..."
./scripts/install-deps.sh

# 3. 数据库迁移
echo "3. 执行数据库迁移..."
cd backend && pnpm prisma:migrate:deploy && cd ..
cd amis-lowcode-backend && pnpm prisma:migrate:deploy && cd ..
cd lowcode-platform-backend && pnpm prisma:migrate:deploy && cd ..

# 4. 构建新版本
echo "4. 构建新版本..."
docker-compose build

# 5. 启动服务
echo "5. 启动更新后的服务..."
docker-compose up -d

# 6. 等待服务启动
echo "6. 等待服务启动..."
sleep 30

# 7. 验证更新
echo "7. 验证服务状态..."
./scripts/monitor-services.sh

echo "✅ 更新完成！"
```

#### 1.3 回滚方案

```bash
#!/bin/bash
# scripts/rollback.sh

echo "🔙 开始回滚操作..."

# 1. 停止当前服务
echo "1. 停止当前服务..."
docker-compose down

# 2. 恢复代码版本
echo "2. 恢复到上一个版本..."
git checkout HEAD~1

# 3. 恢复数据库
echo "3. 恢复数据库备份..."
latest_backup=$(ls -t /backup/database/main_db_*.sql.gz | head -1)
if [ -f "$latest_backup" ]; then
    echo "恢复备份: $latest_backup"
    gunzip -c "$latest_backup" | docker exec -i soybean-postgres psql -U soybean -d soybean-admin-nest-backend
    echo "✅ 数据库恢复完成"
else
    echo "❌ 未找到数据库备份文件"
    exit 1
fi

# 4. 重新构建和启动
echo "4. 重新构建和启动服务..."
docker-compose build
docker-compose up -d

# 5. 验证回滚
echo "5. 验证回滚结果..."
sleep 30
./scripts/monitor-services.sh

echo "✅ 回滚完成！"
```

### 2. 版本管理

#### 2.1 版本标记

```bash
#!/bin/bash
# scripts/tag-version.sh

if [ -z "$1" ]; then
    echo "用法: $0 <version>"
    echo "示例: $0 v1.2.0"
    exit 1
fi

VERSION=$1

echo "🏷️  创建版本标签: $VERSION"

# 1. 检查工作区是否干净
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ 工作区有未提交的更改，请先提交"
    exit 1
fi

# 2. 创建标签
git tag -a "$VERSION" -m "Release $VERSION"

# 3. 推送标签
git push origin "$VERSION"

# 4. 更新版本文件
echo "$VERSION" > VERSION
echo "$(date): Released $VERSION" >> CHANGELOG.md

# 5. 提交版本文件更新
git add VERSION CHANGELOG.md
git commit -m "chore: bump version to $VERSION"
git push origin main

echo "✅ 版本 $VERSION 标记完成！"
```

#### 2.2 变更日志生成

```bash
#!/bin/bash
# scripts/generate-changelog.sh

echo "📝 生成变更日志..."

# 获取最新的两个标签
latest_tag=$(git describe --tags --abbrev=0)
previous_tag=$(git describe --tags --abbrev=0 "$latest_tag"^)

echo "生成从 $previous_tag 到 $latest_tag 的变更日志..."

# 生成变更日志
{
    echo "# 变更日志"
    echo ""
    echo "## [$latest_tag] - $(date +%Y-%m-%d)"
    echo ""
    
    # 新功能
    echo "### 新增功能"
    git log "$previous_tag..$latest_tag" --pretty=format:"- %s" --grep="^feat" | sed 's/^feat[^:]*: /- /'
    echo ""
    
    # 修复
    echo "### 问题修复"
    git log "$previous_tag..$latest_tag" --pretty=format:"- %s" --grep="^fix" | sed 's/^fix[^:]*: /- /'
    echo ""
    
    # 改进
    echo "### 改进优化"
    git log "$previous_tag..$latest_tag" --pretty=format:"- %s" --grep="^perf\|^refactor" | sed 's/^[^:]*: /- /'
    echo ""
    
    # 文档
    echo "### 文档更新"
    git log "$previous_tag..$latest_tag" --pretty=format:"- %s" --grep="^docs" | sed 's/^docs[^:]*: /- /'
    echo ""
    
} > "CHANGELOG_$latest_tag.md"

echo "✅ 变更日志已生成: CHANGELOG_$latest_tag.md"
```

## 故障排除

### 1. 常见问题诊断

#### 1.1 服务启动失败

```bash
#!/bin/bash
# scripts/diagnose-startup.sh

echo "🔍 诊断服务启动问题..."

# 检查端口占用
check_port_usage() {
    local port=$1
    local service=$2
    
    echo "检查端口 $port ($service)..."
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
        local process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        echo "⚠️  端口 $port 被进程占用: $process (PID: $pid)"
        return 1
    else
        echo "✅ 端口 $port 可用"
        return 0
    fi
}

# 检查所有服务端口
ports=(9527:Frontend 9528:Backend 9522:"Amis Backend" 3000:"Lowcode Platform" 9555:"Lowcode Designer")

for port_info in "${ports[@]}"; do
    IFS=':' read -r port service <<< "$port_info"
    check_port_usage "$port" "$service"
done

# 检查Docker服务
echo ""
echo "🐳 检查Docker服务..."
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker 服务未运行"
    echo "解决方案: sudo systemctl start docker"
else
    echo "✅ Docker 服务正常"
fi

# 检查数据库连接
echo ""
echo "🗄️  检查数据库连接..."
if docker exec soybean-postgres pg_isready -U soybean >/dev/null 2>&1; then
    echo "✅ PostgreSQL 连接正常"
else
    echo "❌ PostgreSQL 连接失败"
    echo "解决方案:"
    echo "  1. 检查容器是否运行: docker ps | grep postgres"
    echo "  2. 检查容器日志: docker logs soybean-postgres"
    echo "  3. 重启容器: docker restart soybean-postgres"
fi

# 检查Redis连接
echo ""
echo "🔴 检查Redis连接..."
if docker exec soybean-redis redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis 连接正常"
else
    echo "❌ Redis 连接失败"
    echo "解决方案:"
    echo "  1. 检查容器是否运行: docker ps | grep redis"
    echo "  2. 检查容器日志: docker logs soybean-redis"
    echo "  3. 重启容器: docker restart soybean-redis"
fi

# 检查磁盘空间
echo ""
echo "💾 检查磁盘空间..."
disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$disk_usage" -gt 80 ]; then
    echo "⚠️  磁盘使用率过高: ${disk_usage}%"
    echo "解决方案:"
    echo "  1. 清理日志文件: ./scripts/cleanup-logs.sh"
    echo "  2. 清理Docker镜像: docker system prune -a"
    echo "  3. 清理备份文件: find /backup -mtime +30 -delete"
else
    echo "✅ 磁盘空间充足: ${disk_usage}%"
fi

echo ""
echo "🎯 诊断完成！请根据上述建议解决问题。"
```

#### 1.2 性能问题诊断

```bash
#!/bin/bash
# scripts/diagnose-performance.sh

echo "⚡ 诊断性能问题..."

# 检查响应时间
check_response_time() {
    local url=$1
    local service=$2
    local threshold=${3:-2}
    
    echo "检查 $service 响应时间..."
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' "$url" 2>/dev/null || echo "999")
    
    if (( $(echo "$response_time > $threshold" | bc -l) )); then
        echo "⚠️  $service 响应时间过长: ${response_time}s (阈值: ${threshold}s)"
        return 1
    else
        echo "✅ $service 响应时间正常: ${response_time}s"
        return 0
    fi
}

# 检查各服务响应时间
services=(
    "http://localhost:9527:Frontend:3"
    "http://localhost:9528/api/health:Backend:2"
    "http://localhost:9522/api/v1/health:Amis Backend:2"
    "http://localhost:3000/api/v1/health:Lowcode Platform:2"
)

for service_info in "${services[@]}"; do
    IFS=':' read -r url service threshold <<< "$service_info"
    check_response_time "$url" "$service" "$threshold"
done

# 检查数据库性能
echo ""
echo "🗄️  检查数据库性能..."
db_slow_queries=$(docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -t -c "
    SELECT count(*) FROM pg_stat_statements 
    WHERE mean_time > 1000;" 2>/dev/null | xargs || echo "0")

if [ "$db_slow_queries" -gt 10 ]; then
    echo "⚠️  数据库慢查询较多: $db_slow_queries 条"
    echo "建议:"
    echo "  1. 检查慢查询日志"
    echo "  2. 优化查询语句"
    echo "  3. 添加必要的索引"
else
    echo "✅ 数据库查询性能正常"
fi

# 检查内存使用
echo ""
echo "🧠 检查内存使用情况..."
containers=("soybean-backend" "soybean-amis-backend" "soybean-lowcode-platform" "soybean-frontend")

for container in "${containers[@]}"; do
    if docker ps --format "table {{.Names}}" | grep -q "$container"; then
        memory_usage=$(docker stats "$container" --no-stream --format "table {{.MemUsage}}" | tail -1)
        echo "$container 内存使用: $memory_usage"
    fi
done

echo ""
echo "🎯 性能诊断完成！"
```

#### 1.3 网络连接问题

```bash
#!/bin/bash
# scripts/diagnose-network.sh

echo "🌐 诊断网络连接问题..."

# 检查服务间连通性
check_service_connectivity() {
    local from_service=$1
    local to_service=$2
    local to_url=$3
    
    echo "检查 $from_service -> $to_service 连通性..."
    
    if docker exec "$from_service" curl -f -s "$to_url" >/dev/null 2>&1; then
        echo "✅ $from_service -> $to_service 连通正常"
    else
        echo "❌ $from_service -> $to_service 连通失败"
        echo "  目标URL: $to_url"
        echo "  建议检查网络配置和防火墙设置"
    fi
}

# 检查服务间连通性
connectivity_tests=(
    "soybean-frontend:soybean-backend:http://backend:9528/api/health"
    "soybean-frontend:soybean-amis-backend:http://amis-backend:9522/api/v1/health"
    "soybean-amis-backend:soybean-lowcode-platform:http://lowcode-platform:3000/api/v1/health"
    "soybean-backend:soybean-postgres:postgresql://soybean:soybean@123.@postgres:5432/soybean-admin-nest-backend"
)

for test_info in "${connectivity_tests[@]}"; do
    IFS=':' read -r from_service to_service to_url <<< "$test_info"
    if docker ps --format "table {{.Names}}" | grep -q "$from_service"; then
        check_service_connectivity "$from_service" "$to_service" "$to_url"
    else
        echo "⚠️  $from_service 容器未运行，跳过连通性测试"
    fi
done

# 检查外部网络连接
echo ""
echo "🌍 检查外部网络连接..."
external_urls=("https://registry.npmmirror.com" "https://github.com" "https://docker.io")

for url in "${external_urls[@]}"; do
    if curl -f -s --connect-timeout 5 "$url" >/dev/null; then
        echo "✅ 外部连接正常: $url"
    else
        echo "❌ 外部连接失败: $url"
    fi
done

echo ""
echo "🎯 网络诊断完成！"
```

### 2. 故障恢复

#### 2.1 服务重启脚本

```bash
#!/bin/bash
# scripts/restart-services.sh

echo "🔄 重启服务..."

# 重启指定服务
restart_service() {
    local service=$1
    echo "重启 $service..."
    
    docker-compose restart "$service"
    
    # 等待服务启动
    sleep 10
    
    # 检查服务状态
    if docker-compose ps "$service" | grep -q "Up"; then
        echo "✅ $service 重启成功"
    else
        echo "❌ $service 重启失败"
        docker-compose logs "$service" | tail -10
    fi
}

# 如果指定了服务名，只重启该服务
if [ -n "$1" ]; then
    restart_service "$1"
else
    # 重启所有服务
    services=("postgres" "redis" "backend" "amis-backend" "lowcode-platform" "frontend" "lowcode-designer")
    
    for service in "${services[@]}"; do
        restart_service "$service"
        echo ""
    done
fi

echo "🎉 服务重启完成！"
```

#### 2.2 数据恢复脚本

```bash
#!/bin/bash
# scripts/restore-data.sh

if [ -z "$1" ]; then
    echo "用法: $0 <backup_file>"
    echo "示例: $0 /backup/database/main_db_20240101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

echo "🔄 开始数据恢复..."

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

# 停止相关服务
echo "1. 停止应用服务..."
docker-compose stop backend amis-backend lowcode-platform

# 创建数据库备份（恢复前）
echo "2. 创建当前数据库备份..."
current_backup="/backup/database/before_restore_$(date +%Y%m%d_%H%M%S).sql"
docker exec soybean-postgres pg_dump -U soybean -d soybean-admin-nest-backend > "$current_backup"
echo "✅ 当前数据库已备份到: $current_backup"

# 恢复数据库
echo "3. 恢复数据库..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker exec -i soybean-postgres psql -U soybean -d soybean-admin-nest-backend
else
    docker exec -i soybean-postgres psql -U soybean -d soybean-admin-nest-backend < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo "✅ 数据库恢复成功"
else
    echo "❌ 数据库恢复失败"
    echo "正在恢复到恢复前状态..."
    docker exec -i soybean-postgres psql -U soybean -d soybean-admin-nest-backend < "$current_backup"
    exit 1
fi

# 重启服务
echo "4. 重启应用服务..."
docker-compose start backend amis-backend lowcode-platform

# 等待服务启动
echo "5. 等待服务启动..."
sleep 30

# 验证恢复
echo "6. 验证数据恢复..."
./scripts/monitor-services.sh

echo "🎉 数据恢复完成！"
```

## 性能优化

### 1. 数据库优化

#### 1.1 数据库性能监控

```bash
#!/bin/bash
# scripts/monitor-database-performance.sh

echo "📊 数据库性能监控..."

# 检查连接数
echo "🔗 数据库连接情况:"
docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -c "
SELECT 
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity;"

# 检查慢查询
echo ""
echo "🐌 慢查询统计:"
docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -c "
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC 
LIMIT 10;" 2>/dev/null || echo "pg_stat_statements 扩展未启用"

# 检查表大小
echo ""
echo "📏 表大小统计:"
docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname IN ('public', 'amis', 'lowcode')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
LIMIT 10;"

# 检查索引使用情况
echo ""
echo "📇 索引使用情况:"
docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -c "
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
ORDER BY schemaname, tablename;"

echo ""
echo "🎯 数据库性能监控完成！"
```

#### 1.2 数据库优化建议

```sql
-- scripts/database-optimization.sql

-- 1. 创建必要的索引
-- 用户表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 项目表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_code ON lowcode.projects(code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON lowcode.projects(status);

-- 实体表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_project_id ON lowcode.entities(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_code ON lowcode.entities(code);

-- 2. 更新表统计信息
ANALYZE;

-- 3. 清理无用数据
-- 清理过期的会话数据
DELETE FROM sessions WHERE expires_at < NOW() - INTERVAL '7 days';

-- 清理过期的日志数据
DELETE FROM logs WHERE created_at < NOW() - INTERVAL '30 days';

-- 4. 重建索引（定期维护）
-- REINDEX DATABASE "soybean-admin-nest-backend";
```

### 2. 应用性能优化

#### 2.1 缓存优化

```typescript
// 缓存配置优化示例
// backend/src/config/cache.config.ts

export const cacheConfig = {
  // Redis 配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
    keyPrefix: 'soybean:',
    // 连接池配置
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    // 性能优化
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  },
  
  // 缓存策略
  strategies: {
    // 用户信息缓存
    userInfo: {
      ttl: 3600, // 1小时
      key: (userId: string) => `user:${userId}`,
    },
    
    // 项目列表缓存
    projectList: {
      ttl: 300, // 5分钟
      key: (userId: string) => `projects:${userId}`,
    },
    
    // 实体详情缓存
    entityDetail: {
      ttl: 1800, // 30分钟
      key: (entityId: string) => `entity:${entityId}`,
    },
  },
};
```

#### 2.2 数据库连接池优化

```typescript
// backend/src/config/database.config.ts

export const databaseConfig = {
  // Prisma 连接池配置
  datasource: {
    url: process.env.DATABASE_URL,
  },
  
  // 连接池优化
  pool: {
    // 最大连接数
    max: 20,
    // 最小连接数
    min: 5,
    // 连接超时时间
    acquire: 30000,
    // 空闲连接超时时间
    idle: 10000,
  },
  
  // 查询优化
  query: {
    // 查询超时时间
    timeout: 10000,
    // 启用查询日志
    logging: process.env.NODE_ENV === 'development',
  },
};
```

### 3. 系统监控

#### 3.1 性能监控脚本

```bash
#!/bin/bash
# scripts/performance-monitor.sh

echo "📈 系统性能监控..."

# 创建监控日志目录
mkdir -p monitoring/logs

# 监控系统资源
monitor_system_resources() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    echo "$timestamp,$cpu_usage,$memory_usage,$disk_usage" >> monitoring/logs/system_resources.csv
}

# 监控服务响应时间
monitor_response_times() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    services=(
        "frontend:http://localhost:9527"
        "backend:http://localhost:9528/api/health"
        "amis-backend:http://localhost:9522/api/v1/health"
        "lowcode-platform:http://localhost:3000/api/v1/health"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service_name url <<< "$service_info"
        local response_time=$(curl -o /dev/null -s -w '%{time_total}' "$url" 2>/dev/null || echo "999")
        echo "$timestamp,$service_name,$response_time" >> monitoring/logs/response_times.csv
    done
}

# 监控数据库性能
monitor_database_performance() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 获取数据库连接数
    local connections=$(docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs || echo "0")
    
    # 获取数据库大小
    local db_size=$(docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -t -c "SELECT pg_size_pretty(pg_database_size('soybean-admin-nest-backend'));" 2>/dev/null | xargs || echo "0")
    
    echo "$timestamp,$connections,$db_size" >> monitoring/logs/database_performance.csv
}

# 执行监控
monitor_system_resources
monitor_response_times
monitor_database_performance

echo "✅ 性能监控数据已记录"

# 如果是定时任务，可以添加到 crontab
# */5 * * * * /path/to/scripts/performance-monitor.sh
```

#### 3.2 告警通知

```bash
#!/bin/bash
# scripts/send-alert.sh

ALERT_TYPE=$1
ALERT_MESSAGE=$2
WEBHOOK_URL=${WEBHOOK_URL:-""}

if [ -z "$ALERT_TYPE" ] || [ -z "$ALERT_MESSAGE" ]; then
    echo "用法: $0 <alert_type> <alert_message>"
    exit 1
fi

echo "🚨 发送告警通知..."

# 发送到钉钉/企业微信
send_webhook_alert() {
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"msgtype\": \"text\",
                \"text\": {
                    \"content\": \"【SoybeanAdmin告警】\\n类型: $ALERT_TYPE\\n内容: $ALERT_MESSAGE\\n时间: $(date)\"
                }
            }"
        echo "✅ Webhook 告警已发送"
    fi
}

# 发送邮件告警
send_email_alert() {
    if command -v mail >/dev/null 2>&1; then
        echo "类型: $ALERT_TYPE
内容: $ALERT_MESSAGE
时间: $(date)
服务器: $(hostname)" | mail -s "SoybeanAdmin系统告警" admin@example.com
        echo "✅ 邮件告警已发送"
    fi
}

# 记录告警日志
log_alert() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$ALERT_TYPE] $ALERT_MESSAGE" >> monitoring/logs/alerts.log
    echo "✅ 告警日志已记录"
}

# 执行告警通知
send_webhook_alert
send_email_alert
log_alert

echo "🎯 告警通知完成！"
```

## 安全维护

### 1. 安全检查

```bash
#!/bin/bash
# scripts/security-check.sh

echo "🔒 执行安全检查..."

# 检查密码强度
check_password_policy() {
    echo "🔑 检查密码策略..."
    
    # 检查默认密码
    default_passwords=("123456" "admin" "password" "root")
    
    for password in "${default_passwords[@]}"; do
        # 这里应该检查数据库中是否存在弱密码
        echo "⚠️  请确保没有使用弱密码: $password"
    done
}

# 检查SSL证书
check_ssl_certificates() {
    echo "🔐 检查SSL证书..."
    
    domains=("localhost" "api.example.com")
    
    for domain in "${domains[@]}"; do
        if command -v openssl >/dev/null 2>&1; then
            expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
            if [ -n "$expiry_date" ]; then
                echo "✅ $domain SSL证书有效期至: $expiry_date"
            else
                echo "⚠️  $domain SSL证书检查失败"
            fi
        fi
    done
}

# 检查文件权限
check_file_permissions() {
    echo "📁 检查文件权限..."
    
    # 检查敏感文件权限
    sensitive_files=(".env" ".env.*" "docker-compose.yml" "*/prisma/schema.prisma")
    
    for pattern in "${sensitive_files[@]}"; do
        find . -name "$pattern" -type f -exec ls -la {} \; 2>/dev/null | while read -r line; do
            permissions=$(echo "$line" | awk '{print $1}')
            filename=$(echo "$line" | awk '{print $NF}')
            
            if [[ "$permissions" == *"rw-rw-rw-"* ]] || [[ "$permissions" == *"rwxrwxrwx"* ]]; then
                echo "⚠️  文件权限过于宽松: $filename ($permissions)"
            else
                echo "✅ 文件权限正常: $filename"
            fi
        done
    done
}

# 检查依赖漏洞
check_dependency_vulnerabilities() {
    echo "🔍 检查依赖漏洞..."
    
    services=("frontend" "backend" "lowcode-designer" "amis-lowcode-backend" "lowcode-platform-backend")
    
    for service in "${services[@]}"; do
        if [ -d "$service" ]; then
            echo "检查 $service 依赖..."
            cd "$service"
            
            if [ -f "package.json" ]; then
                if command -v pnpm >/dev/null 2>&1; then
                    pnpm audit --audit-level moderate
                else
                    npm audit --audit-level moderate
                fi
            fi
            
            cd ..
        fi
    done
}

# 执行安全检查
check_password_policy
check_ssl_certificates
check_file_permissions
check_dependency_vulnerabilities

echo "🎯 安全检查完成！"
```

### 2. 定期维护任务

```bash
#!/bin/bash
# scripts/scheduled-maintenance.sh

echo "🔧 执行定期维护任务..."

# 每日维护任务
daily_maintenance() {
    echo "📅 执行每日维护..."
    
    # 备份数据库
    ./scripts/backup-database.sh
    
    # 清理日志
    ./scripts/cleanup-logs.sh
    
    # 监控系统状态
    ./scripts/monitor-services.sh
    
    # 性能监控
    ./scripts/performance-monitor.sh
}

# 每周维护任务
weekly_maintenance() {
    echo "📅 执行每周维护..."
    
    # 备份文件
    ./scripts/backup-files.sh
    
    # 安全检查
    ./scripts/security-check.sh
    
    # 数据库优化
    docker exec soybean-postgres psql -U soybean -d soybean-admin-nest-backend -f /scripts/database-optimization.sql
    
    # 清理Docker资源
    docker system prune -f
}

# 每月维护任务
monthly_maintenance() {
    echo "📅 执行每月维护..."
    
    # 依赖更新检查
    ./scripts/check-updates.sh
    
    # 性能报告生成
    ./scripts/generate-performance-report.sh
    
    # 清理过期备份
    find /backup -mtime +90 -delete
}

# 根据参数执行相应的维护任务
case "$1" in
    "daily")
        daily_maintenance
        ;;
    "weekly")
        weekly_maintenance
        ;;
    "monthly")
        monthly_maintenance
        ;;
    *)
        echo "用法: $0 {daily|weekly|monthly}"
        echo "或添加到 crontab:"
        echo "0 2 * * * /path/to/scripts/scheduled-maintenance.sh daily"
        echo "0 3 * * 0 /path/to/scripts/scheduled-maintenance.sh weekly"
        echo "0 4 1 * * /path/to/scripts/scheduled-maintenance.sh monthly"
        exit 1
        ;;
esac

echo "✅ 定期维护任务完成！"
```

## 总结

本项目维护和更新指南涵盖了以下主要内容：

### 📋 维护清单

1. **日常监控**
   - ✅ 服务状态监控
   - ✅ 资源使用监控
   - ✅ 日志监控
   - ✅ 性能监控

2. **数据管理**
   - ✅ 数据库备份
   - ✅ 文件备份
   - ✅ 日志管理
   - ✅ 数据恢复

3. **版本控制**
   - ✅ 更新流程
   - ✅ 回滚方案
   - ✅ 版本标记
   - ✅ 变更日志

4. **故障处理**
   - ✅ 问题诊断
   - ✅ 故障恢复
   - ✅ 性能优化
   - ✅ 安全维护

### 🚀 最佳实践

1. **自动化运维**: 使用脚本自动化日常维护任务
2. **监控告警**: 建立完善的监控和告警机制
3. **定期备份**: 确保数据安全，定期备份重要数据
4. **性能优化**: 持续监控和优化系统性能
5. **安全加固**: 定期进行安全检查和漏洞修复

### 📞 技术支持

如遇到问题，请按以下顺序排查：

1. 查看服务日志
2. 运行诊断脚本
3. 检查系统资源
4. 参考故障排除指南
5. 联系技术支持团队

---

**维护团队**: SoybeanAdmin 开发团队  
**文档版本**: v1.0.0  
**最后更新**: 2024年1月1日
