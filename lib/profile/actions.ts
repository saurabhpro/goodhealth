'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ProfileData {
  full_name?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  height_cm?: number
  fitness_level?: 'beginner' | 'intermediate' | 'advanced'
  fitness_goals?: string[]
  medical_conditions?: string
  injuries?: string
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { profile }
}

export async function updateProfile(profileData: ProfileData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Validate date of birth if provided
  if (profileData.date_of_birth) {
    const dob = new Date(profileData.date_of_birth)
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

    if (age < 13 || age > 120) {
      return { error: 'Please enter a valid date of birth (age must be between 13 and 120)' }
    }
  }

  // Validate height if provided
  if (profileData.height_cm !== undefined && (profileData.height_cm < 50 || profileData.height_cm > 300)) {
    return { error: 'Height must be between 50 and 300 cm' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/profile')
  return { success: true }
}
