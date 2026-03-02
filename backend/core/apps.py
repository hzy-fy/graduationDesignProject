from django.apps import AppConfig
import os
import sys

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    
    embedding_model = None
    chroma_collection = None

    def ready(self):
        # 避免在 autoreload 或者是 manage.py 命令（如 migrate）时重复加载大模型
        # 只有在 runserver 主进程或 wsgi 启动时才加载
        if 'runserver' not in sys.argv:
            return
            
        # 检查是否是 reload 进程（避免加载两次）
        if os.environ.get('RUN_MAIN') != 'true':
            return

        print("Initializing RAG System...")
        try:
            # 延迟导入，避免 AppRegistryNotReady
            from sentence_transformers import SentenceTransformer
            import chromadb
            
            # 设置 HF 镜像
            os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"
            
            print("  Loading Embedding Model (BGE-Large)... This may take a while.")
            # 使用 CPU 以避免显存冲突，生产环境可改 cuda
            self.embedding_model = SentenceTransformer("BAAI/bge-large-zh-v1.5", device="cpu") 
            
            # 连接 ChromaDB
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            db_path_default = os.path.join(base_dir, 'data', 'vector_db')
            db_path = os.getenv("VECTOR_DB_PATH", db_path_default)
            
            if os.path.exists(db_path):
                print(f"  Connecting ChromaDB at: {db_path}")
                client = chromadb.PersistentClient(path=db_path)
                self.chroma_collection = client.get_or_create_collection(name="medical_knowledge_bge")
                try:
                    cnt = self.chroma_collection.count()
                    print(f"  ChromaDB connected. Collection count: {cnt}")
                except Exception as e:
                    print(f"  ChromaDB connected but count failed: {e}")
                    print("  Hint: If this is an HNSW index error, please rebuild the vector DB using local_embedding.py --reset")
            else:
                print(f"  Warning: Vector DB not found at {db_path}")
                
            print("RAG System Ready.")
        except Exception as e:
            print(f"Failed to init RAG: {e}")
