import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { WorkoutEditForm } from '@/components/workout-edit-form'

export const dynamic = 'force-dynamic'

export default async function EditWorkoutPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Fetch the workout with exercises
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (workoutError || !workout) {
    redirect('/workouts')
  }

  // Fetch exercises for this workout
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('workout_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Workout</h1>
        <p className="text-muted-foreground">
          Update your workout details and exercises
        </p>
      </div>

      <WorkoutEditForm workout={workout} exercises={exercises || []} />
    </div>
  )
}
