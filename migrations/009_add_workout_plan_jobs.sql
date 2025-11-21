-- Migration: Add workout plan generation jobs tracking
-- Purpose: Enable async AI generation with status tracking and user notification

-- Create enum for job status
CREATE TYPE workout_plan_job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create workout_plan_generation_jobs table
CREATE TABLE IF NOT EXISTS workout_plan_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status workout_plan_job_status NOT NULL DEFAULT 'pending',
  plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
  error_message TEXT,
  request_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups by user and status
CREATE INDEX idx_workout_plan_jobs_user_id ON workout_plan_generation_jobs(user_id);
CREATE INDEX idx_workout_plan_jobs_status ON workout_plan_generation_jobs(status);
CREATE INDEX idx_workout_plan_jobs_created_at ON workout_plan_generation_jobs(created_at DESC);

-- Add RLS policies
ALTER TABLE workout_plan_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view their own generation jobs"
  ON workout_plan_generation_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own jobs
CREATE POLICY "Users can create their own generation jobs"
  ON workout_plan_generation_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to update jobs (for background processing)
CREATE POLICY "Service role can update generation jobs"
  ON workout_plan_generation_jobs
  FOR UPDATE
  USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_workout_plan_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workout_plan_job_updated_at
  BEFORE UPDATE ON workout_plan_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_plan_job_updated_at();

-- Add comment
COMMENT ON TABLE workout_plan_generation_jobs IS 'Tracks async AI workout plan generation jobs';
