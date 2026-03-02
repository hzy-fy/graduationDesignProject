import os
import re
import pdfplumber
from tqdm import tqdm
import pytesseract
from pdf2image import convert_from_path
import docx

# 定位数据目录
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, 'data')
BOOKS_DIR = os.path.join(DATA_DIR, 'booksdata')
PROCESSED_DIR = os.path.join(DATA_DIR, 'processed')

def clean_text(text):
    if not text: return ""
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if re.match(r'^\d+$', line): continue
        if len(line) < 2: continue
        # 删除章节号
        line = re.sub(r'第[一二三四五六七八九十百千0-9]+[章节]', '', line)
        cleaned_lines.append(line)
    text = '\n'.join(cleaned_lines)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n\s*\n', '\n', text)
    return text.strip()

def process_with_ocr(pdf_path):
    print(f"  Starting OCR for {os.path.basename(pdf_path)}...")
    text_content = []
    try:
        images = convert_from_path(pdf_path, dpi=200)
        start_page = 0
        if len(images) > 10: start_page = 5
        print(f"  Total pages (OCR): {len(images)}. Processing from page {start_page}...")
        for i, image in enumerate(tqdm(images[start_page:])):
            try:
                text = pytesseract.image_to_string(image, lang='chi_sim+eng')
                if text:
                    cleaned = clean_text(text)
                    if cleaned: text_content.append(cleaned)
            except Exception as e: print(f"    OCR Error: {e}")
    except Exception as e:
        print(f"  OCR Failed: {e}")
        return None
    return "\n".join(text_content)

def process_pdf(pdf_path):
    print(f"Processing PDF: {os.path.basename(pdf_path)}")
    text_content = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            start_page = 0
            if len(pdf.pages) > 10: start_page = 5
            
            # Check if scanned
            sample = "".join([p.extract_text() or "" for p in pdf.pages[start_page:start_page+10]])
            if len(sample.strip()) < 100:
                print("  Scanned PDF detected. Switching to OCR...")
                return process_with_ocr(pdf_path)
            
            for page in tqdm(pdf.pages[start_page:]):
                text = page.extract_text()
                if text:
                    cleaned = clean_text(text)
                    if cleaned: text_content.append(cleaned)
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None
    return "\n".join(text_content)

def process_docx(docx_path):
    print(f"Processing DOCX: {os.path.basename(docx_path)}")
    text_content = []
    try:
        doc = docx.Document(docx_path)
        for para in tqdm(doc.paragraphs):
            text = para.text.strip()
            if text:
                cleaned = clean_text(text)
                if cleaned: text_content.append(cleaned)
    except Exception as e:
        print(f"Error reading DOCX: {e}")
        return None
    return "\n".join(text_content)

def main():
    if not os.path.exists(PROCESSED_DIR): os.makedirs(PROCESSED_DIR)
    
    files = [f for f in os.listdir(BOOKS_DIR) if f.lower().endswith(('.pdf', '.docx'))]
    print(f"Found {len(files)} files.")
    
    for filename in files:
        file_path = os.path.join(BOOKS_DIR, filename)
        txt_filename = os.path.splitext(filename)[0] + '.txt'
        txt_path = os.path.join(PROCESSED_DIR, txt_filename)
        
        # 跳过已存在的临时文件（以 ~$ 开头）
        if filename.startswith('~$'): continue

        if os.path.exists(txt_path) and os.path.getsize(txt_path) > 1024:
            print(f"Skipping {filename} (already processed)")
            continue
            
        content = None
        if filename.lower().endswith('.pdf'): content = process_pdf(file_path)
        elif filename.lower().endswith('.docx'): content = process_docx(file_path)
        
        if content and len(content.strip()) > 100:
            with open(txt_path, 'w', encoding='utf-8') as f: f.write(content)
            print(f"Saved to {txt_path}")
        else:
            print(f"Warning: Extraction failed for {filename}")

if __name__ == "__main__":
    main()
