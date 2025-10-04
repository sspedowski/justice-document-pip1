# Justice Dashboard

---

## 🚀 Railway Deployment Automation

Justice Dashboard is fully automated for Railway deployment. To build, bundle, and deploy live:

```
npm run deploy
```

This will:
- Build the frontend
- Copy the build to the backend public folder
- Deploy the backend to Railway
- Bind ports automatically

### Environment Variables (set in Railway dashboard):
- `NODE_ENV=production`
- `ADMIN_USERNAME=<secure>`
- `ADMIN_PASSWORD=<secure>`
- `JWT_SECRET=<generated>`
- `SESSION_SECRET=<generated>`

After deploy, your app will be live at:
```
https://<your-project>.up.railway.app
```

---

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
