#!/usr/bin/env python3
"""
更新deploy/postgres目录下的SQL文件，将表创建到正确的schema中
"""

import os
import re
import glob

def update_backend_tables(file_path):
    """更新backend相关的表到backend schema"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 系统表列表
    backend_tables = [
        'sys_tokens', 'sys_user', 'casbin_rule', 'sys_access_key', 'sys_domain',
        'sys_endpoint', 'sys_login_log', 'sys_lowcode_page', 'sys_lowcode_page_version',
        'sys_menu', 'sys_operation_log', 'sys_organization', 'sys_role', 
        'sys_role_menu', 'sys_user_role'
    ]
    
    # 更新CREATE TABLE语句
    for table in backend_tables:
        # 匹配 CREATE TABLE "table_name" 或 CREATE TABLE table_name
        pattern1 = rf'CREATE TABLE\s+"?{table}"?\s*\('
        replacement1 = f'CREATE TABLE backend.{table} ('
        content = re.sub(pattern1, replacement1, content, flags=re.IGNORECASE)
        
        # 匹配 CREATE TABLE IF NOT EXISTS
        pattern2 = rf'CREATE TABLE IF NOT EXISTS\s+"?{table}"?\s*\('
        replacement2 = f'CREATE TABLE IF NOT EXISTS backend.{table} ('
        content = re.sub(pattern2, replacement2, content, flags=re.IGNORECASE)
    
    # 更新枚举类型引用
    content = re.sub(r'"Status"', 'backend."Status"', content)
    content = re.sub(r'"MenuType"', 'backend."MenuType"', content)
    
    # 更新外键引用
    for table in backend_tables:
        pattern = rf'REFERENCES\s+"?{table}"?'
        replacement = f'REFERENCES backend.{table}'
        content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ 已更新 {file_path} - Backend表")

def update_lowcode_tables(file_path):
    """更新lowcode相关的表到lowcode schema"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 低代码平台表列表
    lowcode_tables = [
        'lowcode_projects', 'lowcode_entities', 'lowcode_fields', 'lowcode_relations',
        'lowcode_api_configs', 'lowcode_apis', 'lowcode_queries', 'lowcode_codegen_tasks',
        'lowcode_code_templates'
    ]
    
    # 添加schema设置
    if 'SET search_path' not in content:
        content = "-- 设置当前schema为lowcode\nSET search_path TO lowcode, backend, public;\n\n" + content
    
    # 更新CREATE TABLE语句
    for table in lowcode_tables:
        pattern1 = rf'CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"?{table}"?\s*\('
        replacement1 = f'CREATE TABLE IF NOT EXISTS lowcode.{table} ('
        content = re.sub(pattern1, replacement1, content, flags=re.IGNORECASE)
    
    # 更新外键引用
    for table in lowcode_tables:
        pattern = rf'REFERENCES\s+"?{table}"?'
        replacement = f'REFERENCES lowcode.{table}'
        content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ 已更新 {file_path} - Lowcode表")

def main():
    deploy_dir = "deploy/postgres"
    
    print("🔧 开始更新SQL文件的schema配置...")
    
    # 更新backend相关文件
    backend_files = [
        "01_create_table.sql", "02_sys_user.sql", "03_sys_role.sql", 
        "04_sys_menu.sql", "05_sys_domain.sql", "06_sys_user_role.sql",
        "07_sys_role_menu.sql", "08_casbin_rule.sql", "09_lowcode_pages.sql"
    ]
    
    for filename in backend_files:
        file_path = os.path.join(deploy_dir, filename)
        if os.path.exists(file_path):
            update_backend_tables(file_path)
    
    # 更新lowcode相关文件
    lowcode_files = [
        "10_lowcode_platform_tables.sql", "11_lowcode_platform_data.sql",
        "12_lowcode_queries_init.sql", "13_prisma_templates_update.sql",
        "14_code_generation_menus.sql"
    ]
    
    for filename in lowcode_files:
        file_path = os.path.join(deploy_dir, filename)
        if os.path.exists(file_path):
            update_lowcode_tables(file_path)
    
    print("🎉 所有SQL文件schema更新完成！")

if __name__ == "__main__":
    main()
