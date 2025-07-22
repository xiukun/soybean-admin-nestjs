#!/usr/bin/env python3
"""
为backend服务的所有模型添加@@schema("backend")属性
"""

import re

def add_schema_to_models(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 匹配所有的@@map行，在其后添加@@schema("backend")
    # 但要避免重复添加
    pattern = r'(  @@map\("[^"]+"\))\n(?!  @@schema)'
    replacement = r'\1\n  @@schema("backend")\n'
    
    content = re.sub(pattern, replacement, content)
    
    # 为枚举添加schema
    enum_pattern = r'(enum \w+ \{[^}]+\})'
    def add_enum_schema(match):
        enum_content = match.group(1)
        if '@@schema' not in enum_content:
            return enum_content + '\n\n@@schema("backend")'
        return enum_content
    
    content = re.sub(enum_pattern, add_enum_schema, content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"已为 {file_path} 添加schema属性")

if __name__ == "__main__":
    add_schema_to_models("backend/prisma/schema.prisma")
