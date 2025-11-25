-- =====================================================
-- FIX: handle_new_user trigger with better error handling
-- =====================================================
-- This migration improves the handle_new_user trigger to:
-- 1. Handle cases where profile already exists (UPSERT)
-- 2. Add better error handling
-- 3. Extract metadata from OAuth providers

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  user_avatar TEXT;
BEGIN
  -- Extract email from NEW record
  user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');

  -- Extract name from OAuth metadata if available
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name'
  );

  -- Extract avatar from OAuth metadata if available
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Use INSERT ... ON CONFLICT to handle existing profiles
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    user_email,
    user_name,
    user_avatar,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth operation
    RAISE WARNING 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS
'Automatically creates or updates user profile when a new user signs up via OAuth or email';
