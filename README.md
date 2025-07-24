# Justice Dashboard

[![E2E Tests](https://github.com/sspedowski/justice-dashboard/actions/workflows/cypress.yml/badge.svg)](https://github.com/sspedowski/justice-dashboard/actions/workflows/cypress.yml)

## Testing

Justice Dashboard includes automated tests for backend APIs, frontend UI, and end-to-end (E2E) user flows.

### Run All Tests

```
npm test
```

### API & UI Unit Tests (Jest)

```
npx jest
```

### E2E Tests (Cypress)

```
npx cypress open
```

Or run headless:

```
npx cypress run
```

### Continuous Integration (CI)

All tests run automatically on every push and pull request via GitHub Actions. See the badge above for status.

---

- API tests: `tests/api.test.js`
- UI tests: `tests/ui.test.js`
- E2E tests: `cypress/e2e/*.cy.js`
- Sample upload file: `cypress/fixtures/sample.pdf`

---

For troubleshooting or to add more tests, see the `tests/` and `cypress/` folders.
