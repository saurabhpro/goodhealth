/**
 * Helper functions to extract metadata from workout templates
 */

import type { WorkoutTemplate, Exercise } from '@/types'

/**
 * Extracts exercises from template's JSONB field
 */
export function getTemplateExercises(template: WorkoutTemplate): Exercise[] {
  if (!template.exercises) return []

  try {
    // exercises is stored as JSONB, might be already parsed or string
    if (Array.isArray(template.exercises)) {
      return template.exercises as Exercise[]
    }
    if (typeof template.exercises === 'string') {
      return JSON.parse(template.exercises) as Exercise[]
    }
    return []
  } catch {
    return []
  }
}

/**
 * Gets muscle groups targeted by a template
 */
export function getTemplateMuscleGroups(template: WorkoutTemplate): string[] {
  const exercises = getTemplateExercises(template)
  const muscleGroups = new Set<string>()

  for (const exercise of exercises) {
    if (exercise.muscle_group) {
      muscleGroups.add(exercise.muscle_group)
    }
  }

  return Array.from(muscleGroups)
}

/**
 * Estimates duration for a template
 */
export function getTemplateEstimatedDuration(template: WorkoutTemplate): number {
  const exercises = getTemplateExercises(template)

  if (exercises.length === 0) return 45 // Default

  let totalMinutes = 0

  for (const exercise of exercises) {
    if (exercise.duration_minutes) {
      // Cardio exercise with explicit duration
      totalMinutes += exercise.duration_minutes
    } else {
      // Strength exercise: estimate based on sets
      const sets = exercise.sets || 3
      const restTime = 1 // 1 minute rest between sets
      const workTime = 1 // 1 minute per set
      totalMinutes += sets * (workTime + restTime)
    }
  }

  // Add 5 minutes for warmup/cooldown
  return Math.round(totalMinutes + 5)
}

/**
 * Determines intensity level of a template
 */
export function getTemplateIntensity(template: WorkoutTemplate): 'low' | 'moderate' | 'high' | 'max' {
  const exercises = getTemplateExercises(template)

  if (exercises.length === 0) return 'moderate'

  // Check if exercises have high weight or high reps
  let highIntensityCount = 0

  for (const exercise of exercises) {
    if (exercise.sets && exercise.sets >= 4) highIntensityCount++
    if (exercise.reps && exercise.reps >= 12) highIntensityCount++
  }

  const ratio = highIntensityCount / exercises.length

  if (ratio >= 0.7) return 'high'
  if (ratio >= 0.4) return 'moderate'
  return 'low'
}
