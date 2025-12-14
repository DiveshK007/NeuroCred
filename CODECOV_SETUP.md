# Codecov Setup Guide

## Overview

Codecov integration is configured in `.github/workflows/codecov.yml` and `.github/workflows/backend.yml`.

## Setup Steps

### 1. Create Codecov Account (Optional)

1. Go to https://codecov.io
2. Sign up with GitHub
3. Add your repository
4. Get your repository upload token

### 2. Add GitHub Secret

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add new secret: `CODECOV_TOKEN`
4. Paste your Codecov upload token

### 3. Coverage Reports

Coverage is automatically uploaded on:
- Push to `main` or `feature/fullstack-enhancements`
- Pull requests to `main`

### 4. View Coverage

- **Codecov Dashboard**: https://codecov.io/gh/YOUR_USERNAME/NeuroCred
- **Local Reports**: `backend/htmlcov/index.html`

## Current Coverage

- **Backend**: ~56% (target: 80%+)
- **Contracts**: Configured (run `COVERAGE=true npm test`)

## Improving Coverage

1. Run full test suite: `pytest tests/unit/ tests/integration/ --cov=.`
2. View HTML report: `open backend/htmlcov/index.html`
3. Add tests for uncovered lines
4. Focus on critical paths first

## Notes

- Codecov token is optional - coverage will still be generated locally
- Coverage threshold is set to 80% in `pytest.ini`
- CI will fail if coverage < 80% (can be adjusted)

