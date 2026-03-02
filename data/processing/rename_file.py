import os

# 定位数据目录
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BOOKS_DIR = os.path.join(BASE_DIR, 'data', 'booksdata')

# 尝试列出所有文件以确认名字
print("Files in dir:", os.listdir(BOOKS_DIR))

try:
    # 尝试重命名
    for f in os.listdir(BOOKS_DIR):
        if '药理学' in f and '第10版' in f:
            print(f"Found match: {f}")
            src = os.path.join(BOOKS_DIR, f)
            dst = os.path.join(BOOKS_DIR, 'pharmacology_10.pdf')
            os.rename(src, dst)
            print(f"Renamed {f} to pharmacology_10.pdf")
            break
except Exception as e:
    print(f"Error: {e}")
