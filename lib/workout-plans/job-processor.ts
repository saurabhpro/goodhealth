/**
 * Background Job Processor for AI Workout Plan Generation
 * Handles async processing of workout plan generation jobs
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { generateWorkoutPlanWithAI, type WeeklyWorkout } from './ai-generator'
import type { Goal, UserWorkoutPreferences, Workout, UserWorkoutTemplate } from '@/types'

export interface JobRequest {
  goalId: string
  name?: string
  description?: string
  weeksDuration: number
  workoutsPerWeek: number
  avgDuration: number
}

/**
 * Process a workout plan generation job in the background
 */
export async function processWorkoutPlanJob(jobId: string) {
  const supabase = await createClient()

  try {
    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('workout_plan_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      console.error('Job not found:', jobId)
      return
    }

    // Update status to processing
    await supabase
      .from('workout_plan_generation_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId)

    const requestData = job.request_data as JobRequest
    const userId = job.user_id

    // Fetch user's goal
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', requestData.goalId)
      .eq('user_id', userId)
      .single()

    if (goalError || !goal) {
      await supabase
        .from('workout_plan_generation_jobs')
        .update({
          status: 'failed',
          error_message: 'Goal not found'
        })
        .eq('id', jobId)
      return
    }

    // Fetch user profile for age, gender, height
    const { data: profile } = await supabase
      .from('profiles')
      .select('date_of_birth, gender, height_cm, fitness_level, medical_conditions, injuries')
      .eq('id', userId)
      .single()

    // Fetch latest body measurements
    const { data: latestMeasurement } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .limit(1)
      .single()

    // Fetch user preferences (optional)
    const { data: preferences } = await supabase
      .from('user_workout_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Fetch recent workout history (last 30 days for exercise weight tracking)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: workoutHistory } = await supabase
      .from('workouts')
      .select('*, exercises(*)')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    // Fetch user's custom templates (optional)
    const { data: userTemplates } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    // Build AI request with all personalization data
    const aiRequest = {
      goal: goal as Goal,
      preferences: preferences as UserWorkoutPreferences | undefined,
      workoutHistory: (workoutHistory as Workout[]) || [],
      userTemplates: (userTemplates as UserWorkoutTemplate[]) || [],
      userProfile: profile ? {
        dateOfBirth: profile.date_of_birth,
        gender: profile.gender,
        heightCm: profile.height_cm,
        fitnessLevel: profile.fitness_level,
        medicalConditions: profile.medical_conditions,
        injuries: profile.injuries,
      } : undefined,
      latestMeasurements: latestMeasurement ? {
        weight: latestMeasurement.weight,
        bodyFatPercentage: latestMeasurement.body_fat_percentage,
        muscleMass: latestMeasurement.muscle_mass,
        measurementDate: latestMeasurement.measured_at,
      } : undefined,
      planConfig: {
        weeksCount: requestData.weeksDuration,
        workoutsPerWeek: requestData.workoutsPerWeek,
        avgDuration: requestData.avgDuration || 60,
      },
    }

    // Generate workout plan with AI
    const result = await generateWorkoutPlanWithAI(aiRequest)

    if (!result.success || !result.plan) {
      await supabase
        .from('workout_plan_generation_jobs')
        .update({
          status: 'failed',
          error_message: result.error || 'Failed to generate workout plan'
        })
        .eq('id', jobId)
      return
    }

    // Determine goal type from goal title/description
    const goalType = getGoalTypeFromGoal(goal as Goal)

    // Create the workout plan in the database
    const aiGeneratedDescription = requestData.description ||
      `${result.plan.rationale}\n\n**Progression Strategy:**\n${result.plan.progressionStrategy}\n\n**Key Considerations:**\n${result.plan.keyConsiderations.map(c => `• ${c}`).join('\n')}`

    const { data: workoutPlan, error: planError } = await supabase
      .from('workout_plans')
      .insert({
        user_id: userId,
        goal_id: requestData.goalId,
        name: requestData.name || `${goal.title} - AI Workout Plan`,
        description: aiGeneratedDescription,
        weeks_duration: requestData.weeksDuration,
        workouts_per_week: requestData.workoutsPerWeek,
        avg_workout_duration: requestData.avgDuration || 60,
        goal_type: goalType,
        status: 'draft',
      })
      .select()
      .single()

    if (planError || !workoutPlan) {
      console.error('Error creating workout plan:', planError)
      await supabase
        .from('workout_plan_generation_jobs')
        .update({
          status: 'failed',
          error_message: 'Failed to save workout plan to database'
        })
        .eq('id', jobId)
      return
    }

    // Create workout sessions from AI-generated schedule
    const sessions = result.plan.weeklySchedule.map((workout: WeeklyWorkout) => ({
      plan_id: workoutPlan.id,
      week_number: workout.week,
      day_of_week: workout.day,
      day_name: workout.dayName,
      workout_name: workout.workoutType,
      workout_type: 'mixed',
      notes: workout.notes || `${workout.workoutType} workout for week ${workout.week}`,
      exercises: workout.exercises,
      estimated_duration: workout.duration,
      intensity_level: workout.intensity === 'low' ? 'low' : workout.intensity === 'high' ? 'high' : 'moderate',
      status: 'scheduled',
    }))

    const { error: sessionsError } = await supabase
      .from('workout_plan_sessions')
      .insert(sessions)

    if (sessionsError) {
      console.error('Error creating workout sessions:', sessionsError)
      // Note: Plan is already created, so we mark as completed with a warning
    }

    // Mark job as completed with AI request/response for debugging
    await supabase
      .from('workout_plan_generation_jobs')
      .update({
        status: 'completed',
        plan_id: workoutPlan.id,
        ai_request_data: aiRequest,
        ai_response_data: result.plan
      })
      .eq('id', jobId)

  } catch (error) {
    console.error('Error processing job:', error)
    await supabase
      .from('workout_plan_generation_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Internal server error'
      })
      .eq('id', jobId)
  }
}

function getGoalTypeFromGoal(goal: Goal): string {
  const title = goal.title.toLowerCase()
  const desc = goal.description?.toLowerCase() || ''

  if (title.includes('weight loss') || desc.includes('lose weight') || title.includes('cut')) {
    return 'weight_loss'
  }
  if (title.includes('muscle') || title.includes('bulk') || desc.includes('build muscle')) {
    return 'muscle_building'
  }
  if (title.includes('endurance') || title.includes('cardio') || title.includes('running')) {
    return 'endurance'
  }
  return 'general_fitness'
}
