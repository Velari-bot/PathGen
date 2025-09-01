# 🔧 Firebase Token Setup for GitHub Actions

## Quick Setup

To enable automatic deployment to Firebase Hosting via GitHub Actions, you need to set up a Firebase token:

### Step 1: Generate Firebase Token
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login and generate token
firebase login:ci
```

### Step 2: Add Token to GitHub Secrets
1. Go to your GitHub repository: https://github.com/Velari-bot/PathGen
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FIREBASE_TOKEN`
5. Value: Paste the token from Step 1

### Step 3: Enable Automatic Deployment
Once the token is set up, the workflow will automatically deploy on every push to main.

## Manual Deployment
If you prefer manual deployment, you can:
1. Go to **Actions** tab in your GitHub repository
2. Select **Manual Deploy to Firebase**
3. Click **Run workflow**

## Current Status
- ✅ Build workflow: Automatically builds and tests on push
- ⚠️ Deploy workflow: Requires FIREBASE_TOKEN secret
- ✅ Manual deployment: Available via GitHub Actions

## Troubleshooting
If you see "Context access might be invalid" errors, it means the FIREBASE_TOKEN secret is not set up in your GitHub repository.
