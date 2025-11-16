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
- Creates preview deployment on Vercel
- Posts preview URL in PR comments

#### 3. **Deploy Production** (`.github/workflows/deploy-production.yml`)
Runs when code is pushed to `main` branch.

**Steps:**
- Run tests
- Deploy to Vercel production

### Required GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
NEXT_PUBLIC_SUPABASE_URL        # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Your Supabase anonymous key
NEXT_PUBLIC_APP_URL             # Your production app URL
VERCEL_TOKEN                    # Vercel authentication token
VERCEL_ORG_ID                   # Vercel organization ID
VERCEL_PROJECT_ID               # Vercel project ID
CODECOV_TOKEN                   # Optional: Codecov token for coverage reports
```

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

### Step 3: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable

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
