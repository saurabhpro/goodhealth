import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getUser } from '@/lib/auth/actions'
import { getWorkouts } from '@/lib/workouts/actions'
import { getGoals } from '@/lib/goals/actions'
import { redirect } from 'next/navigation'
import { Camera } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch data
  const { workouts } = await getWorkouts()
  const { goals } = await getGoals()

  // Calculate statistics
  const totalWorkouts = workouts.length
  const activeGoals = goals.filter(g => !g.achieved).length
  const totalExercises = workouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0)

  // Calculate workout streak
  const calculateStreak = () => {
    if (workouts.length === 0) return 0

    const sortedWorkouts = [...workouts].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    let streak = 0
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.date)
      workoutDate.setHours(0, 0, 0, 0)

      const daysDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff === streak) {
        streak++
      } else if (daysDiff > streak) {
        break
      }
    }

    return streak
  }

  const currentStreak = calculateStreak()

  const stats = [
    {
      title: 'Total Workouts',
      value: totalWorkouts.toString(),
      description: 'All time workouts',
    },
    {
      title: 'Active Goals',
      value: activeGoals.toString(),
      description: 'Goals in progress',
    },
    {
      title: 'Current Streak',
      value: currentStreak.toString(),
      description: currentStreak === 1 ? 'Day in a row' : 'Days in a row',
    },
    {
      title: 'Total Exercises',
      value: totalExercises.toString(),
      description: 'Exercises completed',
    },
  ]

  const quickActions = [
    {
      title: 'Log Workout',
      description: 'Record your latest workout session',
      href: '/workouts/new',
      variant: 'default' as const,
    },
    {
      title: 'View Progress',
      description: 'Check your fitness progress',
      href: '/progress',
      variant: 'outline' as const,
    },
    {
      title: 'Set New Goal',
      description: 'Create a new fitness goal',
      href: '/goals/new',
      variant: 'outline' as const,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your fitness journey
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.title}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title}>
              <CardHeader>
                <CardTitle>{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant={action.variant} className="w-full" asChild>
                  <Link href={action.href}>Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Recent Activity</h2>
          {workouts.length > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/workouts">View All</Link>
            </Button>
          )}
        </div>
        {workouts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No recent activity yet</p>
                <Button asChild>
                  <Link href="/workouts/new">Log Your First Workout</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {workouts.slice(0, 5).map((workout) => {
              const selfie = workout.workout_selfies?.[0]

              return (
                <Link href={`/workouts/${workout.id}`} key={workout.id}>
                  <Card className="cursor-pointer hover:border-primary transition-colors overflow-hidden">
                    <div className="flex gap-3 p-3">
                      {/* Selfie thumbnail on the left */}
                      {selfie?.signedUrl && (
                        <div className="relative w-20 h-20 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                          <Image
                            src={selfie.signedUrl}
                            alt={selfie.caption || 'Workout selfie'}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                            sizes="80px"
                            quality={80}
                          />
                        </div>
                      )}

                      {/* Content on the right */}
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold leading-none tracking-tight">{workout.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(workout.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <Badge variant="secondary" className="flex-shrink-0 text-xs">
                              {workout.exercises?.length || 0} exercises
                            </Badge>
                          </div>
                          {(workout.duration_minutes || workout.description || selfie) && (
                            <div className="flex gap-2 text-xs text-muted-foreground items-center flex-wrap">
                              {workout.duration_minutes && (
                                <span>{workout.duration_minutes} min</span>
                              )}
                              {workout.description && (
                                <>
                                  {workout.duration_minutes && <span>•</span>}
                                  <span className="truncate line-clamp-1">{workout.description}</span>
                                </>
                              )}
                              {selfie && !workout.description && (
                                <>
                                  {workout.duration_minutes && <span>•</span>}
                                  <div className="flex items-center gap-1">
                                    <Camera className="h-3 w-3" />
                                    <span>Photo</span>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
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
    </div>
  )
}
