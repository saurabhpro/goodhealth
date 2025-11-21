import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/workout-plans/jobs/:id
 * Check the status of a workout plan generation job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: jobId } = await params

    // Fetch job status
    const { data: job, error: jobError } = await supabase
      .from('workout_plan_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Return job status
    return NextResponse.json({
      id: job.id,
      status: job.status,
      planId: job.plan_id,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    })
  } catch (error) {
    console.error('Error fetching job status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
