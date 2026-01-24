# Migration 005: Fix handle_new_user Trigger

## Problem

OAuth authentication was failing with error:
```
OAuth error: {
  error_code: 'server_error',
  error_description: 'Database error updating user'
}
```

## Root Cause

The original `handle_new_user()` trigger function had several issues:

1. **No conflict handling**: If a user profile already existed (e.g., from a previous failed attempt), the INSERT would fail
2. **No error handling**: Any database error would bubble up and fail the entire OAuth flow
3. **Missing OAuth metadata**: Google OAuth provides additional user data (name, avatar) that wasn't being extracted

## Solution

The updated trigger function now:

1. **Uses UPSERT pattern**: `INSERT ... ON CONFLICT DO UPDATE` to handle existing profiles
2. **Extracts OAuth metadata**: Pulls `full_name` and `avatar_url` from Google OAuth provider data
3. **Graceful error handling**: Catches exceptions and logs warnings without failing auth
4. **Handles edge cases**: Properly extracts email from both direct field and metadata

## Changes

- Enhanced `handle_new_user()` function with:
  - OAuth metadata extraction from `raw_user_meta_data`
  - UPSERT logic with `ON CONFLICT`
  - Exception handling with `EXCEPTION WHEN OTHERS`
  - Better field coalescing

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `005_fix_handle_new_user_trigger.sql`
4. Paste and **Run** the migration

### Option 2: Supabase CLI
```bash
# Link to your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
npx supabase db push

# Or run directly
psql YOUR_DATABASE_URL -f migrations/005_fix_handle_new_user_trigger.sql
```

## Verification

After applying the migration, verify it worked:

```sql
-- Check the function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check the trigger exists
SELECT tgname, tgrelid::regclass, tgfoid::regproc
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

## Testing

1. Try signing in with Google OAuth
2. Check that profile is created/updated successfully
3. Verify user data is populated:
   ```sql
   SELECT id, email, full_name, avatar_url, created_at
   FROM profiles
   ORDER BY created_at DESC
   LIMIT 5;
   ```

## Rollback

If needed, you can rollback to the simple version:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Impact

- ✅ Fixes OAuth authentication failures
- ✅ Handles duplicate profile creation attempts
- ✅ Populates user profile with Google data
- ✅ Prevents auth failures from database errors
- ✅ Better error logging for debugging

## Related Issues

- GitHub Issue: TBD
- Error: "Database error updating user" during OAuth callback
