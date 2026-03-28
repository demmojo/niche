import re
import json
import os
import glob

agents_file = '/home/demmojo/Code/nicheai/AGENTS.md'
index_file = '/home/demmojo/Code/nicheai/.cursor/hooks/state/continual-learning-index.json'

with open(agents_file, 'r') as f:
    content = f.read()

# Replace the Gemini legacy fact
old_gemini = "- Gemini 1.5 and 2.5 are legacy as of 2026; always target `gemini-3.1-flash` for rapid tasks and `gemini-3.1-pro` (or newer) for complex, critical reasoning tasks."
new_gemini = "- Gemini 1.5 and 2.5 are legacy and strictly prohibited as of 2026; always target `gemini-3.1-flash` for rapid tasks and `gemini-3.1-pro` for critical reasoning tasks."

if old_gemini in content:
    content = content.replace(old_gemini, new_gemini)
elif "- Gemini 1.5 and 2.5 are legacy and strictly prohibited" not in content:
    content = content.replace("## Learned Workspace Facts\n", f"## Learned Workspace Facts\n{new_gemini}\n")

# Add the impersonation fact
impersonation_fact = "- For user impersonation by superadmins, NicheAI uses a \"Secondary Firebase App\" approach with Custom JWT tokens containing `{ isImpersonated: true }` claims (via POST /api/superadmin/impersonate)."
if impersonation_fact not in content:
    content = content.replace("## Learned Workspace Facts\n", f"## Learned Workspace Facts\n{impersonation_fact}\n")

# Add the OpenSpec directory fact
openspec_fact = "- OpenSpec files and plans are strictly managed under `openspec/` rather than `docs/`. Avoid regressing the codebase by incorrectly implementing outdated plans after directory migrations."
if openspec_fact not in content:
    content = content.replace("## Learned Workspace Facts\n", f"## Learned Workspace Facts\n{openspec_fact}\n")

# Add the user preference for Leeropedia and pro model
gemini_pref = "- Strictly avoid Gemini 1.5 and 2.5 models; use gemini-3.1-pro for critical tasks and ensure machine learning best practices from Leeropedia are applied."
if gemini_pref not in content:
    content = content.replace("## Learned User Preferences\n", f"## Learned User Preferences\n{gemini_pref}\n")

with open(agents_file, 'w') as f:
    f.write(content)

# Update index file
try:
    with open(index_file, 'r') as f:
        idx = json.load(f)
except:
    idx = {}

transcripts = glob.glob('/home/demmojo/.cursor/projects/home-demmojo-Code-nicheai/agent-transcripts/*/*.jsonl')

# remove missing files from index
for fpath in list(idx.keys()):
    if not os.path.exists(fpath):
        del idx[fpath]

for fpath in transcripts:
    idx[fpath] = os.path.getmtime(fpath)

# ensure directory exists
os.makedirs(os.path.dirname(index_file), exist_ok=True)
with open(index_file, 'w') as f:
    json.dump(idx, f)

print("Updates applied to AGENTS.md and index refreshed.")
