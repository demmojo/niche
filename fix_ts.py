import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Fix status: 'planned'
content = content.replace("status: 'planned'", "status: 'planned' as const")

# Fix category in initialDerivedInsights
content = content.replace("category: 'opportunity',", "category: 'opportunity' as const,")
content = content.replace("category: 'threat',", "category: 'threat' as const,")
content = content.replace("impact: 'high',", "impact: 'high' as const,")
content = content.replace("impact: 'medium',", "impact: 'medium' as const,")
content = content.replace("source: 'AI',", "source: 'AI' as const,")
content = content.replace("source: 'Human',", "source: 'Human' as const,")

# Fix 'Google Search'
content = content.replace("source: 'Google Search'", "source: 'AI' as const")

# Move initialDerivedInsights up
initial_derived_insights_block = re.search(r"const initialDerivedInsights = \[[\s\S]*?\];", content)
if initial_derived_insights_block:
    block_text = initial_derived_insights_block.group(0)
    content = content.replace(block_text, "")
    # insert after initialRawDataSources
    content = re.sub(r"(const initialRawDataSources[\s\S]*?\];)", r"\1\n\n" + block_text, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

