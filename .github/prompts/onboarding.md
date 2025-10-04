# Save the prompt in-repo for any AI (not Q-specific)
ni -Type Directory .ai -Force; Set-Content .ai\ONBOARDING_PROMPT.md @'
# Onboarding Prompt (Reusable)
You are assisting with the **justice-dashboard** repository.

## Context & preferences
- Frontend: React + Tailwind; keep class names explicit (no dynamic color strings unless safelisted).
- i18n: Fluent `.ftl`; preserve message IDs and variables.
- Lint: Prefer fixable rules; avoid disabling rules globally.

## When generating code
- Include minimal comments for non-obvious logic.
- Avoid any secrets or hard-coded tokens.
- Keep file sizes in bytes in data models; format at render time.
- Prefer hooks and pure functions.

## When refactoring
- Extract pure helpers.
- Add tiny tests for critical helpers.
- Maintain API compatibility unless explicitly told otherwise.

## Deliverables
- Self-contained diffs or functions that drop in cleanly.
- If a build config change is needed, include the exact file edits.
'@; git add .ai\ONBOARDING_PROMPT.md; git commit -m "docs(ai): add reusable onboarding prompt"

