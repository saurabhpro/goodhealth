-- Migration: Backfill status for soft-deleted goals
-- Purpose: Keep status consistent with deleted_at so active filters are correct.

UPDATE public.goals
SET status = 'archived',
    updated_at = NOW()
WHERE deleted_at IS NOT NULL
  AND status = 'active';
