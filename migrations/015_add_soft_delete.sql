-- Migration: Add soft delete support across all tables
-- Purpose: Replace hard deletes with soft deletes for data recovery and audit trail

-- Add deleted_at column to all user-facing tables
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE workout_plans
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE workout_plan_sessions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE workout_templates
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE body_measurements
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE workout_selfies
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add indexes for soft delete queries (WHERE deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_workouts_deleted_at
  ON workouts(user_id, deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_goals_deleted_at
  ON goals(user_id, deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_workout_plans_deleted_at
  ON workout_plans(user_id, deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_workout_templates_deleted_at
  ON workout_templates(user_id, deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_body_measurements_deleted_at
  ON body_measurements(user_id, deleted_at) WHERE deleted_at IS NULL;

-- Add comments
COMMENT ON COLUMN workouts.deleted_at IS 'Soft delete timestamp - NULL means active, set to NOW() when deleted';
COMMENT ON COLUMN exercises.deleted_at IS 'Soft delete timestamp - NULL means active, set to NOW() when deleted';
COMMENT ON COLUMN goals.deleted_at IS 'Soft delete timestamp - NULL means active, set to NOW() when deleted';
COMMENT ON COLUMN workout_plans.deleted_at IS 'Soft delete timestamp - NULL means active, set to NOW() when deleted';
COMMENT ON COLUMN workout_plan_sessions.deleted_at IS 'Soft delete timestamp - NULL means active, set to NOW() when deleted';
COMMENT ON COLUMN workout_templates.deleted_at IS 'Soft delete timestamp - NULL means active, set to NOW() when deleted';
COMMENT ON COLUMN body_measurements.deleted_at IS 'Soft delete timestamp - NULL means active, set to NOW() when deleted';
COMMENT ON COLUMN workout_selfies.deleted_at IS 'Soft delete timestamp - NULL means active, set to NOW() when deleted';
