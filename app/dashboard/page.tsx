'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Dumbbell,
  Target,
  Flame,
  Calendar,
  TrendingUp,
  Clock,
  Camera,
  Check,
  X
} from 'lucide-react'
import { MotivationalQuote } from '@/components/motivational-quote'
import { SessionDetailModal } from '@/components/workout-plans/session-detail-modal'
import type { Workout, Goal, WorkoutPlan, WorkoutPlanSession } from '@/types'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <Check className="h-3.5 w-3.5 text-green-500" />
    case 'skipped':
      return <X className="h-3.5 w-3.5 text-red-500" />
    case 'scheduled':
      return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
    default:
      return null
  }
}

function getWeekStartDay(startDate: string): number {
  // Parse date carefully to avoid timezone issues
  const date = new Date(startDate.includes('T') ? startDate : `${startDate}T00:00:00`)
  const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
  return dayOfWeek
}

function getOrderedDayNames(weekStartDay: number): { name: string; dayOfWeek: number }[] {
  const orderedDays = []
  for (let i = 0; i < 7; i++) {
    const dayIndex = (weekStartDay + i) % 7
    orderedDays.push({
      name: DAY_NAMES[dayIndex],
      dayOfWeek: dayIndex
    })
  }
  return orderedDays
}

function getDateForDayOfWeek(startDate: string, currentWeek: number, dayOfWeek: number): Date {
  const start = new Date(startDate.includes('T') ? startDate : `${startDate}T00:00:00`)
  const startDayOfWeek = start.getDay()

  // Calculate days from start to reach the target day in the current week
  let daysToAdd = (dayOfWeek - startDayOfWeek + 7) % 7
  daysToAdd += (currentWeek - 1) * 7

  const targetDate = new Date(start)
  targetDate.setDate(start.getDate() + daysToAdd)
  return targetDate
}

export default function DashboardPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [weekSessions, setWeekSessions] = useState<WorkoutPlanSession[]>([])
  const [currentWeek, setCurrentWeek] = useState<number>(1)
  const [selectedSession, setSelectedSession] = useState<WorkoutPlanSession | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [workoutsRes, goalsRes, plansRes, sessionsRes] = await Promise.all([
        fetch('/api/workouts'),
        fetch('/api/goals'),
        fetch('/api/workout-plans'),
        fetch('/api/workout-plans/sessions/current-week')
      ])

      if (workoutsRes.ok) {
        const data = await workoutsRes.json()
        setWorkouts(data)
      }
      if (goalsRes.ok) {
        const data = await goalsRes.json()
        setGoals(data)
      }
      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans(data)
      }
      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        setWeekSessions(data.sessions || [])
        setCurrentWeek(data.currentWeek || 1)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Find active workout plan
  const activePlan = plans.find(p => p.status === 'active' || p.status === 'draft')

  // Calculate statistics
  const totalWorkouts = workouts.length
  const activeGoals = goals.filter(g => !g.achieved).length
  const totalExercises = workouts.reduce((sum, w) => {
    const workout = w as typeof w & { exercises?: unknown[] }
    return sum + (workout.exercises?.length || 0)
  }, 0)

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    )
  }

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
                <CardTitle className="text-lg sm:text-xl">
                  {activePlan.name}
                  {currentWeek && <span className="text-sm font-normal text-muted-foreground ml-2">Week {currentWeek}</span>}
                </CardTitle>
              </div>
              <Badge
                className={
                  activePlan.status === 'active' ? 'bg-green-500 hover:bg-green-600 text-white' :
                  activePlan.status === 'completed' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                  activePlan.status === 'draft' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                  activePlan.status === 'archived' ? 'bg-gray-500 hover:bg-gray-600 text-white' :
                  ''
                }
                variant={activePlan.status === 'active' || activePlan.status === 'completed' || activePlan.status === 'draft' || activePlan.status === 'archived' ? undefined : 'outline'}
              >
                {activePlan.status.charAt(0).toUpperCase() + activePlan.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {weekSessions && weekSessions.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {(() => {
                  // Get ordered days based on when the plan started
                  const orderedDays = activePlan?.started_at
                    ? getOrderedDayNames(getWeekStartDay(activePlan.started_at))
                    : DAY_NAMES.map((name, index) => ({ name, dayOfWeek: index }))

                  return orderedDays.map(({ name: dayName, dayOfWeek }) => {
                    const session = weekSessions.find(s => s.day_of_week === dayOfWeek)
                    const isRestDay = !session || session.workout_type === 'rest'
                    const isCompleted = session?.status === 'completed'

                    // Calculate the actual date for this day
                    const date = activePlan?.started_at
                      ? getDateForDayOfWeek(activePlan.started_at, currentWeek, dayOfWeek)
                      : null

                    return (
                      <div
                        key={dayOfWeek}
                      className={`p-3 rounded-lg border transition-all ${
                        isRestDay
                          ? 'bg-muted/30 border-muted'
                          : isCompleted
                          ? 'border-green-500 cursor-pointer'
                          : 'bg-primary/5 border-primary/30 hover:border-primary/50 cursor-pointer'
                      }`}
                      onClick={() => {
                        if (!isRestDay && session) {
                          setSelectedSession(session)
                          setModalOpen(true)
                        }
                      }}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground truncate">
                              {dayName.slice(0, 3)}
                            </p>
                            {session && getStatusIcon(session.status)}
                          </div>
                          {date && (
                            <p className="text-[10px] text-muted-foreground">
                              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                        {isRestDay ? (
                          <p className="text-xs text-muted-foreground">Rest</p>
                        ) : (
                          <>
                            <p className="text-xs font-medium line-clamp-2 leading-tight">
                              {session.workout_name}
                            </p>
                            {session.estimated_duration && (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-2.5 w-2.5" />
                                <span>{session.estimated_duration}m</span>
                              </div>
                            )}
                            {session.status === 'completed' && (
                              <div className="text-[10px] text-green-600 font-medium text-center pt-1">
                                Completed ✓
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    )
                  })
                })()}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No workouts scheduled for this week</p>
            )}
            <Button variant="outline" className="w-full mt-3" asChild>
              <Link href={`/workout-plans/${activePlan.id}`}>
                View Full Plan
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
              const workoutWithExtras = workout as typeof workout & {
                workout_selfies?: { signedUrl?: string; caption?: string | null }[]
                exercises?: unknown[]
              }
              const selfie = workoutWithExtras.workout_selfies?.[0]

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
                              {workoutWithExtras.exercises?.length || 0}
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

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onUpdate={fetchData}
        />
      )}
    </div>
  )
}
