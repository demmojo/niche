import json
import sys

file_path = sys.argv[1]
with open(file_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('role') == 'assistant':
                content = data.get('message', {}).get('content', [])
                for item in content:
                    if item.get('type') == 'text' and 'Sovereign Claim-Check Protocol' in item.get('text', ''):
                        print("--- MESSAGE ---")
                        print(item.get('text'))
        except:
            pass
