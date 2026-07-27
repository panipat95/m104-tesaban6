import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

pdf_dir = r'D:\porsky\แบบฟอร์มระบบเยี่ยมบ้าน'
files = os.listdir(pdf_dir)
pdf_path = None
for f in files:
    if f.endswith('.pdf'):
        pdf_path = os.path.join(pdf_dir, f)
        break

print(f"Found PDF: {pdf_path}")

try:
    import pypdf
    reader = pypdf.PdfReader(pdf_path)
    print(f"Total pages: {len(reader.pages)}")
    for i, page in enumerate(reader.pages):
        print(f"\n--- PAGE {i+1} ---")
        print(page.extract_text())
except Exception as e:
    print(f"pypdf error: {e}")
    try:
        import fitz # PyMuPDF
        doc = fitz.open(pdf_path)
        print(f"PyMuPDF Total pages: {len(doc)}")
        for i, page in enumerate(doc):
            print(f"\n--- PAGE {i+1} ---")
            print(page.get_text())
    except Exception as e2:
        print(f"PyMuPDF error: {e2}")
