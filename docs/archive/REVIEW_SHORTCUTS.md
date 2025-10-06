# PR Review Shortcuts - Quick Comments

Quick one-liner comments for fast reviews.

---

## Quick Approval Templates

### Standard Approval
```markdown
✅ **Approve** — CI green, scope + docs + tests look good. No secrets, no node_modules. Merging per order. Great work! 🙌
```

### Approval with Minor Nits
```markdown
✅ **Approve (nits only)** — LGTM overall. Left minor optional nits; not merge-blocking.
```

### Request Changes
```markdown
⛔ **Request changes** — see inline comments. Please address: (1) failing check / missing secret, (2) error/edge-case handling, (3) doc update. Ping when ready for re-review.
```

---

## Quick Stamps Per PR

### PR #16 - PR Assistant
```markdown
✅ Sanity check: CI green, event scope correct, model switch (Opus on `security`) verified, comment dedup works via hidden marker. No secret leakage. Ready to merge.
```

### PR #17 - Digest Preview
```markdown
✅ Page renders locally, APIs respond, workflow idempotent. Reminder: add `SLACK_WEBHOOK` secret post-merge. Good to go.
```

### PR #18 - Streaming Progress
```markdown
✅ SSE headers correct; stages stream as expected; cleanup on close confirmed. `useSSE` handles unmount + errors. Recommend merging with #21 for easier QA.
```

### PR #19 - Templates & Protection
```markdown
✅ Templates render; CODEOWNERS valid. Before running protection API, confirm CI context names match your jobs (`build`, `test` by default). Ship it.
```

### PR #20 - Node Core Tests
```markdown
✅ Zero-dep Node tests run fast and complement Vitest. Workflow triggers on PRs. All good.
```

### PR #21 - SSE Demo (Optional)
```markdown
✅ Demo is standalone; helps reviewers visualize #18. Safe to merge alongside; removable later.
```

---

## Master Comment (Post on PR #16)

Use this to guide the entire review process:

```markdown
## 🎯 Justice Dashboard Rollout - Review Guide

**Merge Order:** #16 → #17 → #18 → #19 → #20 → #21 (optional)

### Quick Status
All 6 PRs ready for review with:
- ✅ CI passing (16/16 tests)
- ✅ Zero secrets committed
- ✅ Complete documentation

### Review Resources
- **Detailed checklists:** `GITHUB_REVIEW_COMMENTS.md`
- **Quick stamps:** `REVIEW_SHORTCUTS.md`
- **Implementation guide:** `ROLLOUT_COMPLETE.md`

### Post-Merge Actions
1. Add `SLACK_WEBHOOK` secret (after #17)
2. Enable branch protection (after #19) - command in PR description
3. Test digest workflow: Actions → Daily Digest → Run workflow

### Testing Each PR
- **#16:** Create test PR, verify auto-comment
- **#17:** Visit `/digest`, test Slack posting
- **#18:** `curl -N -X POST localhost:3000/api/summarize -H 'accept: text/event-stream'`
- **#19:** Verify templates render on new PR
- **#20:** `npm run test:unit-node`
- **#21:** Visit `/summarize-demo`, click "Start Streaming"

---

**Questions?** Check documentation files or ping the team.
```

---

## Bash Script for Posting Comments

Save as `post-pr-comments.sh`:

```bash
#!/bin/bash
# Post review comments to all PRs from GITHUB_REVIEW_COMMENTS.md

# Function to extract section between headers
extract_section() {
  local file=$1
  local header=$2
  awk "/$header/,/^## PR #/" "$file" | sed '$ d'
}

# Post to each PR
post_comment() {
  local pr_num=$1
  local header=$2
  echo "Posting to PR #$pr_num..."
  
  section=$(extract_section "GITHUB_REVIEW_COMMENTS.md" "$header")
  echo "$section" | gh pr comment $pr_num --body-file -
  
  echo "✅ Posted to PR #$pr_num"
}

# Post master comment to PR #16
echo "## 🎯 Justice Dashboard Rollout - Review Guide

**Merge Order:** #16 → #17 → #18 → #19 → #20 → #21 (optional)

### Quick Status
All 6 PRs ready with CI passing ✅

### Resources
- Detailed: \`GITHUB_REVIEW_COMMENTS.md\`
- Quick: \`REVIEW_SHORTCUTS.md\`
- Guide: \`ROLLOUT_COMPLETE.md\`

### Post-Merge
1. Add \`SLACK_WEBHOOK\` secret
2. Enable branch protection (command in #19)
3. Test workflow

**All PRs:** https://github.com/sspedowski/justice-document-pip1/pulls" | \
  gh pr comment 16 --body-file -

# Post detailed comments (uncomment to use)
# post_comment 16 "## PR #16 - PR Assistant"
# post_comment 17 "## PR #17 - Digest Preview"
# post_comment 18 "## PR #18 - Streaming Progress"
# post_comment 19 "## PR #19 - Templates & Protection"
# post_comment 20 "## PR #20 - Node Core Tests"
# post_comment 21 "## PR #21 - SSE Demo"

echo ""
echo "✅ All comments posted!"
```

Make executable:
```bash
chmod +x post-pr-comments.sh
./post-pr-comments.sh
```

---

## PowerShell Script for Windows

Save as `post-pr-comments.ps1`:

```powershell
# Post review comments to all PRs from GITHUB_REVIEW_COMMENTS.md

function Get-PRSection {
    param(
        [string]$FilePath,
        [string]$Header
    )
    
    $lines = Get-Content $FilePath
    $startIdx = -1
    $endIdx = $lines.Length
    
    for ($i = 0; $i -lt $lines.Length; $i++) {
        if ($lines[$i] -match [regex]::Escape($Header)) {
            $startIdx = $i
            break
        }
    }
    
    if ($startIdx -eq -1) {
        throw "Header '$Header' not found in file"
    }
    
    # Find next PR header
    for ($i = $startIdx + 1; $i -lt $lines.Length; $i++) {
        if ($lines[$i] -match '^## PR #\d+') {
            $endIdx = $i - 1
            break
        }
    }
    
    return ($lines[$startIdx..$endIdx] -join "`n")
}

# Post master comment to PR #16
$masterComment = @"
## 🎯 Justice Dashboard Rollout - Review Guide

**Merge Order:** #16 → #17 → #18 → #19 → #20 → #21 (optional)

### Quick Status
All 6 PRs ready with CI passing ✅

### Resources
- Detailed: ``GITHUB_REVIEW_COMMENTS.md``
- Quick: ``REVIEW_SHORTCUTS.md``
- Guide: ``ROLLOUT_COMPLETE.md``

### Post-Merge
1. Add ``SLACK_WEBHOOK`` secret
2. Enable branch protection (command in #19)
3. Test workflow

**All PRs:** https://github.com/sspedowski/justice-document-pip1/pulls
"@

Write-Host "Posting master comment to PR #16..." -ForegroundColor Cyan
$masterComment | gh pr comment 16 --body-file -
Write-Host "✅ Posted to PR #16" -ForegroundColor Green

# Map of PR numbers to headers
$prMap = @{
    16 = "## PR #16 - PR Assistant"
    17 = "## PR #17 - Digest Preview"
    18 = "## PR #18 - Streaming Progress"
    19 = "## PR #19 - Templates & Protection"
    20 = "## PR #20 - Node Core Tests"
    21 = "## PR #21 - SSE Demo (Optional)"
}

# Uncomment to post detailed comments
# foreach ($pr in $prMap.Keys | Sort-Object) {
#     Write-Host "Posting to PR #$pr..." -ForegroundColor Cyan
#     $section = Get-PRSection -FilePath "GITHUB_REVIEW_COMMENTS.md" -Header $prMap[$pr]
#     $section | gh pr comment $pr --body-file -
#     Write-Host "✅ Posted to PR #$pr" -ForegroundColor Green
# }

Write-Host ""
Write-Host "✅ All comments posted!" -ForegroundColor Green
```

Run:
```powershell
.\post-pr-comments.ps1
```

---

## Suggested Labels

Add these labels in GitHub → Issues → Labels:

**Review Status:**
- `review:ready` (green) - Ready for review
- `review:in-progress` (yellow) - Review in progress
- `review:blockers` (red) - Has blocking issues
- `review:approved` (blue) - Approved, ready to merge

**Merge Dependencies:**
- `merge:after-#16` (gray)
- `merge:after-#17` (gray)
- `merge:after-#18` (gray)
- `merge:after-#19` (gray)

**Priority:**
- `priority:high` (red) - Required for rollout
- `priority:optional` (gray) - Nice to have

---

## Usage

### Quick Manual Review
1. Open PR on GitHub
2. Copy stamp from "Quick Stamps Per PR" above
3. Paste into comment
4. Click "Submit review"

### Automated Posting
1. Run PowerShell/Bash script to post all comments at once
2. Review each PR and check boxes
3. Approve when ready

### Master Comment
Post the master comment on PR #16 to provide overview for all reviewers

---

**Generated:** 2025-09-30
**For:** Justice Dashboard Team Rollout
