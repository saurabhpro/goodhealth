# Troubleshooting OAuth "Database error updating user"

## Symptom
User trying to sign up gets error:
```
OAuth error: {
  error_code: 'server_error',
  error_description: 'Database error updating user'
}
```

## Quick Diagnosis Checklist

### Step 1: Identify the Environment
- [ ] Where did the error occur?
  - Production: `https://goodhealth-three.vercel.app`
  - Preview deployment
  - Local development

### Step 2: Check Supabase Auth Configuration

**In Supabase Dashboard → Authentication → URL Configuration:**

Required redirect URLs for **production**:
```
https://goodhealth-three.vercel.app/api/auth/callback
https://goodhealth-three.vercel.app/**
```

Required redirect URLs for **development**:
```
http://localhost:3000/api/auth/callback
http://localhost:3000/**
```

### Step 3: Check Database Trigger

Run the diagnostic script in **Supabase SQL Editor**:

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy and run: `scripts/diagnose-oauth-issue.sql`
3. Check the results:
   - ✅ `handle_new_user` function should exist
   - ✅ `on_auth_user_created` trigger should be enabled
   - ⚠️ Check if any users have missing profiles

### Step 4: Check for Missing Migrations

If the trigger doesn't exist in production:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run the consolidated schema:
   ```bash
   # Copy migrations/000_consolidated_schema.sql
   # Paste in SQL Editor and run
   ```

## Common Causes & Solutions

### Cause 1: Trigger Not Deployed to Production ⭐ Most Likely

**Symptoms:**
- Works locally but fails in production
- New users created but no profile entry

**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `migrations/000_consolidated_schema.sql`
3. Look for the section starting with `CREATE OR REPLACE FUNCTION public.handle_new_user()`
4. Run just that section + the trigger creation
5. Or better: Apply migration 005 for the improved version

### Cause 2: Redirect URL Not Configured

**Symptoms:**
- Error appears immediately on redirect
- Happens on production/preview but not locally

**Solution:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add Site URL: `https://goodhealth-three.vercel.app`
3. Add Redirect URLs:
   ```
   https://goodhealth-three.vercel.app/api/auth/callback
   https://goodhealth-three.vercel.app/**
   ```
4. For preview deployments, add:
   ```
   https://*.vercel.app/api/auth/callback
   https://*.vercel.app/**
   ```

### Cause 3: Profile Already Exists (Conflict)

**Symptoms:**
- User tried signing up before
- Partial account exists

**Solution:**
Apply migration 005 which adds UPSERT logic:
```bash
# In Supabase SQL Editor, run:
# migrations/005_fix_handle_new_user_trigger.sql
```

### Cause 4: RLS Policy Issue

**Symptoms:**
- Trigger runs but fails to insert
- Permission denied errors

**Solution:**
Check RLS policies allow the trigger to insert:
```sql
-- The trigger runs with SECURITY DEFINER
-- Should have permissions, but verify:
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## Recommended Fix (Apply Migration 005)

The migration 005 fixes all these issues:
- ✅ UPSERT logic (handles existing profiles)
- ✅ Error handling (doesn't crash auth)
- ✅ OAuth metadata extraction (saves name/avatar)

**To Apply:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy `migrations/005_fix_handle_new_user_trigger.sql`
3. Paste and Run
4. Test OAuth sign-in again

## Verification Steps

After applying fix:

1. **Check function exists:**
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
   ```

2. **Check trigger is active:**
   ```sql
   SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

3. **Test sign-up:**
   - Clear browser cookies
   - Try Google OAuth sign-in
   - Check profile was created:
     ```sql
     SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;
     ```

## Environment-Specific Notes

### Production (`https://goodhealth-three.vercel.app`)
- Ensure `NEXT_PUBLIC_APP_URL` in Vercel env vars is set correctly
- Ensure Supabase redirect URLs include production domain
- Migrations must be run in Supabase Dashboard (not auto-deployed)

### Preview Deployments
- Each PR creates a new preview URL
- Add wildcard redirect: `https://*.vercel.app/**`
- Or configure specific preview URLs

### Local Development
- Use `http://localhost:3000` in redirect URLs
- Ensure `.env.local` has correct `NEXT_PUBLIC_APP_URL`

## If Issue Persists

1. **Check Supabase logs:**
   - Dashboard → Logs → Filter by "auth"
   - Look for detailed error messages

2. **Check Vercel logs:**
   ```bash
   vercel logs --prod
   ```

3. **Check browser console:**
   - Open DevTools → Console
   - Look for callback errors

4. **Enable debug mode:**
   Add to `.env.local` or Vercel env vars:
   ```
   NEXT_PUBLIC_SUPABASE_DEBUG=true
   ```

## Contact Support

If none of the above works:
- Check Supabase Dashboard → Logs for detailed errors
- Contact Supabase support with the error details
- Check GitHub issues for similar problems

## Quick Fix Summary

**For immediate resolution:**
```bash
# 1. Apply migration 005
# In Supabase SQL Editor, run:
# migrations/005_fix_handle_new_user_trigger.sql

# 2. Verify redirect URLs
# Supabase → Auth → URL Configuration
# Add: https://goodhealth-three.vercel.app/**

# 3. Test
# Clear cookies and try OAuth sign-in
```
