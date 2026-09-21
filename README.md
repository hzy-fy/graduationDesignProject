# MedSafe AI

基于大语言模型与 RAG 的中医药智能健康助手毕业设计。系统结合中医体质辨识与个人用药安全分析，提供体质评估、用药禁忌提示与 3D 人体穴位可视化功能。

## 功能特性

- **用户认证**：注册 / 登录（DRF Token 认证）
- **体质分析**：依据《中医体质分类与判定》标准进行体质辨识与结果解读
- **用药分析**：结合用户体质，通过 RAG 检索药学知识库 + 通义千问（qwen-plus）分析用药禁忌
- **3D 人体穴位**：基于 Three.js 的 3D 人体模型穴位展示与交互
- **知识库**：药学大辞典、中医体质学等文献的向量化（Chroma）检索

## 技术栈

### 前端（frontend/）

- React 18 + TypeScript + Vite
- TailwindCSS、Zustand、React Router
- Three.js（@react-three/fiber、@react-three/drei、three-editor-cores）

### 后端（backend/）

- Python + Django + Django REST Framework
- Token 认证、django-cors-headers
- ChromaDB 向量数据库 + sentence-transformers 嵌入
- 通义千问（qwen-plus）大模型

## 项目结构

```
├── backend/            # Django 后端
│   ├── backend/        # 项目配置（settings 等）
│   ├── core/           # 业务应用（auth / constitution / drugs / acupoints、rag_service）
│   ├── db.sqlite3      # 本地数据库（不入库，已被 .gitignore 忽略）
│   ├── import_questions.py / export_questions.py
│   └── manage.py
├── data/               # 数据目录（除 vector_db 外不入库）
│   ├── booksdata/      # 原始文献（药学大辞典、中医体质学等）
│   ├── processing/     # 数据处理脚本与中间结果
│   └── vector_db/      # Chroma 向量库（通过 Git LFS 追踪）
└── frontend/           # React 前端
    ├── public/models/  # 3D 人体模型（model.glb，Git LFS 追踪）
    └── src/pages/      # Home / Body3D / ConstitutionAnalysis / Analysis
```

## 快速开始

### 后端

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install django djangorestframework django-cors-headers chromadb sentence-transformers dashscope
python manage.py migrate
python manage.py runserver   # 默认 http://127.0.0.1:8000
```

### 前端

```bash
cd frontend
npm install
npm run dev                  # 默认 http://localhost:5173
```

### 数据说明

- 首次运行需执行 migrate 生成 `backend/db.sqlite3`
- 穴位数据可通过 `python manage.py import_acupoints` 导入
- 向量库 `data/vector_db` 已随仓库（LFS）提供，克隆后可直接使用；如需重建，运行 `data/processing` 下的处理脚本

## 注意事项

- 本仓库使用 **Git LFS** 追踪大文件（`*.glb`、`*.sqlite3`、`*.bin`、`*.docx` 等），克隆前请确认已安装 [Git LFS](https://git-lfs.com/)
- `backend/db.sqlite3`、`venv/`、`node_modules/`、`data/`（除 vector_db）均已忽略，不会入库
- 项目仅用于毕业设计学习研究，不构成医疗建议
