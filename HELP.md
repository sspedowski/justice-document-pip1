# Help & Accessibility System

The Justice Dashboard includes an accessible, framework-agnostic Help modal and a standalone static demo (`/help-demo.html`). This document describes architecture, authoring guidelines, and maintenance tasks.

## Goals

### Fast Access

Provide users immediate contextual guidance without leaving the current workflow.

### Inclusive Design

Ensure the help experience is usable with keyboard, screen readers, high contrast modes, and reduced‑motion preferences.

### Low Coupling

Keep help logic self-contained so core upload and analysis features remain unaffected by iterative help content changes.

## Architecture

### Modal Layer

An ARIA-compliant dialog (role="dialog" + `aria-modal="true"`) with focus trapping and inert background.

### Trigger & Focus Management

The opener button stores previously focused element and restores it on close; ESC key and overlay click both dismiss.

### Version Footer

The footer fetches `/api/version` to display the currently deployed service version + git SHA (if available) for support traceability.

## Authoring Content

### Heading Structure

Limit depth to three levels (H1–H3) to keep the auto summary readable; deeper nesting should be flattened.

### Tone & Style

Use concise, action‑oriented sentences. Prefer bullets over dense paragraphs. Avoid internal jargon when plain language suffices.

### Linking

Use absolute HTTPS URLs for external references; avoid protocol‑relative or javascript: URLs.

## Accessibility Checklist

### Semantics

Dialog element includes a unique `aria-labelledby` referencing the visible title.

### Keyboard Support

TAB cycles within modal; ESC closes; initial focus set to the first focusable control or the dialog container.

### Focus Trap Edge Cases

Handles zero or single focusable child elements by returning focus to the dialog container.

### Reduced Motion

Transitions kept to opacity / transform with `prefers-reduced-motion` respected by disabling non-essential animation classes.

## Tailwind & Styling

### Safelist

Modal utility classes (e.g., sizing, background variants) are safelisted to prevent purge removal in production builds.

### Theming

Colors derive from the existing palette; avoid hard-coded hex values—use semantic utility classes for maintainability.

## Build & CI

### Summary Generation

`npm run build:help:summary` creates `HELP_IMPLEMENTATION_SUMMARY.md` from the H1–H3 headings of this file.

### CI Guard

`help-doc-check` workflow fails if the summary is stale relative to committed HELP.md changes.

### Lint Integration

Future enhancement: integrate markdown lint & link validation to the doc freshness workflow.

## Testing Strategies

### Manual Accessibility Audit

Use browser dev tools accessibility tree + keyboard-only navigation path (open → navigate controls → close → focus restored).

### Automated Smoke

Extend existing smoke composite to optionally hit `/help-demo.html` and verify presence of `data-help-modal` root element.

### Schema Validation

Planned step: validate `/api/version` response against `.github/schemas/version.schema.json` using `ajv` in CI.

## Maintenance

### Content Updates

Modify `HELP.md` then regenerate summary before committing. Keep changes atomic for clear diff history.

### Dependency Review

Help modal uses only platform APIs; if a library is introduced in future, document rationale and risk evaluation here.

### Performance

Aim for <5KB added (gzipped) for help JS; re-evaluate if expanding beyond current capabilities.

## Future Enhancements

### Contextual Section Linking

Allow direct deep-links to a specific tab/section within the modal via hash fragments.

### Offline Fallback

Cache help assets via service worker so guidance is available during transient network loss.

### Analytics (Opt-In)

Aggregate anonymous open/close counts to prioritize frequently accessed help topics.
