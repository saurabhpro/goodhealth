-- Fix RLS policies for workout_templates to allow access to public templates
-- Date: 2025-01-21

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own workout templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can view public workout templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can create their own workout templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can update their own workout templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can delete their own workout templates" ON workout_templates;

-- Enable RLS on workout_templates
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

-- Create new policies that allow access to public templates

-- SELECT: Users can see their own templates AND all public templates
CREATE POLICY "Users can view their own and public workout templates"
  ON workout_templates FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_public = true
  );

-- INSERT: Users can only create templates for themselves
CREATE POLICY "Users can create their own workout templates"
  ON workout_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own templates
CREATE POLICY "Users can update their own workout templates"
  ON workout_templates FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own templates
CREATE POLICY "Users can delete their own workout templates"
  ON workout_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment explaining the policy
COMMENT ON POLICY "Users can view their own and public workout templates" ON workout_templates IS
'Allows users to view their own workout templates and all public system templates';
