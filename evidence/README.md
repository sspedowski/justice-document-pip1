# Evidence Folder

This directory is intended for large external artifacts (PDFs, ZIPs, media) that should not bloat Git history.

Structure:

- `_INBOX/` – drop new files here before triage
- `KEEP/` – curated, deduplicated set used by the project
- `ARCHIVE/` – older or duplicate material kept for reference

Guidelines:

- Prefer tracking large binaries with Git LFS or keep them untracked.
- Normalize filenames to `YYYY-MM-DD_Short-Slug.ext` for readability.
- Consider adding OCR sidecar files (`.txt`/`.json`) alongside PDFs.
