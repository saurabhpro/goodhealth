-- Migration: Add status field to goals table
-- Purpose: Track goal lifecycle (active, completed, archived)
-- Completed goals: progress >= 100%
-- Archived goals: target_date passed without achievement

-- Add status column with check constraint
ALTER TABLE public.goals
ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
CHECK (status IN ('active', 'completed', 'archived'));

-- Create index for filtering by status
CREATE INDEX idx_goals_status ON public.goals(status);

-- Create index for efficient querying of active goals
CREATE INDEX idx_goals_user_status ON public.goals(user_id, status) WHERE deleted_at IS NULL;

-- Update existing goals based on current achieved status and target date
-- Priority: completed > archived > active

-- 1. Mark achieved goals as completed (highest priority)
UPDATE public.goals
SET status = 'completed'
WHERE achieved = true;

-- 2. Mark goals with past target dates (and not achieved) as archived
UPDATE public.goals
SET status = 'archived'
WHERE achieved = false
  AND target_date IS NOT NULL
  AND target_date < CURRENT_DATE;

-- 3. All remaining goals stay as 'active' (default)

-- Comment on the column
COMMENT ON COLUMN public.goals.status IS 'Goal lifecycle status: active (in progress), completed (achieved target), archived (target date passed without achievement)';
