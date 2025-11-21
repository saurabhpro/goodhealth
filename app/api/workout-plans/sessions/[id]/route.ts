import { NextResponse } from 'next/server'
import { updatePlanSession } from '@/lib/workout-plans/session-actions'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const result = await updatePlanSession(id, body)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, session: result.session })
  } catch (error) {
    console.error('Error updating plan session:', error)
    return NextResponse.json(
      { error: 'Failed to update plan session' },
      { status: 500 }
    )
  }
}
