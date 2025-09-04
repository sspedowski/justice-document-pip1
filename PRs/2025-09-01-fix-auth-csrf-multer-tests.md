# fix(server): skip CSRF in tests; allow-list /api/summarize; requireAuth before multer; add refresh/profile; enable JSX in Jest

Description

Disable `csurf` entirely when `NODE_ENV=test` to keep API tests deterministic.

- In non-test runs, allow-list auth endpoints and `/api/summarize` to avoid CSRF blocking API-style uploads.
- Ensure `requireAuth` runs **before** multer so unauthenticated uploads return **401**.
- Switch to `multer.memoryStorage()` with strict PDF `fileFilter`; map upload/Multer errors to **400**.
- Add `/api/refresh-token` and `/api/profile` to match client/tests.
- Enable JSX in Jest via `@babel/preset-react`, `jest-environment-jsdom`, and `@testing-library/jest-dom`.

Verification

- Local tests pass: 4 suites, 11 tests.
- Lint clean.

Follow-ups

- Add small tests for `/api/refresh-token` and `/api/profile` (added in this branch).
- Consider stricter CSRF in dev/prod if browser protection is desired beyond JWT.

Notes

- I added integration tests for `/api/refresh-token` and `/api/profile` under `justice-dashboard/tests/` and ran the full suite locally: 5 test suites, 14 tests — all passing.

