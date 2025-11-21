import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getUser } from '@/lib/auth/actions'
import { getWorkouts } from '@/lib/workouts/actions'
import { getGoals } from '@/lib/goals/actions'
import { getWorkoutPlans } from '@/lib/workout-plans/actions'
import { redirect } from 'next/navigation'
import {
  Plus,
  Dumbbell,
  Target,
  Flame,
  Calendar,
  TrendingUp,
  Clock,
  Camera
} from 'lucide-react'
import { MotivationalQuote } from '@/components/motivational-quote'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch data
  const { workouts } = await getWorkouts()
  const { goals } = await getGoals()
  const { plans } = await getWorkoutPlans()

  // Find active workout plan
  const activePlan = plans.find(p => p.status === 'active' || p.status === 'draft')

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

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Motivational Quote */}
      <MotivationalQuote />

      {/* Compact Stats Row - Single row on all devices */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-2">
            <div className="flex flex-col items-center text-center gap-1">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-1.5">
                <Dumbbell className="h-3 w-3 text-blue-600 dark:text-blue-300" />
              </div>
              <p className="text-[10px] text-muted-foreground truncate w-full">Workouts</p>
              <p className="text-base font-bold">{totalWorkouts}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-2">
            <div className="flex flex-col items-center text-center gap-1">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-1.5">
                <Target className="h-3 w-3 text-green-600 dark:text-green-300" />
              </div>
              <p className="text-[10px] text-muted-foreground truncate w-full">Goals</p>
              <p className="text-base font-bold">{activeGoals}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-2">
            <div className="flex flex-col items-center text-center gap-1">
              <div className="rounded-full bg-orange-100 dark:bg-orange-900 p-1.5">
                <Flame className="h-3 w-3 text-orange-600 dark:text-orange-300" />
              </div>
              <p className="text-[10px] text-muted-foreground truncate w-full">Streak</p>
              <p className="text-base font-bold">{currentStreak}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-2">
            <div className="flex flex-col items-center text-center gap-1">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-1.5">
                <TrendingUp className="h-3 w-3 text-purple-600 dark:text-purple-300" />
              </div>
              <p className="text-[10px] text-muted-foreground truncate w-full">Exercises</p>
              <p className="text-base font-bold">{totalExercises}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prominent Add Workout Button */}
      <Button
        size="lg"
        className="w-full sm:w-auto text-base sm:text-lg h-12 sm:h-14"
        asChild
      >
        <Link href="/workouts/new">
          <Plus className="h-5 w-5 mr-2" />
          Log Workout
        </Link>
      </Button>

      {/* Current Workout Plan */}
      {activePlan ? (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg sm:text-xl">Current Plan</CardTitle>
              </div>
              <Badge variant={activePlan.status === 'active' ? 'default' : 'secondary'}>
                {activePlan.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-semibold text-base sm:text-lg">{activePlan.name}</h3>
              {activePlan.description && (
                <p className="text-sm text-muted-foreground mt-1">{activePlan.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{activePlan.weeks_duration} weeks</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Dumbbell className="h-4 w-4" />
                <span>{activePlan.workouts_per_week} workouts/week</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/workout-plans/${activePlan.id}`}>
                View Plan Details
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No active workout plan</p>
              <Button asChild>
                <Link href="/workout-plans/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workout Plan
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity - Compact Design */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-bold">Recent Activity</h2>
          {workouts.length > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/workouts">View All</Link>
            </Button>
          )}
        </div>

        {workouts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Dumbbell className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 opacity-50" />
                <p className="mb-4 text-sm sm:text-base">No workouts yet. Start your fitness journey today!</p>
                <Button asChild size="lg">
                  <Link href="/workouts/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Log Your First Workout
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {workouts.slice(0, 5).map((workout) => {
              const selfie = workout.workout_selfies?.[0]

              return (
                <Link href={`/workouts/${workout.id}`} key={workout.id}>
                  <Card className="cursor-pointer hover:border-primary transition-colors overflow-hidden">
                    <div className="flex gap-2 sm:gap-3 p-2 sm:p-3">
                      {/* Selfie thumbnail */}
                      {selfie?.signedUrl && (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                          <Image
                            src={selfie.signedUrl}
                            alt={selfie.caption || 'Workout selfie'}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 64px, 80px"
                            quality={80}
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-base font-semibold leading-tight line-clamp-1">
                                {workout.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(workout.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {workout.exercises?.length || 0}
                            </Badge>
                          </div>
                          {workout.duration_minutes && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{workout.duration_minutes} min</span>
                              {selfie && (
                                <>
                                  <span>•</span>
                                  <Camera className="h-3 w-3" />
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
