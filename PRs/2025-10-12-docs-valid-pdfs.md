### Summary

- Track `*.pdf` via Git LFS
- Replace placeholder text files with real tiny PDFs (valid `%PDF-` header)
- Add `tests-node/pdf.sanity.test.mjs` to assert basic integrity
- CI: `actions/checkout@v4` now uses `lfs: true` for all jobs

### Why

Prevents broken dashboard links and guarantees valid PDF assets in CI.

### Notes

If other workflows read PDFs locally, ensure `lfs: true` on checkout.
