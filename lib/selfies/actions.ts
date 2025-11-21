'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const BUCKET_NAME = 'workout-selfies'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])

interface UploadSelfieResult {
  success?: boolean
  selfieId?: string
  error?: string
}

/**
 * Upload a selfie for a workout (replaces existing selfie if one exists)
 * Only ONE selfie is allowed per workout
 * @param workoutId - The workout ID to attach the selfie to
 * @param file - The file to upload
 * @param caption - Optional caption for the selfie
 */
export async function uploadWorkoutSelfie(
  workoutId: string,
  file: File,
  caption?: string
): Promise<UploadSelfieResult> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Validate file
  if (!file) {
    return { error: 'No file provided' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: 'File size must be less than 5MB' }
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { error: 'File must be a valid image (JPEG, PNG, WebP, or HEIC)' }
  }

  // Verify workout belongs to user
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .select('id')
    .eq('id', workoutId)
    .eq('user_id', user.id)
    .single()

  if (workoutError || !workout) {
    return { error: 'Workout not found or access denied' }
  }

  // Check if a selfie already exists for this workout (limit: 1 per workout)
  const { data: existingSelfies, error: checkError } = await supabase
    .from('workout_selfies')
    .select('id, file_path')
    .eq('workout_id', workoutId)
    .eq('user_id', user.id)

  if (checkError) {
    console.error('Error checking existing selfies:', checkError)
    return { error: 'Failed to check existing selfies' }
  }

  // If a selfie already exists, delete it first (replace old with new)
  if (existingSelfies && existingSelfies.length > 0) {
    for (const existingSelfie of existingSelfies) {
      // Keep file in storage but soft delete from database (for recovery)
      // Soft delete from database
      await supabase
        .from('workout_selfies')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', existingSelfie.id)
        .is('deleted_at', null)
    }
  }

  try {
    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const filePath = `${user.id}/${workoutId}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: `Failed to upload file: ${uploadError.message}` }
    }

    // Create database record
    const { data: selfie, error: dbError } = await supabase
      .from('workout_selfies')
      .insert({
        workout_id: workoutId,
        user_id: user.id,
        file_path: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        caption: caption || null,
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from(BUCKET_NAME).remove([filePath])
      console.error('Database error:', dbError)
      return { error: `Failed to save selfie record: ${dbError.message}` }
    }

    revalidatePath('/workouts')
    revalidatePath(`/workouts/${workoutId}`)

    return { success: true, selfieId: selfie.id }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get all selfies for a workout (should only be 1)
 */
export async function getWorkoutSelfies(workoutId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { selfies: [], error: 'Not authenticated' }
  }

  const { data: selfies, error } = await supabase
    .from('workout_selfies')
    .select('*')
    .eq('workout_id', workoutId)
    .eq('user_id', user.id)
    .order('taken_at', { ascending: false })
    .limit(1) // Only get the most recent one

  if (error) {
    console.error('Error fetching selfies:', error)
    return { selfies: [], error: error.message }
  }

  return { selfies: selfies || [] }
}

/**
 * Get a signed URL for viewing a selfie
 * Returns a temporary signed URL from Supabase Storage
 */
export async function getSelfieUrl(filePath: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { url: null, error: 'Not authenticated' }
  }

  // Create a signed URL that expires in 1 hour
  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600) // 1 hour expiry

  if (signedError || !signedData?.signedUrl) {
    console.error('Failed to create signed URL:', signedError)
    return { url: null, error: 'Failed to generate image URL' }
  }

  return { url: signedData.signedUrl, error: null }
}

/**
 * Delete a selfie
 */
export async function deleteWorkoutSelfie(selfieId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get selfie record to get the file path
  const { data: selfie, error: fetchError } = await supabase
    .from('workout_selfies')
    .select('file_path, workout_id')
    .eq('id', selfieId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !selfie) {
    return { error: 'Selfie not found or access denied' }
  }

  // Keep file in storage for potential recovery, only soft delete from database
  // Soft delete from database
  const { error: dbError } = await supabase
    .from('workout_selfies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', selfieId)
    .eq('user_id', user.id)
    .is('deleted_at', null) // Only delete if not already deleted

  if (dbError) {
    return { error: dbError.message }
  }

  revalidatePath('/workouts')
  revalidatePath(`/workouts/${selfie.workout_id}`)

  return { success: true }
}

/**
 * Update selfie caption
 */
export async function updateSelfieCaption(selfieId: string, caption: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: selfie, error } = await supabase
    .from('workout_selfies')
    .update({ caption })
    .eq('id', selfieId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/workouts')
  revalidatePath(`/workouts/${selfie.workout_id}`)

  return { success: true }
}

/**
 * Get recent selfies across all workouts (for progress tracking)
 */
export async function getRecentSelfies(limit: number = 10) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { selfies: [], error: 'Not authenticated' }
  }

  const { data: selfies, error } = await supabase
    .from('workout_selfies')
    .select(`
      *,
      workouts:workout_id (
        id,
        name,
        date
      )
    `)
    .eq('user_id', user.id)
    .order('taken_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent selfies:', error)
    return { selfies: [], error: error.message }
  }

  return { selfies: selfies || [] }
}
