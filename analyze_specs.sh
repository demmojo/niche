#!/bin/bash

# Analysis for openspecs
for dir in openspec/changes/*/; do
  spec=$(basename "$dir")
  echo "========== SPEC: $spec =========="
  
  # Check tasks.md
  if [ -f "$dir/tasks.md" ]; then
    total=$(grep -c "\- \[" "$dir/tasks.md")
    done=$(grep -c "\- \[x\]" "$dir/tasks.md")
    echo "Tasks: $done / $total completed"
  else
    echo "Tasks: None"
  fi
  
  # Try to find keywords in src
  # We will just print the first 5 lines of proposal.md or design.md to get a sense
  head -n 5 "$dir/proposal.md" 2>/dev/null | grep -v "^$" | head -n 3
  
  echo ""
done

# Analysis for plans
echo "========== PLANS =========="
for file in openspec/plans/*.md; do
  echo "--- $file ---"
  head -n 5 "$file" 2>/dev/null | grep -v "^$" | head -n 3
done

