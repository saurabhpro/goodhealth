-- =====================================================
-- DIAGNOSTIC: Check OAuth/Auth Configuration
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if handle_new_user function exists
SELECT
  proname as function_name,
  prosrc as source_code,
  pg_get_functiondef(oid) as full_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 2. Check if trigger exists and is enabled
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgfoid::regproc as function_name,
  tgenabled as enabled,
  tgtype as trigger_type
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 3. Check recent auth.users entries (without sensitive data)
SELECT
  id,
  email,
  created_at,
  confirmed_at,
  last_sign_in_at,
  raw_app_meta_data->>'provider' as auth_provider
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check profiles table for orphaned or missing profiles
SELECT
  u.id,
  u.email as auth_email,
  p.email as profile_email,
  p.created_at as profile_created,
  u.created_at as user_created,
  CASE
    WHEN p.id IS NULL THEN '❌ MISSING PROFILE'
    WHEN u.email != p.email THEN '⚠️  EMAIL MISMATCH'
    ELSE '✅ OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- 5. Check for duplicate profiles (shouldn't exist)
SELECT
  email,
  COUNT(*) as count
FROM public.profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- 6. Check profiles table constraints
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- 7. Check RLS policies on profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
