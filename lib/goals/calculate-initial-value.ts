/**
 * Calculates initial goal value based on historical workout data
 */

import { createClient } from '@/lib/supabase/server'

const LBS_TO_KG = 0.453592
const KG_TO_LBS = 2.20462
const MILES_TO_KM = 1.60934
const KM_TO_MILES = 0.621371

/**
 * Extract exercise name from goal title
 * Examples: "Bench Press 100kg" -> "Bench Press", "Run 50km" -> "Running"
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
 * Calculates the initial value for a goal based on workout history
 * @param unit - The unit of measurement (workouts, minutes, days, kg, lbs, reps, km, miles)
 * @param goalTitle - The goal title (used to extract exercise name for specific exercises)
 * @param startDate - Optional start date to calculate from
 * @param lookbackDays - Number of days to look back (default: 30)
 * @returns The calculated initial value
 */
export async function calculateInitialValue(
  unit: string,
  goalTitle: string,
  startDate?: string,
  lookbackDays: number = 30
): Promise<number> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return 0
    }

    // Calculate date range
    const endDate = startDate ? new Date(startDate) : new Date()
    const beginDate = new Date(endDate)
    beginDate.setDate(beginDate.getDate() - lookbackDays)

    const beginDateStr = beginDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    switch (unit.toLowerCase()) {
      case 'workouts': {
        // Count total workouts
        const { data: workouts, error } = await supabase
          .from('workouts')
          .select('id')
          .eq('user_id', user.id)
          .gte('date', beginDateStr)
          .lte('date', endDateStr)

        if (error) {
          console.error('Error fetching workouts:', error)
          return 0
        }

        return workouts?.length || 0
      }

      case 'minutes': {
        // Sum workout durations
        const { data: workouts, error } = await supabase
          .from('workouts')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('date', beginDateStr)
          .lte('date', endDateStr)

        if (error) {
          console.error('Error fetching workouts:', error)
          return 0
        }

        const totalMinutes = workouts?.reduce(
          (sum: number, w: { duration_minutes: number | null }) => sum + (w.duration_minutes || 0),
          0
        )
        return totalMinutes || 0
      }

      case 'days': {
        // Count unique workout days
        const { data: workouts, error } = await supabase
          .from('workouts')
          .select('date')
          .eq('user_id', user.id)
          .gte('date', beginDateStr)
          .lte('date', endDateStr)

        if (error) {
          console.error('Error fetching workouts:', error)
          return 0
        }

        const uniqueDays = new Set(workouts?.map((w: { date: string }) => w.date))
        return uniqueDays.size || 0
      }

      case 'kg':
      case 'lbs': {
        // Find max weight for specific exercise
        const exerciseName = extractExerciseName(goalTitle)
        if (!exerciseName) return 0

        // First get workout IDs in date range
        const { data: workouts, error: workoutsError } = await supabase
          .from('workouts')
          .select('id')
          .eq('user_id', user.id)
          .gte('date', beginDateStr)
          .lte('date', endDateStr)

        if (workoutsError || !workouts || workouts.length === 0) {
          console.error('Error fetching workouts:', workoutsError)
          return 0
        }

        const workoutIds = workouts.map((w: { id: string }) => w.id)

        // Then get exercises for those workouts
        const { data: exercises, error: exercisesError } = await supabase
          .from('exercises')
          .select('name, weight, weight_unit')
          .in('workout_id', workoutIds)
          .ilike('name', `%${exerciseName}%`)

        if (exercisesError || !exercises || exercises.length === 0) {
          console.error('Error fetching exercises:', exercisesError)
          return 0
        }

        // Find max weight, converting if necessary
        let maxWeight = 0
        for (const exercise of exercises) {
          if (!exercise.weight) continue

          let weightInTargetUnit = exercise.weight
          if (unit === 'kg' && exercise.weight_unit === 'lbs') {
            weightInTargetUnit = exercise.weight * LBS_TO_KG
          } else if (unit === 'lbs' && exercise.weight_unit === 'kg') {
            weightInTargetUnit = exercise.weight * KG_TO_LBS
          }

          maxWeight = Math.max(maxWeight, weightInTargetUnit)
        }

        return Math.round(maxWeight * 10) / 10 // Round to 1 decimal
      }

      case 'reps': {
        // Find max reps for specific exercise
        const exerciseName = extractExerciseName(goalTitle)
        if (!exerciseName) return 0

        // First get workout IDs in date range
        const { data: workouts, error: workoutsError } = await supabase
          .from('workouts')
          .select('id')
          .eq('user_id', user.id)
          .gte('date', beginDateStr)
          .lte('date', endDateStr)

        if (workoutsError || !workouts || workouts.length === 0) {
          console.error('Error fetching workouts:', workoutsError)
          return 0
        }

        const workoutIds = workouts.map((w: { id: string }) => w.id)

        // Then get exercises for those workouts
        const { data: exercises, error: exercisesError } = await supabase
          .from('exercises')
          .select('name, reps')
          .in('workout_id', workoutIds)
          .ilike('name', `%${exerciseName}%`)

        if (exercisesError || !exercises || exercises.length === 0) {
          console.error('Error fetching exercises:', exercisesError)
          return 0
        }

        const maxReps = Math.max(...exercises.map((e: { reps: number | null }) => e.reps || 0))
        return maxReps
      }

      case 'km':
      case 'miles': {
        // Sum total distance for cardio exercises
        const exerciseName = extractExerciseName(goalTitle)

        // First get workout IDs in date range
        const { data: workouts, error: workoutsError } = await supabase
          .from('workouts')
          .select('id')
          .eq('user_id', user.id)
          .gte('date', beginDateStr)
          .lte('date', endDateStr)

        if (workoutsError || !workouts || workouts.length === 0) {
          console.error('Error fetching workouts:', workoutsError)
          return 0
        }

        const workoutIds = workouts.map((w: { id: string }) => w.id)

        // Then get exercises for those workouts
        let query = supabase
          .from('exercises')
          .select('name, distance, distance_unit')
          .in('workout_id', workoutIds)

        if (exerciseName) {
          query = query.ilike('name', `%${exerciseName}%`)
        }

        const { data: exercises, error: exercisesError } = await query

        if (exercisesError || !exercises || exercises.length === 0) {
          console.error('Error fetching exercises:', exercisesError)
          return 0
        }

        // Sum distance, converting if necessary
        let totalDistance = 0
        for (const exercise of exercises) {
          if (!exercise.distance) continue

          let distanceInTargetUnit = exercise.distance
          if (unit === 'km' && exercise.distance_unit === 'miles') {
            distanceInTargetUnit = exercise.distance * MILES_TO_KM
          } else if (unit === 'miles' && exercise.distance_unit === 'km') {
            distanceInTargetUnit = exercise.distance * KM_TO_MILES
          }

          totalDistance += distanceInTargetUnit
        }

        return Math.round(totalDistance * 10) / 10 // Round to 1 decimal
      }

      default:
        console.warn(`Unknown unit: ${unit}`)
        return 0
    }
  } catch (error) {
    console.error('Error calculating initial value:', error)
    return 0
  }
}
