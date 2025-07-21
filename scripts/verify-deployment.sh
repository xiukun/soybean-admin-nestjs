#!/bin/bash

# Low-code Platform Deployment Verification Script
# This script verifies that the deployment is successful and all components are working

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=30
MAX_RETRIES=5

# Service URLs
FRONTEND_URL="http://localhost:9527"
DESIGNER_URL="http://localhost:9555"
BACKEND_URL="http://localhost:9528"
LOWCODE_URL="http://localhost:3000"
AMIS_URL="http://localhost:9522"

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

log_step() {
    echo -e "${PURPLE}🔍 $1${NC}"
}

# Wait for service to be ready
wait_for_service() {
    local name="$1"
    local url="$2"
    local retries=0
    
    log_step "Waiting for $name to be ready..."
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f -s --max-time $TIMEOUT "$url" >/dev/null 2>&1; then
            log_success "$name is ready"
            return 0
        fi
        
        retries=$((retries + 1))
        log_info "Attempt $retries/$MAX_RETRIES - waiting 10 seconds..."
        sleep 10
    done
    
    log_error "$name failed to become ready after $MAX_RETRIES attempts"
    return 1
}

# Check service health
check_service_health() {
    local name="$1"
    local url="$2"
    local health_endpoint="$3"
    
    log_step "Checking $name health..."
    
    # Check basic connectivity
    if ! curl -f -s --max-time $TIMEOUT "$url" >/dev/null 2>&1; then
        log_error "$name is not accessible at $url"
        return 1
    fi
    
    # Check health endpoint if provided
    if [ -n "$health_endpoint" ]; then
        local health_url="$url$health_endpoint"
        if curl -f -s --max-time $TIMEOUT "$health_url" | jq -e '.status' >/dev/null 2>&1; then
            log_success "$name health check passed"
        else
            log_warning "$name health endpoint returned unexpected response"
        fi
    else
        log_success "$name is accessible"
    fi
    
    return 0
}

# Verify Docker containers
verify_containers() {
    log_step "Verifying Docker containers..."
    
    # Get compose command
    local compose_cmd
    if command -v docker-compose &> /dev/null; then
        compose_cmd="docker-compose"
    else
        compose_cmd="docker compose"
    fi
    
    # Check if containers are running
    local containers
    containers=$($compose_cmd ps --services 2>/dev/null || echo "")
    
    if [ -z "$containers" ]; then
        log_error "No Docker containers found. Is the platform deployed?"
        return 1
    fi
    
    local all_running=true
    
    for container in $containers; do
        local status
        status=$($compose_cmd ps "$container" 2>/dev/null | tail -n +2 | awk '{print $3}' || echo "")
        
        if [[ "$status" == *"Up"* ]] || [[ "$status" == *"healthy"* ]]; then
            log_success "Container $container is running"
        else
            log_error "Container $container is not running (status: $status)"
            all_running=false
        fi
    done
    
    if [ "$all_running" = true ]; then
        log_success "All containers are running"
        return 0
    else
        log_error "Some containers are not running"
        return 1
    fi
}

# Verify database connectivity
verify_database() {
    log_step "Verifying database connectivity..."
    
    # Check PostgreSQL
    if docker-compose exec -T postgres pg_isready -U soybean >/dev/null 2>&1; then
        log_success "PostgreSQL is ready"
    else
        log_error "PostgreSQL is not ready"
        return 1
    fi
    
    # Check Redis
    if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        log_success "Redis is ready"
    else
        log_error "Redis is not ready"
        return 1
    fi
    
    return 0
}

# Verify API endpoints
verify_apis() {
    log_step "Verifying API endpoints..."
    
    # Backend API
    if curl -f -s --max-time $TIMEOUT "$BACKEND_URL/v1/route/getConstantRoutes" | jq -e '.data' >/dev/null 2>&1; then
        log_success "Backend API is working"
    else
        log_error "Backend API is not working"
        return 1
    fi
    
    # Low-code Platform API
    if curl -f -s --max-time $TIMEOUT "$LOWCODE_URL/api/v1/health" | jq -e '.status' >/dev/null 2>&1; then
        log_success "Low-code Platform API is working"
    else
        log_error "Low-code Platform API is not working"
        return 1
    fi
    
    # Amis Backend API
    if curl -f -s --max-time $TIMEOUT "$AMIS_URL/api/v1/health" | jq -e '.status' >/dev/null 2>&1; then
        log_success "Amis Backend API is working"
    else
        log_warning "Amis Backend API is not responding (this may be normal if no code is generated yet)"
    fi
    
    return 0
}

# Verify file system
verify_filesystem() {
    log_step "Verifying file system..."
    
    # Check required directories
    local directories=("generated-code" "amis-generated" "logs" "amis-logs" "uploads")
    
    for dir in "${directories[@]}"; do
        if [ -d "$dir" ]; then
            log_success "Directory $dir exists"
        else
            log_warning "Directory $dir does not exist (will be created when needed)"
        fi
    done
    
    # Check write permissions
    if touch test_write_permission 2>/dev/null && rm test_write_permission 2>/dev/null; then
        log_success "Write permissions are correct"
    else
        log_error "Write permissions are not correct"
        return 1
    fi
    
    return 0
}

# Verify system resources
verify_resources() {
    log_step "Verifying system resources..."
    
    # Check disk space
    local disk_usage
    disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 80 ]; then
        log_success "Disk usage is normal ($disk_usage%)"
    elif [ "$disk_usage" -lt 90 ]; then
        log_warning "Disk usage is moderate ($disk_usage%)"
    else
        log_error "Disk usage is high ($disk_usage%)"
    fi
    
    # Check memory usage (if available)
    if command -v free &> /dev/null; then
        local memory_usage
        memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
        
        if [ "$memory_usage" -lt 80 ]; then
            log_success "Memory usage is normal ($memory_usage%)"
        elif [ "$memory_usage" -lt 90 ]; then
            log_warning "Memory usage is moderate ($memory_usage%)"
        else
            log_error "Memory usage is high ($memory_usage%)"
        fi
    fi
    
    return 0
}

# Show deployment summary
show_deployment_summary() {
    echo ""
    echo "🎉 Deployment Verification Complete!"
    echo "===================================="
    echo ""
    echo "📋 Service URLs:"
    echo "  🌐 Frontend (Soybean Admin): $FRONTEND_URL"
    echo "  🎨 Low-code Designer: $DESIGNER_URL"
    echo "  🔧 Backend API: $BACKEND_URL"
    echo "  🚀 Low-code Platform API: $LOWCODE_URL"
    echo "  📊 Amis Backend API: $AMIS_URL"
    echo ""
    echo "🗄️  Database Services:"
    echo "  📊 PostgreSQL: localhost:25432"
    echo "  🔴 Redis: localhost:26379"
    echo ""
    echo "🛠️  Management Commands:"
    echo "  ./scripts/manage.sh status     # Check service status"
    echo "  ./scripts/manage.sh logs       # View logs"
    echo "  ./scripts/manage.sh health     # Run health check"
    echo "  ./scripts/manage.sh backup     # Create backup"
    echo ""
    echo "🧪 Testing:"
    echo "  ./scripts/integration-test.sh  # Run integration tests"
    echo "  ./scripts/health-check.sh      # Detailed health check"
    echo ""
    echo "📚 Documentation:"
    echo "  DOCKER_DEPLOYMENT.md          # Deployment guide"
    echo "  README.md                      # Project documentation"
    echo ""
}

# Main verification function
main() {
    echo "🔍 Low-code Platform Deployment Verification"
    echo "============================================"
    echo ""
    
    local verification_failed=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --retries)
                MAX_RETRIES="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --timeout SECONDS    Set timeout for HTTP requests (default: 30)"
                echo "  --retries COUNT      Set max retries for service checks (default: 5)"
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
    
    # Check prerequisites
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed"
        exit 1
    fi
    
    # Run verification steps
    echo "Starting verification process..."
    echo ""
    
    # Step 1: Verify Docker containers
    if ! verify_containers; then
        verification_failed=true
    fi
    
    echo ""
    
    # Step 2: Verify database connectivity
    if ! verify_database; then
        verification_failed=true
    fi
    
    echo ""
    
    # Step 3: Wait for services to be ready
    wait_for_service "Frontend" "$FRONTEND_URL" || verification_failed=true
    wait_for_service "Backend API" "$BACKEND_URL/v1/route/getConstantRoutes" || verification_failed=true
    wait_for_service "Low-code Platform" "$LOWCODE_URL/api/v1/health" || verification_failed=true
    wait_for_service "Amis Backend" "$AMIS_URL/api/v1/health" || true  # Don't fail if Amis is not ready
    
    echo ""
    
    # Step 4: Check service health
    check_service_health "Frontend" "$FRONTEND_URL" "" || verification_failed=true
    check_service_health "Backend API" "$BACKEND_URL" "/v1/route/getConstantRoutes" || verification_failed=true
    check_service_health "Low-code Platform" "$LOWCODE_URL" "/api/v1/health" || verification_failed=true
    check_service_health "Amis Backend" "$AMIS_URL" "/api/v1/health" || true  # Don't fail if Amis is not ready
    
    echo ""
    
    # Step 5: Verify API endpoints
    if ! verify_apis; then
        verification_failed=true
    fi
    
    echo ""
    
    # Step 6: Verify file system
    if ! verify_filesystem; then
        verification_failed=true
    fi
    
    echo ""
    
    # Step 7: Verify system resources
    verify_resources  # Don't fail on resource warnings
    
    echo ""
    
    # Show results
    if [ "$verification_failed" = true ]; then
        log_error "💥 Deployment verification failed!"
        echo ""
        echo "🔧 Troubleshooting steps:"
        echo "  1. Check container logs: ./scripts/manage.sh logs"
        echo "  2. Restart failed services: ./scripts/manage.sh restart [service-name]"
        echo "  3. Run health check: ./scripts/health-check.sh"
        echo "  4. Check system resources: docker stats"
        echo ""
        exit 1
    else
        show_deployment_summary
        log_success "🎉 All verification checks passed! The platform is ready to use."
        exit 0
    fi
}

# Handle script interruption
trap 'log_error "Verification interrupted"; exit 1' INT TERM

# Run main function
main "$@"
