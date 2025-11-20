-- Workout Planning System - Part 1: workout_plans table
-- This migration creates the master workout plans table
-- Issue: #15

-- Create workout_plans table
CREATE TABLE workout_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Plan metadata
  name TEXT NOT NULL,
  description TEXT,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weight_loss', 'muscle_building', 'endurance', 'general_fitness')),

  -- Plan configuration
  weeks_duration INTEGER NOT NULL DEFAULT 4 CHECK (weeks_duration BETWEEN 1 AND 12),
  workouts_per_week INTEGER NOT NULL DEFAULT 4 CHECK (workouts_per_week BETWEEN 1 AND 7),
  avg_workout_duration INTEGER CHECK (avg_workout_duration > 0), -- minutes

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Constraints
  CHECK (completed_at IS NULL OR completed_at >= started_at),
  CHECK (started_at IS NULL OR status != 'draft')
);

-- Create indexes for better query performance
CREATE INDEX workout_plans_user_id_idx ON workout_plans(user_id);
CREATE INDEX workout_plans_status_idx ON workout_plans(status);
CREATE INDEX workout_plans_goal_id_idx ON workout_plans(goal_id);
CREATE INDEX workout_plans_user_status_idx ON workout_plans(user_id, status);

-- Enable Row Level Security (RLS)
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own workout plans"
  ON workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout plans"
  ON workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout plans"
  ON workout_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout plans"
  ON workout_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE workout_plans IS 'Stores master workout plan information for AI-powered planning system';
COMMENT ON COLUMN workout_plans.goal_type IS 'Type of fitness goal: weight_loss, muscle_building, endurance, or general_fitness';
COMMENT ON COLUMN workout_plans.weeks_duration IS 'Total duration of the plan in weeks (1-12)';
COMMENT ON COLUMN workout_plans.workouts_per_week IS 'Target number of workouts per week (1-7)';
COMMENT ON COLUMN workout_plans.status IS 'Current status: draft (being edited), active (in use), completed (finished), archived (saved for reference)';
