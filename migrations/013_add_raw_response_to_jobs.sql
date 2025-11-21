-- Migration: Add raw AI data to workout plan generation jobs
-- Purpose: Store raw AI request/response for debugging and analysis

-- Add columns to store complete AI interaction data
ALTER TABLE workout_plan_generation_jobs
  ADD COLUMN IF NOT EXISTS ai_request_data JSONB,
  ADD COLUMN IF NOT EXISTS ai_response_data JSONB;

-- Add comments
COMMENT ON COLUMN workout_plan_generation_jobs.ai_request_data IS 'Complete AI request including profile, measurements, history for debugging';
COMMENT ON COLUMN workout_plan_generation_jobs.ai_response_data IS 'Raw AI response from Gemini for debugging and analysis';

-- Create indexes for querying (optional, for future analysis)
CREATE INDEX IF NOT EXISTS idx_workout_plan_jobs_ai_request
  ON workout_plan_generation_jobs USING GIN (ai_request_data);

CREATE INDEX IF NOT EXISTS idx_workout_plan_jobs_ai_response
  ON workout_plan_generation_jobs USING GIN (ai_response_data);
