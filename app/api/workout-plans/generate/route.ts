import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processWorkoutPlanJob } from '@/lib/workout-plans/job-processor'

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
    const { goalId, name, description, weeksDuration, workoutsPerWeek, avgDuration, startDate } = body

    if (!goalId || !weeksDuration || !workoutsPerWeek) {
      return NextResponse.json(
        { error: 'Missing required fields: goalId, weeksDuration, workoutsPerWeek' },
        { status: 400 }
      )
    }

    // Validate start date if provided
    if (startDate) {
      const parsedDate = new Date(startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start date format' },
          { status: 400 }
        )
      }

      if (parsedDate < today) {
        return NextResponse.json(
          { error: 'Start date cannot be in the past' },
          { status: 400 }
        )
      }
    }

    // Verify goal exists and belongs to user
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('id, title')
      .eq('id', goalId)
      .eq('user_id', user.id)
      // Exclude soft-deleted records
      .is('deleted_at', null)
      .single()

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    // Check for existing active or draft plans for this goal (exclude soft-deleted)
    const { data: existingPlans } = await supabase
      .from('workout_plans')
      .select('id, status, name')
      .eq('user_id', user.id)
      .eq('goal_id', goalId)
      .in('status', ['active', 'draft'])
      .is('deleted_at', null) // Exclude soft-deleted plans

    if (existingPlans && existingPlans.length > 0) {
      const existingPlan = existingPlans[0]
      return NextResponse.json(
        {
          error: `You already have ${existingPlan.status === 'active' ? 'an active' : 'a draft'} workout plan for this goal: "${existingPlan.name}". Please deactivate or delete it before creating a new one.`,
          existingPlanId: existingPlan.id,
          existingPlanStatus: existingPlan.status
        },
        { status: 409 } // Conflict
      )
    }

    // Create a job record
    const { data: job, error: jobError } = await supabase
      .from('workout_plan_generation_jobs')
      .insert({
        user_id: user.id,
        status: 'pending',
        request_data: {
          goalId,
          name,
          description,
          weeksDuration,
          workoutsPerWeek,
          avgDuration: avgDuration || 60,
          startDate: startDate || null,
        },
      })
      .select()
      .single()

    if (jobError || !job) {
      console.error('Error creating job:', jobError)
      return NextResponse.json(
        { error: 'Failed to create generation job' },
        { status: 500 }
      )
    }

    // Trigger background processing (non-blocking)
    // In production, this would be handled by a queue system (e.g., BullMQ, AWS SQS)
    // For now, we use a simple async call with error handling
    processWorkoutPlanJob(job.id).catch(error => {
      console.error('Background job processing error:', error)
    })

    // Return immediately with job ID
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'pending',
      message: 'Workout plan generation started',
    })
  } catch (error) {
    console.error('Error in AI generation endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
