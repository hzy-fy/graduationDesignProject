import os
import json
from langchain_text_splitters import RecursiveCharacterTextSplitter
from tqdm import tqdm

# 路径配置
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, 'data')
PROCESSED_DIR = os.path.join(DATA_DIR, 'processed')
CHUNKS_DIR = os.path.join(DATA_DIR, 'chunks')

def get_category(filename):
    if '体质' in filename: return 'constitution'
    elif '药' in filename or '处方' in filename: return 'drug'
    else: return 'general'

def split_text_advanced(text, filename):
    chunks_data = []
    
    # 1. 按段落切分
    # 假设清洗后的文本段落之间由换行符分隔
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    
    # 子块分割器 (用于切分长段落)
    # 优先按句子结束符切分，避免断句
    child_splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=50,
        separators=["。", "！", "？", "；", "，", " ", ""],
        length_function=len,
    )
    
    category = get_category(filename)
    
    for i, para in enumerate(paragraphs):
        # 2. 判断段落长度
        if len(para) <= 500:
            # 短段落：直接作为一块
            chunks_data.append({
                "id": f"{filename}_p{i}",
                "source": filename,
                "category": category,
                "content": para,
                "parent_content": para, # 父块即自身
                "is_child": False,
                "length": len(para)
            })
        else:
            # 长段落：进行子块切分
            sub_chunks = child_splitter.split_text(para)
            for j, sub_content in enumerate(sub_chunks):
                chunks_data.append({
                    "id": f"{filename}_p{i}_c{j}",
                    "source": filename,
                    "category": category,
                    "content": sub_content,
                    "parent_content": para, # 关联完整父段落
                    "is_child": True,
                    "length": len(sub_content)
                })
                
    return chunks_data

def main():
    if not os.path.exists(CHUNKS_DIR): os.makedirs(CHUNKS_DIR)
    
    txt_files = [f for f in os.listdir(PROCESSED_DIR) if f.endswith('.txt')]
    print(f"Found {len(txt_files)} processed text files.")
    
    total_chunks = 0
    
    for filename in txt_files:
        file_path = os.path.join(PROCESSED_DIR, filename)
        print(f"Chunking {filename} with Parent-Child strategy...")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            
            if not text: continue
            
            chunks = split_text_advanced(text, filename)
            
            # 保存
            json_filename = os.path.splitext(filename)[0] + '_chunks.json'
            json_path = os.path.join(CHUNKS_DIR, json_filename)
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(chunks, f, ensure_ascii=False, indent=2)
                
            print(f"  Generated {len(chunks)} chunks.")
            total_chunks += len(chunks)
            
        except Exception as e:
            print(f"  Error: {e}")
            
    print(f"Done. Total chunks: {total_chunks}")

if __name__ == "__main__":
    main()
