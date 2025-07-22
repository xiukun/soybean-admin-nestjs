#!/bin/bash

# Soybean Admin 微服务系统备份恢复脚本
# 作者: AI Assistant
# 版本: 1.0.0
# 描述: 数据库备份、恢复和数据迁移工具

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BACKUP_DIR="backups"
DATE_FORMAT="%Y%m%d_%H%M%S"
RETENTION_DAYS=30

# 数据库配置
DB_HOST="localhost"
DB_PORT="25432"
DB_USER="soybean"
DB_PASSWORD="soybean@123."
DB_NAME="soybean-admin-nest-backend"

# Redis配置
REDIS_HOST="localhost"
REDIS_PORT="26379"
REDIS_PASSWORD="123456"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
Soybean Admin 微服务系统备份恢复脚本

用法: $0 [选项] [参数]

选项:
    backup              创建完整备份
    backup-db           仅备份数据库
    backup-redis        仅备份Redis数据
    backup-files        仅备份文件
    restore <file>      从备份文件恢复
    restore-db <file>   恢复数据库
    restore-redis <file> 恢复Redis数据
    list                列出所有备份
    clean               清理过期备份
    schedule            设置定时备份
    verify <file>       验证备份文件
    help                显示此帮助信息

示例:
    $0 backup                           # 创建完整备份
    $0 restore backups/backup_20240101_120000.tar.gz
    $0 backup-db                        # 仅备份数据库
    $0 list                             # 列出备份
    $0 clean                            # 清理过期备份

EOF
}

# 初始化备份目录
init_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/redis"
    mkdir -p "$BACKUP_DIR/files"
    mkdir -p "$BACKUP_DIR/full"
}

# 检查依赖
check_dependencies() {
    local missing_deps=()
    
    # 检查 pg_dump
    if ! command -v pg_dump &> /dev/null; then
        missing_deps+=("postgresql-client")
    fi
    
    # 检查 redis-cli
    if ! command -v redis-cli &> /dev/null; then
        missing_deps+=("redis-tools")
    fi
    
    # 检查 tar
    if ! command -v tar &> /dev/null; then
        missing_deps+=("tar")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "缺少依赖: ${missing_deps[*]}"
        log_info "请安装缺少的依赖后重试"
        exit 1
    fi
}

# 备份数据库
backup_database() {
    local timestamp=$(date +"$DATE_FORMAT")
    local backup_file="$BACKUP_DIR/database/db_backup_$timestamp.sql"
    
    log_info "开始备份数据库..."
    
    # 设置密码环境变量
    export PGPASSWORD="$DB_PASSWORD"
    
    # 执行备份
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --if-exists --create > "$backup_file" 2>/dev/null; then
        
        # 压缩备份文件
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
        
        local file_size=$(du -h "$backup_file" | cut -f1)
        log_success "数据库备份完成: $backup_file ($file_size)"
        echo "$backup_file"
    else
        log_error "数据库备份失败"
        rm -f "$backup_file"
        return 1
    fi
    
    unset PGPASSWORD
}

# 备份Redis数据
backup_redis() {
    local timestamp=$(date +"$DATE_FORMAT")
    local backup_file="$BACKUP_DIR/redis/redis_backup_$timestamp.rdb"
    
    log_info "开始备份Redis数据..."
    
    # 使用BGSAVE命令创建备份
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" BGSAVE > /dev/null 2>&1; then
        # 等待备份完成
        while [ "$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" LASTSAVE)" = "$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" LASTSAVE)" ]; do
            sleep 1
        done
        
        # 复制RDB文件
        if command -v docker &> /dev/null; then
            # 从Docker容器复制
            docker cp redis-soybean:/data/dump.rdb "$backup_file" 2>/dev/null || {
                log_warning "无法从Docker容器复制Redis数据，尝试其他方法"
                # 使用redis-cli导出数据
                redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" --rdb "$backup_file"
            }
        else
            # 本地Redis
            cp /var/lib/redis/dump.rdb "$backup_file" 2>/dev/null || {
                redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" --rdb "$backup_file"
            }
        fi
        
        if [ -f "$backup_file" ]; then
            gzip "$backup_file"
            backup_file="${backup_file}.gz"
            local file_size=$(du -h "$backup_file" | cut -f1)
            log_success "Redis备份完成: $backup_file ($file_size)"
            echo "$backup_file"
        else
            log_error "Redis备份文件创建失败"
            return 1
        fi
    else
        log_error "Redis备份失败"
        return 1
    fi
}

# 备份文件
backup_files() {
    local timestamp=$(date +"$DATE_FORMAT")
    local backup_file="$BACKUP_DIR/files/files_backup_$timestamp.tar.gz"
    
    log_info "开始备份应用文件..."
    
    # 要备份的目录和文件
    local backup_items=(
        "logs"
        "uploads"
        ".env*"
        "docker-compose.yml"
        "ecosystem.config.js"
    )
    
    # 创建文件列表
    local existing_items=()
    for item in "${backup_items[@]}"; do
        if [ -e "$item" ]; then
            existing_items+=("$item")
        fi
    done
    
    if [ ${#existing_items[@]} -gt 0 ]; then
        tar -czf "$backup_file" "${existing_items[@]}" 2>/dev/null
        local file_size=$(du -h "$backup_file" | cut -f1)
        log_success "文件备份完成: $backup_file ($file_size)"
        echo "$backup_file"
    else
        log_warning "没有找到需要备份的文件"
        return 1
    fi
}

# 创建完整备份
create_full_backup() {
    local timestamp=$(date +"$DATE_FORMAT")
    local backup_name="backup_$timestamp"
    local temp_dir="$BACKUP_DIR/temp_$timestamp"
    local final_backup="$BACKUP_DIR/full/${backup_name}.tar.gz"
    
    log_info "开始创建完整备份..."
    
    # 创建临时目录
    mkdir -p "$temp_dir"
    
    # 备份数据库
    log_info "备份数据库..."
    local db_backup=$(backup_database)
    if [ $? -eq 0 ] && [ -n "$db_backup" ]; then
        cp "$db_backup" "$temp_dir/"
    fi
    
    # 备份Redis
    log_info "备份Redis..."
    local redis_backup=$(backup_redis)
    if [ $? -eq 0 ] && [ -n "$redis_backup" ]; then
        cp "$redis_backup" "$temp_dir/"
    fi
    
    # 备份文件
    log_info "备份文件..."
    local files_backup=$(backup_files)
    if [ $? -eq 0 ] && [ -n "$files_backup" ]; then
        cp "$files_backup" "$temp_dir/"
    fi
    
    # 创建备份信息文件
    cat > "$temp_dir/backup_info.txt" << EOF
备份信息
========
备份时间: $(date)
备份类型: 完整备份
数据库: $DB_NAME
Redis: $REDIS_HOST:$REDIS_PORT
版本: $(git rev-parse HEAD 2>/dev/null || echo "未知")
EOF
    
    # 打包完整备份
    tar -czf "$final_backup" -C "$temp_dir" .
    
    # 清理临时目录
    rm -rf "$temp_dir"
    
    local file_size=$(du -h "$final_backup" | cut -f1)
    log_success "完整备份创建完成: $final_backup ($file_size)"
}

# 恢复数据库
restore_database() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        return 1
    fi
    
    log_info "开始恢复数据库..."
    log_warning "这将覆盖现有数据库，请确认操作"
    
    read -p "确认恢复数据库? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "恢复操作已取消"
        return 0
    fi
    
    # 设置密码环境变量
    export PGPASSWORD="$DB_PASSWORD"
    
    # 解压并恢复
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$backup_file"
    fi
    
    if [ $? -eq 0 ]; then
        log_success "数据库恢复完成"
    else
        log_error "数据库恢复失败"
        return 1
    fi
    
    unset PGPASSWORD
}

# 恢复Redis数据
restore_redis() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        return 1
    fi
    
    log_info "开始恢复Redis数据..."
    
    # 解压备份文件
    local temp_file="/tmp/dump.rdb"
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" > "$temp_file"
    else
        cp "$backup_file" "$temp_file"
    fi
    
    # 停止Redis服务
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" SHUTDOWN NOSAVE 2>/dev/null || true
    
    # 复制RDB文件
    if command -v docker &> /dev/null; then
        docker cp "$temp_file" redis-soybean:/data/dump.rdb
        docker start redis-soybean
    else
        cp "$temp_file" /var/lib/redis/dump.rdb
        systemctl start redis
    fi
    
    rm -f "$temp_file"
    log_success "Redis数据恢复完成"
}

# 列出备份
list_backups() {
    log_info "备份文件列表:"
    echo
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "*.gz" -o -name "*.sql" -o -name "*.tar.gz" | sort -r | while read -r file; do
            local size=$(du -h "$file" | cut -f1)
            local date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
            echo -e "${GREEN}$(basename "$file")${NC} - $size - $date"
        done
    else
        log_warning "备份目录不存在"
    fi
}

# 清理过期备份
clean_old_backups() {
    log_info "清理 $RETENTION_DAYS 天前的备份..."
    
    local deleted=0
    find "$BACKUP_DIR" -name "*.gz" -o -name "*.sql" -o -name "*.tar.gz" | while read -r file; do
        if [ $(find "$file" -mtime +$RETENTION_DAYS) ]; then
            rm -f "$file"
            log_info "删除过期备份: $(basename "$file")"
            deleted=$((deleted + 1))
        fi
    done
    
    log_success "清理完成，删除了 $deleted 个过期备份"
}

# 验证备份文件
verify_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        return 1
    fi
    
    log_info "验证备份文件: $backup_file"
    
    # 检查文件完整性
    if [[ "$backup_file" == *.gz ]]; then
        if gunzip -t "$backup_file" 2>/dev/null; then
            log_success "备份文件完整性验证通过"
        else
            log_error "备份文件损坏"
            return 1
        fi
    elif [[ "$backup_file" == *.tar.gz ]]; then
        if tar -tzf "$backup_file" >/dev/null 2>&1; then
            log_success "备份文件完整性验证通过"
        else
            log_error "备份文件损坏"
            return 1
        fi
    fi
    
    # 显示文件信息
    local size=$(du -h "$backup_file" | cut -f1)
    local date=$(stat -c %y "$backup_file" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
    echo -e "文件大小: ${CYAN}$size${NC}"
    echo -e "创建时间: ${CYAN}$date${NC}"
}

# 主函数
main() {
    init_backup_dir
    check_dependencies
    
    case "${1:-help}" in
        backup)
            create_full_backup
            ;;
        backup-db)
            backup_database
            ;;
        backup-redis)
            backup_redis
            ;;
        backup-files)
            backup_files
            ;;
        restore)
            if [ -z "$2" ]; then
                log_error "请指定备份文件"
                exit 1
            fi
            # 这里可以添加完整恢复逻辑
            log_info "完整恢复功能开发中..."
            ;;
        restore-db)
            if [ -z "$2" ]; then
                log_error "请指定数据库备份文件"
                exit 1
            fi
            restore_database "$2"
            ;;
        restore-redis)
            if [ -z "$2" ]; then
                log_error "请指定Redis备份文件"
                exit 1
            fi
            restore_redis "$2"
            ;;
        list)
            list_backups
            ;;
        clean)
            clean_old_backups
            ;;
        verify)
            if [ -z "$2" ]; then
                log_error "请指定要验证的备份文件"
                exit 1
            fi
            verify_backup "$2"
            ;;
        help|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"
