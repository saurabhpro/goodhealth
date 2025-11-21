-- Migration: Add user profile fields for personalized AI workout generation
-- Purpose: Store age, gender, fitness level for better AI recommendations

-- Add new columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS fitness_goals TEXT[],
  ADD COLUMN IF NOT EXISTS medical_conditions TEXT,
  ADD COLUMN IF NOT EXISTS injuries TEXT;

-- Add comment
COMMENT ON COLUMN profiles.date_of_birth IS 'User date of birth for age calculation and personalized recommendations';
COMMENT ON COLUMN profiles.gender IS 'User gender for physiological considerations';
COMMENT ON COLUMN profiles.height_cm IS 'User height in centimeters';
COMMENT ON COLUMN profiles.fitness_level IS 'Self-reported fitness level';
COMMENT ON COLUMN profiles.fitness_goals IS 'Array of fitness goals (e.g., weight_loss, muscle_gain, endurance)';
COMMENT ON COLUMN profiles.medical_conditions IS 'Medical conditions to consider';
COMMENT ON COLUMN profiles.injuries IS 'Past or current injuries to avoid aggravating';
