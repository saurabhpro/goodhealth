import { NextResponse } from 'next/server'
import { completePlanSession } from '@/lib/workout-plans/session-actions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const result = await completePlanSession(id, body.workoutId, body.notes)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, session: result.session })
  } catch (error) {
    console.error('Error completing plan session:', error)
    return NextResponse.json(
      { error: 'Failed to complete plan session' },
      { status: 500 }
    )
  }
}
