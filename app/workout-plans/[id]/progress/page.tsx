'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Target,
  Award,
  Flame,
  BarChart3
} from 'lucide-react'
import type { WorkoutPlan, WorkoutPlanSession } from '@/types'

export default function WorkoutPlanProgressPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.id as string

  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [allSessions, setAllSessions] = useState<WorkoutPlanSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlanData()
  }, [planId])

  async function fetchPlanData() {
    try {
      // Fetch plan
      const planResponse = await fetch(`/api/workout-plans/${planId}`)
      if (!planResponse.ok) {
        toast.error('Failed to load plan')
        router.push('/workout-plans')
        return
      }
      const planData = await planResponse.json()
      setPlan(planData)

      // Fetch all sessions for all weeks
      const sessionsPromises = []
      for (let week = 1; week <= planData.weeks_duration; week++) {
        sessionsPromises.push(
          fetch(`/api/workout-plans/${planId}/week/${week}`).then(res => res.json())
        )
      }

      const weeksData = await Promise.all(sessionsPromises)
      const sessions = weeksData.flatMap(weekData => weekData.sessions || [])
      setAllSessions(sessions)
    } catch (error) {
      toast.error('Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading progress...</div>
        </div>
      </div>
    )
  }

  if (!plan) {
    return null
  }

  // Calculate statistics
  const totalSessions = allSessions.filter(s => s.workout_type !== 'rest').length
  const completedSessions = allSessions.filter(s => s.status === 'completed').length
  const skippedSessions = allSessions.filter(s => s.status === 'skipped').length
  const remainingSessions = totalSessions - completedSessions - skippedSessions

  const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
  const adherenceRate = (completedSessions + skippedSessions) > 0
    ? (completedSessions / (completedSessions + skippedSessions)) * 100
    : 0

  // Calculate streak
  const sortedCompletedSessions = allSessions
    .filter(s => s.status === 'completed' && s.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())

  let currentStreak = 0
  if (sortedCompletedSessions.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const session of sortedCompletedSessions) {
      const completedDate = new Date(session.completed_at!)
      completedDate.setHours(0, 0, 0, 0)

      const daysDiff = Math.floor((today.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff <= currentStreak + 1) {
        currentStreak = daysDiff + 1
      } else {
        break
      }
    }
  }

  // Weekly breakdown
  const weeklyStats = []
  for (let week = 1; week <= plan.weeks_duration; week++) {
    const weekSessions = allSessions.filter(s => s.week_number === week && s.workout_type !== 'rest')
    const weekCompleted = weekSessions.filter(s => s.status === 'completed').length
    const weekTotal = weekSessions.length

    weeklyStats.push({
      week,
      completed: weekCompleted,
      total: weekTotal,
      percentage: weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0
    })
  }

  // Workout type breakdown
  const workoutTypes = allSessions.reduce((acc, session) => {
    if (session.workout_type !== 'rest') {
      if (!acc[session.workout_type]) {
        acc[session.workout_type] = { total: 0, completed: 0 }
      }
      acc[session.workout_type].total++
      if (session.status === 'completed') {
        acc[session.workout_type].completed++
      }
    }
    return acc
  }, {} as Record<string, { total: number; completed: number }>)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <Link href={`/workout-plans/${planId}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plan
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Progress Dashboard</h1>
            <p className="text-muted-foreground">{plan.name}</p>
          </div>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {Math.round(completionRate)}%
            </div>
            <Progress value={completionRate} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {completedSessions} of {totalSessions} workouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-green-500" />
              Adherence Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {Math.round(adherenceRate)}%
            </div>
            <Progress value={adherenceRate} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              Completion when attempted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {currentStreak}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentStreak === 1 ? 'day' : 'days'} in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {remainingSessions}
            </div>
            <p className="text-xs text-muted-foreground">
              workouts to complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly Progress
          </CardTitle>
          <CardDescription>
            Completion rate for each week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyStats.map((stat) => (
              <div key={stat.week}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Week {stat.week}</span>
                  <span className="text-sm text-muted-foreground">
                    {stat.completed}/{stat.total} ({Math.round(stat.percentage)}%)
                  </span>
                </div>
                <Progress value={stat.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workout Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Workout Type Breakdown
          </CardTitle>
          <CardDescription>
            Performance by workout category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(workoutTypes).map(([type, stats]) => {
              const percentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{type}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stats.completed}/{stats.total} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {sortedCompletedSessions.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest completed workouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedCompletedSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{session.workout_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Week {session.week_number} - {session.day_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">Completed</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.completed_at!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
