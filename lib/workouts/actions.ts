'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ExerciseInput {
  name: string
  type?: string
  sets?: string
  reps?: string
  weight?: string
  duration?: string
  distance?: string
  speed?: string
  calories?: string
  resistance?: string
  incline?: string
}

export async function createWorkout(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Extract workout data
  const name = formData.get('name') as string
  const date = formData.get('date') as string
  const duration = formData.get('duration') as string
  const description = formData.get('description') as string
  const effortLevel = formData.get('effort_level') as string
  const exercisesJson = formData.get('exercises') as string

  // Parse exercises
  let exercises = []
  try {
    exercises = JSON.parse(exercisesJson)
  } catch {
    return { error: 'Invalid exercises data' }
  }

  // Create workout
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      user_id: user.id,
      name,
      date,
      duration_minutes: duration ? parseInt(duration) : null,
      description,
      effort_level: effortLevel ? parseInt(effortLevel) : null,
    })
    .select()
    .single()

  if (workoutError) {
    console.error('Workout error:', workoutError)
    return { error: `Failed to create workout: ${workoutError.message}` }
  }

  console.log('Workout created:', workout)

  // Create exercises
  if (exercises.length > 0) {
    const exerciseRecords = exercises.map((ex: ExerciseInput) => ({
      workout_id: workout.id,
      name: ex.name,
      exercise_type: ex.type || 'strength',
      // Strength fields
      sets: ex.sets ? parseInt(ex.sets) : null,
      reps: ex.reps ? parseInt(ex.reps) : null,
      weight: ex.weight ? parseFloat(ex.weight) : null,
      weight_unit: 'kg',
      // Cardio fields
      duration_minutes: ex.duration ? parseInt(ex.duration) : null,
      distance: ex.distance ? parseFloat(ex.distance) : null,
      distance_unit: 'km',
      speed: ex.speed ? parseFloat(ex.speed) : null,
      calories: ex.calories ? parseInt(ex.calories) : null,
      resistance_level: ex.resistance ? parseInt(ex.resistance) : null,
      incline: ex.incline ? parseFloat(ex.incline) : null,
    }))

    console.log('Creating exercises:', exerciseRecords)

    const { error: exercisesError } = await supabase
      .from('exercises')
      .insert(exerciseRecords)

    if (exercisesError) {
      console.error('Exercises error:', exercisesError)
      return { error: `Failed to create exercises: ${exercisesError.message}` }
    }
  }

  // Revalidate the workouts page to show new data
  revalidatePath('/workouts')

  return { success: true, workoutId: workout.id }
}

export async function getWorkouts() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log('No user found when fetching workouts')
    return { workouts: [] }
  }

  console.log('Fetching workouts for user:', user.id)

  const { data: workouts, error } = await supabase
    .from('workouts')
    .select(`
      *,
      exercises (*)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching workouts:', error)
    return { workouts: [], error: error.message }
  }

  console.log('Fetched workouts:', workouts?.length || 0)

  return { workouts: workouts || [] }
}

export async function deleteWorkout(workoutId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
