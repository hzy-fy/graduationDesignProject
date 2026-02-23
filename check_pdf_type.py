import pdfplumber
import os

pdf_path = r'data/booksdata/药理学（第10版).pdf'
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
