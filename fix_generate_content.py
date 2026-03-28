import os
import re

def fix_generate_content(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Look for ai.models.generateContent({\n model: model,\n contents: prompt...
    # Actually, let's just use regex to find ai.models.generateContent({ model: model, ... })
    # It might be `model,` or `model: model,`
    
    # We want to replace:
    # ai.models.generateContent({
    #   model: model,
    #   contents: ...
    # })
    #
    # With:
    # ai.generateContent(model, {
    #   contents: ...
    # })
    
    new_content = re.sub(
        r'ai\.models\.generateContent\(\s*{\s*model(?:\s*:\s*model)?\s*,',
        r'ai.generateContent(model, {',
        content
    )
    
    # And same for generateContentStream
    new_content = re.sub(
        r'ai\.models\.generateContentStream\(\s*{\s*model(?:\s*:\s*model)?\s*,',
        r'ai.generateContentStream(model, {',
        new_content
    )
    
    if new_content != content:
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"Fixed {file_path}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            fix_generate_content(os.path.join(root, file))
