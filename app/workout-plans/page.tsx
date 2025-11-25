'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Plus,
  Calendar,
  Dumbbell,
  BarChart3,
  Trash2,
  Play,
  Settings,
  BookTemplate
} from 'lucide-react'
import type { WorkoutPlan } from '@/types'
import { AIGeneratingPlaceholder } from '@/components/workout-plans/ai-generating-placeholder'

interface PendingJob {
  jobId: string
  planName: string
  weeksDuration: number
  workoutsPerWeek: number
}

function WorkoutPlansContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingJob, setPendingJob] = useState<PendingJob | null>(null)

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/workout-plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      } else {
        toast.error('Failed to load plans')
      }
    } catch {
      toast.error('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }, [])

  const clearPendingJob = useCallback(() => {
    setPendingJob(null)
    localStorage.removeItem('pendingWorkoutPlanJob')
    router.replace('/workout-plans')
  }, [router])

  const pollJobStatus = useCallback(async (jobId: string) => {
    const pollInterval = 3000 // Poll every 3 seconds
    const maxAttempts = 60 // Max 3 minutes
    let attempts = 0

    const poll = async () => {
      attempts++

      try {
        const response = await fetch(`/api/workout-plans/jobs/${jobId}`)

        if (response.ok) {
          const data = await response.json()

          if (data.status === 'completed' && data.planId) {
            toast.success('Workout plan generated!', {
              description: 'Your personalized workout plan is ready'
            })
            clearPendingJob()
            // Refresh the plans list
            fetchPlans()
            return
          } else if (data.status === 'failed') {
            toast.error('Plan generation failed', {
              description: data.error || 'Please try again'
            })
            clearPendingJob()
            return
          }
        }

        // Continue polling if still processing and haven't exceeded max attempts
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval)
        } else {
          toast.error('Generation timeout', {
            description: 'The plan is still generating. Check back in a few minutes.'
          })
          clearPendingJob()
        }
      } catch (error) {
        console.error('Error polling job status:', error)
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval)
        }
      }
    }

    poll()
  }, [clearPendingJob, fetchPlans])

  useEffect(() => {
    fetchPlans()

    // Check localStorage for existing pending job first
    const storedJob = localStorage.getItem('pendingWorkoutPlanJob')
    if (storedJob) {
      try {
        const job = JSON.parse(storedJob) as PendingJob
        setPendingJob(job)
        pollJobStatus(job.jobId)
        return
      } catch (error) {
        console.error('Failed to parse stored job:', error)
        localStorage.removeItem('pendingWorkoutPlanJob')
      }
    }

    // Check if we have a pending job from URL params
    const jobId = searchParams.get('jobId')
    const planName = searchParams.get('planName')
    const weeksDuration = searchParams.get('weeks')
    const workoutsPerWeek = searchParams.get('workouts')

    if (jobId && planName) {
      const job: PendingJob = {
        jobId,
        planName,
        weeksDuration: weeksDuration ? parseInt(weeksDuration) : 8,
        workoutsPerWeek: workoutsPerWeek ? parseInt(workoutsPerWeek) : 4,
      }

      setPendingJob(job)
      // Store in localStorage for persistence
      localStorage.setItem('pendingWorkoutPlanJob', JSON.stringify(job))
      // Start polling for the job
      pollJobStatus(jobId)
    }
  }, [searchParams, fetchPlans, pollJobStatus])

  async function handleDelete(planId: string) {
    if (!confirm('Are you sure you want to delete this workout plan?')) {
      return
    }

    try {
      const response = await fetch(`/api/workout-plans/${planId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Plan deleted successfully')
        setPlans(plans.filter(p => p.id !== planId))
      } else {
        toast.error('Failed to delete plan')
      }
    } catch {
      toast.error('Failed to delete plan')
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>
      case 'completed':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Completed</Badge>
      case 'draft':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Draft</Badge>
      case 'archived':
        return <Badge className="bg-gray-500 hover:bg-gray-600 text-white">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading plans...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workout Plans</h1>
          <p className="text-muted-foreground">
            Manage your personalized workout plans and track your progress
          </p>
        </div>
        <Link href="/workout-plans/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/workout-plans/preferences')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Workout Preferences
            </CardTitle>
            <CardDescription>
              Customize your workout experience and set your fitness goals
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/workout-plans/templates')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookTemplate className="h-5 w-5" />
              My Templates
            </CardTitle>
            <CardDescription>
              Create and manage your custom workout templates
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Show AI Generating Placeholder if there's a pending job */}
      {pendingJob && (
        <div className="mb-6">
          <AIGeneratingPlaceholder
            planName={pendingJob.planName}
            weeksDuration={pendingJob.weeksDuration}
            workoutsPerWeek={pendingJob.workoutsPerWeek}
          />
        </div>
      )}

      {plans.length === 0 && !pendingJob ? (
        <Card>
          <CardContent className="text-center py-12">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No workout plans yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first personalized workout plan to get started
            </p>
            <Link href="/workout-plans/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            // Mock progress data - in real app, fetch from API
            const progress = 0 // TODO: Calculate from sessions

            return (
              <Card
                key={plan.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/workout-plans/${plan.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {getStatusBadge(plan.status)}
                  </div>
                  {plan.description && (
                    <CardDescription className="line-clamp-2">
                      {plan.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {plan.weeks_duration} {plan.weeks_duration === 1 ? 'week' : 'weeks'}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" />
                      {plan.workouts_per_week}/week
                    </Badge>
                    {plan.avg_workout_duration && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        {plan.avg_workout_duration} min
                      </Badge>
                    )}
                  </div>

                  {plan.goal_type && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Goal Type</p>
                      <Badge variant="secondary">
                        {plan.goal_type.split('_').map(w =>
                          w.charAt(0).toUpperCase() + w.slice(1)
                        ).join(' ')}
                      </Badge>
                    </div>
                  )}

                  {plan.started_at && (plan.status === 'active' || plan.status === 'completed') && (
                    <div className="space-y-1">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Started</p>
                        <p className="text-sm font-medium">
                          {new Date(plan.started_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Ends</p>
                        <p className="text-sm font-medium">
                          {new Date(
                            new Date(plan.started_at).getTime() + (plan.weeks_duration * 7 * 24 * 60 * 60 * 1000)
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {plan.status === 'active' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <span className="text-xs font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/workout-plans/${plan.id}`)
                      }}
                    >
                      {plan.status === 'draft' ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Start Plan
                        </>
                      ) : plan.status === 'active' ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Continue
                        </>
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          View
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/workout-plans/${plan.id}/progress`)
                      }}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(plan.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function WorkoutPlansPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading plans...</div>
        </div>
      </div>
    }>
      <WorkoutPlansContent />
    </Suspense>
  )
}
