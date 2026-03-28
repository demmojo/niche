import json
import os
import glob

index_file = "/home/demmojo/Code/nicheai/.cursor/hooks/state/continual-learning-index.json"
try:
    with open(index_file, 'r') as f:
        index = json.load(f)
except FileNotFoundError:
    index = {}

transcript_dir = "/home/demmojo/.cursor/projects/home-demmojo-Code-nicheai/agent-transcripts/"
jsonl_files = glob.glob(transcript_dir + "**/*.jsonl", recursive=True)

new_files = []
for f in jsonl_files:
    mtime = os.path.getmtime(f)
    if f not in index or mtime > index[f]:
        new_files.append((f, mtime))

for f, mtime in new_files:
    # only look at parent transcripts or interesting user messages
    with open(f, 'r') as file:
        lines = file.readlines()
        if not lines: continue
        for line in lines:
            try:
                msg = json.loads(line)
                role = msg.get("role", "")
                if role == "user":
                    content = msg.get("message", {}).get("content", [])
                    text = "".join(c.get("text", "") for c in content if c.get("type") == "text")
                    if "always" in text.lower() or "never" in text.lower() or "prefer" in text.lower() or "remember" in text.lower() or "update AGENTS.md" in text:
                        print(f"--- {f} ---")
                        print(f"USER: {text[:500]}")
            except:
                pass
