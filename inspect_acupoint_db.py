import sqlite3
import os

db_path = r"c:\Users\26576\Desktop\GraduationDesign\Code\data\Acupoint.db"

if not os.path.exists(db_path):
    print(f"Error: {db_path} does not exist.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables:", tables)

for table in tables:
    table_name = table[0]
    print(f"\n--- Data in {table_name} (limit 3) ---")
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [col[1] for col in cursor.fetchall()]
    print("Columns:", columns)
    
    cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
    rows = cursor.fetchall()
    for row in rows:
        print(row)

conn.close()
