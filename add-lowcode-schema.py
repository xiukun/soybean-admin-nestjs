#!/usr/bin/env python3
"""
为lowcode-platform-backend服务的所有模型添加@@schema("lowcode")属性
"""

import re

def add_schema_to_models(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 匹配所有的@@map行，在其后添加@@schema("lowcode")
    # 但要避免重复添加
    pattern = r'(  @@map\("[^"]+"\))\n(?!  @@schema)'
    replacement = r'\1\n  @@schema("lowcode")\n'
    
    content = re.sub(pattern, replacement, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"已为 {file_path} 添加schema属性")

if __name__ == "__main__":
    add_schema_to_models("lowcode-platform-backend/prisma/schema.prisma")
