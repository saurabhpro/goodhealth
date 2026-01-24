-- Migration: Add start date support to workout plans
-- Date: 2025-11-21
-- Description: Adds start_date to workout_plans and actual_date to workout_plan_sessions
--              This allows users to schedule plans to start on a specific date

BEGIN;

-- Add start_date column to workout_plans
ALTER TABLE workout_plans
ADD COLUMN IF NOT EXISTS start_date DATE;

COMMENT ON COLUMN workout_plans.start_date IS 'The date when the workout plan should start. If NULL, plan is not scheduled yet.';

-- Add actual_date column to workout_plan_sessions
ALTER TABLE workout_plan_sessions
ADD COLUMN IF NOT EXISTS actual_date DATE;

COMMENT ON COLUMN workout_plan_sessions.actual_date IS 'The actual calendar date for this workout session, calculated from plan start_date + week/day offsets';

-- Add index for querying sessions by actual date
CREATE INDEX IF NOT EXISTS idx_workout_plan_sessions_actual_date
ON workout_plan_sessions(plan_id, actual_date)
WHERE deleted_at IS NULL;

-- Add index for querying plans by start date
CREATE INDEX IF NOT EXISTS idx_workout_plans_start_date
ON workout_plans(user_id, start_date)
WHERE deleted_at IS NULL;

COMMIT;

-- Migration Notes:
-- 1. start_date is optional - NULL means plan not scheduled yet
-- 2. actual_date is calculated as: start_date + ((week_number - 1) * 7 days) + day_offset
--    where day_offset is calculated from day_of_week
-- 3. Existing plans will have NULL start_date until user schedules them
-- 4. UI should allow setting/updating start_date after plan creation
