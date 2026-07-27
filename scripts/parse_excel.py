import sys
import pandas as pd

sys.stdout.reconfigure(encoding='utf-8')

excel_path = 'd:/porsky/Student_Midterm_Scores_M1_4.xlsx'
df = pd.read_excel(excel_path, header=None)
for i in range(10):
    print(f"Row {i}: {df.iloc[i].tolist()}")
