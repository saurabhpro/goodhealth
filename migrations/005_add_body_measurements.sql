-- Migration: Add body measurements tracking
-- This allows users to track various body metrics over time for progress monitoring

CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Weight and body composition
  weight DECIMAL(5, 2), -- in kg
  body_fat_percentage DECIMAL(4, 2), -- percentage
  muscle_mass DECIMAL(5, 2), -- in kg
  bone_mass DECIMAL(4, 2), -- in kg
  water_percentage DECIMAL(4, 2), -- percentage

  -- Body measurements (in cm)
  height DECIMAL(5, 2), -- in cm
  neck DECIMAL(4, 1),
  shoulders DECIMAL(5, 1),
  chest DECIMAL(5, 1),
  waist DECIMAL(5, 1),
  hips DECIMAL(5, 1),
  bicep_left DECIMAL(4, 1),
  bicep_right DECIMAL(4, 1),
  forearm_left DECIMAL(4, 1),
  forearm_right DECIMAL(4, 1),
  thigh_left DECIMAL(5, 1),
  thigh_right DECIMAL(5, 1),
  calf_left DECIMAL(4, 1),
  calf_right DECIMAL(4, 1),

  -- Smart scale metrics
  bmr INTEGER, -- Basal Metabolic Rate in calories
  metabolic_age INTEGER, -- in years
  visceral_fat INTEGER, -- rating (1-59)
  protein_percentage DECIMAL(4, 2), -- percentage

  -- Additional tracking
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user and date
CREATE INDEX idx_body_measurements_user_date ON body_measurements(user_id, measured_at DESC);

-- Enable Row Level Security
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own measurements
CREATE POLICY "Users can view their own measurements"
  ON body_measurements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own measurements
CREATE POLICY "Users can insert their own measurements"
  ON body_measurements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own measurements
CREATE POLICY "Users can update their own measurements"
  ON body_measurements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own measurements
CREATE POLICY "Users can delete their own measurements"
  ON body_measurements
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE body_measurements IS 'Stores user body measurements over time for progress tracking';
COMMENT ON COLUMN body_measurements.weight IS 'Body weight in kilograms';
COMMENT ON COLUMN body_measurements.body_fat_percentage IS 'Body fat as percentage of total weight';
COMMENT ON COLUMN body_measurements.muscle_mass IS 'Muscle mass in kilograms';
COMMENT ON COLUMN body_measurements.bmr IS 'Basal Metabolic Rate - calories burned at rest';
COMMENT ON COLUMN body_measurements.metabolic_age IS 'Metabolic age as calculated by smart scales';
COMMENT ON COLUMN body_measurements.visceral_fat IS 'Visceral fat rating (1-59, lower is better)';
