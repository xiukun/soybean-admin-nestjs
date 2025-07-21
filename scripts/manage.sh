#!/bin/bash

# Low-code Platform Management Script
# This script provides common management operations for the platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
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

# Get compose command
get_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# Start services
start_services() {
    log_info "Starting all services..."
    $(get_compose_cmd) up -d
    log_success "Services started"
}

# Stop services
stop_services() {
    log_info "Stopping all services..."
    $(get_compose_cmd) down
    log_success "Services stopped"
}

# Restart services
restart_services() {
    local service="$1"
    
    if [ -n "$service" ]; then
        log_info "Restarting service: $service"
        $(get_compose_cmd) restart "$service"
        log_success "Service $service restarted"
    else
        log_info "Restarting all services..."
        $(get_compose_cmd) restart
        log_success "All services restarted"
    fi
}

# Show service status
show_status() {
    log_info "Service Status:"
    $(get_compose_cmd) ps
    
    echo ""
    log_info "Service Logs (last 10 lines):"
    $(get_compose_cmd) logs --tail=10
}

# Show logs
show_logs() {
    local service="$1"
    local lines="${2:-50}"
    
    if [ -n "$service" ]; then
        log_info "Showing logs for service: $service (last $lines lines)"
        $(get_compose_cmd) logs --tail="$lines" -f "$service"
    else
        log_info "Showing logs for all services (last $lines lines)"
        $(get_compose_cmd) logs --tail="$lines" -f
    fi
}

# Execute command in container
exec_command() {
    local service="$1"
    shift
    local command="$@"
    
    if [ -z "$service" ]; then
        log_error "Service name is required"
        return 1
    fi
    
    if [ -z "$command" ]; then
        command="/bin/sh"
    fi
    
    log_info "Executing command in $service: $command"
    $(get_compose_cmd) exec "$service" $command
}

# Backup data
backup_data() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_name="lowcode_platform_backup_$timestamp"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log_info "Creating backup: $backup_name"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Backup database
    log_info "Backing up database..."
    $(get_compose_cmd) exec -T postgres pg_dump -U soybean soybean-admin-nest-backend > "$backup_path/database.sql"
    
    # Backup Redis data
    log_info "Backing up Redis data..."
    $(get_compose_cmd) exec -T redis redis-cli --rdb - > "$backup_path/redis.rdb"
    
    # Backup generated code
    if [ -d "generated-code" ]; then
        log_info "Backing up generated code..."
        cp -r generated-code "$backup_path/"
    fi
    
    if [ -d "amis-generated" ]; then
        log_info "Backing up amis generated code..."
        cp -r amis-generated "$backup_path/"
    fi
    
    # Backup configuration files
    log_info "Backing up configuration files..."
    cp docker-compose.yml "$backup_path/" 2>/dev/null || true
    cp .env "$backup_path/" 2>/dev/null || true
    
    # Create archive
    log_info "Creating archive..."
    tar -czf "$backup_path.tar.gz" -C "$BACKUP_DIR" "$backup_name"
    rm -rf "$backup_path"
    
    log_success "Backup created: $backup_path.tar.gz"
}

# Restore data
restore_data() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log_error "Backup file is required"
        return 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_warning "This will restore data from backup and may overwrite existing data."
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled"
        return 0
    fi
    
    # Extract backup
    local temp_dir=$(mktemp -d)
    log_info "Extracting backup to: $temp_dir"
    tar -xzf "$backup_file" -C "$temp_dir"
    
    local backup_name=$(basename "$backup_file" .tar.gz)
    local backup_path="$temp_dir/$backup_name"
    
    # Restore database
    if [ -f "$backup_path/database.sql" ]; then
        log_info "Restoring database..."
        $(get_compose_cmd) exec -T postgres psql -U soybean -d soybean-admin-nest-backend < "$backup_path/database.sql"
    fi
    
    # Restore Redis data
    if [ -f "$backup_path/redis.rdb" ]; then
        log_info "Restoring Redis data..."
        $(get_compose_cmd) stop redis
        docker cp "$backup_path/redis.rdb" $($(get_compose_cmd) ps -q redis):/data/dump.rdb
        $(get_compose_cmd) start redis
    fi
    
    # Restore generated code
    if [ -d "$backup_path/generated-code" ]; then
        log_info "Restoring generated code..."
        rm -rf generated-code
        cp -r "$backup_path/generated-code" .
    fi
    
    if [ -d "$backup_path/amis-generated" ]; then
        log_info "Restoring amis generated code..."
        rm -rf amis-generated
        cp -r "$backup_path/amis-generated" .
    fi
    
    # Clean up
    rm -rf "$temp_dir"
    
    log_success "Data restored from: $backup_file"
    log_info "You may need to restart services for changes to take effect"
}

# Update services
update_services() {
    log_info "Updating services..."
    
    # Pull latest images
    log_info "Pulling latest images..."
    $(get_compose_cmd) pull
    
    # Rebuild and restart
    log_info "Rebuilding and restarting services..."
    $(get_compose_cmd) up -d --build
    
    log_success "Services updated"
}

# Clean up system
cleanup_system() {
    log_warning "This will remove unused Docker images, containers, and volumes."
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleanup cancelled"
        return 0
    fi
    
    log_info "Cleaning up Docker system..."
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    docker volume prune -f
    
    # Remove unused networks
    docker network prune -f
    
    log_success "System cleanup completed"
}

# Show help
show_help() {
    echo "Low-code Platform Management Script"
    echo "=================================="
    echo ""
    echo "Usage: $0 COMMAND [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start                    Start all services"
    echo "  stop                     Stop all services"
    echo "  restart [SERVICE]        Restart all services or specific service"
    echo "  status                   Show service status and recent logs"
    echo "  logs [SERVICE] [LINES]   Show logs for all services or specific service"
    echo "  exec SERVICE [COMMAND]   Execute command in service container"
    echo "  backup                   Create backup of all data"
    echo "  restore BACKUP_FILE      Restore data from backup file"
    echo "  update                   Update all services to latest versions"
    echo "  cleanup                  Clean up unused Docker resources"
    echo "  health                   Run health check"
    echo "  help                     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                           # Start all services"
    echo "  $0 restart lowcode-platform        # Restart low-code platform service"
    echo "  $0 logs backend 100                # Show last 100 lines of backend logs"
    echo "  $0 exec postgres psql -U soybean   # Connect to PostgreSQL"
    echo "  $0 backup                          # Create backup"
    echo "  $0 restore backups/backup.tar.gz   # Restore from backup"
}

# Main function
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 1
    fi
    
    local command="$1"
    shift
    
    case "$command" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services "$1"
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$1" "$2"
            ;;
        exec)
            exec_command "$@"
            ;;
        backup)
            backup_data
            ;;
        restore)
            restore_data "$1"
            ;;
        update)
            update_services
            ;;
        cleanup)
            cleanup_system
            ;;
        health)
            if [ -f "scripts/health-check.sh" ]; then
                bash scripts/health-check.sh
            else
                log_error "Health check script not found"
                exit 1
            fi
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Handle script interruption
trap 'log_error "Operation interrupted"; exit 1' INT TERM

# Run main function
main "$@"
