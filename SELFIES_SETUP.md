# Workout Selfies - Supabase Setup Guide

This guide walks you through setting up the Supabase storage and policies for workout selfies.

## Prerequisites

- Supabase project created
- Database migrations 001-004 already run
- Authenticated access to Supabase Dashboard

## Step 1: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **Create Bucket** or **New Bucket**
3. Configure the bucket:
   - **Name**: `workout-selfies`
   - **Public**: ❌ **UNCHECKED** (must be private)
   - **File size limit**: `5242880` (5MB in bytes)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/heic`

4. Click **Create Bucket**

## Step 2: Enable RLS on Storage

1. In Supabase Dashboard, go to **Storage** → **Policies**
2. Make sure RLS is enabled for the `workout-selfies` bucket

## Step 3: Run Storage Policies Migration

Option A: **Using SQL Editor** (Recommended)
1. Go to **SQL Editor** in Supabase Dashboard
2. Open the file `migrations/004b_add_storage_policies.sql`
3. Copy and paste the entire content into the SQL editor
4. Click **Run**

Option B: **Using Supabase CLI**
```bash
supabase db push --include-all
```

## Step 4: Verify Setup

### Test Upload
Try uploading a workout selfie from your app. It should:
- ✅ Upload successfully
- ✅ Create record in `workout_selfies` table
- ✅ Store file in format: `{user_id}/{workout_id}/{timestamp}_{filename}`

### Test Download/View
Try viewing the selfie:
- ✅ Image should load in workout detail page
- ✅ Next.js image optimization should work
- ✅ Only the owner should be able to view

### Check Console Logs
If images fail to load, check your dev server logs for:
```
[Image Proxy] Requesting file: ...
[Image Proxy] User authenticated: ...
[Image Proxy] Storage error: ...
```

## Troubleshooting

### Images Not Loading

**Error: "Unauthorized" (401)**
- Check if user is logged in
- Verify auth cookie is being sent with request

**Error: "Image not found" (404)**
- Check if storage policies are created (Step 3)
- Verify file path structure: `{user_id}/{workout_id}/{filename}`
- Check that the bucket name is exactly `workout-selfies`
- Verify RLS is enabled on storage.objects table

**Error: "The requested resource isn't a valid image"**
- Check server logs for detailed error from Supabase
- Verify the file actually exists in Supabase Storage
- Check MIME type is allowed
- Ensure file isn't corrupted

### Storage Policies Not Working

Run this query to check existing policies:
```sql
SELECT * FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';
```

Expected policies:
- `Users can upload selfies to their own folder`
- `Users can view their own selfies`
- `Users can update their own selfies`
- `Users can delete their own selfies`

### Reset Storage (Development Only)

⚠️ **WARNING: This deletes all files!**

```sql
-- Delete all files from bucket
DELETE FROM storage.objects WHERE bucket_id = 'workout-selfies';

-- Delete all selfie records
DELETE FROM workout_selfies;
```

## File Structure

```
workout-selfies/
├── {user_id_1}/
│   ├── {workout_id_1}/
│   │   └── 1234567890_filename.jpg
│   └── {workout_id_2}/
│       └── 1234567891_photo.png
└── {user_id_2}/
    └── {workout_id_3}/
        └── 1234567892_selfie.jpg
```

## Security Notes

- ✅ All images are **private** - only the owner can access
- ✅ Authentication required for all operations
- ✅ RLS policies enforce user isolation
- ✅ File paths validated to prevent directory traversal
- ✅ Maximum file size enforced (5MB)
- ✅ MIME type validation on upload

## API Routes

- `POST /lib/selfies/actions.ts::uploadWorkoutSelfie` - Upload selfie
- `GET /api/images/[...path]` - Proxy for serving images (enables Next.js optimization)
- `DELETE /lib/selfies/actions.ts::deleteWorkoutSelfie` - Delete selfie

## Migration Files

1. `004_add_workout_selfies.sql` - Database table and RLS policies
2. `004b_add_storage_policies.sql` - Storage bucket policies
