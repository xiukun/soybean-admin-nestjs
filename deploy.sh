#!/bin/bash

# Low-code Platform Deployment Script
# This script handles the complete deployment of the low-code platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups"

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if required files exist
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose file ($COMPOSE_FILE) not found."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create environment file if it doesn't exist
create_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_info "Creating environment file..."
        
        cat > "$ENV_FILE" << EOF
# Database Configuration
POSTGRES_DB=soybean-admin-nest-backend
POSTGRES_USER=soybean
POSTGRES_PASSWORD=soybean@123.
DATABASE_URL=postgresql://soybean:soybean@123.@postgres:5432/soybean-admin-nest-backend?schema=public

# Redis Configuration
REDIS_PASSWORD=123456

# JWT Configuration
JWT_SECRET=JWT_SECRET-soybean-admin-nest@123456!@#.
JWT_EXPIRE_IN=3600
REFRESH_TOKEN_SECRET=REFRESH_TOKEN_EXPIRE_IN-soybean-admin-nest@123456!@#.
REFRESH_TOKEN_EXPIRE_IN=7200

# Application Configuration
NODE_ENV=production
LOG_LEVEL=info

# CORS Configuration
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:9527,http://127.0.0.1:9527,http://localhost:9528,http://127.0.0.1:9528,http://localhost:3000,http://127.0.0.1:3000,http://localhost:9522,http://127.0.0.1:9522
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
CORS_CREDENTIALS=true

# Low-code Platform Configuration
AUTO_INIT_DATA=true
FIRST_RUN_DETECTION=true
AMIS_BACKEND_PATH=/app/amis-backend

# Monitoring Configuration
METRICS_ENABLED=true
PERFORMANCE_MONITORING=true
EOF
        
        log_success "Environment file created: $ENV_FILE"
        log_warning "Please review and update the environment variables as needed"
    else
        log_info "Environment file already exists: $ENV_FILE"
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    directories=(
        "generated-code"
        "amis-generated"
        "logs"
        "amis-logs"
        "uploads"
        "$BACKUP_DIR"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_success "Created directory: $dir"
        fi
    done
}

# Backup existing data
backup_data() {
    if [ "$1" = "--backup" ]; then
        log_info "Creating backup..."
        
        timestamp=$(date +"%Y%m%d_%H%M%S")
        backup_name="lowcode_platform_backup_$timestamp"
        
        # Create backup directory
        mkdir -p "$BACKUP_DIR/$backup_name"
        
        # Backup volumes if they exist
        if docker volume ls | grep -q "soybean-admin-postgres_data"; then
            log_info "Backing up database..."
            docker run --rm -v soybean-admin-postgres_data:/data -v "$(pwd)/$BACKUP_DIR/$backup_name":/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
        fi
        
        if docker volume ls | grep -q "soybean-admin-redis_data"; then
            log_info "Backing up Redis data..."
            docker run --rm -v soybean-admin-redis_data:/data -v "$(pwd)/$BACKUP_DIR/$backup_name":/backup alpine tar czf /backup/redis_data.tar.gz -C /data .
        fi
        
        # Backup generated code
        if [ -d "generated-code" ]; then
            cp -r generated-code "$BACKUP_DIR/$backup_name/"
        fi
        
        if [ -d "amis-generated" ]; then
            cp -r amis-generated "$BACKUP_DIR/$backup_name/"
        fi
        
        log_success "Backup created: $BACKUP_DIR/$backup_name"
    fi
}

# Build and start services
deploy_services() {
    log_info "Building and starting services..."
    
    # Use docker-compose or docker compose based on availability
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    # Build images
    log_info "Building Docker images..."
    $COMPOSE_CMD build --no-cache
    
    # Start services
    log_info "Starting services..."
    $COMPOSE_CMD up -d
    
    log_success "Services started successfully"
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    services=("postgres" "redis" "backend" "lowcode-platform")
    max_attempts=30
    
    for service in "${services[@]}"; do
        log_info "Checking $service..."
        attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if docker-compose ps "$service" | grep -q "healthy\|Up"; then
                log_success "$service is ready"
                break
            fi
            
            if [ $attempt -eq $max_attempts ]; then
                log_error "$service failed to become healthy"
                return 1
            fi
            
            log_info "Waiting for $service... (attempt $attempt/$max_attempts)"
            sleep 10
            attempt=$((attempt + 1))
        done
    done
    
    log_success "All services are healthy"
}

# Show deployment status
show_status() {
    log_info "Deployment Status:"
    echo ""
    
    # Use docker-compose or docker compose based on availability
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    $COMPOSE_CMD ps
    
    echo ""
    log_info "Service URLs:"
    echo "  🌐 Frontend (Soybean Admin): http://localhost:9527"
    echo "  🎨 Low-code Designer: http://localhost:9555"
    echo "  🔧 Backend API: http://localhost:9528"
    echo "  🚀 Low-code Platform API: http://localhost:3000"
    echo "  📊 Amis Backend API: http://localhost:9522"
    echo "  🗄️  PostgreSQL: localhost:25432"
    echo "  🔴 Redis: localhost:26379"
    echo ""
    log_info "Health Checks:"
    echo "  Backend: curl http://localhost:9528/v1/route/getConstantRoutes"
    echo "  Low-code Platform: curl http://localhost:3000/api/v1/projects"
    echo "  Amis Backend: curl http://localhost:9522/api/v1/health"
}

# Main deployment function
main() {
    echo "🚀 Low-code Platform Deployment Script"
    echo "======================================"
    echo ""
    
    # Parse command line arguments
    BACKUP_FLAG=""
    FORCE_REBUILD=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backup)
                BACKUP_FLAG="--backup"
                shift
                ;;
            --force-rebuild)
                FORCE_REBUILD="--force-rebuild"
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --backup         Create backup before deployment"
                echo "  --force-rebuild  Force rebuild of all images"
                echo "  --help          Show this help message"
                echo ""
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute deployment steps
    check_prerequisites
    create_env_file
    create_directories
    backup_data "$BACKUP_FLAG"
    
    if [ "$FORCE_REBUILD" = "--force-rebuild" ]; then
        log_info "Force rebuilding all images..."
        docker-compose down --volumes --remove-orphans 2>/dev/null || true
        docker system prune -f
    fi
    
    deploy_services
    wait_for_services
    show_status
    
    echo ""
    log_success "🎉 Low-code Platform deployed successfully!"
    echo ""
    log_info "Next steps:"
    echo "  1. Access the frontend at http://localhost:9527"
    echo "  2. Login with default credentials (check documentation)"
    echo "  3. Start creating your low-code applications!"
    echo ""
    log_warning "Remember to:"
    echo "  - Change default passwords in production"
    echo "  - Configure SSL certificates for HTTPS"
    echo "  - Set up proper backup procedures"
    echo "  - Monitor system resources and logs"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
