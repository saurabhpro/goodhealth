# Weekly Workout Analysis Feature - Setup Guide

This guide will help you set up and test the new Weekly Workout Analysis feature.

## Overview

The Weekly Workout Analysis feature automatically generates AI-powered insights every Monday for users who have active goals or workout plans. It analyzes:
- Weekly workout performance
- Goal progress
- Body measurement changes
- Key achievements and areas for improvement
- Personalized recommendations
- Motivational quotes

## 1. Database Migration

Run the migration to create the `weekly_workout_analysis` table:

### Option A: Using Supabase CLI (Recommended)

```bash
# Make sure you have Supabase CLI installed
npm install -g supabase

# Link to your Supabase project (if not already linked)
npx supabase link --project-ref your-project-ref

# Apply the migration
npx supabase db push
```

### Option B: Manual SQL Execution

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: SQL Editor
3. Copy and paste the contents of `/migrations/002_add_weekly_workout_analysis.sql`
4. Execute the SQL

## 2. Environment Variables

Ensure you have the following environment variables set in `.env.local`:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Google Gemini AI (already configured)
GEMINI_API_KEY=your_gemini_api_key

# Cron Secret (for scheduled jobs)
CRON_SECRET=your_random_secret_string  # Generate: openssl rand -base64 32
```

## 3. Vercel Cron Setup (for Production)

The `vercel.json` file is already configured to run the cron job every Monday at 8:00 AM:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-analysis",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

### Deploy to Vercel:

```bash
# If not already deployed
vercel

# Or deploy with environment variables
vercel --prod
```

### Add CRON_SECRET to Vercel:

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add: `CRON_SECRET` with your generated secret value
4. Redeploy

## 4. Manual Testing

### Test the API Endpoints

1. **Generate Analysis for Last Week (Manual Trigger)**

```bash
curl -X POST http://localhost:3000/api/weekly-analysis/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{}'
```

2. **Fetch Latest Analysis**

```bash
curl http://localhost:3000/api/weekly-analysis/latest \
  -H "Cookie: your-session-cookie"
```

3. **Mark as Viewed**

```bash
curl -X PUT http://localhost:3000/api/weekly-analysis/{analysis-id}/view \
  -H "Cookie: your-session-cookie"
```

4. **Dismiss Analysis**

```bash
curl -X PUT http://localhost:3000/api/weekly-analysis/{analysis-id}/dismiss \
  -H "Cookie: your-session-cookie"
```

### Test the UI

1. **Start the dev server:**
   ```bash
   yarn dev
   ```

2. **Login to your account** with goals/workout plans

3. **Navigate to Dashboard:** http://localhost:3000/dashboard

4. **Generate a test analysis:**
   - Open browser console
   - Run:
     ```javascript
     fetch('/api/weekly-analysis/generate', { method: 'POST' })
       .then(r => r.json())
       .then(console.log)
     ```

5. **Reload the page** to see the analysis card

6. **Interact with the card:**
   - View full analysis (expand details)
   - Dismiss the card

## 5. Testing the Cron Job Locally

### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Run dev server with cron support
vercel dev

# In another terminal, trigger the cron endpoint manually:
curl http://localhost:3000/api/cron/weekly-analysis \
  -H "Authorization: Bearer your-cron-secret"
```

### Option B: Direct API Call

```bash
# Start your Next.js dev server
yarn dev

# In another terminal, trigger with CRON_SECRET
curl http://localhost:3000/api/cron/weekly-analysis \
  -H "Authorization: Bearer your-cron-secret"
```

## 6. Verify Database Records

After generating analysis, check the database:

```sql
-- View all weekly analyses
SELECT
  id,
  user_id,
  week_start_date,
  week_end_date,
  viewed_at,
  is_dismissed,
  generated_at
FROM weekly_workout_analysis
ORDER BY generated_at DESC;

-- View analysis details for a user
SELECT *
FROM weekly_workout_analysis
WHERE user_id = 'your-user-id'
ORDER BY week_start_date DESC
LIMIT 1;
```

## 7. Production Monitoring

### Check Cron Job Execution Logs (Vercel)

1. Go to Vercel Dashboard → Your Project
2. Click on "Deployments"
3. Click on your latest deployment
4. Go to "Functions" tab
5. Find `/api/cron/weekly-analysis`
6. View logs and execution history

### Monitor with Vercel Cron Dashboard

1. Vercel Dashboard → Your Project
2. Settings → Cron Jobs
3. View execution history and status

## 8. Troubleshooting

### Issue: Analysis not appearing on dashboard

**Solutions:**
- Check if user has active goals or workout plans
- Verify analysis was generated: query `weekly_workout_analysis` table
- Check `is_dismissed` field is `false`
- Ensure user had workouts in the past week

### Issue: Cron job not running

**Solutions:**
- Verify `CRON_SECRET` is set in Vercel environment variables
- Check cron job logs in Vercel dashboard
- Verify `vercel.json` is committed and deployed
- Test the endpoint manually with correct Authorization header

### Issue: AI generation fails

**Solutions:**
- Verify `GEMINI_API_KEY` is valid and not expired
- Check API quota/billing on Google AI Studio
- Review error logs in Vercel/console
- Test with smaller date ranges

### Issue: "Unauthorized" errors

**Solutions:**
- Ensure user is logged in (check session cookie)
- Verify RLS policies are active on `weekly_workout_analysis` table
- Check `auth.uid()` is being properly passed

## 9. Feature Customization

### Change Cron Schedule

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-analysis",
      "schedule": "0 9 * * 1"  // 9:00 AM every Monday
    }
  ]
}
```

Cron syntax: `minute hour day-of-month month day-of-week`

### Customize AI Model

Edit `lib/weekly-analysis/ai-analyzer.ts`:

```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',  // Change model here
  generationConfig: {
    temperature: 0.7,    // Adjust creativity
    maxOutputTokens: 2048,
  },
})
```

### Change Analysis Week Window

By default, the cron job analyzes the previous week (Monday to Sunday). To customize:

Edit `app/api/cron/weekly-analysis/route.ts`:

```typescript
// Change from last week to 2 weeks ago
const targetWeek = startOfWeek(subWeeks(new Date(), 2), { weekStartsOn: 1 })
```

## 10. Future Enhancements

Potential improvements:
- Email notifications when analysis is ready
- Weekly email digest with analysis
- Historical analysis comparison (month-over-month trends)
- Export analysis as PDF
- Share analysis with coach/trainer
- Custom analysis frequency (bi-weekly, monthly)
- Integration with wearables (Apple Health, Fitbit)

## Support

For issues or questions:
- Check application logs
- Review Supabase RLS policies
- Verify environment variables
- Test API endpoints individually
- Consult Vercel Cron documentation: https://vercel.com/docs/cron-jobs
