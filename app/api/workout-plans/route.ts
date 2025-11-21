import { NextResponse } from 'next/server'
import { getWorkoutPlans } from '@/lib/workout-plans/actions'

export async function GET() {
  try {
    const result = await getWorkoutPlans()

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.plans || [])
  } catch (error) {
    console.error('Error fetching workout plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout plans' },
      { status: 500 }
    )
  }
}
