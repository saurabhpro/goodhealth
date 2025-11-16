-- Migration: Add effort_level to workouts table
-- Run this in your Supabase SQL Editor

-- Add effort_level column to workouts table
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS effort_level INTEGER;

-- Add a constraint to ensure effort_level is between 1 and 6
ALTER TABLE workouts ADD CONSTRAINT effort_level_range CHECK (effort_level >= 1 AND effort_level <= 6);

-- Add a comment to document the effort levels
COMMENT ON COLUMN workouts.effort_level IS 'Perceived effort: 1=Very Easy, 2=Easy, 3=Moderate, 4=Hard, 5=Very Hard, 6=Maximum/Impossible';

-- Update existing workouts to have a default effort level (optional)
-- UPDATE workouts SET effort_level = 3 WHERE effort_level IS NULL;
