import pandas as pd
import os

BASE_DIR = r'C:\Users\26576\Desktop\毕业设计\Code\data\meddata'
files = [f for f in os.listdir(BASE_DIR) if f.endswith('.xlsx') and not f.startswith('~$')]

if files:
    print(f"Checking {files[0]}...")
    df = pd.read_excel(os.path.join(BASE_DIR, files[0]))
    print("Columns found:")
    for col in df.columns:
        print(f"  - {col}")
else:
    print("No Excel files found.")
