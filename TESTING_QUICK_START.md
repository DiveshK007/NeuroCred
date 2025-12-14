# Testing Quick Start Guide

## ✅ Setup Complete!

All testing infrastructure is ready. Here's how to use it:

## Quick Commands

### Backend Tests
```bash
cd backend
source venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test type
pytest tests/unit -m unit
pytest tests/integration -m integration
pytest tests/security -m security
```

### Contract Tests
```bash
cd contracts

# Run all tests
npm test

# Run with coverage
COVERAGE=true npm test
```

### Frontend E2E Tests
```bash
cd frontend

# Run E2E tests (requires frontend running)
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

### Load Testing
```bash
cd backend
locust -f tests/load/test_api_load.py --host=http://localhost:8000
# Then open http://localhost:8089
```

### Security Scans
```bash
cd backend
./scripts/run_security_scans.sh
```

## Test Coverage

Current coverage is low when running individual files. Run the full test suite to see actual coverage:

```bash
# Backend - full suite
cd backend && pytest --cov=. --cov-report=html

# View coverage report
open htmlcov/index.html
```

## CI/CD

All tests run automatically on:
- Push to `main` or `feature/fullstack-enhancements`
- Pull requests to `main`

Check `.github/workflows/` for:
- `backend.yml` - Backend tests & coverage
- `contracts.yml` - Contract tests & coverage  
- `frontend.yml` - Frontend build & E2E
- `security.yml` - Security scans

## Documentation

- Full guide: `docs/TESTING.md`
- Load testing: `backend/tests/load/README.md`
- Setup summary: `TESTING_SETUP_COMPLETE.md`

## Status

✅ All testing infrastructure implemented
✅ Dependencies installed
✅ Tests passing
✅ CI/CD configured
✅ Documentation complete

Ready for development! 🚀
