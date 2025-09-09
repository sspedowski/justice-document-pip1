# Justice Dashboard

## Linting

We enforce ESLint locally and in CI.

- Local: `npm run lint` (or `npm run lint:fix`)
- Pre-commit: Husky + lint-staged runs ESLint on staged JS/TS files
- CI: GitHub Actions runs the Lint workflow on pushes/PRs that touch JS/TS or lint config

![Lint](https://github.com/sspedowski/justice-document-pip1/actions/workflows/lint.yml/badge.svg)

### Repository hygiene: embedded repos

We removed an accidentally committed nested Git repository at:
`external/justice-document-pip/`

- The path is now ignored in `.gitignore`.
- CI includes a guard workflow to fail if files reappear under this path.
- If you need that code, add it as a **submodule** intentionally, or pull it via a build step.

