import { NextResponse } from 'next/server'
import { generateWorkoutPlan } from '@/lib/workout-plans/generator'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      goalId,
      name,
      description,
      weeksDuration,
      workoutsPerWeek,
      avgDuration,
      preferences
    } = body

    // Validate required fields
    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      )
    }

    // Validate ranges
    if (weeksDuration < 1 || weeksDuration > 12) {
      return NextResponse.json(
        { error: 'Weeks duration must be between 1 and 12' },
        { status: 400 }
      )
    }

    if (workoutsPerWeek < 3 || workoutsPerWeek > 7) {
      return NextResponse.json(
        { error: 'Workouts per week must be between 3 and 7' },
        { status: 400 }
      )
    }

    // Generate the workout plan
    const result = await generateWorkoutPlan({
      goalId,
      name,
      description,
      weeksCount: weeksDuration,
      workoutsPerWeek,
      avgDuration,
      preferences
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      planId: result.plan!.id,
      plan: result.plan,
      schedule: result.schedule,
      summary: result.summary
    })
  } catch (error) {
    console.error('Error generating workout plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate workout plan' },
      { status: 500 }
    )
  }
}
