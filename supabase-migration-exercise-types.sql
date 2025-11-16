-- Migration: Add fields for different exercise types (cardio, strength, functional)
-- Run this in your Supabase SQL Editor

-- Make sets nullable (not all exercises have sets)
ALTER TABLE exercises ALTER COLUMN sets DROP NOT NULL;

-- Add exercise_type field
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS exercise_type TEXT DEFAULT 'strength' CHECK (exercise_type IN ('strength', 'cardio', 'functional'));

-- Add cardio-specific fields
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS distance DECIMAL(10, 2);
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS distance_unit TEXT DEFAULT 'km' CHECK (distance_unit IN ('km', 'miles'));
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS speed DECIMAL(10, 2);
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS calories INTEGER;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS resistance_level INTEGER;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS incline DECIMAL(10, 2);

-- Add comments
COMMENT ON COLUMN exercises.exercise_type IS 'Type of exercise: strength, cardio, or functional';
COMMENT ON COLUMN exercises.duration_minutes IS 'Duration for cardio exercises';
COMMENT ON COLUMN exercises.distance IS 'Distance covered for cardio exercises';
COMMENT ON COLUMN exercises.speed IS 'Speed/pace for cardio exercises';
COMMENT ON COLUMN exercises.resistance_level IS 'Resistance level (1-20) for cardio machines';
COMMENT ON COLUMN exercises.incline IS 'Incline percentage for treadmill/elliptical';
