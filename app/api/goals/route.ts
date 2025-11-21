import { NextResponse } from 'next/server'
import { getGoals } from '@/lib/goals/actions'

export async function GET() {
  try {
    const result = await getGoals()

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.goals || [])
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}
