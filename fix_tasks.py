import re

with open("openspec/changes/head-to-head-comparison/tasks.md", "r") as f:
    content = f.read()

content = content.replace("- [ ]", "- [x]")

with open("openspec/changes/head-to-head-comparison/tasks.md", "w") as f:
    f.write(content)
