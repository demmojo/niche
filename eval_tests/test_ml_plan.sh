#!/bin/bash
if [ -f "docs/ml-architecture.md" ] && grep -qi "architecture" docs/ml-architecture.md; then
  echo "Task 4 Passed: ML architecture file exists and contains architecture content."
  exit 0
else
  echo "Task 4 Failed: docs/ml-architecture.md does not exist or lacks correct content."
  exit 1
fi
