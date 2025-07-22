#!/bin/bash

# Soybean Admin 微服务系统监控脚本
# 作者: AI Assistant
# 版本: 1.0.0
# 描述: 监控系统健康状态、性能指标和服务可用性

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
MONITOR_INTERVAL=30
LOG_FILE="logs/monitor.log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=80
ALERT_THRESHOLD_DISK=90

# 服务配置
declare -A SERVICES=(
    ["frontend"]="http://localhost:9527"
    ["backend"]="http://localhost:9528/api/health"
    ["lowcode-platform"]="http://localhost:3000/api/health"
    ["amis-backend"]="http://localhost:9522/api/v1/health"
    ["designer"]="http://localhost:9555"
)

declare -A SERVICE_PORTS=(
    ["frontend"]=9527
    ["backend"]=9528
    ["lowcode-platform"]=3000
    ["amis-backend"]=9522
    ["designer"]=9555
    ["postgres"]=25432
    ["redis"]=26379
)

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> "$LOG_FILE"
}

log_metric() {
    echo -e "${CYAN}[METRIC]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [METRIC] $1" >> "$LOG_FILE"
}

# 初始化日志目录
init_logging() {
    mkdir -p logs
    touch "$LOG_FILE"
}

# 显示帮助信息
show_help() {
    cat << EOF
Soybean Admin 微服务系统监控脚本

用法: $0 [选项]

选项:
    status      显示所有服务状态
    health      执行健康检查
    metrics     显示系统指标
    services    检查服务可用性
    docker      显示Docker容器状态
    logs        显示最近的监控日志
    watch       持续监控模式
    alert       检查告警条件
    report      生成监控报告
    help        显示此帮助信息

示例:
    $0 status       # 显示服务状态
    $0 watch        # 持续监控
    $0 metrics      # 显示系统指标
    $0 report       # 生成报告

EOF
}

# 检查服务状态
check_service_status() {
    local service=$1
    local port=${SERVICE_PORTS[$service]}
    
    if lsof -i :$port &> /dev/null; then
        echo -e "${GREEN}✓${NC} $service (端口 $port)"
        return 0
    else
        echo -e "${RED}✗${NC} $service (端口 $port)"
        return 1
    fi
}

# 显示所有服务状态
show_status() {
    echo -e "${PURPLE}=== 服务状态检查 ===${NC}"
    echo
    
    local total=0
    local running=0
    
    for service in "${!SERVICE_PORTS[@]}"; do
        total=$((total + 1))
        if check_service_status "$service"; then
            running=$((running + 1))
        fi
    done
    
    echo
    echo -e "运行中: ${GREEN}$running${NC}/$total 个服务"
    
    if [ $running -eq $total ]; then
        log_success "所有服务运行正常"
    else
        log_warning "$((total - running)) 个服务未运行"
    fi
}

# 健康检查
health_check() {
    echo -e "${PURPLE}=== 健康检查 ===${NC}"
    echo
    
    local healthy=0
    local total=0
    
    for service in "${!SERVICES[@]}"; do
        total=$((total + 1))
        local url=${SERVICES[$service]}
        
        echo -n "检查 $service... "
        
        if curl -s --max-time 10 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}健康${NC}"
            healthy=$((healthy + 1))
        else
            echo -e "${RED}不健康${NC}"
            log_error "$service 健康检查失败"
        fi
    done
    
    echo
    echo -e "健康服务: ${GREEN}$healthy${NC}/$total"
    
    if [ $healthy -eq $total ]; then
        log_success "所有服务健康检查通过"
    else
        log_error "$((total - healthy)) 个服务健康检查失败"
    fi
}

# 获取系统指标
get_system_metrics() {
    echo -e "${PURPLE}=== 系统指标 ===${NC}"
    echo
    
    # CPU 使用率
    if command -v top &> /dev/null; then
        local cpu_usage=$(top -l 1 -s 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' 2>/dev/null || echo "0")
        echo -e "CPU 使用率: ${CYAN}${cpu_usage}%${NC}"
        log_metric "CPU使用率: ${cpu_usage}%"
        
        if (( $(echo "$cpu_usage > $ALERT_THRESHOLD_CPU" | bc -l 2>/dev/null || echo 0) )); then
            log_warning "CPU使用率过高: ${cpu_usage}%"
        fi
    fi
    
    # 内存使用率
    if command -v free &> /dev/null; then
        local mem_info=$(free | grep Mem)
        local total_mem=$(echo $mem_info | awk '{print $2}')
        local used_mem=$(echo $mem_info | awk '{print $3}')
        local mem_usage=$(( used_mem * 100 / total_mem ))
        echo -e "内存使用率: ${CYAN}${mem_usage}%${NC}"
        log_metric "内存使用率: ${mem_usage}%"
        
        if [ $mem_usage -gt $ALERT_THRESHOLD_MEMORY ]; then
            log_warning "内存使用率过高: ${mem_usage}%"
        fi
    elif command -v vm_stat &> /dev/null; then
        # macOS
        local vm_stat_output=$(vm_stat)
        local pages_free=$(echo "$vm_stat_output" | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
        local pages_active=$(echo "$vm_stat_output" | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
        local pages_inactive=$(echo "$vm_stat_output" | grep "Pages inactive" | awk '{print $3}' | sed 's/\.//')
        local pages_wired=$(echo "$vm_stat_output" | grep "Pages wired down" | awk '{print $4}' | sed 's/\.//')
        
        local total_pages=$((pages_free + pages_active + pages_inactive + pages_wired))
        local used_pages=$((pages_active + pages_inactive + pages_wired))
        local mem_usage=$((used_pages * 100 / total_pages))
        
        echo -e "内存使用率: ${CYAN}${mem_usage}%${NC}"
        log_metric "内存使用率: ${mem_usage}%"
    fi
    
    # 磁盘使用率
    local disk_usage=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    echo -e "磁盘使用率: ${CYAN}${disk_usage}%${NC}"
    log_metric "磁盘使用率: ${disk_usage}%"
    
    if [ $disk_usage -gt $ALERT_THRESHOLD_DISK ]; then
        log_warning "磁盘使用率过高: ${disk_usage}%"
    fi
    
    # 负载平均值
    if command -v uptime &> /dev/null; then
        local load_avg=$(uptime | awk -F'load average:' '{print $2}' | xargs)
        echo -e "负载平均值: ${CYAN}${load_avg}${NC}"
        log_metric "负载平均值: ${load_avg}"
    fi
    
    echo
}

# Docker 容器状态
show_docker_status() {
    echo -e "${PURPLE}=== Docker 容器状态 ===${NC}"
    echo
    
    if ! command -v docker &> /dev/null; then
        log_warning "Docker 未安装"
        return
    fi
    
    if ! docker ps &> /dev/null; then
        log_error "无法连接到 Docker daemon"
        return
    fi
    
    # 显示容器状态
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo
    
    # 统计容器状态
    local running=$(docker ps -q | wc -l | xargs)
    local total=$(docker ps -a -q | wc -l | xargs)
    
    echo -e "运行中容器: ${GREEN}$running${NC}/$total"
    log_metric "Docker容器: $running/$total 运行中"
}

# 显示监控日志
show_logs() {
    echo -e "${PURPLE}=== 最近监控日志 ===${NC}"
    echo
    
    if [ -f "$LOG_FILE" ]; then
        tail -n 50 "$LOG_FILE"
    else
        log_warning "监控日志文件不存在"
    fi
}

# 持续监控模式
watch_mode() {
    echo -e "${PURPLE}=== 持续监控模式 (间隔: ${MONITOR_INTERVAL}秒) ===${NC}"
    echo -e "按 ${YELLOW}Ctrl+C${NC} 退出监控"
    echo
    
    while true; do
        clear
        echo -e "${BLUE}$(date '+%Y-%m-%d %H:%M:%S')${NC} - Soybean Admin 系统监控"
        echo "=================================================="
        
        show_status
        echo
        get_system_metrics
        
        if command -v docker &> /dev/null; then
            show_docker_status
        fi
        
        echo
        echo -e "下次更新: $(date -d "+${MONITOR_INTERVAL} seconds" '+%H:%M:%S')"
        
        sleep $MONITOR_INTERVAL
    done
}

# 检查告警条件
check_alerts() {
    echo -e "${PURPLE}=== 告警检查 ===${NC}"
    echo
    
    local alerts=0
    
    # 检查服务状态
    for service in "${!SERVICE_PORTS[@]}"; do
        if ! check_service_status "$service" > /dev/null; then
            log_error "告警: $service 服务未运行"
            alerts=$((alerts + 1))
        fi
    done
    
    # 检查健康状态
    for service in "${!SERVICES[@]}"; do
        local url=${SERVICES[$service]}
        if ! curl -s --max-time 5 "$url" > /dev/null 2>&1; then
            log_error "告警: $service 健康检查失败"
            alerts=$((alerts + 1))
        fi
    done
    
    if [ $alerts -eq 0 ]; then
        log_success "无告警"
    else
        log_error "发现 $alerts 个告警"
    fi
    
    echo -e "告警数量: ${RED}$alerts${NC}"
}

# 生成监控报告
generate_report() {
    local report_file="logs/monitor_report_$(date +%Y%m%d_%H%M%S).txt"
    
    echo -e "${PURPLE}=== 生成监控报告 ===${NC}"
    echo
    
    {
        echo "Soybean Admin 微服务系统监控报告"
        echo "生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "=================================================="
        echo
        
        echo "=== 服务状态 ==="
        for service in "${!SERVICE_PORTS[@]}"; do
            local port=${SERVICE_PORTS[$service]}
            if lsof -i :$port &> /dev/null; then
                echo "$service (端口 $port): 运行中"
            else
                echo "$service (端口 $port): 未运行"
            fi
        done
        echo
        
        echo "=== 健康检查 ==="
        for service in "${!SERVICES[@]}"; do
            local url=${SERVICES[$service]}
            if curl -s --max-time 10 "$url" > /dev/null 2>&1; then
                echo "$service: 健康"
            else
                echo "$service: 不健康"
            fi
        done
        echo
        
        echo "=== 系统指标 ==="
        if command -v df &> /dev/null; then
            echo "磁盘使用情况:"
            df -h
        fi
        echo
        
        if command -v docker &> /dev/null && docker ps &> /dev/null; then
            echo "Docker 容器状态:"
            docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        fi
        echo
        
        echo "=== 最近日志 ==="
        if [ -f "$LOG_FILE" ]; then
            tail -n 20 "$LOG_FILE"
        fi
        
    } > "$report_file"
    
    log_success "监控报告已生成: $report_file"
    echo -e "报告文件: ${CYAN}$report_file${NC}"
}

# 主函数
main() {
    init_logging
    
    case "${1:-help}" in
        status)
            show_status
            ;;
        health)
            health_check
            ;;
        metrics)
            get_system_metrics
            ;;
        services)
            show_status
            health_check
            ;;
        docker)
            show_docker_status
            ;;
        logs)
            show_logs
            ;;
        watch)
            watch_mode
            ;;
        alert)
            check_alerts
            ;;
        report)
            generate_report
            ;;
        help|*)
            show_help
            ;;
    esac
}

# 捕获中断信号
trap 'echo -e "\n${YELLOW}监控已停止${NC}"; exit 0' INT

# 执行主函数
main "$@"
