#!/bin/bash
if [ -f "docs/ml-debug-checklist.md" ]; then
  echo "Task 5 Passed: Debug checklist file exists."
  exit 0
else
  echo "Task 5 Failed: docs/ml-debug-checklist.md does not exist."
  exit 1
fi
