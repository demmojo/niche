import os
import re

specs_dir = "openspec/changes"
plans_dir = "openspec/plans"
src_dir = "src"

specs = [
    "unified-ideation-and-evolution",
    "navbar-logical-ordering",
    "next-gen-analytics",
    "comprehensive-documentation",
    "image-import",
    "hitl-feature-merging",
    "deduplication-algorithm",
    "sanitize-system-logs",
    "tooltip-activation-fix",
    "superadmin-feature-controls",
    "bug-hunt-test-review",
    "codebase-test-quality-review",
    "multi-category-mentions",
    "exa-api-key-fallback",
    "proactive-market-analysis",
    "strategy-toolbox",
    "raw-data-image-storage",
    "supabase-integration",
    "head-to-head-comparison",
    "system-logs-ux",
    "smart-llm-routing",
    "hybrid-scoring-tarpit-flywheel",
    "performance-optimization",
    "cloudflare-deployment-analytics-engine"
]

plans = [
    "2026-03-28-feat-productionize-mock-data-plan.md",
    "2026-03-27-security-review.md",
    "2026-03-27-refactor-upgrade-gemini-models-plan.md",
    "2026-03-27-feat-comprehensive-documentation-and-guides-update-plan.md",
    "2026-03-27-feat-analytical-template-library-redesign-plan.md",
    "2026-03-27-feat-performance-optimization-plan.md",
    "2026-03-27-feat-unified-ideation-and-evolution-plan.md",
    "2026-03-27-feat-ast-drift-healing-plan.md",
    "2026-03-27-chore-100-percent-test-coverage-plan.md",
    "2026-03-27-feat-hybrid-scoring-engine-and-intent-testing-plan.md",
    "2026-03-28-feat-inject-brand-identity-to-prompt-exporter-plan.md"
]

print("=== SPECS ===")
for s in specs:
    tasks_file = os.path.join(specs_dir, s, "tasks.md")
    status = "N/A"
    done = 0
    total = 0
    if os.path.exists(tasks_file):
        with open(tasks_file, 'r') as f:
            content = f.read()
            total = content.count("- [")
            done = content.count("- [x]")
    
    yaml_file = os.path.join(specs_dir, s, ".openspec.yaml")
    yaml_status = ""
    if os.path.exists(yaml_file):
        with open(yaml_file, 'r') as f:
            match = re.search(r'status:\s*(\w+)', f.read())
            if match:
                yaml_status = match.group(1)
                
    print(f"Spec: {s} | Tasks: {done}/{total} | Status: {yaml_status}")
    
print("\n=== PLANS ===")
for p in plans:
    path = os.path.join(plans_dir, p)
    if os.path.exists(path):
        print(f"Plan: {p}")
    else:
        print(f"Plan: {p} (MISSING)")

