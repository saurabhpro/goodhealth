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
import { WeeklyAnalysisCard } from '@/components/weekly-analysis-card'
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
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<{
    id: string
    week_start_date: string
    week_end_date: string
    analysis_summary: string
    key_achievements: string[]
    areas_for_improvement: string[]
    recommendations: string[]
    motivational_quote: string
    weekly_stats: {
      workouts_completed: number
      total_duration_minutes: number
      avg_effort_level: number
      total_exercises: number
      workout_types: Record<string, number>
    }
    viewed_at: string | null
    is_dismissed: boolean
    generated_at: string
  } | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(true)
  const [weeklySummaryDisabled, setWeeklySummaryDisabled] = useState(false)

  useEffect(() => {
    fetchData()
    fetchWeeklyAnalysis()
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

  async function fetchWeeklyAnalysis() {
    try {
      // Try to fetch latest analysis
      const response = await fetch('/api/weekly-analysis/latest')
      if (response.ok) {
        const result = await response.json()
        setWeeklyAnalysis(result.data)
        setWeeklySummaryDisabled(false)
      } else if (response.status === 404) {
        const errorData = await response.json().catch(() => ({}))

        // Check if it's disabled in settings
        if (errorData.error?.includes('disabled in settings')) {
          setWeeklySummaryDisabled(true)
        } else {
          // No analysis exists - trigger generation in background (fire and forget)
          console.log('No weekly analysis found, triggering background generation...')
          fetch('/api/weekly-analysis/generate', { method: 'POST' })
            .then(response => {
              if (response.ok) {
                console.log('Weekly analysis generation started - will be available on next visit')
              } else {
                console.log('Could not generate analysis (might not have enough data yet)')
              }
            })
            .catch(err => console.log('Background analysis generation error:', err))
        }
        // Don't set analysis - user will see quote this time
      } else {
        console.error('Error fetching weekly analysis')
      }
    } catch (error) {
      console.error('Error fetching weekly analysis:', error)
    } finally {
      setAnalysisLoading(false)
    }
  }

  async function handleViewAnalysis(id: string) {
    try {
      await fetch(`/api/weekly-analysis/${id}/view`, { method: 'PUT' })
    } catch (error) {
      console.error('Error marking analysis as viewed:', error)
    }
  }

  async function handleDismissAnalysis(id: string) {
    try {
      await fetch(`/api/weekly-analysis/${id}/dismiss`, { method: 'PUT' })
      setWeeklyAnalysis(null)
    } catch (error) {
      console.error('Error dismissing analysis:', error)
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
      {/* Weekly Analysis Card - Only show if there's an unviewed or recent analysis */}
      {weeklyAnalysis && !weeklyAnalysis.is_dismissed && (
        <WeeklyAnalysisCard
          analysis={weeklyAnalysis}
          onDismiss={handleDismissAnalysis}
          onView={handleViewAnalysis}
          isLoading={analysisLoading}
        />
      )}

      {/* Motivational Quote - Only show if no weekly analysis */}
      {(!weeklyAnalysis || weeklyAnalysis.is_dismissed) && <MotivationalQuote />}

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
                <CardTitle className="text-md sm:text-xl">
                  {activePlan.name}
                  {!!(currentWeek) && <span className="text-sm font-normal text-muted-foreground ml-2">Week {currentWeek}</span>}
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
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workouts.slice(0, 6).map((workout) => {
              const workoutWithExtras = workout as typeof workout & {
                workout_selfies?: { signedUrl?: string; caption?: string | null }[]
                exercises?: unknown[]
              }
              const selfie = workoutWithExtras.workout_selfies?.[0]

              return (
                <Link href={`/workouts/${workout.id}`} key={workout.id}>
                  <Card className="group cursor-pointer hover:border-primary hover:shadow-lg transition-all overflow-hidden h-full">
                    {/* Image Header */}
                    <div className="relative h-32 sm:h-40 w-full bg-muted overflow-hidden">
                      {selfie?.signedUrl ? (
                        <Image
                          src={selfie.signedUrl}
                          alt={selfie.caption || 'Workout selfie'}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          quality={80}
                        />
                      ) : (
                        <>
                          <Image
                            src="/goku-placeholder.jpg"
                            alt="Workout placeholder"
                            fill
                            className="object-cover opacity-50 group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            quality={80}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Camera className="h-10 w-10 text-white" />
                          </div>
                        </>
                      )}
                      {/* Date Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-black/60 text-white backdrop-blur-sm border-0">
                          {new Date(workout.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                            {workout.name}
                          </h3>
                          {workout.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {workout.description}
                            </p>
                          )}
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Dumbbell className="h-3.5 w-3.5" />
                            <span className="font-medium">{workoutWithExtras.exercises?.length || 0}</span>
                          </div>
                          {workout.duration_minutes && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{workout.duration_minutes} min</span>
                              </div>
                            </>
                          )}
                          {selfie && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Camera className="h-3.5 w-3.5 text-green-600" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
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
