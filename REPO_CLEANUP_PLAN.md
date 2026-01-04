# Repository Cleanup Plan

## 🎯 Purpose
Prepare repository for public evaluation and mainnet deployment by removing unnecessary, auto-generated, local-only, or redundant files.

---

## 📋 Files to Remove

### 1. Log Files (Should not be committed)
- ✅ `backend.log` - Root-level log file
- ✅ `frontend.log` - Root-level log file
- ✅ `backend/logs/app.log` - Application log (if tracked)
- ✅ `backend/logs/audit.log` - Audit log (if tracked)
- ✅ `frontend/.next/dev/logs/next-development.log` - Next.js dev log (if tracked)

**Reason:** Log files are runtime artifacts, should be in .gitignore

---

### 2. Environment Files (Should not be committed)
- ✅ `backend/.env` - Backend environment variables
- ✅ `contracts/.env` - Contracts environment variables

**Reason:** Contains secrets, should use .env.example instead

**Action:** Verify these are in .gitignore, remove if tracked

---

### 3. Build Artifacts (Should be ignored)
- ✅ `backend/__pycache__/` - Python cache (if tracked)
- ✅ `backend/venv/` - Python virtual environment (if tracked)
- ✅ `backend/htmlcov/` - Coverage HTML (if tracked)
- ✅ `backend/coverage.xml` - Coverage report (if tracked)
- ✅ `frontend/node_modules/` - Node dependencies (if tracked)
- ✅ `frontend/.next/` - Next.js build (if tracked)
- ✅ `contracts/node_modules/` - Node dependencies (if tracked)
- ✅ `contracts/artifacts/` - Hardhat artifacts (if tracked)
- ✅ `contracts/cache/` - Hardhat cache (if tracked)
- ✅ `contracts/typechain-types/` - TypeScript types (if tracked)

**Reason:** Auto-generated, should be in .gitignore

---

### 4. OS/Editor Junk
- ✅ `contracts/node_modules/fp-ts/rules/.DS_Store` - macOS file (if tracked)
- ✅ Any other `.DS_Store` files (if tracked)
- ✅ Any `Thumbs.db` files (if tracked)

**Reason:** OS-specific files, should be ignored

---

### 5. Redundant/Obsolete Files

#### Documentation Consolidation Candidates:
- ⚠️ `REMAINING_TASKS.md` - May be obsolete (check if tasks are complete)
- ⚠️ `START_FRONTEND.md` - May be redundant with README
- ⚠️ `RESTART_INSTRUCTIONS.md` - May be redundant with docs/
- ⚠️ `QUICK_START.md` - May be redundant with README

**Action:** Review these files - keep if they provide unique value, remove if redundant

#### Script Consolidation:
- ⚠️ `scripts/execute-qa-checklist.ts` - TypeScript version (not working)
- ✅ Keep: `scripts/verify-qa-fixes.js` - Working JavaScript version

**Reason:** TypeScript version has dependency issues, JavaScript version works

---

## ✅ Files to Keep (With Reasons)

### Source Code
- ✅ All `frontend/`, `backend/`, `contracts/` source files
- ✅ All deployment scripts in `scripts/`
- ✅ All test files
- ✅ All configuration files (package.json, requirements.txt, etc.)

### Documentation
- ✅ `README.md` - Main project documentation
- ✅ `docs/` - Comprehensive documentation
- ✅ `QA_*.md` - QA documentation (recently created, important)
- ✅ `MAINNET_*.md` - Mainnet deployment guides
- ✅ `GAS_OPTIMIZATION_ANALYSIS.md` - Important analysis
- ✅ `EVALUATION_PACKAGE.md` - Evaluation guide
- ✅ `CODEBASE_REVIEW.md` - Code review findings
- ✅ `AUDIT_REPORT.md` - Security audit

### Configuration
- ✅ `.gitignore` - Git ignore rules
- ✅ `.env.example` files - Environment templates
- ✅ `docker-compose*.yml` - Docker configurations
- ✅ `hardhat.config.ts` - Contract configuration
- ✅ `next.config.ts` - Frontend configuration

### Scripts
- ✅ All scripts in `scripts/` (except redundant ones)
- ✅ `start-dev.sh` - Development startup script
- ✅ `restart.sh` - Restart script

---

## 🔍 .gitignore Verification

### Current .gitignore Status
✅ Already includes:
- `node_modules/`
- `venv/`, `__pycache__/`
- `.env`, `.env.local`
- `.next/`, `dist/`, `build/`
- `artifacts/`, `cache/`, `typechain-types/`
- `*.log`
- `.DS_Store`, `Thumbs.db`
- `coverage/`, `htmlcov/`, `coverage.xml`
- `logs/`

### Proposed .gitignore Improvements
1. ✅ Add explicit `*.log` at root level (already present)
2. ✅ Ensure `backend/logs/` is ignored (already present)
3. ✅ Ensure `frontend/.next/` is ignored (already present)
4. ⚠️ Consider adding `*.env` pattern (already covered by `.env`)

**Status:** .gitignore is comprehensive, no changes needed

---

## 🔒 Security Check

### Environment Files
- ⚠️ `backend/.env` - **MUST NOT BE COMMITTED**
- ⚠️ `contracts/.env` - **MUST NOT BE COMMITTED**

**Action:** Verify these are in .gitignore and not tracked

### Secrets Check
- ✅ No hardcoded private keys found
- ✅ No hardcoded API keys found
- ✅ No hardcoded passwords found

**Status:** No secrets found in code

---

## 📊 Cleanup Summary

### Files to Delete (Confirmed)
1. `backend.log`
2. `frontend.log`
3. `backend/.env` (if tracked)
4. `contracts/.env` (if tracked)
5. `scripts/execute-qa-checklist.ts` (redundant, use .js version)

### Files to Review (May Delete)
1. `REMAINING_TASKS.md` - Check if tasks are complete
2. `START_FRONTEND.md` - Check if redundant with README
3. `RESTART_INSTRUCTIONS.md` - Check if redundant with docs/

### Build Artifacts (Verify Not Tracked)
- All `__pycache__/`, `node_modules/`, `.next/`, `venv/` directories
- All `*.log` files
- All `.env` files

---

## ✅ Final Checklist

Before pushing:
- [ ] Verify `.env` files are not tracked: `git ls-files | grep .env`
- [ ] Verify log files are not tracked: `git ls-files | grep .log`
- [ ] Verify build artifacts are not tracked: `git ls-files | grep -E "node_modules|__pycache__|\.next|venv"`
- [ ] Remove confirmed files
- [ ] Review and decide on "Files to Review"
- [ ] Test that repo can be cloned and run from scratch
- [ ] Verify README has all necessary setup instructions

---

## 🚀 Next Steps

1. **Execute cleanup** - Remove confirmed files
2. **Review documentation** - Decide on redundant docs
3. **Verify .gitignore** - Ensure all artifacts are ignored
4. **Test fresh clone** - Verify repo works from scratch
5. **Push to GitHub** - After cleanup is complete

