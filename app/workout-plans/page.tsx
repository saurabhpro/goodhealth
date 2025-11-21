'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Play
} from 'lucide-react'
import type { WorkoutPlan } from '@/types'

export default function WorkoutPlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    try {
      const response = await fetch('/api/workout-plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      } else {
        toast.error('Failed to load plans')
      }
    } catch (error) {
      toast.error('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

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
    } catch (error) {
      toast.error('Failed to delete plan')
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      case 'archived':
        return <Badge variant="outline">Archived</Badge>
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

      {plans.length === 0 ? (
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

                  {plan.started_at && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Started</p>
                      <p className="text-sm font-medium">
                        {new Date(plan.started_at).toLocaleDateString()}
                      </p>
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
                      {plan.status === 'active' ? (
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
