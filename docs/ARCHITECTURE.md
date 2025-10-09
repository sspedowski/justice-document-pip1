# Justice Dashboard — Architecture

## Overview
- **Next.js app (root)**: site shell + API routes; serves `/dashboard` from `public/dashboard`.
- **Vite sub-app (`justice-dashboard/`)**: React+TS dashboard; builds to `dist/` and gets copied to `public/dashboard/`.
- **Workspace (`pnpm-workspace.yaml`)**: single `pnpm install --frozen-lockfile` hydrates all packages.

## Layout
```

root/
app/                      # Next.js (routes, pages, api)
public/
dashboard/              # copied Vite build (served at /dashboard)
justice-dashboard/        # Vite sub-app (React/TS)
packages/
frontend/               # (optional) shared UI/utils package
justice-server/         # (missing – to restore or replace)
tools/                    # build/copy/smoke/enforcement scripts
.github/workflows/        # CI (build + asserts)

```

## Build Flow
1. `pnpm install --frozen-lockfile` (workspace install)
2. `pnpm run build:dashboard:bundle` (Vite → dist)
3. `pnpm run build:dashboard:copy` (copy dist → public/dashboard)
4. `pnpm build` (Next build; asserts dashboard artifacts)

## CI Guarantees
- Fails if `public/dashboard/index.html` or `public/dashboard/assets/` are missing.
- Uses workspace install; no per-package install hacks.

## Roadmap
- Restore or replace `packages/justice-server/`.
- Replace `users.json` auth with Prisma/Supabase/Firebase.
- Migrate legacy files out of `legacy/` and update docs.
