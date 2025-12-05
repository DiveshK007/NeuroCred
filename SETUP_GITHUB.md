# Push to GitHub - Quick Guide

## Step 1: Create Repository on GitHub

1. Go to: https://github.com/new
2. Repository name: `NeuroCred`
3. Description: "AI-Powered Credit Passport on QIE Blockchain"
4. Choose Public or Private
5. **IMPORTANT**: Do NOT check any boxes (no README, no .gitignore, no license)
6. Click "Create repository"

## Step 2: Push Your Code

After creating the repo, run these commands:

```bash
cd /Users/bond/NeuroCred

# Add GitHub remote (replace DiveshK007 with your GitHub username if different)
git remote add origin https://github.com/DiveshK007/NeuroCred.git

# Ensure you're on main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

## Alternative: Using SSH (if you have SSH keys set up)

```bash
git remote add origin git@github.com:DiveshK007/NeuroCred.git
git branch -M main
git push -u origin main
```

## Troubleshooting

If you get "repository not found":
- Make sure you created the repo on GitHub first
- Check that the repository name matches exactly
- Verify your GitHub username is correct

If you get authentication errors:
- Use a Personal Access Token instead of password
- Or set up SSH keys for easier authentication

