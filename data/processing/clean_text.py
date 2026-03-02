import os
import re

# 定位数据目录
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROCESSED_DIR = os.path.join(BASE_DIR, 'data', 'processed')

def clean_file(path):
    print(f"Processing {os.path.basename(path)}...")
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.splitlines()
    cleaned_lines = []
    
    for line in lines:
        # 1. 删除 "第x章" / "第x节" 及其后的空格
        # 例子: "第一章 绪论" -> " 绪论" -> (去空格后) "绪论"
        # 例子: "第1节" -> "" -> (去空行后) 丢弃
        line = re.sub(r'第[一二三四五六七八九十百千0-9]+[章节]', '', line)
        
        # 2. 去除行内空白 (空格、制表符、全角空格)
        cleaned = "".join(line.split())
        
        # 3. 去除空行
        if cleaned:
            cleaned_lines.append(cleaned)
            
    # 重新写入
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(cleaned_lines))
    
    print(f"  Lines reduced: {len(lines)} -> {len(cleaned_lines)}")

if os.path.exists(PROCESSED_DIR):
    files = [f for f in os.listdir(PROCESSED_DIR) if f.endswith('.txt')]
    print(f"Found {len(files)} txt files.")
    for f in files:
        clean_file(os.path.join(PROCESSED_DIR, f))
else:
    print(f"Directory not found: {PROCESSED_DIR}")
