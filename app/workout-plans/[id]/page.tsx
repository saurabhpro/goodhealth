'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
  Settings,
  Play,
  Check,
  X,
  Clock,
  Target,
  Dumbbell
} from 'lucide-react'
import type { WorkoutPlan, WorkoutPlanSession } from '@/types'
import { SessionDetailModal } from '@/components/workout-plans/session-detail-modal'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function WorkoutPlanPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.id as string

  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [sessions, setSessions] = useState<WorkoutPlanSession[]>([])
  const [currentWeek, setCurrentWeek] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<WorkoutPlanSession | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchPlan()
  }, [planId])

  useEffect(() => {
    if (plan) {
      fetchWeekSchedule(currentWeek)
    }
  }, [currentWeek, plan])

  async function fetchPlan() {
    try {
      const response = await fetch(`/api/workout-plans/${planId}`)
      if (response.ok) {
        const data = await response.json()
        setPlan(data)
      } else {
        toast.error('Failed to load plan')
        router.push('/workout-plans')
      }
    } catch (error) {
      toast.error('Failed to load plan')
    } finally {
      setLoading(false)
    }
  }

  async function fetchWeekSchedule(week: number) {
    try {
      const response = await fetch(`/api/workout-plans/${planId}/week/${week}`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      } else {
        toast.error('Failed to load schedule')
      }
    } catch (error) {
      toast.error('Failed to load schedule')
    }
  }

  function getSessionForDay(dayOfWeek: number): WorkoutPlanSession | null {
    return sessions.find(s => s.day_of_week === dayOfWeek) || null
  }

  function getWorkoutTypeColor(type: string): string {
    const colors: Record<string, string> = {
      strength: 'bg-blue-500',
      cardio: 'bg-orange-500',
      rest: 'bg-gray-400',
      active_recovery: 'bg-green-500',
      mixed: 'bg-purple-500'
    }
    return colors[type] || 'bg-gray-500'
  }

  function getWorkoutTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      strength: 'Strength',
      cardio: 'Cardio',
      rest: 'Rest',
      active_recovery: 'Active Recovery',
      mixed: 'Mixed'
    }
    return labels[type] || type
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />
      case 'skipped':
        return <X className="h-4 w-4 text-red-500" />
      case 'scheduled':
        return <Clock className="h-4 w-4 text-muted-foreground" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading plan...</div>
        </div>
      </div>
    )
  }

  if (!plan) {
    return null
  }

  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const totalSessions = sessions.length
  const weekProgress = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Link href="/workout-plans">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plans
            </Button>
          </Link>

          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{plan.name}</h1>
              {plan.description && (
                <p className="text-muted-foreground">{plan.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Link href={`/workout-plans/${planId}/progress`}>
                <Button variant="outline" size="sm">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Progress
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <Badge variant="outline">
              {plan.weeks_duration} {plan.weeks_duration === 1 ? 'week' : 'weeks'}
            </Badge>
            <Badge variant="outline">
              {plan.workouts_per_week} workouts/week
            </Badge>
            <Badge
              variant={
                plan.status === 'active' ? 'default' :
                plan.status === 'completed' ? 'secondary' :
                'outline'
              }
            >
              {plan.status}
            </Badge>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
              disabled={currentWeek === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 py-2 bg-muted rounded-lg">
              <span className="font-semibold">Week {currentWeek} of {plan.weeks_duration}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(Math.min(plan.weeks_duration, currentWeek + 1))}
              disabled={currentWeek === plan.weeks_duration}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {completedSessions} of {totalSessions} completed
            </span>
            <Progress value={weekProgress} className="w-32 h-2" />
          </div>
        </div>

        {/* Weekly Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {DAY_NAMES.map((dayName, dayOfWeek) => {
            const session = getSessionForDay(dayOfWeek)
            const isRest = !session || session.workout_type === 'rest'

            return (
              <Card
                key={dayOfWeek}
                className={`${
                  isRest ? 'bg-muted/50' : 'cursor-pointer hover:shadow-lg transition-shadow'
                } ${session?.status === 'completed' ? 'border-green-500' : ''}`}
                onClick={() => {
                  if (session && session.workout_type !== 'rest') {
                    setSelectedSession(session)
                    setModalOpen(true)
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      {dayName}
                    </CardTitle>
                    {session && getStatusIcon(session.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {isRest ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Rest Day</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Badge
                          className={`${getWorkoutTypeColor(session.workout_type)} text-white mb-2`}
                        >
                          {getWorkoutTypeLabel(session.workout_type)}
                        </Badge>
                        <h3 className="font-semibold text-sm mb-1">
                          {session.workout_name}
                        </h3>
                      </div>

                      {session.estimated_duration && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{session.estimated_duration} min</span>
                        </div>
                      )}

                      {session.muscle_groups && session.muscle_groups.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {session.muscle_groups.slice(0, 3).map((group, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {group}
                            </Badge>
                          ))}
                          {session.muscle_groups.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{session.muscle_groups.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {session.status === 'scheduled' && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Start workout
                            router.push(`/workouts/new?sessionId=${session.id}`)
                          }}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start Workout
                        </Button>
                      )}

                      {session.status === 'completed' && (
                        <div className="text-xs text-green-600 font-medium text-center">
                          Completed ✓
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Plan Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-semibold">
                    {Math.round((completedSessions / (plan.weeks_duration * plan.workouts_per_week)) * 100)}%
                  </span>
                </div>
                <Progress
                  value={(completedSessions / (plan.weeks_duration * plan.workouts_per_week)) * 100}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-semibold">{completedSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-semibold">{totalSessions - completedSessions}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {plan.started_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started</span>
                    <span className="font-semibold">
                      {new Date(plan.started_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Week</span>
                  <span className="font-semibold">{currentWeek}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onUpdate={() => {
            fetchWeekSchedule(currentWeek)
            fetchPlan()
          }}
        />
      )}
    </>
  )
}
