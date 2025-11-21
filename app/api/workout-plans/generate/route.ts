import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWorkoutPlanWithAI, type WeeklyWorkout } from '@/lib/workout-plans/ai-generator'
import type { Goal, UserWorkoutPreferences, Workout, UserWorkoutTemplate } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { goalId, name, description, weeksDuration, workoutsPerWeek, avgDuration } = body

    if (!goalId || !weeksDuration || !workoutsPerWeek) {
      return NextResponse.json(
        { error: 'Missing required fields: goalId, weeksDuration, workoutsPerWeek' },
        { status: 400 }
      )
    }

    // Fetch user's goal
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single()

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    // Fetch user preferences (optional)
    const { data: preferences } = await supabase
      .from('user_workout_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Fetch recent workout history (optional, last 10 workouts)
    const { data: workoutHistory } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10)

    // Fetch user's custom templates (optional)
    const { data: userTemplates } = await supabase
      .from('user_workout_templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Generate workout plan with AI
    const result = await generateWorkoutPlanWithAI({
      goal: goal as Goal,
      preferences: preferences as UserWorkoutPreferences | undefined,
      workoutHistory: (workoutHistory as Workout[]) || [],
      userTemplates: (userTemplates as UserWorkoutTemplate[]) || [],
      planConfig: {
        weeksCount: weeksDuration,
        workoutsPerWeek,
        avgDuration: avgDuration || 60,
      },
    })

    if (!result.success || !result.plan) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate workout plan' },
        { status: 500 }
      )
    }

    // Determine goal type from goal title/description
    const goalType = getGoalTypeFromGoal(goal as Goal)

    // Create the workout plan in the database
    const { data: workoutPlan, error: planError } = await supabase
      .from('workout_plans')
      .insert({
        user_id: user.id,
        goal_id: goalId,
        name: name || `${goal.title} - Workout Plan`,
        description: description || result.plan.rationale,
        weeks_duration: weeksDuration,
        workouts_per_week: workoutsPerWeek,
        avg_workout_duration: avgDuration || 60,
        goal_type: goalType,
        status: 'draft',
        ai_generated: true,
        ai_metadata: {
          rationale: result.plan.rationale,
          progressionStrategy: result.plan.progressionStrategy,
          keyConsiderations: result.plan.keyConsiderations,
        },
      })
      .select()
      .single()

    if (planError || !workoutPlan) {
      console.error('Error creating workout plan:', planError)
      return NextResponse.json(
        { error: 'Failed to save workout plan to database' },
        { status: 500 }
      )
    }

    // Create workout sessions from AI-generated schedule
    const sessions = result.plan.weeklySchedule.map((workout: WeeklyWorkout) => ({
      workout_plan_id: workoutPlan.id,
      week_number: workout.week,
      day_of_week: workout.day,
      name: workout.workoutType,
      description: workout.notes || `${workout.workoutType} workout for week ${workout.week}`,
      exercises: workout.exercises,
      estimated_duration: workout.duration,
      status: 'scheduled',
    }))

    const { error: sessionsError } = await supabase
      .from('workout_plan_sessions')
      .insert(sessions)

    if (sessionsError) {
      console.error('Error creating workout sessions:', sessionsError)
      // Note: Plan is already created, so we don't fail completely
      // User can still use the plan, just without pre-populated sessions
    }

    return NextResponse.json({
      success: true,
      planId: workoutPlan.id,
      summary: {
        totalWorkouts: sessions.length,
        weeks: weeksDuration,
        workoutsPerWeek,
      },
    })
  } catch (error) {
    console.error('Error in AI generation endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
