# Deployment Guide

## Vercel (Recommended)

### Initial Deployment

```bash
vercel
```

### Environment Variables

Add in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
GEMINI_API_KEY
CRON_SECRET
```

**Required for cron jobs:**
- `SUPABASE_SERVICE_ROLE_KEY` - Get from Supabase Dashboard → Settings → API → service_role key
  - Used by weekly analysis cron to bypass RLS and query all users
  - Keep this secret, never expose in client-side code

Generate CRON_SECRET:
```bash
openssl rand -base64 32
```

### Production Deploy

```bash
vercel --prod
```

### Cron Jobs

Configured in `vercel.json`:
- Weekly analysis runs Monday 8:00 AM
- Requires CRON_SECRET env var
- Monitor: Vercel Dashboard → Functions

## Alternative Platforms

### Netlify
- Add build command: `yarn build`
- Publish directory: `.next`
- Add environment variables

### Railway/Render
- Docker-ready
- Add `Dockerfile` if needed
- Configure environment variables

## Post-Deployment

1. **Verify migrations** - Check Supabase tables exist
2. **Test auth** - Try login/signup
3. **Check cron** - Verify in Functions logs
4. **Monitor errors** - Check Vercel logs

## CI/CD

GitHub Actions runs on push/PR:
- `.github/workflows/ci.yml` - Tests, lint, build
- Auto-deploys via Vercel GitHub integration

## Troubleshooting

**Build fails:**
- Check environment variables
- Verify Node.js version (25.2.0+)
- Run `yarn build` locally

**Cron not running:**
- Verify CRON_SECRET set
- Check vercel.json deployed
- View logs in Vercel Dashboard

**Database errors:**
- Ensure migrations ran
- Check RLS policies
- Verify connection string
