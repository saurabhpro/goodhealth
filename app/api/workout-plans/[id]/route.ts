import { NextResponse } from 'next/server'
import { getWorkoutPlan, deleteWorkoutPlan } from '@/lib/workout-plans/actions'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await getWorkoutPlan(id)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    return NextResponse.json(result.plan)
  } catch (error) {
    console.error('Error fetching workout plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout plan' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await deleteWorkoutPlan(id)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete workout plan' },
      { status: 500 }
    )
  }
}
