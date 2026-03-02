import os
from django.apps import apps
from openai import OpenAI
from .models import Medicine

def get_rag_context(query, top_k=5):
    """
    检索相关文档片段
    """
    try:
        config = apps.get_app_config('core')
        if not config.embedding_model or not config.chroma_collection:
            # print("RAG components not initialized.") # Reduce log noise
            return []
            
        # 1. 向量化
        # normalize_embeddings=True 对余弦相似度检索很重要
        embedding = config.embedding_model.encode([query], normalize_embeddings=True).tolist()[0]
        
        # 2. 检索
        results = config.chroma_collection.query(
            query_embeddings=[embedding],
            n_results=top_k
        )
        
        # 3. 提取文本
        # results['documents'] 是 list of list
        if not results['documents']:
            return []
            
        documents = results['documents'][0]
        metadatas = results['metadatas'][0]
        
        context = []
        for doc, meta in zip(documents, metadatas):
            source = meta.get('source', '未知来源')
            # 简单清洗一下 doc，去掉过多换行
            doc_clean = doc.replace('\n', ' ').strip()
            context.append(f"【来源：{source}】{doc_clean}")
            
        return context
    except Exception as e:
        print(f"RAG Retrieval Error: {e}")
        return []

def analyze_drug_contraindication(drug_name, constitution):
    """
    核心业务逻辑：分析药物禁忌
    步骤：
    1. 查本地药物说明书 (Medicine DB)
    2. 查 RAG (Vector DB)
    3. LLM 综合生成
    """
    print(f"Analyzing: {drug_name} for {constitution}")
    
    # 1. 查询本地药物说明书 (优先匹配通用名)
    med_info = "【药物说明书】未在本地数据库找到该药物的详细说明书。"
    
    # 模糊匹配
    meds = Medicine.objects.filter(generic_name__icontains=drug_name)
    if not meds.exists():
        meds = Medicine.objects.filter(trade_name__icontains=drug_name)
    
    if meds.exists():
        med = meds.first()
        med_info = f"""
【药物说明书摘要】
药物名称：{med.generic_name} ({med.trade_name or ''})
成分：{med.ingredients}
适应症：{med.indications}
禁忌：{med.contraindications}
注意事项：{med.precautions}
不良反应：{med.adverse_reactions}
药物相互作用：{med.interactions}
"""
    else:
        print(f"Medicine not found in local DB: {drug_name}")

    # 2. RAG 检索 (体质 + 药物)
    query = f"{constitution}患者使用{drug_name}的禁忌、副作用及注意事项"
    
    context_list = get_rag_context(query, top_k=5)
    
    # 如果检索结果太少，尝试放宽查询
    if len(context_list) < 2:
        context_list += get_rag_context(drug_name, top_k=3)
        context_list += get_rag_context(constitution + "用药原则", top_k=3)
        
    # 去重
    context_list = list(set(context_list))
    rag_str = "\n\n".join(context_list)
    
    if not rag_str:
        rag_str = "暂无其他相关专业资料。"

    # 3. 构造 Prompt
    prompt = f"""
你是一位资深的中西医结合专家。请根据以下参考资料，分析【{constitution}】人群使用【{drug_name}】的潜在风险和禁忌。

参考资料 A（药物说明书）：
{med_info}

参考资料 B（医学文献检索）：
{rag_str}

请输出一份严格的 JSON 格式分析报告，不要包含任何 Markdown 代码块标记（如 ```json），必须包含以下字段：
1. "input_type": 输入类型，只能是 "SpecificDrug"（具体药物）、"DrugClass"（一类药物）、"Food"（食物）、"Other"（其他）之一。
   **特别注意**：对于输入内容，请优先判断其是否泛指某一类事物（Broad Category）。例如：
   - 用户输入“头孢”，通常泛指“头孢类药物”，input_type 应为 "DrugClass"。
   - 用户输入“感冒药”，泛指所有感冒类药物，input_type 应为 "DrugClass"。
   - 只有当输入明确指向单一特定药物（如“头孢氨苄”、“复方氨酚烷胺”）时，才定为 "SpecificDrug"。
2. "risk_level": 综合风险等级，只能是 "high"、"medium"、"low" 之一。如果 input_type 是 "Other"，此字段为 "low"。
3. "summary": 核心结论摘要（50字以内）。
4. "class_analysis": 如果 input_type 是 "DrugClass"，请在此提供该类药物的整体禁忌分析（Markdown格式，100字左右）；如果是其他类型，留空字符串。
5. "representative_drugs": 如果 input_type 是 "DrugClass"，请列出 3-5 个该类代表性药物，并简述其各自的特殊禁忌（Markdown格式）；如果是其他类型，留空字符串。
6. "interactions": 一个数组，列出该药物与其他药物、食物或化合物的相互作用禁忌。每个对象包含：
   - "name": 相互作用的物质名称（如“头孢类”、“酒精”、“维生素K拮抗剂”）。
   - "type": 类型，只能是 "Drug"（具体药物）、"Food"（具体食物）、"Compound"（一类化合物或药物类别）之一。
   - "examples": 如果 type 是 "Compound"，请列出 3-5 个常见的该类具体药物或食物名称，并用中文顿号“、”分隔（如：type为"头孢类"则列出"头孢氨苄、头孢呋辛"）；如果是 "Drug" 或 "Food"，此字段留空字符串。
   - "risk": 风险等级（"high"禁用/ "medium"慎用/ "low"注意）。
   - "description": 简短说明（20字以内）。
7. "detail": 详细分析报告（Markdown格式），包含风险分析（中西医视角）和用药建议。如果 input_type 是 "Other"，请说明无法识别该输入为药物或食物，并建议用户重新输入。

注意：
- 输出结果中严禁包含任何撰稿人署名（如“资深中西医结合专家”、“AI助手”等）和日期信息。
- 必须是合法的 JSON 格式，可以直接被解析。
"""

    # 4. 调用 LLM
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        return {
            "risk_level": "medium",
            "summary": "配置错误：未找到 API KEY",
            "detail": "无法连接到 AI 服务，请检查后端配置。"
        }
        
    client = OpenAI(
        api_key=api_key,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    )

    try:
        completion = client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {"role": "system", "content": "你是一个专业的医疗AI助手，必须只输出 JSON 格式。"},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"} # 强制 JSON 模式
        )
        content = completion.choices[0].message.content
        
        # 清理可能存在的 Markdown 代码块标记 (针对 DeepSeek 等模型可能返回 ```json 的情况)
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        import json
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "risk_level": "medium",
                "summary": "解析结果格式异常",
                "detail": content
            }
    except Exception as e:
        return {
            "risk_level": "medium",
            "summary": "服务暂时不可用",
            "detail": f"AI 分析服务出错: {e}"
        }
