## 🧭 Stabilization & Ship Checklist

- [ ] **Verify Vercel bypass secret**  
  Confirm repo secret **VERCEL_BYPASS_TOKEN** matches the project’s **Preview Deployments → Bypass Token**.

- [ ] **Run Manual Smoke (with bypass)**  
  Trigger the **Manual Smoke** workflow with your preview URL and `with_bypass=true`. Expect **2xx/3xx** for all probes.

- [ ] **Run local smoke (no bypass)**  
  Run `smoke.ps1` against the same preview URL without a token. Protected endpoints should log **SKIP** and the script should exit **0**.

- [ ] **Full clean build locally (pnpm only)**  

```powershell
pnpm install
pnpm run build

# Sanity checks (Windows PowerShell)
if (Test-Path public/dashboard/index.html) { 'index OK' } else { 'index MISSING' }
if (Test-Path public/dashboard/assets) { 'assets OK' } else { 'assets MISSING' }
```

Expect no tracing ENOENT; `public/dashboard/index.html` and `public/dashboard/assets/` should exist.

- [ ] **Push and watch CI**  
  Lint/typecheck/unit/build all green. Build job asserts dashboard index + assets. Deployment-status smoke tolerates protected previews and prints guidance.

- [ ] **Merge PR #27**  
  _“build: copy dashboard into public + TS test loader transpile + hardened smoke.”_

---

### 🧾 Notes

- Not-found page + `.next` clean in build removes the prior tracing ENOENT.  
- Dashboard sub-app lives in `justice-dashboard` with base `/dashboard/`; CI asserts index + assets.  
- `pnpm` preinstall guard blocks accidental `npm` usage.

---

### ⚙️ Commands

#### 1️⃣ Verify/seed secret locally (optional)
```powershell
$env:VERCEL_BYPASS_TOKEN = "<paste-your-bypass-token>"
```

#### 2️⃣ Trigger Manual Smoke (GitHub Actions)
```powershell
$base = "https://<your-preview>.vercel.app"
gh workflow run "Manual Smoke" -f base_url=$base -f with_bypass=true
gh run watch --exit-status
```

#### 3️⃣ Local smoke (with and without bypass)
```powershell
# With bypass (expect 2xx/3xx)
pwsh ./tools/smoke.ps1 -BaseUrl $base -BypassToken $env:VERCEL_BYPASS_TOKEN

# Without bypass (protected endpoints => SKIP, exit 0)
pwsh ./tools/smoke.ps1 -BaseUrl $base
```

#### 4️⃣ Full clean build (pnpm only)
```powershell
pnpm install
pnpm run build

# Sanity checks
if (Test-Path public/dashboard/index.html) { 'index OK' } else { 'index MISSING' }
if (Test-Path public/dashboard/assets) { 'assets OK' } else { 'assets MISSING' }
```

#### 5️⃣ Push & watch CI
```powershell
git add -A
git commit -m "chore: stabilization pass" 2>$null; if ($LASTEXITCODE -ne 0) { 'No changes to commit' }
git push
gh run watch --exit-status
```

#### 6️⃣ Merge PR #27
```powershell
gh pr checks 27 --watch
gh pr merge 27 --squash --delete-branch --auto
```

---

### 🔧 Troubleshooting Quick Hits

* **Manual Smoke fails 401/403 on /dashboard**  
  → Use `with_bypass=true` in the workflow or pass `-BypassToken` locally.

* **Build passes but `public/dashboard/*` missing**  
  → Run

  ```powershell
  pnpm run build:dashboard:bundle
  pnpm run build:dashboard:copy
  pnpm build
  ```

* **Tracing ENOENT**  
  → Confirm `.next` clean in build and not-found route exists (already added).
