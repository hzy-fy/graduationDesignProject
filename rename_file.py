import os

# 尝试列出所有文件以确认名字
print("Files in dir:", os.listdir('data/booksdata'))

try:
    # 尝试重命名，如果失败可能是名字里还有其他不可见字符
    for f in os.listdir('data/booksdata'):
        if '药理学' in f and '第10版' in f:
            print(f"Found match: {f}")
            src = os.path.join('data/booksdata', f)
            dst = os.path.join('data/booksdata', 'pharmacology_10.pdf')
            os.rename(src, dst)
            print(f"Renamed {f} to pharmacology_10.pdf")
            break
except Exception as e:
    print(f"Error: {e}")
