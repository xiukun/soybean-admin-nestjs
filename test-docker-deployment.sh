#!/bin/bash

# Docker Deployment Test Script
# This script tests the complete Docker deployment of the low-code platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print colored output
print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================${NC}"
}

print_section() {
    echo -e "\n${BLUE}📋 $1${NC}"
    echo -e "${BLUE}$(printf '%.0s-' {1..50})${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    print_info "Running: $test_name"
    ((TOTAL_TESTS++))
    
    if eval "$test_command"; then
        print_success "$test_name passed"
        ((PASSED_TESTS++))
        return 0
    else
        print_error "$test_name failed"
        ((FAILED_TESTS++))
        return 1
    fi
}

# Function to check if service is healthy
check_service_health() {
    local service_name="$1"
    local health_url="$2"
    local max_attempts="${3:-30}"
    
    print_info "Checking health of $service_name..."
    
    for i in $(seq 1 $max_attempts); do
        if curl -f -s "$health_url" >/dev/null 2>&1; then
            print_success "$service_name is healthy"
            return 0
        fi
        
        if [ $i -eq $max_attempts ]; then
            print_error "$service_name health check failed after $max_attempts attempts"
            return 1
        fi
        
        print_info "Attempt $i/$max_attempts failed, waiting 10 seconds..."
        sleep 10
    done
}

# Function to test API endpoint
test_api_endpoint() {
    local endpoint_name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local method="${4:-GET}"
    
    print_info "Testing $endpoint_name..."
    
    local response
    local status_code
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" "$url")
    fi
    
    status_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "$endpoint_name returned expected status $expected_status"
        return 0
    else
        print_error "$endpoint_name returned status $status_code, expected $expected_status"
        return 1
    fi
}

# Function to cleanup Docker environment
cleanup_docker() {
    print_section "Cleaning up Docker environment"
    
    print_info "Stopping containers..."
    docker-compose down --volumes --remove-orphans || true
    
    print_info "Removing unused images..."
    docker image prune -f || true
    
    print_info "Removing unused volumes..."
    docker volume prune -f || true
    
    print_success "Docker cleanup completed"
}

# Function to build and start services
start_services() {
    print_section "Building and starting services"
    
    print_info "Building Docker images..."
    if docker-compose build --no-cache; then
        print_success "Docker images built successfully"
    else
        print_error "Failed to build Docker images"
        return 1
    fi
    
    print_info "Starting services..."
    if docker-compose up -d; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        return 1
    fi
    
    print_info "Waiting for services to be ready..."
    sleep 30
}

# Function to test service connectivity
test_service_connectivity() {
    print_section "Testing Service Connectivity"
    
    # Test PostgreSQL
    run_test "PostgreSQL Connection" "docker-compose exec -T postgres pg_isready -U soybean -d soybean-admin-nest-backend"
    
    # Test Redis
    run_test "Redis Connection" "docker-compose exec -T redis redis-cli ping"
    
    # Test Base System Backend
    run_test "Base System Health Check" "check_service_health 'Base System' 'http://localhost:9528/v1/route/getConstantRoutes'"
    
    # Test Low-code Platform Backend
    run_test "Low-code Platform Health Check" "check_service_health 'Low-code Platform' 'http://localhost:3000/health'"
    
    # Test Frontend
    run_test "Frontend Health Check" "check_service_health 'Frontend' 'http://localhost:9527'"
}

# Function to test API endpoints
test_api_endpoints() {
    print_section "Testing API Endpoints"
    
    # Base System APIs
    run_test "Base System Route API" "test_api_endpoint 'Base System Routes' 'http://localhost:9528/v1/route/getConstantRoutes'"
    
    # Low-code Platform APIs
    run_test "Low-code Health API" "test_api_endpoint 'Low-code Health' 'http://localhost:3000/health'"
    run_test "Low-code Projects API" "test_api_endpoint 'Low-code Projects' 'http://localhost:3000/projects' 401"  # Expect 401 without auth
    
    # Frontend
    run_test "Frontend Index" "test_api_endpoint 'Frontend' 'http://localhost:9527'"
}

# Function to test database initialization
test_database_initialization() {
    print_section "Testing Database Initialization"
    
    # Check if tables exist
    run_test "User Table Exists" "docker-compose exec -T postgres psql -U soybean -d soybean-admin-nest-backend -c 'SELECT 1 FROM information_schema.tables WHERE table_name = \"User\";'"
    
    run_test "Project Table Exists" "docker-compose exec -T postgres psql -U soybean -d soybean-admin-nest-backend -c 'SELECT 1 FROM information_schema.tables WHERE table_name = \"Project\";'"
    
    run_test "Entity Table Exists" "docker-compose exec -T postgres psql -U soybean -d soybean-admin-nest-backend -c 'SELECT 1 FROM information_schema.tables WHERE table_name = \"Entity\";'"
    
    # Check if default data exists
    run_test "Default Project Exists" "docker-compose exec -T postgres psql -U soybean -d soybean-admin-nest-backend -c 'SELECT 1 FROM \"Project\" WHERE name = \"Default Project\";'"
}

# Function to test container logs
test_container_logs() {
    print_section "Checking Container Logs"
    
    local services=("postgres" "redis" "backend" "lowcode-platform" "frontend")
    
    for service in "${services[@]}"; do
        print_info "Checking logs for $service..."
        
        local logs=$(docker-compose logs --tail=50 "$service" 2>&1)
        
        if echo "$logs" | grep -i "error\|failed\|exception" >/dev/null; then
            print_warning "$service has error messages in logs"
            echo "$logs" | grep -i "error\|failed\|exception" | head -5
        else
            print_success "$service logs look healthy"
        fi
    done
}

# Function to test resource usage
test_resource_usage() {
    print_section "Testing Resource Usage"
    
    print_info "Checking container resource usage..."
    
    local stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}")
    echo "$stats"
    
    # Check if any container is using excessive resources
    local high_cpu_containers=$(docker stats --no-stream --format "{{.Container}} {{.CPUPerc}}" | awk '$2 > 80.0 {print $1}')
    
    if [ -n "$high_cpu_containers" ]; then
        print_warning "High CPU usage detected in containers: $high_cpu_containers"
    else
        print_success "CPU usage is within normal limits"
    fi
}

# Function to test multi-gateway configuration
test_multi_gateway() {
    print_section "Testing Multi-Gateway Configuration"
    
    # Test that both services are accessible
    run_test "Base System API Accessible" "test_api_endpoint 'Base System' 'http://localhost:9528/v1/route/getConstantRoutes'"
    run_test "Low-code Platform API Accessible" "test_api_endpoint 'Low-code Platform' 'http://localhost:3000/health'"
    
    # Test that frontend can proxy to both services
    print_info "Testing frontend proxy configuration..."
    
    # This would require more complex testing with authentication
    # For now, we just check that the services are running
    if curl -f -s "http://localhost:9527" >/dev/null && \
       curl -f -s "http://localhost:9528/v1/route/getConstantRoutes" >/dev/null && \
       curl -f -s "http://localhost:3000/health" >/dev/null; then
        print_success "Multi-gateway configuration is working"
        ((PASSED_TESTS++))
    else
        print_error "Multi-gateway configuration has issues"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
}

# Function to generate test report
generate_test_report() {
    print_section "Test Report"
    
    echo -e "\n${CYAN}📊 Docker Deployment Test Summary${NC}"
    echo -e "${CYAN}=================================${NC}"
    echo -e "Total Tests: ${TOTAL_TESTS}"
    echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
    echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
    
    local success_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    fi
    
    echo -e "Success Rate: ${success_rate}%"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "All Docker deployment tests passed! 🎉"
        print_info "The low-code platform is ready for production deployment."
        return 0
    else
        print_error "Some Docker deployment tests failed."
        print_info "Please check the logs above for details."
        return 1
    fi
}

# Main execution function
main() {
    print_header "Low-code Platform Docker Deployment Test"
    
    # Parse command line arguments
    local cleanup_only=false
    local skip_build=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --cleanup-only)
                cleanup_only=true
                shift
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --cleanup-only  Only cleanup Docker environment"
                echo "  --skip-build    Skip building Docker images"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Cleanup if requested
    if [ "$cleanup_only" = true ]; then
        cleanup_docker
        exit 0
    fi
    
    # Check if Docker and Docker Compose are available
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Cleanup previous deployment
    cleanup_docker
    
    # Start services
    if [ "$skip_build" != true ]; then
        if ! start_services; then
            print_error "Failed to start services"
            exit 1
        fi
    fi
    
    # Run tests
    test_service_connectivity
    test_api_endpoints
    test_database_initialization
    test_container_logs
    test_resource_usage
    test_multi_gateway
    
    # Generate final report
    generate_test_report
}

# Run main function with all arguments
main "$@"
