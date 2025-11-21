import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/workout-plans/:id/deactivate
 * Archive/deactivate a workout plan
 */
export async function POST(
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

    const { id: planId } = await params

    // Update plan status to archived
    const { data: plan, error } = await supabase
      .from('workout_plans')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error archiving workout plan:', error)
      return NextResponse.json(
        { error: 'Failed to archive workout plan' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      plan
    })
  } catch (error) {
    console.error('Error in deactivate endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
