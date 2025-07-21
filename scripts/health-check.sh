#!/bin/bash

# Low-code Platform Health Check Script
# This script checks the health of all services in the platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=10
RETRY_COUNT=3

# Service endpoints
declare -A SERVICES=(
    ["Frontend"]="http://localhost:9527"
    ["Low-code Designer"]="http://localhost:9555"
    ["Backend API"]="http://localhost:9528/v1/route/getConstantRoutes"
    ["Low-code Platform"]="http://localhost:3000/api/v1/health"
    ["Amis Backend"]="http://localhost:9522/api/v1/health"
    ["PostgreSQL"]="localhost:25432"
    ["Redis"]="localhost:26379"
)

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check HTTP service
check_http_service() {
    local name="$1"
    local url="$2"
    local timeout="$3"
    
    for i in $(seq 1 $RETRY_COUNT); do
        if curl -f -s --max-time "$timeout" "$url" > /dev/null 2>&1; then
            log_success "$name is healthy"
            return 0
        fi
        
        if [ $i -lt $RETRY_COUNT ]; then
            log_warning "$name check failed (attempt $i/$RETRY_COUNT), retrying..."
            sleep 2
        fi
    done
    
    log_error "$name is unhealthy"
    return 1
}

# Check PostgreSQL
check_postgresql() {
    local host="localhost"
    local port="25432"
    local timeout="$1"
    
    for i in $(seq 1 $RETRY_COUNT); do
        if timeout "$timeout" bash -c "</dev/tcp/$host/$port" > /dev/null 2>&1; then
            log_success "PostgreSQL is healthy"
            return 0
        fi
        
        if [ $i -lt $RETRY_COUNT ]; then
            log_warning "PostgreSQL check failed (attempt $i/$RETRY_COUNT), retrying..."
            sleep 2
        fi
    done
    
    log_error "PostgreSQL is unhealthy"
    return 1
}

# Check Redis
check_redis() {
    local host="localhost"
    local port="26379"
    local timeout="$1"
    
    for i in $(seq 1 $RETRY_COUNT); do
        if timeout "$timeout" bash -c "</dev/tcp/$host/$port" > /dev/null 2>&1; then
            log_success "Redis is healthy"
            return 0
        fi
        
        if [ $i -lt $RETRY_COUNT ]; then
            log_warning "Redis check failed (attempt $i/$RETRY_COUNT), retrying..."
            sleep 2
        fi
    done
    
    log_error "Redis is unhealthy"
    return 1
}

# Check Docker containers
check_docker_containers() {
    log_info "Checking Docker containers..."
    
    # Use docker-compose or docker compose based on availability
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    # Check if containers are running
    containers=$($COMPOSE_CMD ps --services 2>/dev/null || echo "")
    
    if [ -z "$containers" ]; then
        log_error "No Docker containers found. Is the platform deployed?"
        return 1
    fi
    
    local all_healthy=true
    
    for container in $containers; do
        status=$($COMPOSE_CMD ps "$container" 2>/dev/null | tail -n +2 | awk '{print $3}')
        
        if [[ "$status" == *"Up"* ]] || [[ "$status" == *"healthy"* ]]; then
            log_success "Container $container is running"
        else
            log_error "Container $container is not running (status: $status)"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        return 0
    else
        return 1
    fi
}

# Get system resources
check_system_resources() {
    log_info "Checking system resources..."
    
    # Check disk space
    disk_usage=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        log_error "Disk usage is high: ${disk_usage}%"
    elif [ "$disk_usage" -gt 80 ]; then
        log_warning "Disk usage is moderate: ${disk_usage}%"
    else
        log_success "Disk usage is normal: ${disk_usage}%"
    fi
    
    # Check memory usage
    if command -v free &> /dev/null; then
        memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
        if [ "$memory_usage" -gt 90 ]; then
            log_error "Memory usage is high: ${memory_usage}%"
        elif [ "$memory_usage" -gt 80 ]; then
            log_warning "Memory usage is moderate: ${memory_usage}%"
        else
            log_success "Memory usage is normal: ${memory_usage}%"
        fi
    fi
    
    # Check Docker resources
    if command -v docker &> /dev/null; then
        docker_containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -c "Up" || echo "0")
        log_info "Docker containers running: $docker_containers"
        
        # Check Docker system usage
        docker_usage=$(docker system df --format "table {{.Type}}\t{{.Size}}" 2>/dev/null || echo "")
        if [ -n "$docker_usage" ]; then
            log_info "Docker system usage:"
            echo "$docker_usage" | while read -r line; do
                echo "  $line"
            done
        fi
    fi
}

# Generate health report
generate_health_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_file="health-report-$(date '+%Y%m%d-%H%M%S').txt"
    
    {
        echo "Low-code Platform Health Report"
        echo "Generated at: $timestamp"
        echo "================================"
        echo ""
        
        echo "Service Status:"
        for service in "${!SERVICES[@]}"; do
            url="${SERVICES[$service]}"
            if [[ "$service" == "PostgreSQL" ]]; then
                if check_postgresql $TIMEOUT >/dev/null 2>&1; then
                    echo "  ✅ $service: Healthy"
                else
                    echo "  ❌ $service: Unhealthy"
                fi
            elif [[ "$service" == "Redis" ]]; then
                if check_redis $TIMEOUT >/dev/null 2>&1; then
                    echo "  ✅ $service: Healthy"
                else
                    echo "  ❌ $service: Unhealthy"
                fi
            else
                if check_http_service "$service" "$url" $TIMEOUT >/dev/null 2>&1; then
                    echo "  ✅ $service: Healthy"
                else
                    echo "  ❌ $service: Unhealthy"
                fi
            fi
        done
        
        echo ""
        echo "System Resources:"
        disk_usage=$(df -h . | tail -1 | awk '{print $5}')
        echo "  Disk Usage: $disk_usage"
        
        if command -v free &> /dev/null; then
            memory_usage=$(free | grep Mem | awk '{printf "%.0f%%", $3/$2 * 100.0}')
            echo "  Memory Usage: $memory_usage"
        fi
        
        if command -v docker &> /dev/null; then
            docker_containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -c "Up" || echo "0")
            echo "  Docker Containers: $docker_containers running"
        fi
        
    } > "$report_file"
    
    log_success "Health report generated: $report_file"
}

# Main health check function
main() {
    echo "🏥 Low-code Platform Health Check"
    echo "================================="
    echo ""
    
    local overall_health=true
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --retry)
                RETRY_COUNT="$2"
                shift 2
                ;;
            --report)
                generate_health_report
                exit 0
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --timeout SECONDS    Set timeout for health checks (default: 10)"
                echo "  --retry COUNT        Set retry count for failed checks (default: 3)"
                echo "  --report            Generate detailed health report"
                echo "  --help              Show this help message"
                echo ""
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check Docker containers first
    if ! check_docker_containers; then
        overall_health=false
    fi
    
    echo ""
    
    # Check each service
    for service in "${!SERVICES[@]}"; do
        url="${SERVICES[$service]}"
        
        if [[ "$service" == "PostgreSQL" ]]; then
            if ! check_postgresql $TIMEOUT; then
                overall_health=false
            fi
        elif [[ "$service" == "Redis" ]]; then
            if ! check_redis $TIMEOUT; then
                overall_health=false
            fi
        else
            if ! check_http_service "$service" "$url" $TIMEOUT; then
                overall_health=false
            fi
        fi
    done
    
    echo ""
    check_system_resources
    
    echo ""
    if [ "$overall_health" = true ]; then
        log_success "🎉 All services are healthy!"
        exit 0
    else
        log_error "💥 Some services are unhealthy!"
        echo ""
        log_info "Troubleshooting tips:"
        echo "  1. Check Docker container logs: docker-compose logs [service-name]"
        echo "  2. Restart unhealthy services: docker-compose restart [service-name]"
        echo "  3. Check system resources and free up space if needed"
        echo "  4. Verify network connectivity and firewall settings"
        exit 1
    fi
}

# Handle script interruption
trap 'log_error "Health check interrupted"; exit 1' INT TERM

# Run main function
main "$@"
