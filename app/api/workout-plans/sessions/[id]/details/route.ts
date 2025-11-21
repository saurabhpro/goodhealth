/**
 * Get workout plan session details with template exercises
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { id: sessionId } = await params

  // Fetch session with plan and template information
  const { data: session, error: sessionError } = await supabase
    .from('workout_plan_sessions')
    .select(`
      *,
      plan:workout_plans(*)
    `)
    .eq('id', sessionId)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .single()

  if (sessionError || !session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    )
  }

  // Check if this session belongs to the user
  if (session.plan.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    )
  }

  // Fetch template if available
  let template = null
  if (session.workout_template_id) {
    console.log('Fetching template:', session.workout_template_id)
    const { data: templateData, error: templateError } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('id', session.workout_template_id)
      // Exclude soft-deleted records
      .is('deleted_at', null)
      .single()

    if (templateError) {
      console.error('Error fetching template:', templateError)
    } else {
      console.log('Template found:', templateData?.name, 'with exercises:', templateData?.exercises?.length)
    }

    template = templateData
  }

  const exercises = session.exercises || template?.exercises || []
  console.log('Returning exercises count:', exercises.length)
  console.log('Session exercises:', session.exercises)
  console.log('Template exercises:', template?.exercises)

  return NextResponse.json({
    session,
    template,
    exercises
  })
}
