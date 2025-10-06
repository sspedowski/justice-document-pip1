# PR Review Checklist for Team

Copy-paste these comments to each PR as a reviewer checklist.

---

## PR #16 - PR Assistant

**Reviewer Checklist:**
- [ ] CI green ✅
- [ ] Scoped to PR events only (opened/synchronize/labeled)
- [ ] No secrets logged in comments
- [ ] Uses Opus for `security` label, Sonnet otherwise
- [ ] Updates same comment on re-push (hidden marker works)
- [ ] File scope check passes (<150 files, <3000 lines, or `ai-ok-large` label)

**Test:**
- Create a test PR and verify auto-comment appears
- Push another commit and verify comment updates (not duplicates)

---

## PR #17 - Digest Preview

**Reviewer Checklist:**
- [ ] CI green ✅
- [ ] Requires `SLACK_WEBHOOK` secret (documented)
- [ ] Idempotent workflow (can run multiple times safely)
- [ ] Safe failure logging (no webhook URLs leaked)
- [ ] `/digest` page renders with sample data
- [ ] API routes return proper error codes
- [ ] Daily workflow cron correct for timezone (9am ET)

**Test:**
- Visit `/digest` locally
- Add `SLACK_WEBHOOK` secret and test "Post to Slack" button
- Manually trigger workflow in Actions

**Post-Merge:**
- Add `SLACK_WEBHOOK` secret in GitHub Settings

---

## PR #18 - Streaming Progress

**Reviewer Checklist:**
- [ ] CI green ✅
- [ ] SSE endpoint returns proper content-type headers
- [ ] No PII in progress frames
- [ ] Proper stream cleanup (controller.close())
- [ ] Demo available in PR #21 (optional)
- [ ] `useSSE` hook handles errors and cleanup

**Test:**
```bash
curl -N -X POST http://localhost:3000/api/summarize \
  -H 'accept: text/event-stream'
```
Should see: queued → fetching → chunking → summarizing → done

---

## PR #19 - Templates & Protection

**Reviewer Checklist:**
- [ ] CI green ✅
- [ ] PR template has all required sections
- [ ] Issue templates (bug/feature) render correctly
- [ ] CODEOWNERS syntax valid
- [ ] Branch protection command uses correct CI job names

**Important:**
- **Verify** `contexts` in protection command match your actual CI job names
- Current: `["build", "test"]`
- Check your repo's CI to confirm exact names

**Post-Merge:**
Run branch protection command (requires admin):
```bash
gh api -X PUT repos/:owner/:repo/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": {"strict": true, "contexts": ["build", "test"]},
  "enforce_admins": true,
  "required_pull_request_reviews": {"required_approving_review_count": 1, "dismiss_stale_reviews": true},
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

---

## PR #20 - Node Core Tests

**Reviewer Checklist:**
- [ ] CI green ✅
- [ ] Zero dependencies (uses only `node:test`)
- [ ] Complements Vitest (doesn't replace)
- [ ] Fast execution (<1s)
- [ ] npm script works: `npm run test:unit-node`
- [ ] GitHub workflow runs correctly

**Test:**
```bash
npm run test:unit-node
# or
node --test --test-reporter=spec tests-node
```

---

## PR #21 - SSE Demo (Optional)

**Reviewer Checklist:**
- [ ] CI green ✅
- [ ] Standalone demo (no production code changes)
- [ ] Educational content clear
- [ ] Visual feedback works (progress bars, stages)
- [ ] Can be removed later if desired

**Test:**
- Visit `http://localhost:3000/summarize-demo`
- Click "Start Streaming"
- Verify progress stages display in real-time

**Decision:**
- [ ] Merge now (helps visualize PR #18)
- [ ] Merge later
- [ ] Skip (demo served its purpose in review)

---

## Universal Checks (All PRs)

- [ ] Tests pass (16/16 green)
- [ ] No lint errors
- [ ] No secrets in code
- [ ] No node_modules committed
- [ ] Commit messages follow convention
- [ ] Co-authored by Claude (tracking)

---

## Pre-Merge Final Checks

### 1. CI Job Names
Verify branch protection uses correct context names:
```bash
# Check your recent CI runs
gh run list --limit 3
# Look for job names like "build", "test", "Vitest", etc.
```

### 2. Secrets Ready
```bash
# Verify secrets exist
gh secret list
# Should include: SLACK_WEBHOOK, GITHUB_TOKEN (auto), DASHBOARD_URL (optional)
```

### 3. Path Aliases
Verify `@/lib/...` imports resolve correctly:
- Check `tsconfig.json` has correct `paths`
- Test local build: `npm run build`
- Verify Vercel/deployment resolves aliases

---

## Post-All-Merges Checklist

- [ ] All 6 PRs merged successfully
- [ ] Branch protection enabled
- [ ] `SLACK_WEBHOOK` secret added
- [ ] Daily Digest workflow tested (manual run)
- [ ] Local branches cleaned up
- [ ] Tag release `v0.1.0`
- [ ] Optional: Renormalize line endings PR
- [ ] Team notified of new features

---

**Generated:** 2025-09-30
**For:** Justice Dashboard Team Rollout
