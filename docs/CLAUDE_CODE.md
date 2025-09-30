# Claude Code Overview

> Integrated developer agent assistance for this repository.

The content below is adapted from the public Claude Code overview with project-specific notes.

## Quick Install

```bash
npm install -g @anthropic-ai/claude-code
cd <repo-root>
claude
```

First run will prompt browser login.

## Recommended Usage Patterns in This Repo

| Task            | Example Prompt                                                          | Notes                                 |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------- |
| Explain module  | `Explain auth-manager.js and list security assumptions.`                | Good for onboarding reviewers.        |
| Generate tests  | `Add Vitest unit tests for extractAppCheckToken edge cases.`            | Keep tests minimal & deterministic.   |
| Refactor        | `Refactor server.js upload handling into smaller middleware functions.` | After generation, run lint & tests.   |
| Security review | `List unvalidated inputs in server.js and propose validation.`          | Cross-check with existing middleware. |

## Guardrails

- Never commit secrets surfaced in an assistant response.
- Always run `npm run lint && npm test` after large edits.
- Keep generated changes small; prefer iterative commits.

## Core Features (Upstream Summary)

- Build features from natural language descriptions.
- Debug failures by pasting stack traces.
- Search and navigate code contextually.
- Automate repetitive fixes (lint, minor style).

See upstream documentation for more advanced workflows and MCP integrations.

## Advanced Setup Links

- Quickstart: https://anthropic.com (refer to official docs)
- VS Code Extension: (beta) install via marketplace

## Uninstallation

```bash
npm uninstall -g @anthropic-ai/claude-code
```
