import os
import json

index_file = '/home/demmojo/Code/nicheai/.cursor/hooks/state/continual-learning-index.json'
transcript_dir = '/home/demmojo/.cursor/projects/home-demmojo-Code-nicheai/agent-transcripts/'

with open(index_file, 'r') as f:
    index = json.load(f)

to_process = []
for entry in os.listdir(transcript_dir):
    d_path = os.path.join(transcript_dir, entry)
    if os.path.isdir(d_path):
        f_path = os.path.join(d_path, f"{entry}.jsonl")
        if os.path.exists(f_path):
            mtime = os.path.getmtime(f_path) * 1000  # JS timestamps are ms
            if f_path not in index or mtime > index[f_path]:
                to_process.append(f_path)

print("Files to process:")
for f in to_process:
    print(f)
