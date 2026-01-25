import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getUser } from '@/lib/auth/actions'
import { getWorkouts } from '@/lib/workouts/actions'
import { getGoals } from '@/lib/goals/actions'
import { redirect } from 'next/navigation'
import { calculateGoalProgress, getGoalDirection } from '@/lib/goals/progress'

export const dynamic = 'force-dynamic'

export default async function ProgressPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch data
  const { workouts } = await getWorkouts()
  const { goals } = await getGoals()

  // Calculate statistics
  const totalWorkouts = workouts.length
  // Note: Exercise count not available from simple workout listing API
  const totalExercises = 0
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0)

  // Current month workouts
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const thisMonthWorkouts = workouts.filter(w => {
    const workoutDate = new Date(w.date)
    return workoutDate.getMonth() === currentMonth && workoutDate.getFullYear() === currentYear
  }).length

  const thisMonthDuration = workouts
    .filter(w => {
      const workoutDate = new Date(w.date)
      return workoutDate.getMonth() === currentMonth && workoutDate.getFullYear() === currentYear
    })
    .reduce((sum, w) => sum + (w.duration_minutes || 0), 0)

  // Calculate streak
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

  // Note: Strength exercises not available from simple workout listing API
  // TODO: Add endpoint to fetch exercises with workouts if needed
  const strengthExercises: { name: string; weight: number; created_at: string; weight_unit?: string; sets?: number; reps?: number }[] = []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Progress Tracking</h1>
        <p className="text-muted-foreground">
          Visualize your fitness journey and track improvements
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="strength">Strength</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Month</CardDescription>
                <CardTitle className="text-3xl">{thisMonthWorkouts}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Workouts completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Time</CardDescription>
                <CardTitle className="text-3xl">{Math.floor(thisMonthDuration / 60)}h {thisMonthDuration % 60}m</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Time spent training</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Exercises</CardDescription>
                <CardTitle className="text-3xl">{totalExercises}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Total exercises logged</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Streak</CardDescription>
                <CardTitle className="text-3xl">{currentStreak}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{currentStreak === 1 ? 'Day' : 'Days'} in a row</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>Your activity breakdown for {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardDescription>
            </CardHeader>
            <CardContent>
              {workouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No workout data yet</p>
                  <p className="text-sm">Start logging workouts to see your progress here</p>
                  <Button className="mt-4" asChild>
                    <Link href="/workouts/new">Log Your First Workout</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Workouts</p>
                      <p className="text-2xl font-bold">{totalWorkouts}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Duration</p>
                      <p className="text-2xl font-bold">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Avg Duration</p>
                      <p className="text-2xl font-bold">{totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0} min</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workouts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workout History</CardTitle>
                  <CardDescription>Track your workout frequency and consistency</CardDescription>
                </div>
                {workouts.length > 0 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/workouts">View All</Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {workouts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="mb-2">No workout history</p>
                  <p className="text-sm">Start logging workouts to track your progress</p>
                  <Button className="mt-4" asChild>
                    <Link href="/workouts/new">Log Your First Workout</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {workouts.slice(0, 10).map((workout) => (
                    <Link href={`/workouts/${workout.id}`} key={workout.id}>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold">{workout.name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(workout.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          {workout.duration_minutes && (
                            <p className="text-sm font-medium">{workout.duration_minutes} min</p>
                          )}
                          {workout.effort_level && (
                            <Badge className="mt-1 text-xs">
                              Effort {workout.effort_level}/6
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strength" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strength Progress</CardTitle>
              <CardDescription>Track weight and rep progression for each exercise</CardDescription>
            </CardHeader>
            <CardContent>
              {strengthExercises.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="mb-2">No strength data</p>
                  <p className="text-sm">Log exercises with weights to track strength gains</p>
                  <Button className="mt-4" asChild>
                    <Link href="/workouts/new">Log a Strength Workout</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group exercises by name and show latest stats */}
                  {Object.entries(
                    strengthExercises.reduce((acc, exercise) => {
                      if (!acc[exercise.name]) {
                        acc[exercise.name] = []
                      }
                      acc[exercise.name].push(exercise)
                      return acc
                    }, {} as Record<string, Array<typeof strengthExercises[number]>>)
                  ).map(([exerciseName, exercises]) => {
                    const exerciseList = exercises as Array<typeof strengthExercises[number]>
                    const latest = exerciseList[0]
                    const totalSessions = exerciseList.length
                    const maxWeight = Math.max(...exerciseList.map(e => e.weight || 0))
                    const avgWeight = exerciseList.reduce((sum, e) => sum + (e.weight || 0), 0) / exerciseList.length

                    return (
                      <div key={exerciseName} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{exerciseName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {totalSessions} {totalSessions === 1 ? 'session' : 'sessions'} logged
                            </p>
                          </div>
                          <Badge variant="secondary">Strength</Badge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Latest</p>
                            <p className="text-lg font-semibold">
                              {latest.weight} {latest.weight_unit || 'kg'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {latest.sets} × {latest.reps} reps
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Max Weight</p>
                            <p className="text-lg font-semibold">
                              {maxWeight} {latest.weight_unit || 'kg'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Avg Weight</p>
                            <p className="text-lg font-semibold">
                              {avgWeight.toFixed(1)} {latest.weight_unit || 'kg'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Goal Progress</CardTitle>
                  <CardDescription>Monitor your progress towards fitness goals</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/goals/new">New Goal</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="mb-2">No goals set</p>
                  <p className="text-sm">Create goals to track your achievements</p>
                  <Button className="mt-4" asChild>
                    <Link href="/goals/new">Create Your First Goal</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.map((goal) => {
                    const progress = Math.round(calculateGoalProgress(goal))
                    const isAchieved = goal.achieved
                    const direction = getGoalDirection(goal)
                    const remaining = direction === 'up'
                      ? Math.max(0, goal.target_value - (goal.current_value || 0))
                      : Math.max(0, (goal.current_value || 0) - goal.target_value)

                    return (
                      <div key={goal.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{goal.title}</h4>
                              {isAchieved && (
                                <Badge className="bg-green-500">Achieved!</Badge>
                              )}
                            </div>
                            {goal.description && (
                              <p className="text-sm text-muted-foreground">{goal.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* Progress Bar */}
                          <div>
                            <div className="flex items-center justify-between mb-2 text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-semibold">{progress}%</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  isAchieved ? 'bg-green-500' : 'bg-primary'
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid gap-3 sm:grid-cols-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Current</p>
                              <p className="font-semibold">
                                {goal.current_value} {goal.unit}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Target</p>
                              <p className="font-semibold">
                                {goal.target_value} {goal.unit}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Remaining</p>
                              <p className="font-semibold">
                                {remaining.toFixed(1)} {goal.unit}
                              </p>
                            </div>
                          </div>

                          {goal.target_date && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">
                                Target Date: {new Date(goal.target_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
