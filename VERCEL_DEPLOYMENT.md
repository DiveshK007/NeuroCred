# 🚀 Vercel Deployment Guide for NeuroCred Frontend

This guide will walk you through deploying the NeuroCred frontend to Vercel.

## Prerequisites

1. **GitHub Account** - Your code should be pushed to GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier works)
3. **Backend API URL** - Your FastAPI backend should be deployed (e.g., on Render, Railway, or Fly.io)

---

## Step 1: Prepare Your Repository

### 1.1 Ensure Code is Pushed to GitHub

```bash
# Make sure you're on main branch
git checkout main

# Push all changes
git push origin main
```

### 1.2 Verify Frontend Structure

Your `frontend/` directory should contain:
- `package.json` ✅
- `next.config.ts` ✅
- `tsconfig.json` ✅
- All source files in `app/` directory ✅

---

## Step 2: Connect to Vercel

### 2.1 Sign In to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"** (recommended)

### 2.2 Import Your Project

1. Click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Find and select your `NeuroCred` repository
4. Click **"Import"**

---

## Step 3: Configure Project Settings

### 3.1 Project Configuration

Vercel should auto-detect Next.js, but verify these settings:

**Framework Preset:** `Next.js`  
**Root Directory:** `frontend` (IMPORTANT - set this!)  
**Build Command:** `npm run build` (or leave default)  
**Output Directory:** `.next` (or leave default)  
**Install Command:** `npm install` (or leave default)

### 3.2 Environment Variables

Click **"Environment Variables"** and add these:

#### Required Variables:

```bash
# Backend API URL (replace with your deployed backend URL)
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com

# QIE Testnet Configuration
NEXT_PUBLIC_QIE_TESTNET_CHAIN_ID=1983
NEXT_PUBLIC_QIE_TESTNET_RPC_URL=https://rpc1testnet.qie.digital/

# Contract Addresses (replace with your deployed contract addresses)
NEXT_PUBLIC_CREDIT_PASSPORT_NFT_ADDRESS=0xYourContractAddress
NEXT_PUBLIC_LENDING_VAULT_ADDRESS=0xYourVaultAddress

# Optional: Staking Contract (if deployed)
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=0xYourStakingAddress
NEXT_PUBLIC_NCRD_TOKEN_ADDRESS=0xYourNCRDTokenAddress

# Optional: Demo Lender (if deployed)
NEXT_PUBLIC_DEMO_LENDER_ADDRESS=0xYourLenderAddress

# Optional: Explorer URLs
NEXT_PUBLIC_EXPLORER_URL=https://testnet.qie.digital
NEXT_PUBLIC_EXPLORER_TX_URL_PREFIX=https://testnet.qie.digital/tx

# Optional: Sentry (for error tracking)
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

#### How to Add Environment Variables:

1. Click **"Add"** for each variable
2. Enter the **Name** (e.g., `NEXT_PUBLIC_API_URL`)
3. Enter the **Value** (e.g., `https://your-backend.onrender.com`)
4. Select **Environment(s)**: 
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **"Save"**

**Important Notes:**
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Never add private keys or secrets as `NEXT_PUBLIC_` variables
- Update contract addresses after deploying your smart contracts

---

## Step 4: Deploy

### 4.1 Initial Deployment

1. Review all settings
2. Click **"Deploy"**
3. Wait for build to complete (usually 2-5 minutes)

### 4.2 Monitor Build

Watch the build logs for:
- ✅ Dependencies installed
- ✅ TypeScript compilation
- ✅ Next.js build successful
- ❌ Any errors (fix and redeploy)

---

## Step 5: Post-Deployment

### 5.1 Get Your Deployment URL

After successful deployment, Vercel will provide:
- **Production URL**: `https://your-project.vercel.app`
- **Preview URLs**: For each branch/PR

### 5.2 Update Backend CORS

Make sure your backend allows requests from your Vercel domain:

```python
# In backend/app.py, update CORS origins:
origins = [
    "http://localhost:3000",
    "https://your-project.vercel.app",  # Add this
    "https://*.vercel.app",  # Or allow all Vercel previews
]
```

### 5.3 Test Your Deployment

1. Visit your Vercel URL
2. Test wallet connection
3. Test API calls to backend
4. Check browser console for errors

---

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain

1. Go to **Project Settings** → **Domains**
2. Enter your domain (e.g., `neurocred.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

---

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Check that all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: "TypeScript errors"**
- Fix TypeScript errors locally first
- Run `npm run build` locally to test

**Error: "Environment variable not found"**
- Verify all `NEXT_PUBLIC_*` variables are set in Vercel
- Redeploy after adding variables

### Runtime Errors

**Error: "Failed to fetch" (API calls)**
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend CORS allows Vercel domain
- Check backend is running and accessible

**Error: "Invalid chain ID"**
- Verify `NEXT_PUBLIC_QIE_TESTNET_CHAIN_ID=1983`
- Check wallet is connected to QIE Testnet

**Error: "Contract not found"**
- Verify contract addresses are correct
- Ensure contracts are deployed to QIE Testnet
- Check contract addresses in Vercel environment variables

### Performance Issues

**Slow builds:**
- Enable Vercel Build Cache
- Use `.vercelignore` to exclude unnecessary files

**Large bundle size:**
- Check `next.config.ts` has compression enabled (already configured)
- Review and optimize large dependencies

---

## Vercel Configuration File (Optional)

Create `frontend/vercel.json` for advanced configuration:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend.onrender.com/api/:path*"
    }
  ]
}
```

---

## Continuous Deployment

Vercel automatically deploys:
- ✅ **Production**: Every push to `main` branch
- ✅ **Preview**: Every push to other branches
- ✅ **Pull Requests**: Automatic preview deployments

### Branch Protection

To prevent auto-deployment:
1. Go to **Project Settings** → **Git**
2. Configure branch protection rules
3. Require manual approval for production

---

## Monitoring & Analytics

### Vercel Analytics (Free Tier)

1. Go to **Project Settings** → **Analytics**
2. Enable **Web Analytics**
3. View real-time visitor data

### Error Tracking

If using Sentry:
1. Add Sentry environment variables
2. Errors will automatically be tracked
3. View in Sentry dashboard

---

## Quick Checklist

Before deploying:
- [ ] Code pushed to GitHub
- [ ] All environment variables set in Vercel
- [ ] Backend API is deployed and accessible
- [ ] Contract addresses are correct
- [ ] `frontend/` is set as root directory
- [ ] Build passes locally (`npm run build`)

After deploying:
- [ ] Visit deployment URL
- [ ] Test wallet connection
- [ ] Test API calls
- [ ] Check browser console for errors
- [ ] Update backend CORS if needed
- [ ] Update README with deployment URL

---

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check browser console for errors
3. Verify environment variables
4. Test backend API independently
5. Review Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)

---

## Next Steps

After frontend is deployed:
1. Deploy backend (Render, Railway, or Fly.io)
2. Update `NEXT_PUBLIC_API_URL` in Vercel
3. Deploy smart contracts to QIE Testnet
4. Update contract addresses in Vercel
5. Test end-to-end flow
6. Update README with live URLs

---

**Happy Deploying! 🚀**
