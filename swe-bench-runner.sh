#!/bin/bash
TASKS=("task-1-rules.md" "task-2-skills.md" "task-3-mcp.md" "task-4-ml-plan.md" "task-5-ml-debug.md")
CONFIGS=("run-a-baseline.yml" "run-b-prompts.yml" "run-c-full.yml")

for CONFIG in "${CONFIGS[@]}"; do
  for TASK in "${TASKS[@]}"; do
    echo "Running $TASK with $CONFIG..."
    
    # 1. Reset codebase to clean state
    git checkout main
    git reset --hard HEAD
    git clean -fd
    
    # 2. Setup the test command depending on the task
    if [[ "$TASK" == "task-4-ml-plan.md" ]]; then
      TEST_CMD="bash eval_tests/test_ml_plan.sh"
    elif [[ "$TASK" == "task-5-ml-debug.md" ]]; then
      TEST_CMD="bash eval_tests/test_ml_debug.sh"
    else
      # Inject the grading test specifically for UI/logic tasks
      cp eval_tests/${TASK}-test.ts src/__tests__/grading.test.ts
      TEST_CMD="npx vitest run src/__tests__/grading.test.ts"
    fi
    
    # 3. Run Aider
    aider --config $CONFIG \
          --message-file $TASK \
          --test-cmd "$TEST_CMD" \
          --auto-test \
          --yes
          
    # 4. Record Exit Code
    if [ $? -eq 0 ]; then
      echo "RESULT: PASS - $CONFIG - $TASK" >> swe-bench-results.log
    else
      echo "RESULT: FAIL - $CONFIG - $TASK" >> swe-bench-results.log
    fi
  done
done