import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getUser } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'

export default async function WorkoutsPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Placeholder for workouts data - will be fetched from Supabase later
  const workouts: any[] = []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Workouts</h1>
          <p className="text-muted-foreground">
            Track and manage your workout sessions
          </p>
        </div>
        <Button asChild>
          <Link href="/workouts/new">Log New Workout</Link>
        </Button>
      </div>

      {/* Workouts List */}
      {workouts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No workouts yet</h3>
              <p className="text-muted-foreground mb-6">
                Start tracking your fitness journey by logging your first workout
              </p>
              <Button asChild>
                <Link href="/workouts/new">Log Your First Workout</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {workouts.map((workout) => (
            <Card key={workout.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{workout.name}</CardTitle>
                    <CardDescription>{workout.description}</CardDescription>
                  </div>
                  <Badge>{workout.date}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{workout.duration_minutes} minutes</span>
                  <span>•</span>
                  <span>{workout.exercises_count} exercises</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
