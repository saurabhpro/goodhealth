-- Migration: Add workout selfies support
-- This migration adds support for uploading selfies/photos with workouts
-- LIMIT: ONE selfie per workout

-- Create workout_selfies table
CREATE TABLE IF NOT EXISTS workout_selfies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  caption TEXT,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS workout_selfies_workout_id_idx ON workout_selfies(workout_id);
CREATE INDEX IF NOT EXISTS workout_selfies_user_id_idx ON workout_selfies(user_id);
CREATE INDEX IF NOT EXISTS workout_selfies_taken_at_idx ON workout_selfies(taken_at);

-- Enable Row Level Security (RLS)
ALTER TABLE workout_selfies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_selfies
CREATE POLICY "Users can view selfies from their workouts"
  ON workout_selfies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload selfies to their workouts"
  ON workout_selfies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_selfies.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their workout selfies"
  ON workout_selfies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their workout selfies"
  ON workout_selfies FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for workout selfies
-- NOTE: This must be done manually in Supabase Dashboard > Storage
--
-- Bucket Configuration:
--   Name: workout-selfies
--   Public: false (private, authenticated users only)
--   File size limit: 5MB
--   Allowed MIME types: image/jpeg, image/png, image/webp, image/heic
--
-- Storage Policies (create these in Supabase Dashboard):
--   1. Allow users to upload to their own folder
--      Operation: INSERT
--      Policy definition: bucket_id = 'workout-selfies' AND (storage.foldername(name))[1] = auth.uid()::text
--
--   2. Allow users to read their own files
--      Operation: SELECT
--      Policy definition: bucket_id = 'workout-selfies' AND (storage.foldername(name))[1] = auth.uid()::text
--
--   3. Allow users to update their own files
--      Operation: UPDATE
--      Policy definition: bucket_id = 'workout-selfies' AND (storage.foldername(name))[1] = auth.uid()::text
--
--   4. Allow users to delete their own files
--      Operation: DELETE
--      Policy definition: bucket_id = 'workout-selfies' AND (storage.foldername(name))[1] = auth.uid()::text
--
-- File structure: workout-selfies/{user_id}/{workout_id}/{timestamp}_{filename}
