import json
import os

files = [
  "/home/demmojo/.cursor/projects/home-demmojo-Code-nicheai/agent-transcripts/9e426471-70cd-40c3-8022-e2293ecd2285/subagents/ef3a89c5-d0c9-4b57-9b75-939cd241281d.jsonl",
  "/home/demmojo/.cursor/projects/home-demmojo-Code-nicheai/agent-transcripts/9e426471-70cd-40c3-8022-e2293ecd2285/subagents/26b68c1c-4040-4a6b-8e4d-aedc8e320231.jsonl",
  "/home/demmojo/.cursor/projects/home-demmojo-Code-nicheai/agent-transcripts/9e426471-70cd-40c3-8022-e2293ecd2285/subagents/182fcddb-039d-4106-a8fc-b51cd7ffd7a5.jsonl",
  "/home/demmojo/.cursor/projects/home-demmojo-Code-nicheai/agent-transcripts/9e426471-70cd-40c3-8022-e2293ecd2285/subagents/d7bf6556-703e-4ede-a492-bae233550c1b.jsonl",
  "/home/demmojo/.cursor/projects/home-demmojo-Code-nicheai/agent-transcripts/2a0f6222-e252-4cbc-8312-979049a45cfd/subagents/d73a8546-cb06-4c7c-a1ea-03ad3fd55830.jsonl",
  "/home/demmojo/.cursor/projects/home-demmojo-Code-nicheai/agent-transcripts/2a0f6222-e252-4cbc-8312-979049a45cfd/subagents/5b9b5575-c8f5-42be-88a1-7230d148311a.jsonl"
]

for f in files:
    print(f"\n--- {os.path.basename(f)} ---")
    with open(f, 'r') as fd:
        messages = []
        for line in fd:
            try:
                data = json.loads(line)
                if data.get('role') == 'assistant':
                    content = data.get('message', {}).get('content', [])
                    text = ""
                    if isinstance(content, str):
                        text = content
                    elif isinstance(content, list):
                        for block in content:
                            if isinstance(block, dict) and block.get('type') == 'text':
                                text += block.get('text', '') + "\n"
                    if text.strip() and not "```json" in text and len(text) > 100:
                        messages.append(text.strip())
            except:
                pass
        if messages:
            print(messages[-1][:1500]) # Print the last message of the assistant from the subagent
