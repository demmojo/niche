import json
import sys

file_path = sys.argv[1]
with open(file_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            role = data.get('role', 'unknown')
            content = data.get('message', {}).get('content', [])
            print(f"=== ROLE: {role} ===")
            for item in content:
                if item.get('type') == 'text':
                    print(item.get('text'))
        except:
            pass
