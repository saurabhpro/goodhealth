-- Migration: Add user preferences to profiles table
-- Description: Adds theme, accent_theme, weight_unit, distance_unit, and notification preferences

-- Add new columns to profiles table for user preferences
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
ADD COLUMN IF NOT EXISTS accent_theme TEXT DEFAULT 'default' CHECK (accent_theme IN ('default', 'blue', 'gray', 'red', 'green')),
ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
ADD COLUMN IF NOT EXISTS distance_unit TEXT DEFAULT 'km' CHECK (distance_unit IN ('km', 'miles')),
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"workout_reminders": false, "goal_progress": false, "weekly_summary": false}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.theme IS 'User preferred theme: light, dark, or system';
COMMENT ON COLUMN public.profiles.accent_theme IS 'User preferred accent color theme';
COMMENT ON COLUMN public.profiles.weight_unit IS 'Preferred unit for weight measurements';
COMMENT ON COLUMN public.profiles.distance_unit IS 'Preferred unit for distance measurements';
COMMENT ON COLUMN public.profiles.notification_preferences IS 'User notification preferences stored as JSON';

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
