import os

files_to_fix = [
    r'c:\Users\usuario\Desktop\Proyecto ERP\frontend\src\pages\accounting\AccountsPage.tsx',
    r'c:\Users\usuario\Desktop\Proyecto ERP\frontend\src\hooks\usePeriods.ts',
    r'c:\Users\usuario\Desktop\Proyecto ERP\frontend\src\hooks\useAccounts.ts',
    r'c:\Users\usuario\Desktop\Proyecto ERP\backend\app\models\accounting.py'
]

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = []
    state = 'NORMAL'  # NORMAL, IN_HEAD, IN_INCOMING
    
    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            state = 'IN_HEAD'
            continue
        elif line.startswith('======='):
            state = 'IN_INCOMING'
            continue
        elif line.startswith('>>>>>>>'):
            state = 'NORMAL'
            continue
            
        if state == 'NORMAL' or state == 'IN_HEAD':
            new_lines.append(line)
            
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        
    print(f"Fixed {file_path}")
