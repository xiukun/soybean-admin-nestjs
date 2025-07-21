#!/bin/bash

# Low-code Platform Integration Test Script
# This script performs comprehensive testing of the entire platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_TIMEOUT=30
API_BASE_URL="http://localhost"
BACKEND_PORT=9528
LOWCODE_PORT=3000
AMIS_PORT=9522
FRONTEND_PORT=9527
DESIGNER_PORT=9555

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

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

# Test helper functions
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log_info "Running test: $test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        log_success "PASS: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        log_error "FAIL: $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# HTTP test helper
test_http_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    run_test "$name" "curl -f -s --max-time $TEST_TIMEOUT -o /dev/null -w '%{http_code}' '$url' | grep -q '$expected_status'"
}

# JSON API test helper
test_json_api() {
    local name="$1"
    local url="$2"
    local expected_field="$3"
    
    run_test "$name" "curl -f -s --max-time $TEST_TIMEOUT '$url' | jq -e '.$expected_field' >/dev/null"
}

# Database connectivity test
test_database_connectivity() {
    log_info "Testing database connectivity..."
    
    # Test PostgreSQL connection
    run_test "PostgreSQL Connection" "docker-compose exec -T postgres pg_isready -U soybean"
    
    # Test database query
    run_test "Database Query" "docker-compose exec -T postgres psql -U soybean -d soybean-admin-nest-backend -c 'SELECT 1;'"
    
    # Test Redis connection
    run_test "Redis Connection" "docker-compose exec -T redis redis-cli ping | grep -q PONG"
}

# Service health tests
test_service_health() {
    log_info "Testing service health..."
    
    # Test frontend
    test_http_endpoint "Frontend Health" "$API_BASE_URL:$FRONTEND_PORT"
    
    # Test backend API
    test_http_endpoint "Backend API Health" "$API_BASE_URL:$BACKEND_PORT/v1/route/getConstantRoutes"
    
    # Test low-code platform
    test_json_api "Low-code Platform Health" "$API_BASE_URL:$LOWCODE_PORT/api/v1/health" "status"
    
    # Test Amis backend
    test_json_api "Amis Backend Health" "$API_BASE_URL:$AMIS_PORT/api/v1/health" "status"
    
    # Test designer
    test_http_endpoint "Designer Health" "$API_BASE_URL:$DESIGNER_PORT"
}

# API functionality tests
test_api_functionality() {
    log_info "Testing API functionality..."
    
    # Test backend API endpoints
    test_json_api "Backend Routes API" "$API_BASE_URL:$BACKEND_PORT/v1/route/getConstantRoutes" "data"
    
    # Test low-code platform APIs
    test_json_api "Projects API" "$API_BASE_URL:$LOWCODE_PORT/api/v1/projects" "data"
    test_json_api "Templates API" "$API_BASE_URL:$LOWCODE_PORT/api/v1/templates" "data"
    test_json_api "Entities API" "$API_BASE_URL:$LOWCODE_PORT/api/v1/entities" "data"
    
    # Test Amis backend APIs (if available)
    test_http_endpoint "Amis API Endpoints" "$API_BASE_URL:$AMIS_PORT/api/v1/health" "200"
}

# Integration workflow tests
test_integration_workflows() {
    log_info "Testing integration workflows..."
    
    # Test project creation workflow
    local project_data='{"name":"Test Project","code":"test-project","description":"Integration test project"}'
    run_test "Create Project" "curl -f -s --max-time $TEST_TIMEOUT -X POST -H 'Content-Type: application/json' -d '$project_data' '$API_BASE_URL:$LOWCODE_PORT/api/v1/projects' | jq -e '.data.id'"
    
    # Test entity creation workflow
    local entity_data='{"name":"Test Entity","code":"TestEntity","tableName":"test_entities","description":"Integration test entity"}'
    run_test "Create Entity" "curl -f -s --max-time $TEST_TIMEOUT -X POST -H 'Content-Type: application/json' -d '$entity_data' '$API_BASE_URL:$LOWCODE_PORT/api/v1/entities' | jq -e '.data.id'"
    
    # Test template management
    run_test "List Templates" "curl -f -s --max-time $TEST_TIMEOUT '$API_BASE_URL:$LOWCODE_PORT/api/v1/templates' | jq -e '.data | length >= 0'"
}

# Performance tests
test_performance() {
    log_info "Testing performance..."
    
    # Test response times
    local response_time=$(curl -f -s --max-time $TEST_TIMEOUT -o /dev/null -w '%{time_total}' "$API_BASE_URL:$BACKEND_PORT/v1/route/getConstantRoutes")
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        log_success "PASS: Backend Response Time ($response_time seconds)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log_error "FAIL: Backend Response Time too slow ($response_time seconds)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Test concurrent requests
    run_test "Concurrent Requests" "for i in {1..5}; do curl -f -s --max-time $TEST_TIMEOUT '$API_BASE_URL:$LOWCODE_PORT/api/v1/health' & done; wait"
}

# Security tests
test_security() {
    log_info "Testing security..."
    
    # Test CORS headers
    run_test "CORS Headers" "curl -f -s --max-time $TEST_TIMEOUT -H 'Origin: http://localhost:9527' '$API_BASE_URL:$LOWCODE_PORT/api/v1/health' -I | grep -q 'Access-Control-Allow-Origin'"
    
    # Test API without authentication (should work for health endpoints)
    test_http_endpoint "Unauthenticated Health Check" "$API_BASE_URL:$LOWCODE_PORT/api/v1/health" "200"
    
    # Test SQL injection protection (basic test)
    test_http_endpoint "SQL Injection Protection" "$API_BASE_URL:$LOWCODE_PORT/api/v1/projects?id=1';DROP TABLE projects;--" "400|404|422"
}

# Docker container tests
test_docker_containers() {
    log_info "Testing Docker containers..."
    
    # Check if all containers are running
    local containers=("postgres" "redis" "backend" "frontend" "lowcode-platform")
    
    for container in "${containers[@]}"; do
        run_test "Container $container Running" "docker-compose ps $container | grep -q 'Up'"
    done
    
    # Check container health
    run_test "Container Health Checks" "docker-compose ps | grep -v 'Exit'"
    
    # Check resource usage
    run_test "Container Resource Usage" "docker stats --no-stream --format 'table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}' | grep -v '0.00%'"
}

# File system tests
test_file_system() {
    log_info "Testing file system..."
    
    # Check if required directories exist
    local directories=("generated-code" "logs" "uploads")
    
    for dir in "${directories[@]}"; do
        run_test "Directory $dir Exists" "[ -d '$dir' ]"
    done
    
    # Check write permissions
    run_test "Write Permissions" "touch test_write_permission && rm test_write_permission"
    
    # Check disk space
    local disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 90 ]; then
        log_success "PASS: Disk Usage ($disk_usage%)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log_error "FAIL: Disk Usage too high ($disk_usage%)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Generate test report
generate_test_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_file="integration-test-report-$(date '+%Y%m%d-%H%M%S').txt"
    
    {
        echo "Low-code Platform Integration Test Report"
        echo "Generated at: $timestamp"
        echo "========================================"
        echo ""
        echo "Test Summary:"
        echo "  Total Tests: $TOTAL_TESTS"
        echo "  Passed: $PASSED_TESTS"
        echo "  Failed: $FAILED_TESTS"
        echo "  Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
        echo ""
        
        if [ $FAILED_TESTS -eq 0 ]; then
            echo "🎉 All tests passed!"
        else
            echo "⚠️  Some tests failed. Please check the logs for details."
        fi
        
        echo ""
        echo "System Information:"
        echo "  Docker Version: $(docker --version)"
        echo "  Docker Compose Version: $(docker-compose --version 2>/dev/null || docker compose version)"
        echo "  System: $(uname -a)"
        echo "  Available Memory: $(free -h | grep Mem | awk '{print $7}' 2>/dev/null || echo 'N/A')"
        echo "  Disk Usage: $(df -h . | tail -1 | awk '{print $5}')"
        
    } > "$report_file"
    
    log_success "Test report generated: $report_file"
}

# Main test function
main() {
    echo "🧪 Low-code Platform Integration Test Suite"
    echo "==========================================="
    echo ""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --timeout)
                TEST_TIMEOUT="$2"
                shift 2
                ;;
            --report)
                GENERATE_REPORT=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --timeout SECONDS    Set timeout for HTTP requests (default: 30)"
                echo "  --report            Generate detailed test report"
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
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 10
    
    # Run test suites
    test_docker_containers
    test_database_connectivity
    test_service_health
    test_api_functionality
    test_integration_workflows
    test_performance
    test_security
    test_file_system
    
    # Generate report if requested
    if [ "$GENERATE_REPORT" = true ]; then
        generate_test_report
    fi
    
    # Print summary
    echo ""
    echo "🏁 Test Summary"
    echo "==============="
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log_success "🎉 All tests passed! The platform is working correctly."
        exit 0
    else
        log_error "💥 $FAILED_TESTS test(s) failed. Please check the logs and fix the issues."
        exit 1
    fi
}

# Handle script interruption
trap 'log_error "Test interrupted"; exit 1' INT TERM

# Run main function
main "$@"
