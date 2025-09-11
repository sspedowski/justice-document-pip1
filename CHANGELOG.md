# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [main-baseline-after-vercel-min] - 2025-09-11

### Added

- Mirrored `/api/health`, `/api/version`, `/api/upload` in the main app (App Router).
- Post-deploy smoke (schema + latency) and nightly smoke guardrails.
- Docs guard workflows: help summary freshness and link checker.
- PR hardening gate: progress comment + enforcement scoped to `## Hardening TODO`.

### Changed

- Live-smoke now triggers **only** on Production deploys.
- Health-check workflow retargeted to main app paths (`app/**`, `src/app/**`, etc.).

### Removed

- `vercel-min/` temporary minimal app and legacy manual smoke workflow.

### Ops

- `/api/version` supports `APP_SERVICE_NAME`, `APP_NAME`, optional `APP_VERSION`, fallback `GIT_SHA` (Vercel also sets `VERCEL_GIT_COMMIT_SHA`).
