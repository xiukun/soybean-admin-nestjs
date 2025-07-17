#!/bin/bash

# Multi-Gateway Startup Script
# This script starts both the base system (9528) and low-code platform (3000) services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[MULTI-GATEWAY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        print_warning "Killing process on port $port (PID: $pid)"
        kill -9 $pid
        sleep 2
    fi
}

# Function to start base system service
start_base_system() {
    print_status "Starting Base System Service (Port 9528)..."
    
    cd backend
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing base system dependencies..."
        pnpm install
    fi
    
    # Start the base system service
    print_status "Launching base system service..."
    pnpm run start:dev:base-system &
    BASE_SYSTEM_PID=$!
    
    cd ..
    
    # Wait for service to start
    print_status "Waiting for base system service to start..."
    for i in {1..30}; do
        if check_port 9528; then
            print_success "Base System Service is running on http://localhost:9528"
            return 0
        fi
        sleep 2
    done
    
    print_error "Base System Service failed to start"
    return 1
}

# Function to start low-code platform service
start_lowcode_platform() {
    print_status "Starting Low-code Platform Service (Port 3000)..."
    
    cd lowcode-platform-backend
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing low-code platform dependencies..."
        npm install
    fi
    
    # Start the low-code platform service
    print_status "Launching low-code platform service..."
    npm run start:dev &
    LOWCODE_PID=$!
    
    cd ..
    
    # Wait for service to start
    print_status "Waiting for low-code platform service to start..."
    for i in {1..30}; do
        if check_port 3000; then
            print_success "Low-code Platform Service is running on http://localhost:3000"
            return 0
        fi
        sleep 2
    done
    
    print_error "Low-code Platform Service failed to start"
    return 1
}

# Function to start frontend
start_frontend() {
    print_status "Starting Frontend Service (Port 9527)..."
    
    cd frontend
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        pnpm install
    fi
    
    # Start the frontend service
    print_status "Launching frontend service..."
    pnpm run dev &
    FRONTEND_PID=$!
    
    cd ..
    
    # Wait for service to start
    print_status "Waiting for frontend service to start..."
    for i in {1..30}; do
        if check_port 9527; then
            print_success "Frontend Service is running on http://localhost:9527"
            return 0
        fi
        sleep 2
    done
    
    print_error "Frontend Service failed to start"
    return 1
}

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down services..."
    
    if [ ! -z "$BASE_SYSTEM_PID" ]; then
        kill $BASE_SYSTEM_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$LOWCODE_PID" ]; then
        kill $LOWCODE_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes on our ports
    kill_port 9528
    kill_port 3000
    kill_port 9527
    
    print_success "All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    print_status "Starting Multi-Gateway Development Environment"
    print_status "=============================================="
    
    # Check if we're in the right directory
    if [ ! -d "backend" ] || [ ! -d "lowcode-platform-backend" ] || [ ! -d "frontend" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Kill any existing processes on our ports
    print_status "Cleaning up existing processes..."
    kill_port 9528
    kill_port 3000
    kill_port 9527
    
    # Start services
    if ! start_base_system; then
        print_error "Failed to start base system service"
        exit 1
    fi
    
    if ! start_lowcode_platform; then
        print_error "Failed to start low-code platform service"
        exit 1
    fi
    
    if ! start_frontend; then
        print_error "Failed to start frontend service"
        exit 1
    fi
    
    # Display service status
    print_success "All services are running!"
    echo ""
    print_status "Service URLs:"
    echo "  🌐 Frontend:              http://localhost:9527"
    echo "  🔧 Base System API:       http://localhost:9528"
    echo "  🚀 Low-code Platform API: http://localhost:3000"
    echo ""
    print_status "API Documentation:"
    echo "  📚 Base System Swagger:   http://localhost:9528/api-docs"
    echo "  📚 Low-code Platform:     http://localhost:3000/api-docs"
    echo ""
    print_status "Press Ctrl+C to stop all services"
    
    # Wait for user to stop services
    wait
}

# Run main function
main "$@"
