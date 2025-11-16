# GoodHealth Deployment Guide

This guide covers CI/CD setup and deployment options for the GoodHealth fitness tracking application.

> **Prerequisites:** Complete local setup first. See [SETUP.md](./SETUP.md) for installation and configuration instructions.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [CI/CD Pipeline](#cicd-pipeline)
3. [Deployment Options](#deployment-options)
4. [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
5. [Alternative Hosting Providers](#alternative-hosting-providers)
6. [Post-Deployment Setup](#post-deployment-setup)
7. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Pre-Deployment Checklist

Before deploying, ensure:

- ✅ All tests pass: `npm test`
- ✅ Build succeeds locally: `npm run build`
- ✅ Database migrations run in Supabase
- ✅ Environment variables configured
- ✅ Google OAuth credentials set up (if using)

---

## CI/CD Pipeline

### GitHub Actions Workflows

The project includes three automated workflows:

#### 1. **CI Workflow** (`.github/workflows/ci.yml`)
Runs on every push and pull request to `main` or `develop` branches.

**Steps:**
- Checkout code
- Setup Node.js 20
- Install dependencies
- Run ESLint
- Run tests
- Generate coverage report
- Upload coverage to Codecov
- Build application

#### 2. **Deploy Preview** (`.github/workflows/deploy-preview.yml`)
Runs on pull requests to `main` branch.

**Steps:**
- Checkout code
- Setup Node.js 20
- Install dependencies
- Install Vercel CLI
- Pull Vercel environment configuration (`vercel pull --yes`)
- Build project artifacts (`vercel build`)
- Deploy to Vercel preview (`vercel deploy --prebuilt`)

**Note:** Uses official Vercel CLI for reliable, non-interactive deployments.

#### 3. **Deploy Production** (`.github/workflows/deploy-production.yml`)
Runs when code is pushed to `main` branch.

**Steps:**
- Checkout code
- Setup Node.js 20
- Install dependencies
- Run tests
- Install Vercel CLI
- Pull Vercel environment configuration (`vercel pull --yes --environment=production`)
- Build project artifacts (`vercel build --prod`)
- Deploy to Vercel production (`vercel deploy --prebuilt --prod`)

**Note:** Uses Vercel's recommended CI/CD pattern with the `--prebuilt` flag for faster deployments.

### Required GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
NEXT_PUBLIC_SUPABASE_URL        # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Your Supabase anonymous key
NEXT_PUBLIC_APP_URL             # Your production app URL
VERCEL_TOKEN                    # Vercel authentication token
CODECOV_TOKEN                   # Optional: Codecov token for coverage reports
```

**Important:** With the new Vercel CLI approach, you **only need `VERCEL_TOKEN`**. The `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are no longer required as they're automatically detected from your linked Vercel project.

#### How to Get Vercel Credentials

**1. Get VERCEL_TOKEN (Access Token)**

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click **"Create Token"** or **"Tokens"** tab
3. Enter a token name (e.g., "GitHub Actions")
4. Select scope:
   - Choose **"Full Account"** for complete access
   - Or select specific scopes if you prefer
5. Set expiration (recommended: No Expiration for CI/CD, or 1 year)
6. Click **"Create Token"**
7. **Copy the token immediately** (you won't be able to see it again)
8. Save as `VERCEL_TOKEN` in GitHub Secrets

**2. Get VERCEL_ORG_ID (Organization ID)**

Method A - Via Vercel Dashboard:
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on **Settings** (in the left sidebar)
3. Under **General**, find **"Team ID"** or **"Organization ID"**
4. Copy the ID (looks like: `team_xxxxxxxxxxxxxx`)
5. Save as `VERCEL_ORG_ID` in GitHub Secrets

Method B - Via Project Settings:
1. Open any project in Vercel
2. Go to **Settings**
3. Scroll down to find the **Team ID** or check the `.vercel/project.json` file
4. The `orgId` field contains your organization ID

Method C - Via CLI (after deploying once):
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project (creates .vercel folder)
vercel link

# Check .vercel/project.json
cat .vercel/project.json
```

**3. Get VERCEL_PROJECT_ID**

Method A - Via Project Settings:
1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on **Settings**
3. Under **General**, find **"Project ID"**
4. Copy the ID (looks like: `prj_xxxxxxxxxxxxxx`)
5. Save as `VERCEL_PROJECT_ID` in GitHub Secrets

Method B - From Project URL:
1. Your project URL looks like: `https://vercel.com/your-team/your-project`
2. The project ID is visible in the URL or settings page

Method C - Via CLI:
```bash
# After running 'vercel link'
cat .vercel/project.json

# Look for "projectId" field
```

Method D - Create Project First:
1. Deploy your app to Vercel manually first (via dashboard or CLI)
2. Once deployed, the Project ID will be available in Settings
3. This is the **recommended approach** - deploy manually first, then set up CI/CD

**4. Get CODECOV_TOKEN (Optional)**

Only needed if you want code coverage reports:
1. Go to [codecov.io](https://codecov.io)
2. Sign in with GitHub
3. Add your repository
4. Copy the upload token
5. Save as `CODECOV_TOKEN` in GitHub Secrets

#### Adding Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add each secret with its name and value
5. Secrets are encrypted and hidden after saving

---

## Deployment Options

### Why Not GitHub Pages?

**GitHub Pages is NOT suitable** for this project because:
- ❌ Only supports static HTML/CSS/JS
- ❌ No server-side rendering (SSR)
- ❌ No API routes support
- ❌ No server actions support
- ❌ No backend functionality

### Recommended: Vercel

**Best choice** for Next.js applications:
- ✅ Built by Next.js creators
- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Preview deployments for PRs
- ✅ Free tier (generous limits)

### Alternative Options

| Provider | Free Tier | Next.js Support | Database Support | Notes |
|----------|-----------|----------------|------------------|-------|
| **Netlify** | ✅ Yes | ✅ Excellent | Limited | Good alternative to Vercel |
| **Railway** | ✅ $5/month credit | ✅ Good | ✅ Excellent | Best for full-stack apps |
| **Render** | ✅ Yes | ✅ Good | ✅ Good | Free tier has cold starts |
| **AWS Amplify** | ❌ Pay-as-you-go | ✅ Excellent | ✅ Excellent | More complex setup |
| **Cloudflare Pages** | ✅ Yes | ⚠️ Limited | Limited | Edge runtime limitations |

---

## Vercel Deployment (Recommended)

### Understanding What Vercel Needs

**Files Vercel NEEDS for deployment:**
- ✅ `package.json` & `package-lock.json` - Dependencies
- ✅ `next.config.ts` - Next.js configuration
- ✅ `app/` directory - Your application code
- ✅ `components/` - React components
- ✅ `lib/` - Utility functions and API code
- ✅ `types/` - TypeScript definitions
- ✅ `public/` - Static assets
- ✅ `proxy.ts` - Middleware/proxy for auth
- ✅ Environment variables (set in Vercel dashboard)

**Files Vercel DOESN'T need:**
- ❌ `.github/` - CI/CD workflows (GitHub handles this)
- ❌ `migrations/` - Database files (already in Supabase)
- ❌ `__tests__/` - Test files (tests run in CI)
- ❌ `*.test.ts` - Individual test files
- ❌ `jest.config.js` - Test configuration
- ❌ `*.md` - Documentation files
- ❌ `.vscode/`, `.idea/` - Editor configurations
- ❌ `.env.local` - Local environment (use Vercel env vars)
- ❌ `node_modules/` - Rebuilt during deployment
- ❌ `.next/` - Rebuilt during deployment

**Result:** Smaller, faster deployments with only production-necessary files.

---

### Quick Start: Recommended Workflow

**For first-time deployment:**
1. Deploy manually via Vercel Dashboard (steps below)
2. Once deployed, get the Project ID and Org ID from project settings
3. Create Vercel access token
4. Add these as GitHub Secrets for automated deployments

**Why this order?**
- Deploying manually first creates the project and generates IDs
- You can then set up CI/CD with the correct credentials
- Manual deployment verifies everything works before automation

---

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 2: Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)** and sign up/login

2. **Import Git Repository**
   - Click "Add New Project"
   - Connect your GitHub account
   - Select the `goodhealth` repository

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next` (auto-configured)

4. **Add Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at `https://your-app.vercel.app`

### Step 3: Get Project Credentials for CI/CD

After successful deployment, you'll need these credentials for GitHub Actions:

**To find Project ID and Org ID:**
1. Open your project in Vercel Dashboard
2. Go to **Settings** (left sidebar)
3. Scroll to **General** section
4. Look for:
   - **Project ID**: `prj_xxxxxxxxx` (copy this value)
   - **Team ID** or **Organization ID**: `team_xxxxxxxxx` (copy this value)

**To create Access Token:**
1. Click your profile picture (top right)
2. Go to **Settings** → **Tokens**
3. Click **Create Token**
4. Name it "GitHub Actions" or similar
5. Set scope to "Full Account" (or customize as needed)
6. Click **Create** and copy the token immediately

**Alternative: Using Vercel CLI**
```bash
# Deploy once with CLI
vercel

# Check the generated .vercel/project.json file
cat .vercel/project.json

# You'll see:
{
  "orgId": "team_xxxxx",      # This is VERCEL_ORG_ID
  "projectId": "prj_xxxxx"    # This is VERCEL_PROJECT_ID
}
```

### Step 4: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable

### Step 5: Optimize Vercel Deployment (Optional)

**Create `.vercelignore` file**

By default, Vercel respects `.gitignore`, but you may want additional exclusions for deployment optimization. Create a `.vercelignore` file in your project root:

```bash
# .vercelignore - Files to exclude from Vercel deployment

# Documentation (not needed in production)
*.md
DEPLOYMENT.md
SETUP.md
TESTING.md
CONTRIBUTING.md
LICENSE

# Development files
.vscode/
.idea/
*.code-workspace

# Testing
__tests__/
**/*.test.ts
**/*.test.tsx
**/*.spec.ts
**/*.spec.tsx
jest.config.js
jest.setup.js
coverage/

# CI/CD (GitHub Actions workflows not needed on Vercel)
.github/

# Migrations (if already applied in Supabase)
migrations/

# Local environment
.env.local
.env*.local

# Git
.git/
.gitignore
.gitattributes

# Editor configs
.editorconfig
.prettierrc
.prettierignore
.eslintrc.json

# Package manager
.npmrc
.yarnrc
.pnpm-store/

# Vercel CLI (already there)
.vercel/

# Logs
*.log
npm-debug.log*
yarn-debug.log*

# OS files
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.swp
*~
```

**Why use `.vercelignore`?**
- ✅ Reduces deployment bundle size
- ✅ Faster build times
- ✅ Excludes sensitive development files
- ✅ Keeps only production-necessary files

**Note:** Your `.gitignore` already excludes most of these, but `.vercelignore` gives you more control over what gets deployed vs. what's in your repository.

**Vercel automatically excludes:**
- `node_modules/` (reinstalled during build)
- `.next/` (rebuilt during deployment)
- `.env.local` (use Vercel environment variables instead)

---

## Post-Deployment Setup

### 1. Update Supabase Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

**Redirect URLs** (add both):
```
https://your-app.vercel.app/api/auth/callback
https://your-app.vercel.app/auth/auth-code-error
```

**Site URL**:
```
https://your-app.vercel.app
```

### 2. Update Google OAuth (if using)

In Google Cloud Console → APIs & Services → Credentials:

**Authorized redirect URIs**:
```
https://<your-supabase-project>.supabase.co/auth/v1/callback
```

### 3. Test Deployment

- [ ] Visit your deployed URL
- [ ] Test authentication (email/password and Google OAuth)
- [ ] Create a workout
- [ ] Create a goal
- [ ] Check dashboard statistics
- [ ] Verify PWA installation on mobile

---

## Monitoring & Troubleshooting

## Alternative Hosting Providers

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**Build settings:**
- Build command: `npm run build`
- Publish directory: `.next`
- Functions directory: `.netlify/functions`

### Railway

1. Connect GitHub repository at [railway.app](https://railway.app)
2. Railway auto-detects Next.js
3. Add environment variables
4. Deploy automatically on push to main

### Render

1. Create new Web Service at [render.com](https://render.com)
2. Connect repository
3. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add environment variables

---

## Environment Variables

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Application URL (must match deployment URL)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Local Development

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials.

### Production

Add environment variables in your hosting provider's dashboard:
- **Vercel**: Settings → Environment Variables
- **Netlify**: Site settings → Environment variables
- **Railway**: Settings → Variables
- **Render**: Environment → Environment Variables

### Vercel Logs

**Dashboard:**
- Project → Deployments → [Select deployment] → Function Logs

**CLI:**
```bash
vercel logs --follow
```

### Error Tracking (Optional)

Consider integrating:
- **Sentry** - Error tracking and monitoring
- **LogRocket** - Session replay for debugging
- **PostHog** - Product analytics

### Common Issues

**Build Fails:**
- Check environment variables are set
- Verify Node version (20.x)
- Run `npm run build` locally first
- Check for TypeScript errors

**Authentication Not Working:**
- Verify Supabase redirect URLs include production URL
- Check Google OAuth redirect URIs
- Ensure `NEXT_PUBLIC_APP_URL` matches deployment URL

**Database Connection Issues:**
- Verify Supabase anon key is correct
- Check RLS policies are enabled
- Ensure database migrations are run

**GitHub Actions Failing - Vercel Credentials:**

Error: "Invalid token" or "Project not found"
- **Solution**: Verify your GitHub Secrets are correct:
  1. Go to GitHub repo → Settings → Secrets and variables → Actions
  2. Check that `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are set
  3. Ensure no extra spaces or quotes around the values
  4. Token must have correct scopes (Full Account or project-specific)

Error: "Team not found" or "Unauthorized"
- **Solution**: Your `VERCEL_ORG_ID` might be wrong
  1. For personal accounts, use your username or find Team ID in Vercel Settings
  2. For team accounts, use the `team_xxxxx` format
  3. Check `.vercel/project.json` after running `vercel` CLI locally

Error: "Project does not exist"
- **Solution**:
  1. Make sure you've deployed to Vercel at least once manually
  2. Verify `VERCEL_PROJECT_ID` matches the project in your Vercel dashboard
  3. Project ID should start with `prj_`

**Can't Find Project ID or Org ID:**
- **Quick Solution**: Deploy with Vercel CLI once
  ```bash
  npm i -g vercel
  vercel login
  vercel
  cat .vercel/project.json  # Contains both IDs
  ```

**GitHub Actions Getting Stuck: "Set up and deploy? [Y/n]"**

The deployment is waiting for interactive confirmation.

**Solution:**
The workflows have been updated to use the official Vercel CLI instead of the third-party action. The new approach uses:
```yaml
- vercel pull --yes  # Pulls environment config
- vercel build       # Builds the project
- vercel deploy --prebuilt  # Deploys the built project
```

This eliminates all interactive prompts and uses Vercel's recommended CI/CD pattern. The `--yes` flag in `vercel pull` automatically confirms the setup.

**GitHub Actions Error: "Input required and not supplied: vercel-token"**

This error means GitHub Actions can't find your `VERCEL_TOKEN` secret. Here's how to fix it:

**Step 1: Verify Secret Name is Exact**
1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Look for a secret named **exactly** `VERCEL_TOKEN` (case-sensitive, no spaces)
4. If it's named differently (e.g., `VERCEL_ACCESS_TOKEN`), either:
   - Rename it to `VERCEL_TOKEN`, OR
   - Update the workflow files to match your secret name

**Step 2: Check Secret is in Repository Secrets (not Environment Secrets)**
1. In **Settings** → **Secrets and variables** → **Actions**
2. Make sure you're looking at the **"Secrets"** tab (Repository secrets)
3. NOT the "Variables" tab
4. NOT Environment secrets (unless your workflow specifies an environment)

**Step 3: Verify All Three Secrets Exist**
You need all three of these secrets (exact names):
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Step 4: Check for Copy/Paste Issues**
1. When you added the secret, make sure:
   - No leading/trailing spaces
   - No quotes around the value
   - You clicked "Add secret" to save
2. If unsure, delete and re-add the secret:
   - Click the secret name
   - Click "Remove"
   - Click "New repository secret"
   - Add it again

**Step 5: Trigger Workflow Correctly**
- For **deploy-production.yml**: Push to `main` branch
- For **deploy-preview.yml**: Open a pull request to `main`
- Workflows won't run on commits to other branches

**Quick Test:**
Add this temporary step to your workflow to debug:
```yaml
- name: Check secrets
  run: |
    if [ -z "${{ secrets.VERCEL_TOKEN }}" ]; then
      echo "VERCEL_TOKEN is not set!"
    else
      echo "VERCEL_TOKEN is set (length: ${#VERCEL_TOKEN})"
    fi
```

If it shows "not set", the secret isn't configured properly in GitHub.

---

## Continuous Deployment

With GitHub Actions configured, deployments happen automatically:

- **Push to `main`** → Deploy to production
- **Open PR to `main`** → Deploy preview environment
- **Push to PR** → Update preview environment

### Manual Deployment

If needed, you can deploy manually:

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel
```

---

## Rollback

### Vercel
1. Go to Deployments tab
2. Find previous successful deployment
3. Click "Promote to Production"

### Other Providers
- Most providers offer rollback in their dashboard
- Or redeploy a previous commit from Git

---

## Performance Optimization

### Already Configured
- ✅ Next.js 16 with Turbopack (faster builds)
- ✅ Automatic code splitting
- ✅ Image optimization
- ✅ Server components for better performance
- ✅ PWA with service worker

### Future Optimizations
- Add Redis caching for frequently accessed data
- Implement Edge Functions for global low-latency
- Add CDN for static assets
- Implement image optimization with next/image

---

## Security Best Practices

Before going to production:

- ✅ Never commit `.env.local` to Git (in `.gitignore`)
- ✅ Use environment variables for all secrets
- ✅ Enable Supabase Row Level Security (RLS) on all tables
- ✅ Use HTTPS in production (automatic with Vercel)
- ✅ Keep dependencies updated: `npm audit fix`
- ✅ Configure CORS appropriately
- ✅ Review Google OAuth scopes
- ✅ Enable rate limiting (consider Vercel Edge Config)

---

## Performance Optimization

The app is already optimized with:

- ✅ Next.js 16 with Turbopack
- ✅ Automatic code splitting
- ✅ Image optimization
- ✅ Server components
- ✅ PWA with service worker

**Future optimizations:**
- Add Redis caching for frequently accessed data
- Implement Edge Functions for global low-latency
- Add CDN for static assets

---

## Quick Reference

### Deployment Commands

```bash
# Vercel CLI deployment
vercel --prod                    # Deploy to production
vercel                           # Deploy preview

# Build and test locally
npm run build                    # Build for production
npm start                        # Start production server
npm test                         # Run tests
```

### Support Resources

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Project Setup**: [SETUP.md](./SETUP.md)
- **Testing Guide**: [TESTING.md](./TESTING.md)

---

## Summary

**Recommended Setup:**
1. Deploy to Vercel (free tier)
2. Set up GitHub Actions for CI/CD
3. Configure Supabase redirect URLs
4. Test authentication and core features
5. Monitor with Vercel Analytics

**Total Cost:** $0/month for starter usage

**Deployment Time:** ~5 minutes

**Maintenance:** Automatic deployments on push to main
