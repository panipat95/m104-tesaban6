import sys
import pandas as pd
import json

sys.stdout.reconfigure(encoding='utf-8')

excel_path = 'd:/porsky/Student_Midterm_Scores_M1_4.xlsx'
df = pd.read_excel(excel_path, header=None)

scores_by_id = {}

for r in range(5, len(df)):
    row = df.iloc[r]
    if pd.isna(row[0]) or pd.isna(row[1]):
        continue
    
    student_id = str(row[1]).strip()
    
    eng_comm = int(row[5]) if not pd.isna(row[5]) else 0
    social = int(row[6]) if not pd.isna(row[6]) else 0
    math_basic = int(row[7]) if not pd.isna(row[7]) else 0
    thai = int(row[8]) if not pd.isna(row[8]) else 0
    math_add1 = int(row[9]) if not pd.isna(row[9]) else 0
    math_add2 = int(row[10]) if not pd.isna(row[10]) else 0
    chinese = int(row[11]) if not pd.isna(row[11]) else 0
    eng_basic = int(row[12]) if not pd.isna(row[12]) else 0
    sci_basic = int(row[13]) if not pd.isna(row[13]) else 0
    
    total = eng_comm + social + math_basic + thai + math_add1 + math_add2 + chinese + eng_basic + sci_basic
    
    scores_by_id[student_id] = {
        "eng_comm": eng_comm,
        "social": social,
        "math_basic": math_basic,
        "thai": thai,
        "math_add1": math_add1,
        "math_add2": math_add2,
        "chinese": chinese,
        "eng_basic": eng_basic,
        "sci_basic": sci_basic,
        "total_score": total
    }

print(f"Loaded scores for {len(scores_by_id)} students.")

# Read real_db.js with utf-8-sig
with open('d:/porsky/real_db.js', 'r', encoding='utf-8-sig') as f:
    db_content = f.read()

json_str = db_content.replace('window.REAL_STUDENT_DB =', '').strip()
if json_str.endswith(';'):
    json_str = json_str[:-1]

students_list = json.loads(json_str)

updated_count = 0
for st in students_list:
    sid = str(st.get("student_id")).strip()
    if sid in scores_by_id:
        st["scores"] = scores_by_id[sid]
        updated_count += 1

new_db_content = "window.REAL_STUDENT_DB = " + json.dumps(students_list, ensure_ascii=False, indent=4) + ";"

with open('d:/porsky/real_db.js', 'w', encoding='utf-8') as f:
    f.write(new_db_content)

print(f"Successfully updated {updated_count} student records in real_db.js!")
