import os
import glob
import re

def resolve_conflicts(directory):
    files = glob.glob(os.path.join(directory, '**', '*'), recursive=True)
    resolved_count = 0
    
    for file_path in files:
        if not os.path.isfile(file_path):
            continue
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            continue
            
        if '<<<<<<< HEAD' in content:
            # Reemplazar conflictos manteniendo HEAD
            # Match:
            # <<<<<<< HEAD\n
            # (HEAD content)
            # =======\n
            # (Incoming content)
            # >>>>>>> (commit/branch name)\n
            
            pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n=======\n.*?\n>>>>>>> .*?(\n|$)', re.DOTALL)
            new_content = pattern.sub(r'\1\n', content)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
                
            print(f"Conflictos resueltos en: {file_path}")
            resolved_count += 1
            
    print(f"\nTotal archivos resueltos: {resolved_count}")

if __name__ == '__main__':
    resolve_conflicts('c:/Users/usuario/Desktop/Proyecto ERP/')
