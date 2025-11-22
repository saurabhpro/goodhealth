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
NEXT_PUBLIC_APP_URL
GEMINI_API_KEY
```

### Production Deploy

```bash
vercel --prod
```

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
3. **Test weekly analysis** - Visit dashboard, should auto-generate if data exists
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

**Weekly analysis not generating:**
- Ensure user has workouts/goals/plans
- Check GEMINI_API_KEY is set
- View browser console for errors
- Check Vercel function logs

**Database errors:**
- Ensure migrations ran
- Check RLS policies
- Verify connection string
