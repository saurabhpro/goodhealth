import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getUser } from '@/lib/auth/actions'
import { getWorkouts } from '@/lib/workouts/actions'
import { redirect } from 'next/navigation'
import { Camera } from 'lucide-react'

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

export default async function WorkoutsPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch workouts from Supabase
  const { workouts } = await getWorkouts()

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
          {workouts.map((workout) => {
            const selfie = workout.workout_selfies?.[0]

            return (
              <Link href={`/workouts/${workout.id}`} key={workout.id}>
                <Card className="cursor-pointer hover:border-primary transition-colors overflow-hidden">
                  <div className="flex gap-4 p-4">
                    {/* Selfie thumbnail on the left */}
                    {selfie?.signedUrl && (
                      <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                        <Image
                          src={selfie.signedUrl}
                          alt={selfie.caption || 'Workout selfie'}
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                          sizes="96px"
                          quality={80}
                        />
                      </div>
                    )}

                    {/* Content on the right */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold leading-none tracking-tight">{workout.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{workout.description || 'No description'}</p>
                          </div>
                          <Badge className="flex-shrink-0">{new Date(workout.date).toLocaleDateString()}</Badge>
                        </div>
                        <div className="flex gap-3 text-sm text-muted-foreground items-center flex-wrap">
                          {workout.duration_minutes && (
                            <>
                              <span>{workout.duration_minutes} minutes</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{workout.exercises?.length || 0} exercises</span>
                          {selfie && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                <span>Photo</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
