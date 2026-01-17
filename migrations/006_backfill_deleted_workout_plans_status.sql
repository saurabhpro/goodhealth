-- Migration: Backfill status for soft-deleted workout plans
-- Purpose: Keep status consistent with deleted_at so queries on status don't
--          show soft-deleted plans as active.
UPDATE public.workout_plans
SET status = 'archived',
    updated_at = NOW()
WHERE deleted_at IS NOT NULL
    AND status = 'active';