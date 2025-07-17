#!/bin/bash

# Comprehensive Test Runner for Low-code Platform
# This script runs all types of tests across the entire platform

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
SKIPPED_TESTS=0

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

# Function to run command and track results
run_test_command() {
    local test_name="$1"
    local command="$2"
    local directory="$3"
    
    print_info "Running: $test_name"
    
    if [ -n "$directory" ]; then
        cd "$directory"
    fi
    
    if eval "$command"; then
        print_success "$test_name passed"
        ((PASSED_TESTS++))
    else
        print_error "$test_name failed"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
    
    if [ -n "$directory" ]; then
        cd - > /dev/null
    fi
}

# Function to check if service is running
check_service() {
    local service_name="$1"
    local port="$2"
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        print_success "$service_name is running on port $port"
        return 0
    else
        print_warning "$service_name is not running on port $port"
        return 1
    fi
}

# Function to start services if needed
start_services() {
    print_section "Starting Required Services"
    
    # Check if services are already running
    local base_system_running=false
    local lowcode_platform_running=false
    
    if check_service "Base System" 9528; then
        base_system_running=true
    fi
    
    if check_service "Low-code Platform" 3000; then
        lowcode_platform_running=true
    fi
    
    # Start services if not running
    if [ "$base_system_running" = false ]; then
        print_info "Starting Base System service..."
        cd backend
        pnpm run start:dev:base-system &
        BASE_SYSTEM_PID=$!
        cd ..
        sleep 10 # Wait for service to start
    fi
    
    if [ "$lowcode_platform_running" = false ]; then
        print_info "Starting Low-code Platform service..."
        cd lowcode-platform-backend
        npm run start:dev &
        LOWCODE_PLATFORM_PID=$!
        cd ..
        sleep 10 # Wait for service to start
    fi
}

# Function to stop services
stop_services() {
    print_section "Stopping Services"
    
    if [ ! -z "$BASE_SYSTEM_PID" ]; then
        print_info "Stopping Base System service..."
        kill $BASE_SYSTEM_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$LOWCODE_PLATFORM_PID" ]; then
        print_info "Stopping Low-code Platform service..."
        kill $LOWCODE_PLATFORM_PID 2>/dev/null || true
    fi
}

# Function to run backend tests
run_backend_tests() {
    print_section "Backend Tests"
    
    # Unit tests
    run_test_command "Backend Unit Tests" "npm run test" "lowcode-platform-backend"
    
    # Integration tests
    run_test_command "Project Management Integration Tests" "npm run test:integration -- project-management" "lowcode-platform-backend"
    run_test_command "Entity Management Integration Tests" "npm run test:integration -- entity-management" "lowcode-platform-backend"
    
    # E2E tests
    run_test_command "Low-code Workflow E2E Tests" "npm run test:e2e -- lowcode-workflow" "lowcode-platform-backend"
    
    # Performance tests
    run_test_command "Performance Tests" "npm run test:performance" "lowcode-platform-backend"
}

# Function to run frontend tests
run_frontend_tests() {
    print_section "Frontend Tests"
    
    # Unit tests
    run_test_command "Frontend Unit Tests" "pnpm run test:unit" "frontend"
    
    # Integration tests
    run_test_command "Low-code Integration Tests" "pnpm run test:integration" "frontend"
    
    # Component tests
    run_test_command "Component Tests" "pnpm run test:component" "frontend"
}

# Function to run API tests
run_api_tests() {
    print_section "API Tests"
    
    # Test multi-gateway configuration
    run_test_command "Multi-Gateway Configuration Test" "node test-multi-gateway.js" "."
    
    # Test API endpoints
    run_test_command "API Endpoint Tests" "npm run test:api" "lowcode-platform-backend"
}

# Function to run security tests
run_security_tests() {
    print_section "Security Tests"
    
    # Authentication tests
    run_test_command "Authentication Tests" "npm run test:auth" "lowcode-platform-backend"
    
    # Authorization tests
    run_test_command "Authorization Tests" "npm run test:authz" "lowcode-platform-backend"
    
    # Input validation tests
    run_test_command "Input Validation Tests" "npm run test:validation" "lowcode-platform-backend"
}

# Function to run database tests
run_database_tests() {
    print_section "Database Tests"
    
    # Migration tests
    run_test_command "Database Migration Tests" "npm run test:migrations" "lowcode-platform-backend"
    
    # Seed tests
    run_test_command "Database Seed Tests" "npm run test:seeds" "lowcode-platform-backend"
    
    # Connection tests
    run_test_command "Database Connection Tests" "npm run test:db-connection" "lowcode-platform-backend"
}

# Function to generate test report
generate_test_report() {
    print_section "Test Report"
    
    echo -e "\n${CYAN}📊 Test Execution Summary${NC}"
    echo -e "${CYAN}=========================${NC}"
    echo -e "Total Tests: ${TOTAL_TESTS}"
    echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
    echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
    echo -e "${YELLOW}Skipped: ${SKIPPED_TESTS}${NC}"
    
    local success_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    fi
    
    echo -e "Success Rate: ${success_rate}%"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "All tests passed! 🎉"
        return 0
    else
        print_error "Some tests failed. Please check the output above."
        return 1
    fi
}

# Main execution function
main() {
    print_header "Low-code Platform Test Suite"
    
    # Parse command line arguments
    local run_all=true
    local run_backend=false
    local run_frontend=false
    local run_api=false
    local run_security=false
    local run_database=false
    local start_services_flag=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backend)
                run_backend=true
                run_all=false
                shift
                ;;
            --frontend)
                run_frontend=true
                run_all=false
                shift
                ;;
            --api)
                run_api=true
                run_all=false
                shift
                ;;
            --security)
                run_security=true
                run_all=false
                shift
                ;;
            --database)
                run_database=true
                run_all=false
                shift
                ;;
            --start-services)
                start_services_flag=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --backend       Run only backend tests"
                echo "  --frontend      Run only frontend tests"
                echo "  --api          Run only API tests"
                echo "  --security     Run only security tests"
                echo "  --database     Run only database tests"
                echo "  --start-services Start services before running tests"
                echo "  --help         Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Start services if requested
    if [ "$start_services_flag" = true ]; then
        start_services
        trap stop_services EXIT
    fi
    
    # Run tests based on arguments
    if [ "$run_all" = true ]; then
        run_backend_tests
        run_frontend_tests
        run_api_tests
        run_security_tests
        run_database_tests
    else
        if [ "$run_backend" = true ]; then
            run_backend_tests
        fi
        
        if [ "$run_frontend" = true ]; then
            run_frontend_tests
        fi
        
        if [ "$run_api" = true ]; then
            run_api_tests
        fi
        
        if [ "$run_security" = true ]; then
            run_security_tests
        fi
        
        if [ "$run_database" = true ]; then
            run_database_tests
        fi
    fi
    
    # Generate final report
    generate_test_report
}

# Run main function with all arguments
main "$@"
