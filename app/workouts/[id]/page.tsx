import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { WorkoutSelfieDisplay } from '@/components/workout-selfie-display'

export const dynamic = 'force-dynamic'

interface Exercise {
  id: string
  name: string
  exercise_type: string
  // Strength fields
  sets?: number
  reps?: number
  weight?: number
  weight_unit?: string
  // Cardio fields
  duration_minutes?: number
  distance?: number
  distance_unit?: string
  speed?: number
  calories?: number
  resistance_level?: number
  incline?: number
  notes?: string
}

interface Workout {
  id: string
  name: string
  description?: string
  date: string
  duration_minutes?: number
  effort_level?: number
  exercises: Exercise[]
}

const effortLabels = ['', 'Very Easy', 'Easy', 'Moderate', 'Hard', 'Very Hard', 'Maximum']
const effortColors = ['', 'bg-green-500', 'bg-green-600', 'bg-yellow-500', 'bg-orange-600', 'bg-red-600', 'bg-red-800']

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Fetch workout with exercises
  const { data: workout, error } = await supabase
    .from('workouts')
    .select(`
      *,
      exercises (*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !workout) {
    notFound()
  }

  const typedWorkout = workout as unknown as Workout

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" asChild>
            <Link href="/workouts">← Back to Workouts</Link>
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{typedWorkout.name}</h1>
            <p className="text-muted-foreground">
              {new Date(typedWorkout.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Workout Summary and Selfie Grid */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Workout Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Workout Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {typedWorkout.duration_minutes && (
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-2xl font-bold">{typedWorkout.duration_minutes} min</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Exercises</p>
                <p className="text-2xl font-bold">{typedWorkout.exercises?.length || 0}</p>
              </div>
              {typedWorkout.effort_level && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground mb-2">Effort Level</p>
                  <Badge className={effortColors[typedWorkout.effort_level]}>
                    {effortLabels[typedWorkout.effort_level]}
                  </Badge>
                </div>
              )}
            </div>
            {typedWorkout.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{typedWorkout.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Selfie */}
        <WorkoutSelfieDisplay workoutId={id} />
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Exercises</h2>

        {typedWorkout.exercises && typedWorkout.exercises.length > 0 ? (
          <div className="space-y-4">
            {typedWorkout.exercises.map((exercise, index) => (
              <Card key={exercise.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-muted-foreground">#{index + 1}</span>
                        {exercise.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {exercise.exercise_type === 'cardio' ? '🏃 Cardio' :
                           exercise.exercise_type === 'functional' ? '⚡ Functional' :
                           '💪 Strength'}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {/* Strength Exercise Details */}
                    {exercise.exercise_type === 'strength' && (
                      <>
                        {exercise.sets && (
                          <div>
                            <p className="text-xs text-muted-foreground">Sets</p>
                            <p className="text-lg font-semibold">{exercise.sets}</p>
                          </div>
                        )}
                        {exercise.reps && (
                          <div>
                            <p className="text-xs text-muted-foreground">Reps</p>
                            <p className="text-lg font-semibold">{exercise.reps}</p>
                          </div>
                        )}
                        {exercise.weight && (
                          <div>
                            <p className="text-xs text-muted-foreground">Weight</p>
                            <p className="text-lg font-semibold">
                              {exercise.weight} {exercise.weight_unit || 'kg'}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Cardio Exercise Details */}
                    {exercise.exercise_type === 'cardio' && (
                      <>
                        {exercise.duration_minutes && (
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="text-lg font-semibold">{exercise.duration_minutes} min</p>
                          </div>
                        )}
                        {exercise.distance && (
                          <div>
                            <p className="text-xs text-muted-foreground">Distance</p>
                            <p className="text-lg font-semibold">
                              {exercise.distance} {exercise.distance_unit || 'km'}
                            </p>
                          </div>
                        )}
                        {exercise.speed && (
                          <div>
                            <p className="text-xs text-muted-foreground">Speed</p>
                            <p className="text-lg font-semibold">{exercise.speed} km/h</p>
                          </div>
                        )}
                        {exercise.resistance_level && (
                          <div>
                            <p className="text-xs text-muted-foreground">Resistance</p>
                            <p className="text-lg font-semibold">Level {exercise.resistance_level}</p>
                          </div>
                        )}
                        {exercise.incline && (
                          <div>
                            <p className="text-xs text-muted-foreground">Incline</p>
                            <p className="text-lg font-semibold">{exercise.incline}%</p>
                          </div>
                        )}
                        {exercise.calories && (
                          <div>
                            <p className="text-xs text-muted-foreground">Calories</p>
                            <p className="text-lg font-semibold">{exercise.calories} kcal</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {exercise.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{exercise.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No exercises recorded for this workout
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
