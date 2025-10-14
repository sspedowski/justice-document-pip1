### Summary

- **Env (Gemini):** add `GOOGLE_API_KEY` + `GEMINI_MODEL` to Zod schema; export typed `env`; summarize route reads from `env`
- **RTDB:** add per-IP memory rate-limit (20/min); always attach `meta: { by:'server', ts }`; dev console warning when `RTDB_REQUIRE_AUTH=false`
- **Git hygiene:** ignore Husky shim (`.husky/_/`) and other transient files
- **CI:** serialize CI runs per ref using concurrency group

### Why

Fail fast on misconfig, preserve provenance, reduce abuse risk, and keep working copies clean.

### Checks

- Typecheck/lint/tests/build: GREEN locally
- SSE acceptance tests: intact

### Follow-ups (separate PR if desired)

- De-duplicate ESLint configs (merge `config/.eslintrc.json` into root)
- Optional: separate `tsconfig.tests.json` if you want to speed base typecheck
