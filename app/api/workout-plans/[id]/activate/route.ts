import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/workout-plans/:id/activate
 * Activate a workout plan (sets status to active and started_at to now)
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

    // Check if there's already an active plan
    const { data: activePlans } = await supabase
      .from('workout_plans')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (activePlans && activePlans.length > 0) {
      // Check if it's not the current plan
      if (!activePlans.find(p => p.id === planId)) {
        return NextResponse.json(
          {
            error: `You already have an active plan: "${activePlans[0].name}". Please complete or archive it before activating another plan.`
          },
          { status: 409 }
        )
      }
    }

    // Activate the plan
    const { data: plan, error } = await supabase
      .from('workout_plans')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error activating workout plan:', error)
      return NextResponse.json(
        { error: 'Failed to activate workout plan' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      plan
    })
  } catch (error) {
    console.error('Error in activate endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
