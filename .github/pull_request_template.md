<!-- .github/pull_request_template.md -->

## Summary
<!-- What / why, user impact, rollout plan -->

## Changes
<!-- High-level bullets of what changed -->

## Testing
- [ ] Unit / integration passing
- [ ] Manual verification notes included (if applicable)

## Docs
- [ ] Updated `HELP.md` if flows changed
- [ ] README/ops notes updated (if applicable)

## Hardening TODO
<!-- Only required when the PR has the "hardening" label.
     The CI gate checks *only this section* when leaving Draft. -->
- [ ] App Check enforced server-side
- [ ] Rate limits + payload size caps verified in prod
- [ ] Signed URL TTL/scope correct; revoke path covered
- [ ] Content-Type allowlist; PDF extraction sandboxed
- [ ] Firestore logs: PII scrub + retention window
- [ ] E2E smoke: 1MB / 25MB / 100MB files; 5× parallel; abort case
- [ ] Security review notes attached

### Links
<!-- e.g., issue/PR refs, design docs, dashboards -->
- Closes #

