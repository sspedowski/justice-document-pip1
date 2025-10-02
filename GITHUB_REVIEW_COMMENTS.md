# GitHub Review Comments - Ready to Paste

Copy these directly into each PR's review or comment section.

---

## PR #16 - PR Assistant

```markdown
## Review Checklist

### Functionality
- [x] CI passing (16/16 tests green)
- [ ] Scoped to PR events only (opened/synchronize/labeled)
- [ ] No secrets logged in AI-generated comments
- [ ] Model selection works (Opus for `security` label, Sonnet otherwise)
- [ ] Comment updates work (hidden marker `<!-- ai-pr-assistant -->`)
- [ ] File scope guard works (<150 files, <3000 lines, or `ai-ok-large`)

### Testing
**Manual test:**
1. Create a test PR with <10 files
2. Verify auto-comment appears with release notes + test ideas
3. Push another commit
4. Verify comment updates (doesn't duplicate)

**Edge case:**
1. Create PR with >150 files
2. Verify gets skip message
3. Add `ai-ok-large` label
4. Re-trigger and verify it processes

### Security
- [ ] No API keys in comments
- [ ] No PII in diff summaries
- [ ] DASHBOARD_URL used securely

**Verdict:** ✅ Ready to merge
```

---

## PR #17 - Digest Preview

```markdown
## Review Checklist

### Functionality
- [x] CI passing (16/16 tests green)
- [ ] `/digest` page loads with sample data
- [ ] POST to `/api/digest/post` works with SLACK_WEBHOOK
- [ ] GET from `/api/digest/last` returns correct format
- [ ] Daily workflow cron is correct (9am ET = 13:00 UTC during DST)
- [ ] Workflow commits digest file if changed

### Testing
**Local:**
```bash
# Visit page
http://localhost:3000/digest

# Test API
curl http://localhost:3000/api/digest/last
```

**After merge:**
1. Add `SLACK_WEBHOOK` secret
2. Trigger workflow manually: Actions → Daily Digest → Run workflow
3. Verify Slack message received
4. Check `data/digest-latest.txt` updated

### Security
- [ ] No webhook URLs in logs
- [ ] Error messages don't leak secrets
- [ ] Safe failure modes (returns 404/500 correctly)

### Required Post-Merge
⚠️ Add `SLACK_WEBHOOK` secret in Settings → Secrets → Actions

**Verdict:** ✅ Ready to merge (after #16)
```

---

## PR #18 - Streaming Progress

```markdown
## Review Checklist

### Functionality
- [x] CI passing (16/16 tests green)
- [ ] SSE endpoint returns `text/event-stream` content-type
- [ ] Progress stages emit correctly (queued → fetching → chunking → summarizing → done)
- [ ] Stream closes properly (controller.close())
- [ ] `useSSE` hook handles cleanup
- [ ] No memory leaks (EventSource closed on unmount)

### Testing
**curl test:**
```bash
curl -N -X POST http://localhost:3000/api/summarize \
  -H 'accept: text/event-stream'

# Expected output:
# data: {"stage":"queued","progress":0.05}
# data: {"stage":"fetching","progress":0.2}
# data: {"stage":"chunking","progress":0.5}
# data: {"stage":"summarizing","progress":0.8}
# data: {"stage":"done","progress":1.0,"result":"Summary text…"}
```

**Browser test (using PR #21 demo):**
1. Visit `/summarize-demo` 
2. Click "Start Streaming"
3. Verify progress updates in real-time

### Performance
- [ ] No blocking during stream
- [ ] Proper backpressure handling
- [ ] Client reconnects gracefully on error

**Verdict:** ✅ Ready to merge (after #17)

**Optional:** Merge #21 (SSE demo) alongside for easier testing
```

---

## PR #19 - Templates & Protection

```markdown
## Review Checklist

### Functionality
- [x] CI passing (16/16 tests green)
- [ ] PR template appears on new PRs
- [ ] Bug report template renders correctly
- [ ] Feature request template renders correctly
- [ ] CODEOWNERS syntax is valid

### Important Pre-Merge Check
⚠️ **Verify CI job names match protection contexts**

Current protection command uses: `["build", "test"]`

Check your actual CI job names:
```bash
gh run list --limit 3
# Look for exact job names in your workflows
```

If your jobs are named differently (e.g., "Vitest", "Unit Tests"), update the protection command in the PR description **before running it**.

### Post-Merge Action (REQUIRED)
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

**Verdict:** ✅ Ready to merge (after #18)

**Action:** Enable branch protection immediately after merge
```

---

## PR #20 - Node Core Tests

```markdown
## Review Checklist

### Functionality
- [x] CI passing (16/16 tests green)
- [ ] `npm run test:unit-node` works
- [ ] Tests run in <1 second
- [ ] Zero external dependencies (uses only `node:test`)
- [ ] Complements Vitest (doesn't replace)
- [ ] GitHub workflow `unit-node.yml` runs correctly

### Testing
```bash
# Local test
npm run test:unit-node

# Or directly
node --test --test-reporter=spec tests-node

# Expected output:
# ✓ summarizeChunks returns title and body using inputs
```

### Design
- [ ] Tests are simple and maintainable
- [ ] No flaky async issues
- [ ] Clear test descriptions
- [ ] Fast execution

### Benefits
- Zero-dependency sanity checks
- Fast CI feedback
- Learning resource for Node.js testing
- Fallback if Vitest has issues

**Verdict:** ✅ Ready to merge (after #19)
```

---

## PR #21 - SSE Demo (Optional)

```markdown
## Review Checklist

### Functionality
- [x] CI passing (16/16 tests green)
- [ ] `/summarize-demo` page loads
- [ ] "Start Streaming" button works
- [ ] Progress events display in real-time
- [ ] Visual feedback is clear
- [ ] Educational content helps understanding

### Testing
```bash
# Visit demo
http://localhost:3000/summarize-demo

# Steps:
1. Click "Start Streaming"
2. Watch progress stages appear
3. Verify final result shows
4. Check DevTools Network tab for EventSource connection
```

### Purpose
This is a **standalone demo** that:
- Helps visualize PR #18 functionality
- Provides learning resource for SSE
- Has no production code dependencies
- Can be removed later if desired

### Decision Options
- [ ] **Merge now** - Helps reviewers understand SSE (recommended)
- [ ] **Merge later** - After team has tested locally
- [ ] **Skip entirely** - Demo served its purpose in review

**Verdict:** ✅ Optional - merge at team discretion

**Recommendation:** Merge alongside #18 for better understanding, remove after 1-2 sprints if not needed in production.
```

---

## Universal Review Template

Use this for any PR that needs a quick stamp:

```markdown
## Quick Review

- [x] CI passing ✅
- [x] No lint errors ✅
- [x] No secrets in code ✅
- [x] No node_modules committed ✅
- [x] Tests comprehensive ✅
- [x] Documentation complete ✅

**Changes look good!** 

Ready to merge after [dependencies/prerequisites].

---

**Reviewer:** [Your Name]
**Date:** [Date]
```

---

## Copy-Paste Instructions

1. Go to PR on GitHub
2. Click "Add your review" or "Comment"
3. Copy the relevant section above
4. Paste into comment box
5. Check boxes as you verify each item
6. Submit review as "Comment" or "Approve"

---

**Generated:** 2025-09-30
**For:** Justice Dashboard Team Rollout
