# Hardening PR

> Use this template for security/performance hardening work.  
> CI will enforce the **Hardening TODO** section when this PR has the `hardening` label and leaves Draft.

## Summary
<!-- What/why, user impact, rollout plan -->

## Risk Areas
- [ ] Auth / App Check
- [ ] Rate limiting / quotas
- [ ] Input validation / content-type allowlist
- [ ] Secrets / PII handling & logs
- [ ] Dependency risk (licenses/CVEs)
- [ ] Observability (metrics/logs/alerts)

## Hardening TODO
- [ ] App Check enforced server-side
- [ ] Rate limits + payload size caps verified in prod
- [ ] Signed URL TTL/scope correct; revoke path covered
- [ ] Content-Type allowlist; PDF extraction sandboxed
- [ ] Firestore logs: PII scrub + retention window
- [ ] E2E smoke: 1MB / 25MB / 100MB files; 5× parallel; abort case
- [ ] Security review notes attached

## Testing
- [ ] Unit/integration passing
- [ ] Manual verification notes (steps + evidence)

## Links
<!-- issue/PR refs, dashboards, design docs -->
- Closes #

