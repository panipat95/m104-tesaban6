import sys
import os
import fitz # PyMuPDF

sys.stdout.reconfigure(encoding='utf-8')

pdf_dir = r'D:\porsky\แบบฟอร์มระบบเยี่ยมบ้าน'
files = os.listdir(pdf_dir)
pdf_path = None
for f in files:
    if f.endswith('.pdf'):
        pdf_path = os.path.join(pdf_dir, f)
        break

print(f"Opening PDF: {pdf_path}")
doc = fitz.open(pdf_path)

output_dir = r'D:\porsky\แบบฟอร์มระบบเยี่ยมบ้าน'
rendered_files = []

for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=150)
    out_name = f"page_{i+1}.png"
    out_path = os.path.join(output_dir, out_name)
    pix.save(out_path)
    rendered_files.append(out_path)
    print(f"Saved: {out_path}")

print("Done rendering pages to images!")
