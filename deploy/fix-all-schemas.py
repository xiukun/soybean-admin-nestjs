#!/usr/bin/env python3
"""
完整修复deploy/postgres目录下所有SQL文件的schema问题
"""

import os
import re

def fix_backend_files():
    """修复backend相关的SQL文件"""
    backend_files = [
        "01_create_table.sql", "02_sys_user.sql", "03_sys_role.sql", 
        "04_sys_menu.sql", "05_sys_domain.sql", "06_sys_user_role.sql",
        "07_sys_role_menu.sql", "08_casbin_rule.sql", "09_lowcode_pages.sql"
    ]
    
    backend_tables = [
        'sys_tokens', 'sys_user', 'casbin_rule', 'sys_access_key', 'sys_domain',
        'sys_endpoint', 'sys_login_log', 'sys_lowcode_page', 'sys_lowcode_page_version',
        'sys_menu', 'sys_operation_log', 'sys_organization', 'sys_role', 
        'sys_role_menu', 'sys_user_role'
    ]
    
    for filename in backend_files:
        file_path = f"postgres/{filename}"
        if not os.path.exists(file_path):
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 添加schema设置（如果没有的话）
        if 'SET search_path' not in content and not content.startswith('-- Backend Schema'):
            content = "-- Backend Schema Tables\nSET search_path TO backend, public;\n\n" + content
        
        # 更新所有backend表
        for table in backend_tables:
            # 各种CREATE TABLE格式
            patterns = [
                (rf'CREATE TABLE\s+"{table}"\s*\(', f'CREATE TABLE backend.{table} ('),
                (rf'CREATE TABLE\s+{table}\s*\(', f'CREATE TABLE backend.{table} ('),
                (rf'CREATE TABLE\s+IF NOT EXISTS\s+"{table}"\s*\(', f'CREATE TABLE IF NOT EXISTS backend.{table} ('),
                (rf'CREATE TABLE\s+IF NOT EXISTS\s+{table}\s*\(', f'CREATE TABLE IF NOT EXISTS backend.{table} ('),
                # INSERT语句
                (rf'INSERT INTO\s+"{table}"', f'INSERT INTO backend.{table}'),
                (rf'INSERT INTO\s+{table}\s+', f'INSERT INTO backend.{table} '),
                # 外键引用
                (rf'REFERENCES\s+"{table}"', f'REFERENCES backend.{table}'),
                (rf'REFERENCES\s+{table}\s+', f'REFERENCES backend.{table} '),
            ]
            
            for pattern, replacement in patterns:
                content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
        
        # 修复枚举类型引用
        content = re.sub(r'backend\.backend\."Status"', 'backend."Status"', content)
        content = re.sub(r'backend\.backend\."MenuType"', 'backend."MenuType"', content)
        content = re.sub(r'"Status"(?!\s*AS\s+ENUM)', 'backend."Status"', content)
        content = re.sub(r'"MenuType"(?!\s*AS\s+ENUM)', 'backend."MenuType"', content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ 已修复 {filename}")

def fix_lowcode_files():
    """修复lowcode相关的SQL文件"""
    lowcode_files = [
        "10_lowcode_platform_tables.sql", "11_lowcode_platform_data.sql",
        "12_lowcode_queries_init.sql", "13_prisma_templates_update.sql",
        "14_code_generation_menus.sql"
    ]
    
    lowcode_tables = [
        'lowcode_projects', 'lowcode_entities', 'lowcode_fields', 'lowcode_relations',
        'lowcode_api_configs', 'lowcode_apis', 'lowcode_queries', 'lowcode_codegen_tasks',
        'lowcode_code_templates'
    ]
    
    for filename in lowcode_files:
        file_path = f"postgres/{filename}"
        if not os.path.exists(file_path):
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 添加schema设置（如果没有的话）
        if 'SET search_path' not in content:
            content = "-- Lowcode Platform Schema Tables\nSET search_path TO lowcode, backend, public;\n\n" + content
        
        # 更新所有lowcode表
        for table in lowcode_tables:
            patterns = [
                (rf'CREATE TABLE\s+"{table}"\s*\(', f'CREATE TABLE lowcode.{table} ('),
                (rf'CREATE TABLE\s+{table}\s*\(', f'CREATE TABLE lowcode.{table} ('),
                (rf'CREATE TABLE\s+IF NOT EXISTS\s+"{table}"\s*\(', f'CREATE TABLE IF NOT EXISTS lowcode.{table} ('),
                (rf'CREATE TABLE\s+IF NOT EXISTS\s+{table}\s*\(', f'CREATE TABLE IF NOT EXISTS lowcode.{table} ('),
                # INSERT语句
                (rf'INSERT INTO\s+"{table}"', f'INSERT INTO lowcode.{table}'),
                (rf'INSERT INTO\s+{table}\s+', f'INSERT INTO lowcode.{table} '),
                # 外键引用
                (rf'REFERENCES\s+"{table}"', f'REFERENCES lowcode.{table}'),
                (rf'REFERENCES\s+{table}\s+', f'REFERENCES lowcode.{table} '),
            ]
            
            for pattern, replacement in patterns:
                content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ 已修复 {filename}")

def main():
    print("🔧 开始修复所有SQL文件的schema配置...")
    
    # 切换到deploy目录
    os.chdir('deploy')
    
    fix_backend_files()
    fix_lowcode_files()
    
    print("🎉 所有SQL文件schema修复完成！")
    print("📋 修复内容:")
    print("  - 添加了正确的schema前缀")
    print("  - 修复了枚举类型引用")
    print("  - 更新了外键引用")
    print("  - 添加了search_path设置")

if __name__ == "__main__":
    main()
