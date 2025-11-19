/**
 * Automatically syncs goal progress based on workout data and measurements
 */

import { createClient } from '@/lib/supabase/server'
import { isGoalAchieved } from './progress'

/**
 * Extract exercise name from goal title
 * Examples: "Bench Press 100kg" -> "Bench Press", "Run 50km" -> "Run"
 */
function extractExerciseName(goalTitle: string): string | null {
  // Remove numbers and units
  const cleaned = goalTitle
    .replace(/\d+(\.\d+)?/g, '') // Remove numbers
    .replace(/\b(kg|lbs|km|miles|reps|minutes|days|workouts)\b/gi, '') // Remove units
    .trim()

  return cleaned || null
}

/**
 * Syncs goals with workout data and measurements for units that can be auto-tracked:
 * - workouts: total number of workouts
 * - minutes: total workout duration
 * - days: unique workout days
 * - kg/lbs (body weight): from body_measurements table
 * - kg/lbs (exercise-specific): max weight for that exercise
 * - reps: max reps for specific exercise
 * - km/miles: total distance for specific exercise or all cardio
 */
export async function syncGoalProgress(userId: string) {
  const supabase = await createClient()

  // Get all goals for the user (including achieved ones to keep them updated)
  const { data: goals, error: goalsError } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)

  if (goalsError || !goals || goals.length === 0) {
    return { success: true, updated: 0 }
  }

  let updatedCount = 0

  // Process each goal
  for (const goal of goals) {
    let newCurrentValue: number | null = null
    const unit = goal.unit.toLowerCase()

    switch (unit) {
      case 'workouts': {
        // Count total workouts
        const { data: workouts } = await supabase
          .from('workouts')
          .select('id')
          .eq('user_id', userId)

        newCurrentValue = workouts?.length || 0
        break
      }

      case 'minutes': {
        // Sum workout durations
        const { data: workouts } = await supabase
          .from('workouts')
          .select('duration_minutes')
          .eq('user_id', userId)

        newCurrentValue = workouts?.reduce(
          (sum, w) => sum + (w.duration_minutes || 0),
          0
        ) || 0
        break
      }

      case 'days': {
        // Count unique workout days
        const { data: workouts } = await supabase
          .from('workouts')
          .select('date')
          .eq('user_id', userId)

        const uniqueDays = new Set(workouts?.map((w) => w.date) || [])
        newCurrentValue = uniqueDays.size
        break
      }

      case 'kg':
      case 'lbs': {
        const exerciseName = extractExerciseName(goal.title)

        // Check if this is a body weight goal or exercise-specific goal
        if (exerciseName && /weight|body|lose|gain/i.test(goal.title)) {
          // Body weight goal - get latest weight from body_measurements
          const { data: measurements } = await supabase
            .from('body_measurements')
            .select('weight, weight_unit')
            .eq('user_id', userId)
            .not('weight', 'is', null)
            .order('measured_at', { ascending: false })
            .limit(1)

          if (measurements && measurements.length > 0) {
            const measurement = measurements[0]
            let weight = measurement.weight || 0

            // Convert if needed
            if (unit === 'kg' && measurement.weight_unit === 'lbs') {
              weight = weight * 0.453592
            } else if (unit === 'lbs' && measurement.weight_unit === 'kg') {
              weight = weight * 2.20462
            }

            newCurrentValue = Math.round(weight * 10) / 10
          }
        } else if (exerciseName) {
          // Exercise-specific weight goal - get max weight for that exercise
          const { data: exercises } = await supabase
            .from('exercises')
            .select('weight, weight_unit, workout_id')
            .ilike('name', `%${exerciseName}%`)
            .not('weight', 'is', null)
            .order('weight', { ascending: false })

          if (exercises && exercises.length > 0) {
            // Verify exercises belong to user's workouts
            const workoutIds = exercises.map(e => e.workout_id)
            const { data: userWorkouts } = await supabase
              .from('workouts')
              .select('id')
              .eq('user_id', userId)
              .in('id', workoutIds)

            const validWorkoutIds = new Set(userWorkouts?.map(w => w.id) || [])
            const validExercises = exercises.filter(e => validWorkoutIds.has(e.workout_id))

            if (validExercises.length > 0) {
              let maxWeight = 0
              for (const exercise of validExercises) {
                let weight = exercise.weight || 0

                // Convert if needed
                if (unit === 'kg' && exercise.weight_unit === 'lbs') {
                  weight = weight * 0.453592
                } else if (unit === 'lbs' && exercise.weight_unit === 'kg') {
                  weight = weight * 2.20462
                }

                maxWeight = Math.max(maxWeight, weight)
              }
              newCurrentValue = Math.round(maxWeight * 10) / 10
            }
          }
        }
        break
      }

      case 'reps': {
        // Max reps for specific exercise
        const exerciseName = extractExerciseName(goal.title)
        if (exerciseName) {
          const { data: exercises } = await supabase
            .from('exercises')
            .select('reps, workout_id')
            .ilike('name', `%${exerciseName}%`)
            .not('reps', 'is', null)
            .order('reps', { ascending: false })

          if (exercises && exercises.length > 0) {
            // Verify exercises belong to user's workouts
            const workoutIds = exercises.map(e => e.workout_id)
            const { data: userWorkouts } = await supabase
              .from('workouts')
              .select('id')
              .eq('user_id', userId)
              .in('id', workoutIds)

            const validWorkoutIds = new Set(userWorkouts?.map(w => w.id) || [])
            const validExercises = exercises.filter(e => validWorkoutIds.has(e.workout_id))

            if (validExercises.length > 0) {
              newCurrentValue = Math.max(...validExercises.map(e => e.reps || 0))
            }
          }
        }
        break
      }

      case 'km':
      case 'miles': {
        // Total distance for specific exercise or all cardio
        const exerciseName = extractExerciseName(goal.title)

        let query = supabase
          .from('exercises')
          .select('distance, distance_unit, workout_id, name')
          .not('distance', 'is', null)

        // Filter by exercise name if specified
        if (exerciseName) {
          query = query.ilike('name', `%${exerciseName}%`)
        }

        const { data: exercises } = await query

        if (exercises && exercises.length > 0) {
          // Verify exercises belong to user's workouts
          const workoutIds = exercises.map(e => e.workout_id)
          const { data: userWorkouts } = await supabase
            .from('workouts')
            .select('id')
            .eq('user_id', userId)
            .in('id', workoutIds)

          const validWorkoutIds = new Set(userWorkouts?.map(w => w.id) || [])
          const validExercises = exercises.filter(e => validWorkoutIds.has(e.workout_id))

          if (validExercises.length > 0) {
            let totalDistance = 0
            for (const exercise of validExercises) {
              let distance = exercise.distance || 0

              // Convert if needed
              if (unit === 'km' && exercise.distance_unit === 'miles') {
                distance = distance * 1.60934
              } else if (unit === 'miles' && exercise.distance_unit === 'km') {
                distance = distance * 0.621371
              }

              totalDistance += distance
            }
            newCurrentValue = Math.round(totalDistance * 10) / 10
          }
        }
        break
      }

      default:
        continue
    }

    // Only update if the value changed
    if (newCurrentValue !== null && newCurrentValue !== goal.current_value) {
      const achieved = isGoalAchieved({
        initial_value: goal.initial_value,
        current_value: newCurrentValue,
        target_value: goal.target_value,
      })

      const { error: updateError } = await supabase
        .from('goals')
        .update({
          current_value: newCurrentValue,
          achieved,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goal.id)

      if (updateError) {
        console.error(`Error updating goal ${goal.id}:`, updateError)
      } else {
        updatedCount++
        console.log(
          `✓ Synced goal "${goal.title}": ${goal.current_value} → ${newCurrentValue} ${goal.unit}${achieved ? ' (ACHIEVED!)' : ''}`
        )
      }
    }
  }

  return { success: true, updated: updatedCount }
}
