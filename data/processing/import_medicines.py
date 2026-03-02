import os
import sys
import json
import django
from tqdm import tqdm

# 设置 Django 环境
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
sys.path.append(BACKEND_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Medicine

# 数据文件路径
MEDDATA_DIR = os.path.join(BASE_DIR, 'data', 'meddata')
JSON_FILE = os.path.join(MEDDATA_DIR, 'all_medicines.json')

def main():
    if not os.path.exists(JSON_FILE):
        print(f"File not found: {JSON_FILE}")
        return

    print("Loading JSON data... (This might take a moment for 400MB)")
    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Total records to import: {len(data)}")
    
    # 清空旧数据 (可选，避免重复导入)
    # print("Clearing existing data...")
    # Medicine.objects.all().delete()
    
    # 批量创建对象
    batch_size = 2000
    batch = []
    
    for item in tqdm(data, desc="Importing"):
        medicine = Medicine(
            generic_name=item.get('通用名称', '')[:255], # 截断以防超过 max_length
            trade_name=item.get('商品名称', '')[:255],
            related_diseases=item.get('相关疾病', ''),
            description=item.get('性状', ''),
            ingredients=item.get('主要成份', ''),
            indications=item.get('适应症', ''),
            specification=item.get('规格', ''),
            adverse_reactions=item.get('不良反应', ''),
            dosage=item.get('用法用量', ''),
            contraindications=item.get('禁忌', ''),
            precautions=item.get('注意事项', ''),
            pregnancy_lactation_use=item.get('孕妇及哺乳期妇女用药', ''),
            pediatric_use=item.get('儿童用药', ''),
            geriatric_use=item.get('老人用药', ''),
            interactions=item.get('药物相互作用', ''),
            pharmacology_toxicology=item.get('药理毒理', ''),
            pharmacokinetics=item.get('药代动力学', ''),
            storage=item.get('贮藏', ''),
            validity=item.get('有效期', '')
        )
        batch.append(medicine)
        
        if len(batch) >= batch_size:
            Medicine.objects.bulk_create(batch)
            batch = []
            
    # 插入剩余的
    if batch:
        Medicine.objects.bulk_create(batch)
        
    print("Import completed successfully!")

if __name__ == "__main__":
    main()
