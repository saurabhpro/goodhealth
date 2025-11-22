/**
 * User Workout Preferences Actions
 * Server actions for managing user workout preferences and custom templates
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  UserWorkoutPreferences,
  InsertUserWorkoutPreferences,
  UpdateUserWorkoutPreferences,
  WorkoutTemplate,
  InsertWorkoutTemplate,
  UpdateWorkoutTemplate,
} from '@/types'

// ============================================================================
// USER PREFERENCES ACTIONS
// ============================================================================

/**
 * Get user's workout preferences
 */
export async function getUserPreferences(): Promise<{
  preferences?: UserWorkoutPreferences
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('user_workout_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // If no preferences found, return empty (not an error)
    if (error.code === 'PGRST116') {
      return { preferences: undefined }
    }
    console.error('Error fetching preferences:', error)
    return { error: error.message }
  }

  return { preferences: data }
}

/**
 * Create or update user's workout preferences
 */
export async function upsertUserPreferences(
  preferences: Omit<InsertUserWorkoutPreferences, 'user_id'>
): Promise<{
  preferences?: UserWorkoutPreferences
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('user_workout_preferences')
    .upsert(
      {
        ...preferences,
        user_id: user.id,
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single()

  if (error) {
    console.error('Error upserting preferences:', error)
    return { error: `Failed to save preferences: ${error.message}` }
  }

  revalidatePath('/workout-plans')
  revalidatePath('/workout-plans/preferences')

  return { preferences: data }
}

/**
 * Update specific fields in user preferences
 */
export async function updateUserPreferences(
  updates: UpdateUserWorkoutPreferences
): Promise<{
  preferences?: UserWorkoutPreferences
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('user_workout_preferences')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating preferences:', error)
    return { error: `Failed to update preferences: ${error.message}` }
  }

  revalidatePath('/workout-plans')
  revalidatePath('/workout-plans/preferences')

  return { preferences: data }
}

// ============================================================================
// USER TEMPLATES ACTIONS
// ============================================================================

/**
 * Get all user's custom templates
 */
export async function getUserTemplates(options?: {
  isActive?: boolean
  workoutType?: string
}): Promise<{
  templates?: WorkoutTemplate[]
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  let query = supabase
    .from('workout_templates')
    .select('*')
    .eq('user_id', user.id)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Apply filters
  if (options?.isActive !== undefined) {
    query = query.eq('is_active', options.isActive)
  }
  if (options?.workoutType) {
    query = query.eq('workout_type', options.workoutType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching templates:', error)
    return { error: error.message }
  }

  return { templates: data || [] }
}

/**
 * Get a single user template by ID
 */
export async function getUserTemplate(
  templateId: string
): Promise<{
  template?: WorkoutTemplate
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('id', templateId)
    .eq('user_id', user.id)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Error fetching template:', error)
    return { error: `Failed to fetch template: ${error.message}` }
  }

  return { template: data }
}

/**
 * Create a new user template
 */
export async function createUserTemplate(
  template: Omit<InsertWorkoutTemplate, 'user_id'>
): Promise<{
  template?: WorkoutTemplate
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('workout_templates')
    .insert({
      ...template,
      user_id: user.id,
      is_public: false, // User templates are private by default
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating template:', error)
    return { error: `Failed to create template: ${error.message}` }
  }

  revalidatePath('/workout-plans/templates')

  return { template: data }
}

/**
 * Update a user template
 */
export async function updateUserTemplate(
  templateId: string,
  updates: UpdateWorkoutTemplate
): Promise<{
  template?: WorkoutTemplate
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('workout_templates')
    .update(updates)
    .eq('id', templateId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating template:', error)
    return { error: `Failed to update template: ${error.message}` }
  }

  revalidatePath('/workout-plans/templates')
  revalidatePath(`/workout-plans/templates/${templateId}`)

  return { template: data }
}

/**
 * Delete a user template
 */
export async function deleteUserTemplate(templateId: string): Promise<{
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Soft delete: set deleted_at instead of hard delete
  const { error } = await supabase
    .from('workout_templates')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', templateId)
    .eq('user_id', user.id)
    .is('deleted_at', null) // Only delete if not already deleted

  if (error) {
    console.error('Error soft deleting template:', error)
    return { error: error.message }
  }

  revalidatePath('/workout-plans/templates')

  return {}
}

/**
 * Increment usage count for a template
 */
export async function incrementTemplateUsage(templateId: string): Promise<{
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // First get current times_used
  const { data: template, error: fetchError } = await supabase
    .from('workout_templates')
    .select('times_used')
    .eq('id', templateId)
    .eq('user_id', user.id)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .single()

  if (fetchError) {
    console.error('Error fetching template for usage update:', fetchError)
    return { error: fetchError.message }
  }

  // Update with incremented count and last_used_at
  const { error } = await supabase
    .from('workout_templates')
    .update({
      times_used: (template.times_used || 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', templateId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error incrementing template usage:', error)
    return { error: error.message }
  }

  return {}
}
