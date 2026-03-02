import os
import json
import pandas as pd
from tqdm import tqdm

# 定位数据目录
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MEDDATA_DIR = os.path.join(BASE_DIR, 'data', 'meddata')
OUTPUT_FILE = os.path.join(MEDDATA_DIR, 'all_medicines.json')

# 需要保留的字段
TARGET_COLUMNS = [
    '通用名称', '商品名称', '相关疾病', '性状', '主要成份', 
    '适应症', '规格', '不良反应', '用法用量', '禁忌', 
    '注意事项', '孕妇及哺乳期妇女用药', '儿童用药', '老人用药', 
    '药物相互作用', '药理毒理', '药代动力学', '贮藏', '有效期'
]

def main():
    if not os.path.exists(MEDDATA_DIR):
        print(f"Directory not found: {MEDDATA_DIR}")
        return

    # 扫描 Excel 文件
    files = [f for f in os.listdir(MEDDATA_DIR) if f.endswith('.xlsx') and not f.startswith('~$')]
    print(f"Found {len(files)} Excel files.")

    all_data = []

    for filename in tqdm(files, desc="Processing files"):
        file_path = os.path.join(MEDDATA_DIR, filename)
        try:
            # 读取 Excel
            # dtype=str 强制所有列读取为字符串，避免日期或数字格式问题
            df = pd.read_excel(file_path, dtype=str)
            
            # 筛选列 (只保留存在的列)
            existing_cols = [col for col in TARGET_COLUMNS if col in df.columns]
            
            # 提取数据
            subset = df[existing_cols].copy()
            
            # 清洗数据: 将 NaN 和 'nan' 替换为空字符串
            subset = subset.fillna('')
            
            # 转为字典列表
            records = subset.to_dict(orient='records')
            
            # 对字典中的值再次清洗（去除首尾空格）
            for record in records:
                for key in record:
                    if isinstance(record[key], str):
                        record[key] = record[key].strip()
                        # 处理可能的 'nan' 字符串 (pandas 有时会把 NaN 转为 'nan')
                        if record[key].lower() == 'nan':
                            record[key] = ''

            all_data.extend(records)
            
        except Exception as e:
            print(f"Error reading {filename}: {e}")

    # 保存为 JSON
    print(f"Total records: {len(all_data)}")
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
        print(f"Saved to {OUTPUT_FILE}")
    except Exception as e:
        print(f"Error saving JSON: {e}")

if __name__ == "__main__":
    main()
