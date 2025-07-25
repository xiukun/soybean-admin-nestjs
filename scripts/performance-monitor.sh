#!/bin/bash

# 统一JWT认证系统性能监控脚本
# 实时监控系统性能指标

set -e

echo "📊 统一JWT认证系统性能监控"
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 配置
BACKEND_URL="http://localhost:3000"
MONITOR_INTERVAL=5
LOG_FILE="logs/performance-$(date +%Y%m%d-%H%M%S).log"

# 创建日志目录
mkdir -p logs

# 性能指标收集函数
collect_metrics() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 系统资源指标
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    local disk_usage=$(df -h / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    
    # Docker容器指标
    local container_stats=""
    if docker-compose -f docker-compose.unified.yml ps | grep -q "Up"; then
        container_stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | tail -n +2)
    fi
    
    # API响应时间测试
    local api_response_time=""
    if curl -s -w "%{time_total}" -o /dev/null "$BACKEND_URL/health" > /dev/null 2>&1; then
        api_response_time=$(curl -s -w "%{time_total}" -o /dev/null "$BACKEND_URL/health" 2>/dev/null)
    else
        api_response_time="N/A"
    fi
    
    # 输出指标
    echo -e "\n${BLUE}[$timestamp] 系统性能指标${NC}"
    echo -e "CPU使用率: ${cpu_usage}%"
    echo -e "内存使用率: ${memory_usage}%"
    echo -e "磁盘使用率: ${disk_usage}%"
    echo -e "API响应时间: ${api_response_time}s"
    
    if [ -n "$container_stats" ]; then
        echo -e "\n${YELLOW}Docker容器状态:${NC}"
        echo "$container_stats"
    fi
    
    # 记录到日志文件
    {
        echo "[$timestamp]"
        echo "CPU: ${cpu_usage}%"
        echo "Memory: ${memory_usage}%"
        echo "Disk: ${disk_usage}%"
        echo "API_Response: ${api_response_time}s"
        echo "---"
    } >> "$LOG_FILE"
}

# JWT性能测试
jwt_performance_test() {
    echo -e "\n${PURPLE}🔑 JWT性能测试${NC}"
    
    # 模拟登录请求
    local login_data='{"username":"admin","password":"admin123"}'
    local login_response_time=""
    
    if curl -s -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "$login_data" \
        -w "%{time_total}" \
        -o /dev/null > /dev/null 2>&1; then
        login_response_time=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "$login_data" \
            -w "%{time_total}" \
            -o /dev/null 2>/dev/null)
        echo -e "登录请求响应时间: ${login_response_time}s"
    else
        echo -e "${RED}登录请求失败${NC}"
    fi
}

# 数据库连接测试
database_performance_test() {
    echo -e "\n${PURPLE}🗄️ 数据库性能测试${NC}"
    
    # 检查数据库连接
    if docker-compose -f docker-compose.unified.yml exec -T postgres pg_isready > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 数据库连接正常${NC}"
        
        # 简单的查询性能测试
        local query_time=$(docker-compose -f docker-compose.unified.yml exec -T postgres \
            psql -U postgres -d soybean_admin -c "SELECT NOW();" \
            2>/dev/null | grep -o "Time: [0-9.]* ms" | grep -o "[0-9.]*" || echo "N/A")
        
        if [ "$query_time" != "N/A" ]; then
            echo -e "数据库查询时间: ${query_time}ms"
        fi
    else
        echo -e "${RED}❌ 数据库连接异常${NC}"
    fi
}

# Redis性能测试
redis_performance_test() {
    echo -e "\n${PURPLE}🔴 Redis性能测试${NC}"
    
    # 检查Redis连接
    if docker-compose -f docker-compose.unified.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis连接正常${NC}"
        
        # 简单的Redis性能测试
        local redis_ops=$(docker-compose -f docker-compose.unified.yml exec -T redis \
            redis-cli eval "
                local start = redis.call('TIME')[1]
                for i=1,1000 do
                    redis.call('SET', 'test:' .. i, 'value' .. i)
                    redis.call('GET', 'test:' .. i)
                end
                local finish = redis.call('TIME')[1]
                return finish - start
            " 0 2>/dev/null || echo "N/A")
        
        if [ "$redis_ops" != "N/A" ]; then
            echo -e "Redis操作性能: 2000 ops in ${redis_ops}s"
        fi
        
        # 清理测试数据
        docker-compose -f docker-compose.unified.yml exec -T redis \
            redis-cli eval "for i=1,1000 do redis.call('DEL', 'test:' .. i) end" 0 > /dev/null 2>&1
    else
        echo -e "${RED}❌ Redis连接异常${NC}"
    fi
}

# 生成性能报告
generate_performance_report() {
    local report_file="PERFORMANCE_REPORT_$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# 📊 性能监控报告

**生成时间**: $(date)
**监控周期**: $MONITOR_INTERVAL 秒间隔
**日志文件**: $LOG_FILE

## 🎯 关键指标

### 系统资源
- CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%
- 内存使用率: $(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')%
- 磁盘使用率: $(df -h / | tail -1 | awk '{print $5}')

### API性能
- 健康检查响应时间: $(curl -s -w "%{time_total}" -o /dev/null "$BACKEND_URL/health" 2>/dev/null || echo "N/A")s
- 平均响应时间: < 100ms (目标)

### 数据库性能
- 连接状态: $(docker-compose -f docker-compose.unified.yml exec -T postgres pg_isready 2>/dev/null && echo "正常" || echo "异常")
- 查询性能: < 10ms (目标)

### 缓存性能
- Redis状态: $(docker-compose -f docker-compose.unified.yml exec -T redis redis-cli ping 2>/dev/null || echo "异常")
- 缓存命中率: 监控中...

## 📈 性能趋势

详细的性能数据请查看日志文件: \`$LOG_FILE\`

## 🚨 告警阈值

- CPU使用率 > 80%: 🔴 高风险
- 内存使用率 > 85%: 🔴 高风险  
- API响应时间 > 1s: 🟡 中风险
- 数据库查询 > 100ms: 🟡 中风险

## 💡 优化建议

1. **CPU优化**: 考虑增加实例数量或优化算法
2. **内存优化**: 检查内存泄漏，优化缓存策略
3. **数据库优化**: 添加索引，优化查询语句
4. **缓存优化**: 提高缓存命中率，减少数据库访问

---
*报告由性能监控脚本自动生成*
EOF
    
    echo -e "\n${GREEN}📊 性能报告已生成: $report_file${NC}"
}

# 实时监控模式
real_time_monitor() {
    echo -e "${BLUE}🔄 开始实时性能监控 (按 Ctrl+C 停止)${NC}"
    echo -e "监控间隔: ${MONITOR_INTERVAL}秒"
    echo -e "日志文件: ${LOG_FILE}"
    
    # 信号处理
    trap 'echo -e "\n${YELLOW}📊 监控已停止，生成最终报告...${NC}"; generate_performance_report; exit 0' INT
    
    while true; do
        clear
        echo "📊 统一JWT认证系统实时性能监控"
        echo "========================================"
        
        collect_metrics
        jwt_performance_test
        database_performance_test
        redis_performance_test
        
        echo -e "\n${BLUE}下次更新: ${MONITOR_INTERVAL}秒后 (按 Ctrl+C 停止)${NC}"
        sleep $MONITOR_INTERVAL
    done
}

# 单次检查模式
single_check() {
    echo -e "${BLUE}📊 执行单次性能检查${NC}"
    
    collect_metrics
    jwt_performance_test
    database_performance_test
    redis_performance_test
    generate_performance_report
    
    echo -e "\n${GREEN}✅ 单次性能检查完成${NC}"
}

# 主函数
main() {
    case "${1:-single}" in
        "monitor"|"real-time")
            real_time_monitor
            ;;
        "single"|"check")
            single_check
            ;;
        *)
            echo "用法: $0 [monitor|single]"
            echo "  monitor: 实时监控模式"
            echo "  single:  单次检查模式 (默认)"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
