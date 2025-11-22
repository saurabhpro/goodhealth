/**
 * Workout Plan Generator - Main API for generating workout plans
 * Phase 3: API Layer
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Goal, Workout, WorkoutTemplate, WorkoutPlanSession } from '@/types'
import {
  analyzeGoal,
  analyzeWorkoutHistory,
  generateMultiWeekPlan,
  applyProgressiveOverload,
  type GoalType,
} from './planning'

export interface GeneratePlanRequest {
  goalId: string
  weeksCount: number // 1-12
  workoutsPerWeek?: number // 3-7 (optional, will be calculated from goal if not provided)
  avgDuration?: number // minutes (optional)
  startDate?: string // ISO date (optional, defaults to today)
  name?: string // Plan name (optional, will be generated from goal if not provided)
  description?: string // Plan description (optional)
  preferences?: {
    preferredDays?: number[] // [1,3,5] for Mon/Wed/Fri
    avoidDays?: number[]
    focusAreas?: string[] // ['upper_body', 'cardio']
  }
}

export interface GeneratePlanResponse {
  success: boolean
  planId?: string
  plan?: {
    id: string
    name: string
    goal_type: GoalType
    weeks_duration: number
    workouts_per_week: number
    total_sessions: number
    status: string
  }
  schedule?: {
    [key: string]: WorkoutPlanSession[] // week1, week2, etc.
  }
  summary?: {
    totalWorkouts: number
    avgWorkoutsPerWeek: number
    cardioSessions: number
    strengthSessions: number
    estimatedTotalTime: number
  }
  error?: string
}

/**
 * Main function: Generates a complete workout plan
 */
export async function generateWorkoutPlan(
  request: GeneratePlanRequest
): Promise<GeneratePlanResponse> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // 1. Fetch the goal
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', request.goalId)
      .eq('user_id', user.id)
      .single()

    if (goalError || !goal) {
      return { success: false, error: 'Goal not found' }
    }

    // 2. Fetch user's workout history
    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(100)

    const workoutHistory = analyzeWorkoutHistory((workouts as Workout[]) || [])

    // 3. Analyze goal and generate recommendations
    const goalAnalysis = analyzeGoal(goal as Goal, workoutHistory)

    // Override workouts per week if provided
    if (request.workoutsPerWeek) {
      goalAnalysis.recommendations.workoutsPerWeek = Math.min(
        Math.max(request.workoutsPerWeek, 1),
        7
      )
    }

    // Override average duration if provided
    if (request.avgDuration) {
      goalAnalysis.recommendations.avgDuration = request.avgDuration
    }

    // 4. Fetch available workout templates (user's templates + public templates)
    const { data: templates, error: templatesError } = await supabase
      .from('workout_templates')
      .select('*')
      .or(`user_id.eq.${user.id},is_public.eq.true`)

    if (templatesError || !templates || templates.length === 0) {
      return {
        success: false,
        error: 'No workout templates found. Please create some workout templates first or ensure public templates are available.',
      }
    }

    // 5. Generate the weekly schedules
    const weeklySchedules = generateMultiWeekPlan(
      request.weeksCount,
      goalAnalysis,
      templates as WorkoutTemplate[],
      request.preferences?.preferredDays
    )

    // 6. Apply progressive overload to each week's sessions
    for (const weekSchedule of weeklySchedules) {
      for (const session of weekSchedule.sessions) {
        if (session.workout_type !== 'rest' && session.workout_type !== 'active_recovery') {
          session.exercises = applyProgressiveOverload(
            session.exercises,
            weekSchedule.week,
            goalAnalysis.goalType
          )
        }
      }
    }

    // 7. Create the workout plan in database
    const planName = request.name || `${goal.title} - ${request.weeksCount} Week Plan`
    const planDescription = request.description || `AI-generated ${request.weeksCount}-week plan for ${goal.title}`

    const { data: createdPlan, error: planError } = await supabase
      .from('workout_plans')
      .insert({
        user_id: user.id,
        name: planName,
        description: planDescription,
        goal_id: request.goalId,
        goal_type: goalAnalysis.goalType,
        weeks_duration: request.weeksCount,
        workouts_per_week: goalAnalysis.recommendations.workoutsPerWeek,
        avg_workout_duration: goalAnalysis.recommendations.avgDuration,
        status: 'draft',
        started_at: null,
      })
      .select()
      .single()

    if (planError || !createdPlan) {
      console.error('Error creating plan:', planError)
      return { success: false, error: `Failed to create plan: ${planError?.message}` }
    }

    // 8. Create all sessions in database
    const sessionsToInsert = weeklySchedules.flatMap(week =>
      week.sessions.map(session => ({
        plan_id: createdPlan.id,
        week_number: session.week_number,
        day_of_week: session.day_of_week,
        day_name: session.day_name,
        session_order: session.session_order,
        workout_template_id: session.workout_template_id,
        workout_name: session.workout_name,
        workout_type: session.workout_type,
        estimated_duration: session.estimated_duration,
        exercises: session.exercises,
        muscle_groups: session.muscle_groups,
        intensity_level: session.intensity_level,
        status: session.status,
        notes: session.notes,
      }))
    )

    const { error: sessionsError } = await supabase
      .from('workout_plan_sessions')
      .insert(sessionsToInsert)

    if (sessionsError) {
      console.error('Error creating sessions:', sessionsError)
      // Try to clean up the plan
      await supabase.from('workout_plans').delete().eq('id', createdPlan.id)
      return {
        success: false,
        error: `Failed to create sessions: ${sessionsError.message}`,
      }
    }

    // 9. Calculate summary statistics
    let totalWorkouts = 0
    let cardioSessions = 0
    let strengthSessions = 0
    let estimatedTotalTime = 0

    for (const week of weeklySchedules) {
      for (const session of week.sessions) {
        if (session.workout_type !== 'rest') {
          totalWorkouts++
          estimatedTotalTime += session.estimated_duration || 0

          if (session.workout_type === 'cardio') {
            cardioSessions++
          } else if (session.workout_type === 'strength') {
            strengthSessions++
          }
        }
      }
    }

    // 10. Build schedule response - fetch the created sessions
    const { data: createdSessions } = await supabase
      .from('workout_plan_sessions')
      .select('*')
      .eq('plan_id', createdPlan.id)
      .order('week_number')
      .order('day_of_week')

    const schedule: { [key: string]: WorkoutPlanSession[] } = {}
    if (createdSessions) {
      for (const session of createdSessions) {
        const weekKey = `week${session.week_number}`
        if (!schedule[weekKey]) {
          schedule[weekKey] = []
        }
        schedule[weekKey].push(session as WorkoutPlanSession)
      }
    }

    revalidatePath('/workout-plans')

    return {
      success: true,
      planId: createdPlan.id,
      plan: {
        id: createdPlan.id,
        name: createdPlan.name,
        goal_type: createdPlan.goal_type as GoalType,
        weeks_duration: createdPlan.weeks_duration,
        workouts_per_week: createdPlan.workouts_per_week,
        total_sessions: totalWorkouts,
        status: createdPlan.status,
      },
      schedule,
      summary: {
        totalWorkouts,
        avgWorkoutsPerWeek: totalWorkouts / request.weeksCount,
        cardioSessions,
        strengthSessions,
        estimatedTotalTime,
      },
    }
  } catch (error) {
    console.error('Error generating workout plan:', error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Regenerates a workout plan from a specific week onwards
 */
export async function regenerateWorkoutPlan(
  planId: string,
  startFromWeek?: number,
  adjustDifficulty?: 'easier' | 'harder' | 'maintain'
): Promise<{ success: boolean; error?: string; regeneratedWeeks?: number[] }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // Fetch the plan
    const { data: plan, error: planError } = await supabase
      .from('workout_plans')
      .select('*, goals(*)')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single()

    if (planError || !plan) {
      return { success: false, error: 'Plan not found' }
    }

    const fromWeek = startFromWeek || 1
    const toWeek = plan.weeks_duration

    // Delete existing sessions for the weeks we're regenerating
    const { error: deleteError } = await supabase
      .from('workout_plan_sessions')
      .delete()
      .eq('plan_id', planId)
      .gte('week_number', fromWeek)
      .lte('week_number', toWeek)

    if (deleteError) {
      return { success: false, error: `Failed to delete old sessions: ${deleteError.message}` }
    }

    // Fetch workout history and templates
    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(100)

    const { data: templates } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('user_id', user.id)

    if (!templates || templates.length === 0) {
      return { success: false, error: 'No workout templates available' }
    }

    const workoutHistory = analyzeWorkoutHistory((workouts as Workout[]) || [])
    const goalAnalysis = analyzeGoal(plan.goals as unknown as Goal, workoutHistory)

    // Adjust intensity if requested
    if (adjustDifficulty === 'easier') {
      goalAnalysis.recommendations.workoutsPerWeek = Math.max(
        3,
        goalAnalysis.recommendations.workoutsPerWeek - 1
      )
    } else if (adjustDifficulty === 'harder') {
      goalAnalysis.recommendations.workoutsPerWeek = Math.min(
        6,
        goalAnalysis.recommendations.workoutsPerWeek + 1
      )
    }

    // Generate new schedules for the specified weeks
    const weeksToGenerate = toWeek - fromWeek + 1
    const weeklySchedules = generateMultiWeekPlan(
      weeksToGenerate,
      goalAnalysis,
      templates as WorkoutTemplate[]
    )

    // Apply progressive overload and insert
    const sessionsToInsert = []
    for (const weekSchedule of weeklySchedules) {
      const adjustedWeekNumber = fromWeek + weekSchedule.week - 1
      for (const session of weekSchedule.sessions) {
        if (session.workout_type !== 'rest' && session.workout_type !== 'active_recovery') {
          session.exercises = applyProgressiveOverload(
            session.exercises,
            adjustedWeekNumber,
            goalAnalysis.goalType
          )
        }

        sessionsToInsert.push({
          plan_id: planId,
          week_number: adjustedWeekNumber,
          day_of_week: session.day_of_week,
          day_name: session.day_name,
          session_order: session.session_order,
          workout_template_id: session.workout_template_id,
          workout_name: session.workout_name,
          workout_type: session.workout_type,
          estimated_duration: session.estimated_duration,
          exercises: session.exercises,
          muscle_groups: session.muscle_groups,
          intensity_level: session.intensity_level,
          status: 'scheduled',
          notes: session.notes,
        })
      }
    }

    const { error: insertError } = await supabase
      .from('workout_plan_sessions')
      .insert(sessionsToInsert)

    if (insertError) {
      return { success: false, error: `Failed to create new sessions: ${insertError.message}` }
    }

    revalidatePath(`/workout-plans/${planId}`)

    const regeneratedWeeks = Array.from({ length: weeksToGenerate }, (_, i) => fromWeek + i)

    return {
      success: true,
      regeneratedWeeks,
    }
  } catch (error) {
    console.error('Error regenerating plan:', error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
