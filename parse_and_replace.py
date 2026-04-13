import re

with open('/home/demmojo/Code/nicheai/openspec/plans/2026-04-11-ai-native-frontend-workflow-docs-plan.md', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith('   - **Progressive Fetch Pattern:**'):
        target_idx = i
        text = line
        break

# The text is extremely long, let's just do sequential replacements of known phrases to create headers.
# I will define the replacements in order of appearance.

replacements = [
    (r"   - \*\*Progressive Fetch Pattern:\*\*", r"   - **Progressive Fetch Pattern:**\n\n#### Rate Limiting & DoS Mitigation\n"),
    (r" \*\*Security Guardrail \(SSRF & Authz\):\*\*", r"\n\n#### Authentication & Tenant Isolation\n**Security Guardrail (SSRF & Authz):**"),
    (r" \*\*Database Efficiency Guardrail:\*\*", r"\n\n#### Database Efficiency & Pagination\n**Database Efficiency Guardrail:**"),
    (r" Phase 1 fetches of external data MUST implement strict Server-Side Request Forgery", r"\n\n#### SSRF Defenses\nPhase 1 fetches of external data MUST implement strict Server-Side Request Forgery"),
    (r" \*\*Security Guardrail \(Prompt Injection & Validation\):\*\*", r"\n\n#### Input Validation, Prompt Injection & Mass Assignment\n**Security Guardrail (Prompt Injection & Validation):**"),
    (r" Furthermore, any third-party data fetched in `Initial Fetch Phase` must be strictly sanitized.", r"\n\n#### Background AI & Data Sanitization\nFurthermore, any third-party data fetched in `Initial Fetch Phase` must be strictly sanitized."),
    (r" \*\*Security Guardrail \(Threat Monitoring & Data Exposure\):\*\*", r"\n\n#### Network Security, CORS & Threat Monitoring\n**Security Guardrail (Threat Monitoring & Data Exposure):**"),
    (r" \*\*Security Guardrail \(Revocation Latency\):\*\*", r"\n\n#### JWT Revocation & Redis Infrastructure\n**Security Guardrail (Revocation Latency):**"),
    (r" Do NOT use Firestore inline transactions for this synchronous path. If `REST API Fetch` is a single deterministic result,", r"\n\n#### Frontend Stream Resumption & Error Handling\nDo NOT use Firestore inline transactions for this synchronous path. If `REST API Fetch` is a single deterministic result,")
]

for old, new in replacements:
    text = re.sub(old, new, text, count=1)

# we need to make sure the indentation of the headers is correct. Let's not indent the headers, or maybe 4 spaces?
# the block is inside a list item that is indented with 3 spaces. So 4 spaces for the header? Let's do `    #### Header`
# Actually, the prompt example was `#### Rate Limiting & DoS Mitigation`. I will use standard 4 spaces indentation for the content.

# let's write out the new text and see how it looks
with open('debug.txt', 'w') as f:
    f.write(text)

lines[target_idx] = text

with open('/home/demmojo/Code/nicheai/openspec/plans/2026-04-11-ai-native-frontend-workflow-docs-plan.md', 'w') as f:
    f.writelines(lines)

print("Replacement done")
