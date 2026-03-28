import os
import json

index_file = '/home/demmojo/Code/nicheai/.cursor/hooks/state/continual-learning-index.json'
transcript_dir = '/home/demmojo/.cursor/projects/home-demmojo-Code-nicheai/agent-transcripts/'

try:
    with open(index_file, 'r') as f:
        index = json.load(f)
except Exception:
    index = {}

current_files = {}

for entry in os.listdir(transcript_dir):
    d_path = os.path.join(transcript_dir, entry)
    if os.path.isdir(d_path):
        f_path = os.path.join(d_path, f"{entry}.jsonl")
        if os.path.exists(f_path):
            mtime = os.path.getmtime(f_path) * 1000
            current_files[f_path] = mtime

# Remove keys not in current_files
keys_to_remove = [k for k in index if k not in current_files]
for k in keys_to_remove:
    del index[k]

# Update index with current_files
for k, v in current_files.items():
    index[k] = v

# Make sure dir exists
os.makedirs(os.path.dirname(index_file), exist_ok=True)

with open(index_file, 'w') as f:
    json.dump(index, f, indent=4)

print(f"Updated index with {len(current_files)} files. Removed {len(keys_to_remove)} stale entries.")
