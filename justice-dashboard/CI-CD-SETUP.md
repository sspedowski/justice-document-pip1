# 🚀 CI/CD Setup Instructions

## GitHub Actions Secrets Required

To enable full CI/CD pipeline functionality, add these secrets in your GitHub repository:

### Required Secrets
1. **JWT_SECRET_TEST** - Test JWT secret (32+ characters)
2. **CYPRESS_RECORD_KEY** - From your Cypress Dashboard (optional but recommended)

### Optional Security Secrets (for enhanced scanning)
3. **SNYK_TOKEN** - For vulnerability scanning (sign up at snyk.io)
4. **SONAR_TOKEN** - For code quality analysis (sign up at sonarcloud.io)

## How to Add Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the exact names above

## Current CI/CD Pipeline Features

✅ **Multi-Node Testing** (Node 18.x, 20.x)
✅ **API Tests** with coverage reporting  
✅ **E2E Tests** with Cypress Dashboard integration
✅ **Security Scanning** (npm audit, dependency review)
✅ **Code Quality** (ESLint, Prettier)
✅ **Automated Deployment** to staging (on main branch)

## Pipeline Triggers

- **Push** to main/develop branches
- **Pull Requests** to main branch  
- **Weekly** security scans (Mondays 2 AM UTC)

## Badges for README

Add these to your README.md for status visibility:

```markdown
[![CI/CD Pipeline](https://github.com/sspedowski/justice-dashboard/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/sspedowski/justice-dashboard/actions/workflows/ci-cd.yml)
[![Code Quality](https://github.com/sspedowski/justice-dashboard/actions/workflows/quality.yml/badge.svg)](https://github.com/sspedowski/justice-dashboard/actions/workflows/quality.yml)
[![Cypress Tests](https://github.com/sspedowski/justice-dashboard/actions/workflows/cypress.yml/badge.svg)](https://github.com/sspedowski/justice-dashboard/actions/workflows/cypress.yml)
```

## Next Steps

1. **Add the required secrets** to your GitHub repository
2. **Push your changes** to trigger the first pipeline run
3. **Monitor the Actions tab** for build results
4. **Add deployment configuration** for your hosting platform

Your Justice Dashboard now has enterprise-grade CI/CD! 🎉
