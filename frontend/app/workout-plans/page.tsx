import { Suspense } from 'react'
import { getWorkoutPlans } from '@/lib/workout-plans/actions'
import { WorkoutPlansClient } from './client'

// Server Component - fetches data before rendering
export default async function WorkoutPlansPage() {
  const { plans } = await getWorkoutPlans()

  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading plans...</div>
        </div>
      </div>
    }>
      <WorkoutPlansClient initialPlans={plans || []} />
    </Suspense>
  )
}
