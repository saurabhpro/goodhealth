'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { syncGoalProgress } from '@/lib/goals/sync'

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
  const sessionId = formData.get('session_id') as string | null

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

  // If this workout is linked to a plan session, update the session
  if (sessionId) {
    const { error: sessionUpdateError } = await supabase
      .from('workout_plan_sessions')
      .update({
        status: 'completed',
        completed_workout_id: workout.id,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (sessionUpdateError) {
      console.error('Failed to update session status:', sessionUpdateError)
      // Don't fail the whole operation, just log the error
    }
  }

  // Sync goal progress (workouts, minutes, days)
  await syncGoalProgress(user.id)

  // Revalidate the workouts page to show new data
  revalidatePath('/workouts')
  revalidatePath('/goals')
  revalidatePath('/progress')
  if (sessionId) {
    revalidatePath('/workout-plans')
  }

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
      exercises (*),
      workout_selfies (
        id,
        file_path,
        caption,
        taken_at
      )
    `)
    .eq('user_id', user.id)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching workouts:', error)
    return { workouts: [], error: error.message }
  }

  console.log('Fetched workouts:', workouts?.length || 0)

  // Add signed URLs for selfies
  const workoutsWithSelfies = await Promise.all(
    (workouts || []).map(async (workout) => {
      if (workout.workout_selfies && workout.workout_selfies.length > 0) {
        const selfie = workout.workout_selfies[0]
        const { data: signedData } = await supabase.storage
          .from('workout-selfies')
          .createSignedUrl(selfie.file_path, 3600) // 1 hour expiry

        return {
          ...workout,
          workout_selfies: [{
            ...selfie,
            signedUrl: signedData?.signedUrl
          }]
        }
      }
      return workout
    })
  )

  return { workouts: workoutsWithSelfies }
}

export async function updateWorkout(workoutId: string, formData: FormData) {
  const supabase = await createClient()

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

  // Update workout
  const { error: workoutError } = await supabase
    .from('workouts')
    .update({
      name,
      date,
      duration_minutes: duration ? Number.parseInt(duration) : null,
      description,
      effort_level: effortLevel ? Number.parseInt(effortLevel) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workoutId)
    .eq('user_id', user.id)

  if (workoutError) {
    console.error('Workout update error:', workoutError)
    return { error: `Failed to update workout: ${workoutError.message}` }
  }

  // Soft delete existing exercises (will be replaced with new ones)
  const { error: deleteError } = await supabase
    .from('exercises')
    .update({ deleted_at: new Date().toISOString() })
    .eq('workout_id', workoutId)
    .is('deleted_at', null) // Only soft delete active exercises

  if (deleteError) {
    console.error('Exercise soft delete error:', deleteError)
    return { error: `Failed to archive old exercises: ${deleteError.message}` }
  }

  // Insert updated exercises
  if (exercises.length > 0) {
    const exerciseRecords = exercises.map((exercise: ExerciseInput) => ({
      workout_id: workoutId,
      name: exercise.name,
      exercise_type: exercise.type || 'strength',
      // Strength fields
      sets: exercise.sets ? Number.parseInt(exercise.sets) : null,
      reps: exercise.reps ? Number.parseInt(exercise.reps) : null,
      weight: exercise.weight ? Number.parseFloat(exercise.weight) : null,
      weight_unit: 'kg',
      // Cardio fields
      duration_minutes: exercise.duration ? Number.parseInt(exercise.duration) : null,
      distance: exercise.distance ? Number.parseFloat(exercise.distance) : null,
      distance_unit: 'km',
      speed: exercise.speed ? Number.parseFloat(exercise.speed) : null,
      calories: exercise.calories ? Number.parseInt(exercise.calories) : null,
      resistance_level: exercise.resistance ? Number.parseInt(exercise.resistance) : null,
      incline: exercise.incline ? Number.parseFloat(exercise.incline) : null,
      notes: null,
    }))

    const { error: exerciseError } = await supabase
      .from('exercises')
      .insert(exerciseRecords)

    if (exerciseError) {
      console.error('Exercise insert error:', exerciseError)
      return { error: `Failed to update exercises: ${exerciseError.message}` }
    }
  }

  // Sync goal progress (workouts, minutes, days)
  await syncGoalProgress(user.id)

  revalidatePath('/workouts')
  revalidatePath(`/workouts/${workoutId}`)
  revalidatePath('/goals')
  revalidatePath('/progress')
  return { success: true }
}

export async function deleteWorkout(workoutId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Soft delete: set deleted_at instead of hard delete
  const { error } = await supabase
    .from('workouts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', workoutId)
    .eq('user_id', user.id)
    .is('deleted_at', null) // Only delete if not already deleted

  if (error) {
    return { error: error.message }
  }

  // Sync goal progress (workouts, minutes, days)
  await syncGoalProgress(user.id)

  revalidatePath('/workouts')
  revalidatePath('/goals')
  revalidatePath('/progress')
  return { success: true }
}

export async function deleteExercise(exerciseId: string, workoutId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify the exercise belongs to a workout owned by the user
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .select('id')
    .eq('id', workoutId)
    .eq('user_id', user.id)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .single()

  if (workoutError || !workout) {
    return { error: 'Workout not found or unauthorized' }
  }

  // Soft delete: set deleted_at instead of hard delete
  const { error } = await supabase
    .from('exercises')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', exerciseId)
    .eq('workout_id', workoutId)
    .is('deleted_at', null) // Only delete if not already deleted

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/workouts/${workoutId}`)
  return { success: true }
}
