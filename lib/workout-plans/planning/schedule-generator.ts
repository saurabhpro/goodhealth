/**
 * Schedule Generator - Creates weekly workout schedules
 * Phase 2: Planning Engine
 */

import type { WorkoutTemplate, Exercise } from '@/types'
import type { GoalAnalysis } from './goal-analyzer'
import { selectTemplateWithRotation } from './template-selector'
import {
  getTemplateExercises,
  getTemplateMuscleGroups,
  getTemplateEstimatedDuration,
  getTemplateIntensity,
} from './template-helpers'

export interface PlanSession {
  week_number: number
  day_of_week: number
  day_name: string
  session_order: number
  workout_template_id: string | null
  workout_name: string
  workout_type: 'strength' | 'cardio' | 'rest' | 'active_recovery' | 'mixed'
  estimated_duration: number | null
  exercises: Exercise[]
  muscle_groups: string[]
  intensity_level: 'low' | 'moderate' | 'high' | 'max' | null
  status: 'scheduled'
  notes: string | null
}

export interface WeeklySchedule {
  week: number
  sessions: PlanSession[]
  totalWorkouts: number
  restDays: number[]
  estimatedWeeklyVolume: number
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const MUSCLE_GROUP_RECOVERY_DAYS: Record<string, number> = {
  chest: 2,
  back: 2,
  legs: 3,
  shoulders: 2,
  arms: 1,
  core: 1,
  biceps: 1,
  triceps: 1,
  quads: 3,
  hamstrings: 3,
  glutes: 2,
  calves: 1,
}

/**
 * Distributes rest days throughout the week
 */
export function distributeRestDays(
  restCount: number,
  workoutCount: number,
  preferredRestDays?: number[]
): number[] {
  if (restCount === 0) return []
  if (restCount === 7) return [0, 1, 2, 3, 4, 5, 6]

  const restDays: number[] = []

  // Use preferred rest days if provided
  if (preferredRestDays && preferredRestDays.length > 0) {
    restDays.push(...preferredRestDays.slice(0, restCount))
  } else {
    // Default strategy: prefer Sunday and Wednesday
    if (restCount >= 1) {
      restDays.push(0) // Sunday
    }
    if (restCount >= 2) {
      restDays.push(3) // Wednesday
    }
    if (restCount >= 3) {
      restDays.push(5) // Friday
    }
    if (restCount >= 4) {
      restDays.push(2) // Tuesday
    }
  }

  // Fill remaining rest days evenly
  const remainingDays = [1, 2, 4, 5, 6].filter(d => !restDays.includes(d))
  while (restDays.length < restCount && remainingDays.length > 0) {
    restDays.push(remainingDays.shift()!)
  }

  return restDays.sort((a, b) => a - b)
}

/**
 * Creates a rest day session
 */
function createRestSession(
  weekNumber: number,
  dayOfWeek: number,
  isActiveRecovery: boolean = false
): PlanSession {
  return {
    week_number: weekNumber,
    day_of_week: dayOfWeek,
    day_name: DAY_NAMES[dayOfWeek],
    session_order: 1,
    workout_template_id: null,
    workout_name: isActiveRecovery ? 'Active Recovery' : 'Rest Day',
    workout_type: isActiveRecovery ? 'active_recovery' : 'rest',
    estimated_duration: isActiveRecovery ? 20 : null,
    exercises: [],
    muscle_groups: [],
    intensity_level: isActiveRecovery ? 'low' : null,
    status: 'scheduled',
    notes: isActiveRecovery
      ? 'Light stretching, yoga, or walking'
      : 'Take a full rest day to recover',
  }
}

/**
 * Creates a workout session from a template
 */
function createSessionFromTemplate(
  weekNumber: number,
  dayOfWeek: number,
  template: WorkoutTemplate
): PlanSession {
  const exercises = getTemplateExercises(template)

  // Determine workout type
  let workoutType: PlanSession['workout_type'] = 'mixed'
  if (exercises.length > 0) {
    const cardioCount = exercises.filter(ex => ex.exercise_type === 'cardio').length
    const totalCount = exercises.length

    if (cardioCount === totalCount) {
      workoutType = 'cardio'
    } else if (cardioCount === 0) {
      workoutType = 'strength'
    }
  }

  return {
    week_number: weekNumber,
    day_of_week: dayOfWeek,
    day_name: DAY_NAMES[dayOfWeek],
    session_order: 1,
    workout_template_id: template.id,
    workout_name: template.name,
    workout_type: workoutType,
    estimated_duration: getTemplateEstimatedDuration(template),
    exercises,
    muscle_groups: getTemplateMuscleGroups(template),
    intensity_level: getTemplateIntensity(template),
    status: 'scheduled',
    notes: template.description,
  }
}

/**
 * Checks if a muscle group can be worked based on recovery time
 */
function canWorkMuscleGroup(
  muscleGroup: string,
  lastWorked: Map<string, number>,
  currentDay: number
): boolean {
  const lastWorkedDay = lastWorked.get(muscleGroup)
  if (lastWorkedDay === undefined) return true

  const daysSinceWorked = currentDay - lastWorkedDay
  const recoveryDays = MUSCLE_GROUP_RECOVERY_DAYS[muscleGroup] || 2

  return daysSinceWorked >= recoveryDays
}

/**
 * Updates muscle group tracking after a workout
 */
function updateMuscleGroupTracking(
  muscleGroupMap: Map<string, number>,
  template: WorkoutTemplate,
  dayIndex: number
): void {
  const muscleGroups = getTemplateMuscleGroups(template)

  for (const muscleGroup of muscleGroups) {
    muscleGroupMap.set(muscleGroup, dayIndex)
  }
}

/**
 * Calculates total volume for a week
 */
function calculateWeeklyVolume(sessions: PlanSession[]): number {
  let totalVolume = 0

  for (const session of sessions) {
    if (session.workout_type === 'rest' || session.workout_type === 'active_recovery') {
      continue
    }

    for (const exercise of session.exercises) {
      const sets = exercise.sets || 0
      const reps = exercise.reps || 0
      const weight = exercise.weight || 0
      totalVolume += sets * reps * weight
    }
  }

  return totalVolume
}

/**
 * Generates a weekly schedule
 */
export function generateWeeklySchedule(
  weekNumber: number,
  goalAnalysis: GoalAnalysis,
  availableTemplates: WorkoutTemplate[],
  preferredRestDays?: number[]
): WeeklySchedule {
  const sessions: PlanSession[] = []
  const workoutsPerWeek = goalAnalysis.recommendations.workoutsPerWeek
  const restDaysCount = 7 - workoutsPerWeek

  // Distribute rest days
  const restDays = distributeRestDays(restDaysCount, workoutsPerWeek, preferredRestDays)

  // Track used templates and muscle groups
  const usedTemplates = new Set<string>()
  const usedMuscleGroups = new Map<string, number>()

  // Generate sessions for each day
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    if (restDays.includes(dayOfWeek)) {
      // Add rest day or active recovery
      const isActiveRecovery =
        goalAnalysis.intensity === 'advanced' &&
        Math.random() > 0.7

      sessions.push(createRestSession(weekNumber, dayOfWeek, isActiveRecovery))
      continue
    }

    // Select appropriate template
    const selectedTemplate = selectTemplateWithRotation(
      availableTemplates,
      goalAnalysis,
      usedTemplates,
      usedMuscleGroups,
      dayOfWeek
    )

    if (selectedTemplate) {
      sessions.push(createSessionFromTemplate(weekNumber, dayOfWeek, selectedTemplate))
      usedTemplates.add(selectedTemplate.id)
      updateMuscleGroupTracking(usedMuscleGroups, selectedTemplate, dayOfWeek)
    } else {
      // Fallback: create a rest day if no template available
      sessions.push(createRestSession(weekNumber, dayOfWeek))
    }
  }

  const totalWorkouts = sessions.filter(
    s => s.workout_type !== 'rest' && s.workout_type !== 'active_recovery'
  ).length

  return {
    week: weekNumber,
    sessions,
    totalWorkouts,
    restDays,
    estimatedWeeklyVolume: calculateWeeklyVolume(sessions),
  }
}

/**
 * Generates a complete multi-week plan
 */
export function generateMultiWeekPlan(
  weeksCount: number,
  goalAnalysis: GoalAnalysis,
  availableTemplates: WorkoutTemplate[],
  preferredRestDays?: number[]
): WeeklySchedule[] {
  const plan: WeeklySchedule[] = []

  for (let week = 1; week <= weeksCount; week++) {
    const weekSchedule = generateWeeklySchedule(
      week,
      goalAnalysis,
      availableTemplates,
      preferredRestDays
    )
    plan.push(weekSchedule)
  }

  return plan
}
