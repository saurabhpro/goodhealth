# Authentication Setup Guide

## The Problem

You're seeing "Authentication Error" when trying to sign up or sign in (including Google OAuth). This is because the redirect URLs in your application don't match what's configured in Supabase.

## Root Cause

The commit [8e499af](https://github.com/saurabhpro/goodhealth/commit/8e499afabb1035c865bddceccc51dae877bfbdce) changed the authentication flow to use `NEXT_PUBLIC_APP_URL` environment variable for consistent redirect URLs. However, this requires proper configuration in both your environment variables and Supabase.

## Solution

### Step 1: Configure Supabase Redirect URLs

1. Go to your Supabase project: https://app.supabase.com/project/bjbkqighhdqefzsehsvb
2. Navigate to **Authentication** → **URL Configuration**
3. Add the following URLs to the **Redirect URLs** (whitelist):

   **For Production:**
   ```
   https://goodhealth-three.vercel.app/api/auth/callback
   https://goodhealth-three.vercel.app/auth/update-password
   ```

   **For Development (if testing locally):**
   ```
   http://localhost:3000/api/auth/callback
   http://localhost:3000/auth/update-password
   ```

   **Important:** Make sure there are no trailing slashes!

4. Set the **Site URL** to:
   ```
   https://goodhealth-three.vercel.app
   ```

### Step 2: Configure Vercel Environment Variables

1. Go to your Vercel project: https://vercel.com/saurabhpro/goodhealth
2. Navigate to **Settings** → **Environment Variables**
3. Add/update the following variables:

   ```
   Name: APP_URL
   Value: https://goodhealth-three.vercel.app

   Name: NEXT_PUBLIC_APP_URL
   Value: https://goodhealth-three.vercel.app
   ```

   **Important:**
   - No trailing slash
   - Must be `https://` not `http://`
   - Must match your production domain exactly
   - `APP_URL` is used on the server-side (preferred)
   - `NEXT_PUBLIC_APP_URL` is used on the client-side as fallback

4. Click **Save**
5. **Redeploy** your application for the changes to take effect

### Step 3: Configure Google OAuth (if using)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to your project → **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   ```
   https://bjbkqighhdqefzsehsvb.supabase.co/auth/v1/callback
   ```

5. Save changes

### Step 4: Test the Fix

1. Clear your browser cache and cookies
2. Try signing up with email/password:
   - Go to https://goodhealth-three.vercel.app/signup
   - Enter your details
   - Check your email for the confirmation link
   - Click the link (should redirect to dashboard)

3. Try signing in with Google:
   - Go to https://goodhealth-three.vercel.app/login
   - Click "Sign in with Google"
   - Complete Google authentication
   - Should redirect to dashboard

## Common Errors and Solutions

### Error: "pkce_verifier_invalid" or "invalid_pkce_code_verifier"

**Cause:** The authentication session expired or the redirect URL mismatch caused the PKCE flow to fail.

**Solution:**
- Ensure both `APP_URL` and `NEXT_PUBLIC_APP_URL` in Vercel match your production URL exactly
- Ensure all redirect URLs are whitelisted in Supabase
- Try signing in again (don't use old email links)

### Error: "otp_expired"

**Cause:** The email confirmation link expired (usually valid for 1 hour).

**Solution:**
- Request a new sign-up or password reset
- Complete the process within 1 hour

### Error: "missing_code"

**Cause:** The authentication callback was called without a code parameter.

**Solution:**
- This usually means the OAuth flow was interrupted
- Check that your redirect URLs are correct
- Try the authentication flow again

### Email Links Not Working

**Cause:** The `emailRedirectTo` parameter doesn't match Supabase's whitelist.

**Solution:**
- Ensure both `APP_URL` and `NEXT_PUBLIC_APP_URL` are set in Vercel environment variables
- Ensure the callback URL is whitelisted in Supabase
- Redeploy after making changes

## Verification Checklist

- [ ] `APP_URL` is set in Vercel environment variables (recommended for server-side)
- [ ] `NEXT_PUBLIC_APP_URL` is set in Vercel environment variables (fallback for client-side)
- [ ] URLs match your production domain exactly (no trailing slash)
- [ ] Production callback URL is whitelisted in Supabase
- [ ] Site URL is set in Supabase to your production domain
- [ ] Google OAuth redirect URI is configured (if using Google sign-in)
- [ ] Application has been redeployed after making changes
- [ ] Browser cache and cookies cleared before testing
- [ ] Successfully tested email/password sign-up
- [ ] Successfully tested Google OAuth sign-in (if applicable)

## Local Development

For local development, your `.env.local` should have:

```bash
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

And ensure `http://localhost:3000/api/auth/callback` is whitelisted in Supabase.

## Debugging

If you're still having issues, check the Vercel function logs:

1. Go to Vercel project → **Deployments**
2. Click on the latest deployment
3. Click **Functions**
4. Look for `/api/auth/callback` logs
5. The error logs will now show detailed error messages to help diagnose the issue

The error page will also now display the specific error message to help you understand what went wrong.
