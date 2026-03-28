import re

with open('src/__tests__/components/Settings.test.tsx', 'r') as f:
    content = f.read()

# Replace all view = render(<Settings />); with await act(async () => { view = render(<Settings />); });
# if they are not already inside an act

def replacer(match):
    before = content[:match.start()]
    # Check if the preceding lines have an act
    lines = before.split('\n')
    if len(lines) > 2 and 'act(async' in lines[-2]:
        return match.group(0)
    
    # We also need to preserve indentation
    indent = match.group(1)
    return f"{indent}await act(async () => {{\n{indent}  view = render(<Settings />);\n{indent}}});"

new_content = re.sub(r'([ \t]*)view = render\(<Settings />\);', replacer, content)

with open('src/__tests__/components/Settings.test.tsx', 'w') as f:
    f.write(new_content)
