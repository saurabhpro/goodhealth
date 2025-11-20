-- Workout Planning System - Part 2: workout_plan_sessions table
-- This migration creates the individual workout sessions table
-- Issue: #15

-- Create workout_plan_sessions table
CREATE TABLE workout_plan_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE NOT NULL,

  -- Schedule information
  week_number INTEGER NOT NULL CHECK (week_number >= 1),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  day_name TEXT NOT NULL CHECK (day_name IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  session_order INTEGER NOT NULL DEFAULT 1 CHECK (session_order >= 1), -- Order within the day (for multiple workouts per day)

  -- Workout information
  workout_template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  workout_name TEXT NOT NULL,
  workout_type TEXT NOT NULL CHECK (workout_type IN ('strength', 'cardio', 'rest', 'active_recovery', 'mixed')),
  estimated_duration INTEGER CHECK (estimated_duration > 0), -- minutes

  -- Exercise details (JSON array of exercises with sets/reps/weight targets)
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Focus areas
  muscle_groups TEXT[] DEFAULT '{}', -- ['chest', 'triceps', 'shoulders']
  intensity_level TEXT CHECK (intensity_level IN ('low', 'moderate', 'high', 'max')),

  -- Tracking
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'skipped', 'modified')),
  completed_workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Constraints
  UNIQUE(plan_id, week_number, day_of_week, session_order),
  CHECK (completed_at IS NULL OR status = 'completed'),
  CHECK (completed_workout_id IS NULL OR status = 'completed')
);

-- Create indexes for better query performance
CREATE INDEX workout_plan_sessions_plan_id_idx ON workout_plan_sessions(plan_id);
CREATE INDEX workout_plan_sessions_week_day_idx ON workout_plan_sessions(week_number, day_of_week);
CREATE INDEX workout_plan_sessions_status_idx ON workout_plan_sessions(status);
CREATE INDEX workout_plan_sessions_completed_workout_id_idx ON workout_plan_sessions(completed_workout_id);
CREATE INDEX workout_plan_sessions_plan_week_idx ON workout_plan_sessions(plan_id, week_number);

-- Enable Row Level Security (RLS)
ALTER TABLE workout_plan_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view sessions from their own plans
CREATE POLICY "Users can view sessions from their own plans"
  ON workout_plan_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_plan_sessions.plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );

-- Users can create sessions in their own plans
CREATE POLICY "Users can create sessions in their own plans"
  ON workout_plan_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_plan_sessions.plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );

-- Users can update sessions in their own plans
CREATE POLICY "Users can update sessions in their own plans"
  ON workout_plan_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_plan_sessions.plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );

-- Users can delete sessions from their own plans
CREATE POLICY "Users can delete sessions from their own plans"
  ON workout_plan_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_plan_sessions.plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE workout_plan_sessions IS 'Stores individual workout sessions within workout plans';
COMMENT ON COLUMN workout_plan_sessions.week_number IS 'Week number in the plan (1-based)';
COMMENT ON COLUMN workout_plan_sessions.day_of_week IS 'Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN workout_plan_sessions.session_order IS 'Order of session within the day (for multiple workouts per day)';
COMMENT ON COLUMN workout_plan_sessions.workout_type IS 'Type: strength, cardio, rest, active_recovery, or mixed';
COMMENT ON COLUMN workout_plan_sessions.exercises IS 'JSON array of exercises with sets/reps/weight targets';
COMMENT ON COLUMN workout_plan_sessions.muscle_groups IS 'Array of muscle groups targeted';
COMMENT ON COLUMN workout_plan_sessions.status IS 'Status: scheduled, completed, skipped, or modified';
COMMENT ON COLUMN workout_plan_sessions.completed_workout_id IS 'Reference to actual completed workout (if status=completed)';
