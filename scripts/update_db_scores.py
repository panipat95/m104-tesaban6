import sys
import pandas as pd
import json

sys.stdout.reconfigure(encoding='utf-8')

excel_path = 'd:/porsky/Student_Midterm_Scores_M1_4.xlsx'
df = pd.read_excel(excel_path, header=None)

# Row 4 is header:
# Col 0: no, Col 1: id, Col 2: prefix, Col 3: firstname, Col 4: lastname
# Col 5: eng_comm, Col 6: social, Col 7: math_basic, Col 8: thai, Col 9: math_add1, Col 10: math_add2, Col 11: chinese, Col 12: eng_basic, Col 13: sci_basic

parsed_students = {}

for r in range(5, len(df)):
    row = df.iloc[r]
    if pd.isna(row[0]) or pd.isna(row[1]):
        continue
    
    try:
        no = int(row[0])
        student_id = str(row[1]).strip()
        name = f"{str(row[2]).strip()}{str(row[3]).strip()} {str(row[4]).strip()}"
        
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
        
        parsed_students[student_id] = {
            "no": no,
            "id": student_id,
            "name": name,
            "scores": {
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
        }
    except Exception as e:
        print(f"Error on row {r}: {e}")

print(f"Parsed {len(parsed_students)} student score records!")
print(json.dumps(list(parsed_students.values())[:3], ensure_ascii=False, indent=2))
