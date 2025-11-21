'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { syncGoalProgress } from '@/lib/goals/sync'

export async function createMeasurement(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Extract form data
  const measuredAt = formData.get('measured_at') as string
  const weight = formData.get('weight') as string
  const bodyFat = formData.get('body_fat_percentage') as string
  const muscleMass = formData.get('muscle_mass') as string
  const boneMass = formData.get('bone_mass') as string
  const waterPercentage = formData.get('water_percentage') as string
  const height = formData.get('height') as string
  const neck = formData.get('neck') as string
  const shoulders = formData.get('shoulders') as string
  const chest = formData.get('chest') as string
  const waist = formData.get('waist') as string
  const hips = formData.get('hips') as string
  const bicepLeft = formData.get('bicep_left') as string
  const bicepRight = formData.get('bicep_right') as string
  const forearmLeft = formData.get('forearm_left') as string
  const forearmRight = formData.get('forearm_right') as string
  const thighLeft = formData.get('thigh_left') as string
  const thighRight = formData.get('thigh_right') as string
  const calfLeft = formData.get('calf_left') as string
  const calfRight = formData.get('calf_right') as string
  const bmr = formData.get('bmr') as string
  const metabolicAge = formData.get('metabolic_age') as string
  const visceralFat = formData.get('visceral_fat') as string
  const proteinPercentage = formData.get('protein_percentage') as string
  const notes = formData.get('notes') as string

  // Insert measurement
  const { data, error } = await supabase
    .from('body_measurements')
    .insert({
      user_id: user.id,
      measured_at: measuredAt || new Date().toISOString(),
      weight: weight ? parseFloat(weight) : null,
      body_fat_percentage: bodyFat ? parseFloat(bodyFat) : null,
      muscle_mass: muscleMass ? parseFloat(muscleMass) : null,
      bone_mass: boneMass ? parseFloat(boneMass) : null,
      water_percentage: waterPercentage ? parseFloat(waterPercentage) : null,
      height: height ? parseFloat(height) : null,
      neck: neck ? parseFloat(neck) : null,
      shoulders: shoulders ? parseFloat(shoulders) : null,
      chest: chest ? parseFloat(chest) : null,
      waist: waist ? parseFloat(waist) : null,
      hips: hips ? parseFloat(hips) : null,
      bicep_left: bicepLeft ? parseFloat(bicepLeft) : null,
      bicep_right: bicepRight ? parseFloat(bicepRight) : null,
      forearm_left: forearmLeft ? parseFloat(forearmLeft) : null,
      forearm_right: forearmRight ? parseFloat(forearmRight) : null,
      thigh_left: thighLeft ? parseFloat(thighLeft) : null,
      thigh_right: thighRight ? parseFloat(thighRight) : null,
      calf_left: calfLeft ? parseFloat(calfLeft) : null,
      calf_right: calfRight ? parseFloat(calfRight) : null,
      bmr: bmr ? parseInt(bmr) : null,
      metabolic_age: metabolicAge ? parseInt(metabolicAge) : null,
      visceral_fat: visceralFat ? parseInt(visceralFat) : null,
      protein_percentage: proteinPercentage ? parseFloat(proteinPercentage) : null,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Measurement creation error:', error)
    return { error: `Failed to save measurement: ${error.message}` }
  }

  // Sync goal progress (weight goals)
  await syncGoalProgress(user.id)

  revalidatePath('/measurements')
  revalidatePath('/progress')
  revalidatePath('/profile')
  revalidatePath('/goals')

  return { success: true, data }
}

export async function getMeasurements(limit?: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { measurements: [] }
  }

  let query = supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', user.id)
    .order('measured_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data: measurements, error } = await query

  if (error) {
    console.error('Error fetching measurements:', error)
    return { measurements: [], error: error.message }
  }

  return { measurements: measurements || [] }
}

export async function getLatestMeasurement() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { measurement: null }
  }

  const { data: measurement, error } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', user.id)
    .order('measured_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error fetching latest measurement:', error)
    return { measurement: null, error: error.message }
  }

  return { measurement }
}

export async function updateMeasurement(measurementId: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Extract form data (same as create)
  const measuredAt = formData.get('measured_at') as string
  const weight = formData.get('weight') as string
  const bodyFat = formData.get('body_fat_percentage') as string
  const muscleMass = formData.get('muscle_mass') as string
  const boneMass = formData.get('bone_mass') as string
  const waterPercentage = formData.get('water_percentage') as string
  const height = formData.get('height') as string
  const neck = formData.get('neck') as string
  const shoulders = formData.get('shoulders') as string
  const chest = formData.get('chest') as string
  const waist = formData.get('waist') as string
  const hips = formData.get('hips') as string
  const bicepLeft = formData.get('bicep_left') as string
  const bicepRight = formData.get('bicep_right') as string
  const forearmLeft = formData.get('forearm_left') as string
  const forearmRight = formData.get('forearm_right') as string
  const thighLeft = formData.get('thigh_left') as string
  const thighRight = formData.get('thigh_right') as string
  const calfLeft = formData.get('calf_left') as string
  const calfRight = formData.get('calf_right') as string
  const bmr = formData.get('bmr') as string
  const metabolicAge = formData.get('metabolic_age') as string
  const visceralFat = formData.get('visceral_fat') as string
  const proteinPercentage = formData.get('protein_percentage') as string
  const notes = formData.get('notes') as string

  const { error } = await supabase
    .from('body_measurements')
    .update({
      measured_at: measuredAt,
      weight: weight ? parseFloat(weight) : null,
      body_fat_percentage: bodyFat ? parseFloat(bodyFat) : null,
      muscle_mass: muscleMass ? parseFloat(muscleMass) : null,
      bone_mass: boneMass ? parseFloat(boneMass) : null,
      water_percentage: waterPercentage ? parseFloat(waterPercentage) : null,
      height: height ? parseFloat(height) : null,
      neck: neck ? parseFloat(neck) : null,
      shoulders: shoulders ? parseFloat(shoulders) : null,
      chest: chest ? parseFloat(chest) : null,
      waist: waist ? parseFloat(waist) : null,
      hips: hips ? parseFloat(hips) : null,
      bicep_left: bicepLeft ? parseFloat(bicepLeft) : null,
      bicep_right: bicepRight ? parseFloat(bicepRight) : null,
      forearm_left: forearmLeft ? parseFloat(forearmLeft) : null,
      forearm_right: forearmRight ? parseFloat(forearmRight) : null,
      thigh_left: thighLeft ? parseFloat(thighLeft) : null,
      thigh_right: thighRight ? parseFloat(thighRight) : null,
      calf_left: calfLeft ? parseFloat(calfLeft) : null,
      calf_right: calfRight ? parseFloat(calfRight) : null,
      bmr: bmr ? parseInt(bmr) : null,
      metabolic_age: metabolicAge ? parseInt(metabolicAge) : null,
      visceral_fat: visceralFat ? parseInt(visceralFat) : null,
      protein_percentage: proteinPercentage ? parseFloat(proteinPercentage) : null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', measurementId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Measurement update error:', error)
    return { error: `Failed to update measurement: ${error.message}` }
  }

  revalidatePath('/measurements')
  revalidatePath('/progress')
  revalidatePath('/profile')

  return { success: true }
}

export async function deleteMeasurement(measurementId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Soft delete: set deleted_at instead of hard delete
  const { error } = await supabase
    .from('body_measurements')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', measurementId)
    .eq('user_id', user.id)
    .is('deleted_at', null) // Only delete if not already deleted

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/measurements')
  revalidatePath('/progress')
  revalidatePath('/profile')

  return { success: true }
}
