# Copilot Project Instructions (Workspace)

Use these guidelines to keep Copilot suggestions aligned with our standards:

- **Code style:** Prefer functional components, hooks, and small modules.
- **Security:** Do not include secrets or keys; never suggest plaintext credentials.
- **Testing:** Favor small, focused tests; mock network/IO.
- **Docs:** Add JSDoc for public functions; keep README snippets runnable.
- **i18n:** Keep Fluent `.ftl` message IDs/variables intact (e.g., `{ $filename }`).

**Prompts:** Reusable prompts live in `.github/prompts/`. In VS Code, Copilot Chat will surface these because the workspace settings enable prompt files.

## Examples

### Refactor request
> Refactor this component into smaller hooks; extract data fetching and memoize derived values; add error boundaries.

### Test request
> Generate a minimal unit test for `formatCaseId()`, covering common inputs and edge cases.

### Accessibility
> Ensure new UI controls have proper aria- attributes, keyboard navigation, and focus management.

## Exclusions
Exclude tests, dist, and secrets from Copilot context via GitHub → Repo → Settings → Copilot → **Content exclusion**:
```
/dist/**
**/*.test.*
**/__snapshots__/**
secrets.json
```
# Justice Dashboard: AI Coding Agent Instructions

## Project Overview

Justice Dashboard is a web-based legal document analysis tool. It uses Node.js, Express, and OpenAI GPT-4 for AI-driven tagging and summarization. The frontend is styled with Tailwind CSS and organized for legal-tech workflows.

## Architecture & Major Components

- **Frontend**: HTML/JS files in the root and `justice-dashboard/` subfolder. Main entry: `index.html`, logic in `script.js`, styles in `styles.css`.
- **Backend**: `server.js` (Express server) handles API requests, file uploads, and AI summarization. No complex routing; most logic is in a few key files.
- **AI Integration**: Uses OpenAI API for document summaries. If `OPENAI_API_KEY` is missing, falls back to basic categorization.
- **Document Storage**: PDFs and other files are stored in organized subfolders (e.g., `Legal_Evidence`, `Court_Orders`). Naming conventions are enforced (see folder READMEs).

## Developer Workflows

- **Install dependencies**: `npm install`
- **Start server**: `node server.js` (or use VS Code task: "Start Justice Dashboard")
- **Build CSS**: Tailwind CSS is compiled via PostCSS. Run `npm run build` if styles are missing.
- **Environment variables**: `.env` file required in root. Must set `JWT_SECRET`, `SESSION_SECRET`, and optionally `OPENAI_API_KEY`.
- **Debugging**: Use `debug.js` and `debug.html` for tracing issues. Console logs are preferred for diagnostics.

## Project-Specific Conventions

- **File Naming**: Legal documents use strict date-based naming (see `Court_Orders/Chronological/README.md`). Example: `YYYY-MM-DD_CourtName_OrderType.pdf`
- **Security**: CORS is enabled in `server.js`. Secrets must be 32+ chars.
- **AI Code Review**: All AI-generated code is reviewed and assembled by the project author.
- **No code citation required for generic usage**; cite sources only for adapted logic (see README).

## Integration Points & External Dependencies

- **OpenAI API**: For AI summarization. Key: `OPENAI_API_KEY` in `.env`.
- **PDF Parsing**: Uses `pdf-parse` npm package.
- **Tailwind CSS**: Configured in `tailwind.config.js`. Content sources must be set for correct style generation.

## Patterns & Examples

- **Express server**: See `server.js` for API endpoints and middleware.
- **Frontend logic**: See `script.js` for document handling and UI updates.
- **Document organization**: See folder-level README files for naming and storage rules.

## Key Files & Directories

- `server.js`, `script.js`, `index.html`, `styles.css`, `tailwind.config.js`, `.env`
- `justice-dashboard/Legal_Evidence/`, `justice-dashboard/Court_Orders/`, etc.

---

For unclear or incomplete sections, please provide feedback or examples from your workflow to improve these instructions.
