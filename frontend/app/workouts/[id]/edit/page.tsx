import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { getWorkout } from '@/lib/workouts/actions'
import { WorkoutEditForm } from '@/components/workout-edit-form'

export const dynamic = 'force-dynamic'

export default async function EditWorkoutPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the workout with exercises via Python backend
  const { workout, error } = await getWorkout(id)

  if (error || !workout) {
    redirect('/workouts')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Workout</h1>
        <p className="text-muted-foreground">
          Update your workout details and exercises
        </p>
      </div>

      <WorkoutEditForm workout={workout} exercises={workout.exercises || []} />
    </div>
  )
}
