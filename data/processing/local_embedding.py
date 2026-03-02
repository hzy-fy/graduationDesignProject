import os
# 设置 Hugging Face 国内镜像
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

import json
import argparse
import shutil
import torch
import chromadb
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# 路径配置
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHUNKS_DIR = os.path.join(BASE_DIR, 'data', 'chunks')
VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", os.path.join(BASE_DIR, 'data', 'vector_db'))
MODEL_NAME = "BAAI/bge-large-zh-v1.5"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true")
    args = parser.parse_args()
    if args.reset and os.path.exists(VECTOR_DB_PATH):
        shutil.rmtree(VECTOR_DB_PATH)
        print(f"Reset vector DB directory: {VECTOR_DB_PATH}")
    # 1. 初始化设备
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    
    if device == "cpu":
        print("Warning: GPU not found. Embedding will be slow on CPU.")

    # 2. 加载模型
    print(f"Loading model: {MODEL_NAME}...")
    try:
        model = SentenceTransformer(MODEL_NAME, device=device)
    except Exception as e:
        print(f"Error loading model: {e}")
        return
    try:
        dim = model.get_sentence_embedding_dimension()
        print(f"Embedding dimension: {dim}")
    except Exception:
        pass

    # 3. 初始化向量库
    chroma_client = chromadb.PersistentClient(path=VECTOR_DB_PATH)
    try:
        chroma_client.delete_collection("medical_knowledge_bge")
        print("Deleted existing collection: medical_knowledge_bge")
    except Exception:
        pass
    collection = chroma_client.create_collection(name="medical_knowledge_bge")

    # 4. 遍历文件
    if not os.path.exists(CHUNKS_DIR):
        print(f"Directory not found: {CHUNKS_DIR}")
        return

    chunk_files = [f for f in os.listdir(CHUNKS_DIR) if f.endswith('.json')]
    print(f"Found {len(chunk_files)} chunk files.")

    for filename in chunk_files:
        filepath = os.path.join(CHUNKS_DIR, filename)
        print(f"Processing {filename}...")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                chunks = json.load(f)
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            continue
            
        # 准备批量数据
        batch_size = 32 # 根据显存调整
        
        # 将 chunks 分批
        for i in tqdm(range(0, len(chunks), batch_size), desc="Embedding"):
            batch_chunks = chunks[i : i + batch_size]
            
            # 提取文本
            texts = [c['content'] for c in batch_chunks]
            ids = [f"{os.path.splitext(filename)[0]}:{c['id']}" for c in batch_chunks]
            
            # 计算向量
            # normalize_embeddings=True 对余弦相似度检索很重要
            try:
                embeddings = model.encode(texts, normalize_embeddings=True, batch_size=batch_size, show_progress_bar=False)
            except Exception as e:
                print(f"Error embedding batch: {e}")
                continue
            
            # 准备 metadata
            metadatas = []
            for c in batch_chunks:
                meta = {
                    "source": c.get('source', ''),
                    "category": c.get('category', 'general'),
                    "is_child": str(c.get('is_child', False)),
                    "parent_content": c.get('parent_content', '')[:500]
                }
                metadatas.append(meta)
            
            # 存入 Chroma
            try:
                collection.add(
                    ids=ids,
                    embeddings=embeddings.tolist(), # 转为 list
                    metadatas=metadatas,
                    documents=texts
                )
            except Exception as e:
                print(f"Error saving to Chroma: {e}")
            
    print(f"Done! Vector DB saved to {VECTOR_DB_PATH}")

if __name__ == "__main__":
    main()
