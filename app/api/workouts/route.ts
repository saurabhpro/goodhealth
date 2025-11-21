import { NextResponse } from 'next/server'
import { getWorkouts } from '@/lib/workouts/actions'

export async function GET() {
  try {
    const result = await getWorkouts()

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.workouts || [])
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    )
  }
}
