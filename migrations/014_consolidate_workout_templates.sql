-- Migration: Consolidate workout_templates and user_workout_templates
-- Purpose: Merge redundant template tables into single source of truth
-- Related: SCHEMA_REDUNDANCY_AUDIT.md

-- PART 1: Add missing columns from user_workout_templates to workout_templates
-- This makes workout_templates have all the enhanced metadata

ALTER TABLE workout_templates
  ADD COLUMN IF NOT EXISTS workout_type TEXT,
  ADD COLUMN IF NOT EXISTS estimated_duration INTEGER,
  ADD COLUMN IF NOT EXISTS intensity_level TEXT,
  ADD COLUMN IF NOT EXISTS difficulty_level TEXT,
  ADD COLUMN IF NOT EXISTS equipment_needed TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_muscle_groups TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add constraints for new columns
ALTER TABLE workout_templates
  ADD CONSTRAINT workout_templates_workout_type_check
    CHECK (workout_type IN ('strength', 'cardio', 'mixed', 'flexibility', 'functional') OR workout_type IS NULL);

ALTER TABLE workout_templates
  ADD CONSTRAINT workout_templates_intensity_level_check
    CHECK (intensity_level IN ('low', 'medium', 'high') OR intensity_level IS NULL);

ALTER TABLE workout_templates
  ADD CONSTRAINT workout_templates_difficulty_level_check
    CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced') OR difficulty_level IS NULL);

-- Add comments for new columns
COMMENT ON COLUMN workout_templates.workout_type IS 'Type of workout: strength, cardio, mixed, flexibility, functional';
COMMENT ON COLUMN workout_templates.estimated_duration IS 'Estimated duration in minutes';
COMMENT ON COLUMN workout_templates.intensity_level IS 'Workout intensity: low, medium, high';
COMMENT ON COLUMN workout_templates.difficulty_level IS 'Difficulty level: beginner, intermediate, advanced';
COMMENT ON COLUMN workout_templates.equipment_needed IS 'Array of equipment required for this workout';
COMMENT ON COLUMN workout_templates.target_muscle_groups IS 'Array of muscle groups targeted';
COMMENT ON COLUMN workout_templates.times_used IS 'Number of times this template has been used';
COMMENT ON COLUMN workout_templates.last_used_at IS 'Timestamp of last usage';
COMMENT ON COLUMN workout_templates.tags IS 'Searchable tags for categorization';
COMMENT ON COLUMN workout_templates.is_active IS 'Whether template is active/visible to user';

-- PART 2: Migrate data from user_workout_templates to workout_templates
-- All user templates are set as is_public=FALSE (private to user)

INSERT INTO workout_templates (
  user_id,
  name,
  description,
  exercises,
  is_public,
  workout_type,
  estimated_duration,
  intensity_level,
  difficulty_level,
  equipment_needed,
  target_muscle_groups,
  times_used,
  last_used_at,
  tags,
  is_active,
  created_at,
  updated_at
)
SELECT
  user_id,
  name,
  description,
  exercises,
  FALSE as is_public, -- User templates are private by default
  workout_type,
  estimated_duration,
  intensity_level,
  difficulty_level,
  equipment_needed,
  target_muscle_groups,
  times_used,
  last_used_at,
  '{}' as tags, -- Default empty array for tags (column doesn't exist in source)
  is_active,
  created_at,
  updated_at
FROM user_workout_templates
WHERE is_active = TRUE; -- Only migrate active templates

-- PART 3: Create index for new columns
CREATE INDEX IF NOT EXISTS idx_workout_templates_workout_type
  ON workout_templates(workout_type) WHERE workout_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_templates_difficulty
  ON workout_templates(difficulty_level) WHERE difficulty_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_templates_active_user
  ON workout_templates(user_id, is_active) WHERE is_active = TRUE AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_templates_tags
  ON workout_templates USING GIN (tags);

-- PART 4: Drop the old user_workout_templates table
-- IMPORTANT: Only run this after verifying data migration succeeded!
DROP TABLE IF EXISTS user_workout_templates;

-- PART 5: Update table comment
COMMENT ON TABLE workout_templates IS
  'Unified workout templates table. Contains both system templates (is_public=TRUE, user_id=NULL) and user-created templates (is_public=FALSE, user_id set). Consolidated from legacy user_workout_templates table.';

-- Verification query (run after migration to check)
-- SELECT
--   is_public,
--   COUNT(*) as count,
--   COUNT(DISTINCT user_id) as unique_users
-- FROM workout_templates
-- GROUP BY is_public;
