-- Migration: Add User Workout Preferences and Custom Templates
-- Purpose: Allow users to define workout preferences and create custom templates
-- Related Issue: #43

-- 1. User Workout Preferences Table
CREATE TABLE IF NOT EXISTS user_workout_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  -- Exercise preferences
  liked_exercises TEXT[] DEFAULT '{}',
  avoided_exercises TEXT[] DEFAULT '{}',

  -- Equipment and facilities
  available_equipment TEXT[] DEFAULT '{}',
  gym_access BOOLEAN DEFAULT true,

  -- Gym locations (related to issue #17)
  gym_locations JSONB DEFAULT '[]', -- Array of {id, name, address, lat, lng, isDefault}
  default_gym_id TEXT,

  -- Session preferences
  preferred_duration INTEGER DEFAULT 60, -- minutes
  min_duration INTEGER DEFAULT 30,
  max_duration INTEGER DEFAULT 90,

  -- Focus areas
  focus_areas TEXT[] DEFAULT '{}', -- ['upper_body', 'lower_body', 'cardio', 'core', 'flexibility']

  -- Constraints and limitations
  constraints TEXT, -- Free-form text for injuries, limitations, etc.
  injuries TEXT[] DEFAULT '{}',

  -- Scheduling preferences
  preferred_days INTEGER[] DEFAULT '{}', -- [1,3,5] for Mon/Wed/Fri (0=Sunday)
  avoid_days INTEGER[] DEFAULT '{}',
  preferred_time_of_day TEXT, -- 'morning', 'afternoon', 'evening'

  -- Experience level
  fitness_level TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Custom Workout Templates Table
CREATE TABLE IF NOT EXISTS user_workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Template details
  name TEXT NOT NULL,
  description TEXT,

  -- Template content (same structure as workout_templates)
  exercises JSONB NOT NULL DEFAULT '[]',

  -- Template metadata
  estimated_duration INTEGER, -- minutes
  intensity_level TEXT CHECK (intensity_level IN ('low', 'medium', 'high')),
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),

  -- Classification
  workout_type TEXT, -- 'strength', 'cardio', 'mixed', 'flexibility'
  target_muscle_groups TEXT[] DEFAULT '{}',
  equipment_needed TEXT[] DEFAULT '{}',

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- User feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  notes TEXT,

  -- Visibility
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_workout_templates_user_id
  ON user_workout_templates(user_id);

CREATE INDEX IF NOT EXISTS idx_user_workout_templates_active
  ON user_workout_templates(user_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_workout_templates_workout_type
  ON user_workout_templates(user_id, workout_type);

-- 4. Row Level Security (RLS)

-- Enable RLS
ALTER TABLE user_workout_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workout_templates ENABLE ROW LEVEL SECURITY;

-- Preferences: Users can only access their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_workout_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_workout_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_workout_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_workout_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Templates: Users can only access their own templates
CREATE POLICY "Users can view own templates"
  ON user_workout_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON user_workout_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON user_workout_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON user_workout_templates FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_workout_preferences_updated_at
  BEFORE UPDATE ON user_workout_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_workout_templates_updated_at
  BEFORE UPDATE ON user_workout_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Comments for documentation
COMMENT ON TABLE user_workout_preferences IS 'Stores user workout preferences including liked/avoided exercises, equipment, and constraints';
COMMENT ON TABLE user_workout_templates IS 'User-created custom workout templates that can be used in plan generation';

COMMENT ON COLUMN user_workout_preferences.liked_exercises IS 'Exercise names the user prefers';
COMMENT ON COLUMN user_workout_preferences.avoided_exercises IS 'Exercise names the user wants to avoid';
COMMENT ON COLUMN user_workout_preferences.available_equipment IS 'Equipment user has access to';
COMMENT ON COLUMN user_workout_preferences.constraints IS 'Free-form text describing injuries, limitations, or special requirements';
COMMENT ON COLUMN user_workout_templates.exercises IS 'JSONB array of exercises with sets, reps, etc.';
COMMENT ON COLUMN user_workout_templates.times_used IS 'Counter for how many times this template has been used in a plan';
