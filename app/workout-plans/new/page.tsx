'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, ChevronRight, Target, Dumbbell, Sparkles } from 'lucide-react'
import type { Goal } from '@/types'

type PlanStep = 'goal' | 'configure' | 'review'

export default function NewWorkoutPlanPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<PlanStep>('goal')
  const [loading, setLoading] = useState(false)
  const [goalsLoading, setGoalsLoading] = useState(true)
  const [goals, setGoals] = useState<Goal[]>([])
  const [generatingJobId, setGeneratingJobId] = useState<string | null>(null)
  const [generatingStatus, setGeneratingStatus] = useState('')

  // Form state
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [planName, setPlanName] = useState('')
  const [description, setDescription] = useState('')
  const [weeksDuration, setWeeksDuration] = useState(4)
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(4)
  const [avgDuration, setAvgDuration] = useState(60)
  const [startDate, setStartDate] = useState<string>('')

  useEffect(() => {
    fetchGoals()
    fetchPlans()
  }, [])

  async function fetchGoals() {
    try {
      const response = await fetch('/api/goals')
      if (response.ok) {
        const data = await response.json()
        setGoals(data)
      }
    } catch (error) {
      toast.error('Failed to load goals')
    } finally {
      setGoalsLoading(false)
    }
  }

  async function fetchPlans() {
    try {
      const response = await fetch('/api/workout-plans')
      if (response.ok) {
        const data = await response.json()
        // Store active/draft plans by goal_id for checking
        const plansByGoal: Record<string, { id: string; status: string; goal_id: string }> = {}
        data.forEach((plan: { id: string; status: string; goal_id: string }) => {
          if (plan.status === 'active' || plan.status === 'draft') {
            plansByGoal[plan.goal_id] = plan
          }
        })
        // You can use this to disable goals
        // For now, we'll just check in handleGenerate
      }
    } catch (error) {
      console.error('Failed to load plans')
    }
  }

  async function handleGenerate() {
    if (!selectedGoal) return

    setLoading(true)
    setGeneratingStatus('Preparing your workout plan...')

    try {
      const response = await fetch('/api/workout-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: selectedGoal.id,
          name: planName || `${selectedGoal.title} - Workout Plan`,
          description,
          weeksDuration,
          workoutsPerWeek,
          avgDuration,
          startDate: startDate || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratingJobId(data.jobId)
        setGeneratingStatus('🍳 Cooking your workout plan...')

        toast.success('Plan generation started!', {
          description: 'You can navigate away - we\'ll notify you when it\'s ready'
        })

        // Start polling for job status
        pollJobStatus(data.jobId)
      } else if (response.status === 409) {
        // Conflict - plan already exists
        const error = await response.json()
        toast.error('Plan Already Exists', {
          description: error.error || 'This goal already has an active plan',
          duration: 6000,
          action: error.existingPlanId ? {
            label: 'View Plan',
            onClick: () => router.push(`/workout-plans/${error.existingPlanId}`)
          } : undefined
        })
        setLoading(false)
      } else {
        const error = await response.json()
        toast.error('Failed to generate plan', {
          description: error.error || 'Please try again'
        })
        setLoading(false)
      }
    } catch (error) {
      toast.error('Failed to generate plan')
      setLoading(false)
    }
  }

  async function pollJobStatus(jobId: string) {
    const pollInterval = 3000 // Poll every 3 seconds
    const maxAttempts = 60 // Max 3 minutes (60 * 3s)
    let attempts = 0

    const poll = async () => {
      attempts++

      try {
        const response = await fetch(`/api/workout-plans/jobs/${jobId}`)

        if (response.ok) {
          const data = await response.json()

          if (data.status === 'completed' && data.planId) {
            setGeneratingStatus('✨ Plan ready!')
            toast.success('Workout plan generated!', {
              description: 'Your personalized workout plan is ready'
            })
            setTimeout(() => {
              router.push(`/workout-plans/${data.planId}`)
            }, 1000)
            return
          } else if (data.status === 'failed') {
            setGeneratingStatus('Failed to generate plan')
            toast.error('Generation failed', {
              description: data.errorMessage || 'Please try again'
            })
            setLoading(false)
            return
          } else if (data.status === 'processing') {
            setGeneratingStatus('🍳 Cooking your workout plan... (almost done!)')
          }
        }

        // Continue polling if still pending/processing and not maxed out
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval)
        } else {
          toast.error('Generation is taking longer than expected', {
            description: 'Please check back in a few minutes'
          })
          setLoading(false)
        }
      } catch (error) {
        console.error('Error polling job status:', error)
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval)
        }
      }
    }

    poll()
  }

  const stepProgress = currentStep === 'goal' ? 33 : currentStep === 'configure' ? 66 : 100

  function getGoalType(goal: Goal): string {
    const title = goal.title.toLowerCase()
    const desc = goal.description?.toLowerCase() || ''

    if (title.includes('weight loss') || desc.includes('lose weight') || title.includes('cut')) {
      return 'weight_loss'
    }
    if (title.includes('muscle') || title.includes('bulk') || desc.includes('build muscle')) {
      return 'muscle_building'
    }
    if (title.includes('endurance') || title.includes('cardio') || title.includes('running')) {
      return 'endurance'
    }
    return 'general_fitness'
  }

  function getGoalTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      weight_loss: 'Weight Loss',
      muscle_building: 'Muscle Building',
      endurance: 'Endurance',
      general_fitness: 'General Fitness'
    }
    return labels[type] || 'General Fitness'
  }

  function getGoalTypeColor(type: string): string {
    const colors: Record<string, string> = {
      weight_loss: 'bg-orange-500',
      muscle_building: 'bg-blue-500',
      endurance: 'bg-green-500',
      general_fitness: 'bg-purple-500'
    }
    return colors[type] || 'bg-gray-500'
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/workout-plans">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plans
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Create Workout Plan</h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          AI-powered personalized workout plan based on your goals
        </p>
      </div>

      <div className="mb-8">
        <Progress value={stepProgress} className="h-2" />
        <div className="flex justify-between mt-2 text-sm">
          <span className={currentStep === 'goal' ? 'font-semibold' : 'text-muted-foreground'}>
            Select Goal
          </span>
          <span className={currentStep === 'configure' ? 'font-semibold' : 'text-muted-foreground'}>
            Configure Plan
          </span>
          <span className={currentStep === 'review' ? 'font-semibold' : 'text-muted-foreground'}>
            Review & Generate with AI
          </span>
        </div>
      </div>

      {/* Step 1: Select Goal */}
      {currentStep === 'goal' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Select Your Goal
              </CardTitle>
              <CardDescription>
                Choose the fitness goal you want to work towards with this plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading goals...
                </div>
              ) : goals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    You don&apos;t have any active goals yet.
                  </p>
                  <Link href="/goals/new">
                    <Button>Create Your First Goal</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {goals.map((goal) => {
                    const goalType = getGoalType(goal)
                    const isSelected = selectedGoal?.id === goal.id

                    return (
                      <div
                        key={goal.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedGoal(goal)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{goal.title}</h3>
                              <Badge variant="outline" className={getGoalTypeColor(goalType)}>
                                {getGoalTypeLabel(goalType)}
                              </Badge>
                            </div>
                            {goal.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {goal.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <span>
                                Target: <strong>{goal.target_value} {goal.unit}</strong>
                              </span>
                              <span>
                                Current: <strong>{goal.current_value || 0} {goal.unit}</strong>
                              </span>
                              {goal.target_date && (
                                <span>
                                  Due: <strong>{new Date(goal.target_date).toLocaleDateString()}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="ml-4">
                              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                <ChevronRight className="h-3 w-3 text-primary-foreground" />
                              </div>
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

          <div className="flex justify-end">
            <Button
              onClick={() => setCurrentStep('configure')}
              disabled={!selectedGoal}
            >
              Next: Configure Plan
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Configure Plan */}
      {currentStep === 'configure' && selectedGoal && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Configure Your Plan
              </CardTitle>
              <CardDescription>
                Customize the workout plan to fit your schedule and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Selected Goal:</strong> {selectedGoal.title}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="planName">Plan Name (Optional)</Label>
                <Input
                  id="planName"
                  placeholder={`${selectedGoal.title} - Workout Plan`}
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any notes or details about this plan..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date (Optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  When do you want to start this plan? Leave empty to schedule it later.
                </p>
              </div>

              <Separator />

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weeks">Duration (weeks)</Label>
                  <Select
                    value={weeksDuration.toString()}
                    onValueChange={(v) => setWeeksDuration(Number(v))}
                  >
                    <SelectTrigger id="weeks">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 6, 8, 12].map((w) => (
                        <SelectItem key={w} value={w.toString()}>
                          {w} {w === 1 ? 'week' : 'weeks'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How long should this plan last?
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workoutsPerWeek">Workouts per week</Label>
                  <Select
                    value={workoutsPerWeek.toString()}
                    onValueChange={(v) => setWorkoutsPerWeek(Number(v))}
                  >
                    <SelectTrigger id="workoutsPerWeek">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 4, 5, 6, 7].map((w) => (
                        <SelectItem key={w} value={w.toString()}>
                          {w} workouts
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How many days per week will you train?
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Average workout duration (minutes)</Label>
                  <Select
                    value={avgDuration.toString()}
                    onValueChange={(v) => setAvgDuration(Number(v))}
                  >
                    <SelectTrigger id="duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[30, 45, 60, 75, 90, 120].map((d) => (
                        <SelectItem key={d} value={d.toString()}>
                          {d} minutes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Target length for each workout
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('goal')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep('review')}
            >
              Next: Review
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Generate */}
      {currentStep === 'review' && selectedGoal && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Review Your Plan
              </CardTitle>
              <CardDescription>
                Confirm the details before generating your personalized workout plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Goal</h3>
                  <p className="text-muted-foreground">{selectedGoal.title}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold mb-1">Plan Name</h3>
                  <p className="text-muted-foreground">
                    {planName || `${selectedGoal.title} - Workout Plan`}
                  </p>
                </div>

                {description && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Description</h3>
                      <p className="text-muted-foreground">{description}</p>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold mb-1">Start Date</h3>
                  <p className="text-muted-foreground">
                    {startDate ? new Date(startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Not scheduled yet (can be set later)'}
                  </p>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Duration</h3>
                    <p className="text-muted-foreground">
                      {weeksDuration} {weeksDuration === 1 ? 'week' : 'weeks'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Frequency</h3>
                    <p className="text-muted-foreground">
                      {workoutsPerWeek} workouts/week
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Duration</h3>
                    <p className="text-muted-foreground">
                      ~{avgDuration} min/workout
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h3 className="text-sm font-semibold">Plan Summary</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Total workouts: <strong>{weeksDuration * workoutsPerWeek}</strong></li>
                    <li>• Rest days per week: <strong>{7 - workoutsPerWeek}</strong></li>
                    <li>• Estimated total time: <strong>{Math.round((weeksDuration * workoutsPerWeek * avgDuration) / 60)} hours</strong></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('configure')}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="min-w-[200px]"
            >
              {loading ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                  {generatingStatus || 'Generating with AI...'}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
