import pdfplumber
import os

# 定位数据目录
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
pdf_path = os.path.join(BASE_DIR, 'data', 'booksdata', 'pharmacology_10.pdf') # 假设已重命名

print(f"Checking {pdf_path}...")

try:
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        # Check page 10 (skip cover)
        if len(pdf.pages) > 10:
            text = pdf.pages[10].extract_text()
            if text:
                print(f"--- Text extracted from page 10 ---\n{text[:200]}...\n--- End ---")
                print("Result: This is a TEXT PDF.")
            else:
                print("Result: This is likely a SCANNED PDF (Image).")
        else:
            print("File too short.")
except Exception as e:
    print(f"Error: {e}")
