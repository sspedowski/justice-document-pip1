# Release Notes

## 2025-10-04

- Tooling: Pin Node 20.11.1 via Volta; CI uses Node 20.11.x
- Docs: README clarifies express-rate-limit v8 usage; PRODUCTION_SETUP.md adds Amazon Q VS Code hardening checklist
- Tests: Add refresh-token unauthorized test; auth rate-limit test (429 on 6th)
- Routing: Remove /dashboard route handler collision, add minimal /dashboard page
- Build: Fix UTF-8 encoding issue in summarize-demo page; Next.js build passes
- Status: Typecheck/lint clean; Node tests 12/12 green
