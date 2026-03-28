import re

with open("src/App.tsx", "r") as f:
    content = f.read()

funcs = [
    "JsonViewer",
    "DataSourceCard",
    "ScoutPage",
    "NavItem",
    "SummaryCard",
    "SortableHeader",
    "QuickPromptButton",
    "SovereigntyBadge",
    "SourcePage",
    "SummaryPage"
]

new_content = content
for func in funcs:
    pattern = r"(function " + func + r"\b.*?^}$)"
    match = re.search(pattern, new_content, re.MULTILINE | re.DOTALL)
    if match:
        code = match.group(1)
        # We will write the code to a new file in src/components/
        filename = f"src/components/{func}.tsx"
        with open(filename, "w") as f:
            f.write("import React, { useState } from 'react';\n")
            f.write("import { ... } from 'lucide-react'; // auto-import if needed\n")
            f.write("export " + code + "\n")
        
        # Remove from App.tsx
        new_content = new_content.replace(code, "")

with open("src/App.tsx", "w") as f:
    f.write(new_content)
