import os
import glob
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    new_content = re.sub(r'vi\.mocked\(supabase!\.(.*?)\)', r'vi.mocked((supabase as any).\1)', content)
    new_content = re.sub(r'expect\(supabase\?\.(.*?)\)', r'expect((supabase as any).\1)', new_content)

    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk('src/__tests__'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

