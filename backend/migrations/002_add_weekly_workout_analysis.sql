-- Migration: Add weekly workout analysis feature
-- Description: Store AI-generated weekly workout analysis and progress insights for users
-- Created: 2025-11-22

-- Table: weekly_workout_analysis
-- Purpose: Store weekly analysis of workout progress, insights, and recommendations
CREATE TABLE IF NOT EXISTS weekly_workout_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,

  -- Analysis data
  analysis_summary TEXT NOT NULL,
  key_achievements TEXT[],
  areas_for_improvement TEXT[],
  weekly_stats JSONB NOT NULL DEFAULT '{}', -- { workouts_completed, total_duration, avg_effort, calories_burned, etc. }

  -- Goal progress
  goal_progress JSONB NOT NULL DEFAULT '{}', -- { goal_id: { current_value, progress_percentage, on_track: boolean } }

  -- Body measurements comparison
  measurements_comparison JSONB DEFAULT NULL, -- { weight_change, body_fat_change, muscle_mass_change, etc. }

  -- AI recommendations
  recommendations TEXT[],
  motivational_quote TEXT NOT NULL,

  -- Status tracking
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  viewed_at TIMESTAMPTZ DEFAULT NULL,
  is_dismissed BOOLEAN DEFAULT FALSE,

  deleted_at TIMESTAMPTZ DEFAULT NULL,

  CONSTRAINT unique_user_week UNIQUE (user_id, week_start_date)
);

-- Indexes
CREATE INDEX idx_weekly_analysis_user_date ON weekly_workout_analysis(user_id, week_start_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_weekly_analysis_generated ON weekly_workout_analysis(generated_at DESC) WHERE deleted_at IS NULL AND is_dismissed = FALSE;
CREATE INDEX idx_weekly_analysis_user_unviewed ON weekly_workout_analysis(user_id, viewed_at) WHERE deleted_at IS NULL AND viewed_at IS NULL;

-- Row Level Security (RLS)
ALTER TABLE weekly_workout_analysis ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own analysis
CREATE POLICY "Users can view own weekly analysis"
  ON weekly_workout_analysis
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own analysis (for manual trigger)
CREATE POLICY "Users can insert own weekly analysis"
  ON weekly_workout_analysis
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own analysis (mark as viewed, dismissed)
CREATE POLICY "Users can update own weekly analysis"
  ON weekly_workout_analysis
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete (soft) their own analysis
CREATE POLICY "Users can delete own weekly analysis"
  ON weekly_workout_analysis
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE weekly_workout_analysis IS 'Stores AI-generated weekly workout analysis and progress insights for users';
COMMENT ON COLUMN weekly_workout_analysis.week_start_date IS 'Monday of the analysis week';
COMMENT ON COLUMN weekly_workout_analysis.week_end_date IS 'Sunday of the analysis week';
COMMENT ON COLUMN weekly_workout_analysis.analysis_summary IS 'AI-generated summary of the week''s workout performance';
COMMENT ON COLUMN weekly_workout_analysis.weekly_stats IS 'JSON object containing workout statistics for the week';
COMMENT ON COLUMN weekly_workout_analysis.goal_progress IS 'JSON object mapping goal IDs to their progress during the week';
COMMENT ON COLUMN weekly_workout_analysis.measurements_comparison IS 'Comparison of body measurements from week start to week end';
COMMENT ON COLUMN weekly_workout_analysis.viewed_at IS 'Timestamp when user first viewed the analysis';
COMMENT ON COLUMN weekly_workout_analysis.is_dismissed IS 'Whether user has dismissed/acknowledged the analysis';
