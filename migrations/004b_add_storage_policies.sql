-- Storage bucket policies for workout-selfies
-- Run this after creating the 'workout-selfies' bucket in Supabase Storage

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload selfies to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workout-selfies'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read/select their own files
CREATE POLICY "Users can view their own selfies"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'workout-selfies'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own selfies"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'workout-selfies'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own selfies"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'workout-selfies'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
