#!/bin/bash

# Script to push NeuroCred to GitHub
# Usage: ./push-to-github.sh YOUR_GITHUB_USERNAME

if [ -z "$1" ]; then
    echo "Usage: ./push-to-github.sh YOUR_GITHUB_USERNAME"
    echo "Example: ./push-to-github.sh DiveshK007"
    exit 1
fi

GITHUB_USER=$1
REPO_NAME="NeuroCred"

echo "Setting up remote for GitHub..."
echo "Repository: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""

# Check if remote already exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "Remote 'origin' already exists. Removing it..."
    git remote remove origin
fi

# Add remote
echo "Adding remote origin..."
git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git

# Verify remote
echo ""
echo "Remote configured:"
git remote -v

echo ""
echo "Ready to push! Make sure you've created the repository on GitHub first."
echo ""
read -p "Have you created the repository on GitHub? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing to GitHub..."
    git push -u origin main
    echo ""
    echo "✅ Done! Your repository should now be visible at:"
    echo "   https://github.com/$GITHUB_USER/$REPO_NAME"
else
    echo ""
    echo "Please create the repository on GitHub first:"
    echo "   1. Go to https://github.com/new"
    echo "   2. Repository name: $REPO_NAME"
    echo "   3. Make it Public (or Private)"
    echo "   4. DO NOT initialize with README, .gitignore, or license"
    echo "   5. Click 'Create repository'"
    echo ""
    echo "Then run this script again and answer 'y' when prompted."
fi

