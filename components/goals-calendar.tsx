'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { GoalActions } from '@/components/goal-actions'
import { calculateGoalProgress } from '@/lib/goals/progress'
import type { Database } from '@/types/database'

type Goal = Database['public']['Tables']['goals']['Row']

interface GoalsCalendarProps {
  readonly goals: Goal[]
}

export function GoalsCalendar({ goals }: GoalsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'quarter' | 'year'>('month')
  const now = new Date()

  // Get date range based on view mode
  const dateRange = useMemo(() => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    if (viewMode === 'month') {
      start.setDate(1)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
    } else if (viewMode === 'quarter') {
      const quarter = Math.floor(start.getMonth() / 3)
      start.setMonth(quarter * 3, 1)
      end.setMonth(quarter * 3 + 3, 0)
    } else {
      start.setMonth(0, 1)
      end.setMonth(11, 31)
    }

    return { start, end }
  }, [currentDate, viewMode])

  // Filter goals that overlap with current view
  const visibleGoals = useMemo(() => {
    return goals.filter((goal) => {
      const createdDate = new Date(goal.created_at)
      const targetDate = goal.target_date ? new Date(goal.target_date) : new Date(2099, 11, 31)

      // Check if goal period overlaps with view period
      return createdDate <= dateRange.end && targetDate >= dateRange.start
    })
  }, [goals, dateRange])

  // Navigate dates
  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (viewMode === 'quarter') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3))
    } else {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  // Format date range title
  const rangeTitle = useMemo(() => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } else if (viewMode === 'quarter') {
      const quarter = Math.floor(currentDate.getMonth() / 3) + 1
      return `Q${quarter} ${currentDate.getFullYear()}`
    } else {
      return currentDate.getFullYear().toString()
    }
  }, [currentDate, viewMode])

  // Calculate goal position and width on timeline
  const getGoalTimelineStyle = (goal: Goal) => {
    const createdDate = new Date(goal.created_at)
    const targetDate = goal.target_date ? new Date(goal.target_date) : null

    const rangeStart = dateRange.start.getTime()
    const rangeEnd = dateRange.end.getTime()
    const rangeDuration = rangeEnd - rangeStart

    // Calculate left position (start of goal)
    const goalStart = Math.max(createdDate.getTime(), rangeStart)
    const leftPercent = ((goalStart - rangeStart) / rangeDuration) * 100

    // Calculate width (duration of goal)
    const goalEnd = targetDate ? Math.min(targetDate.getTime(), rangeEnd) : rangeEnd
    const widthPercent = ((goalEnd - goalStart) / rangeDuration) * 100

    return {
      left: `${Math.max(0, Math.min(100, leftPercent))}%`,
      width: `${Math.max(5, Math.min(100 - leftPercent, widthPercent))}%`,
    }
  }

  const goalsWithoutTargetDate = visibleGoals.filter((g) => !g.target_date)
  const goalsWithTargetDate = visibleGoals.filter((g) => g.target_date)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>

        <h2 className="text-2xl font-bold">{rangeTitle}</h2>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Month
          </Button>
          <Button
            variant={viewMode === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('quarter')}
          >
            Quarter
          </Button>
          <Button
            variant={viewMode === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('year')}
          >
            Year
          </Button>
        </div>
      </div>

      {/* Timeline View for Goals with Target Dates */}
      {goalsWithTargetDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Goals Timeline</CardTitle>
            <CardDescription>
              Goals with target dates from {dateRange.start.toLocaleDateString()} to{' '}
              {dateRange.end.toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Timeline scale */}
            <div className="relative h-8 bg-muted rounded-lg">
              {/* Today marker */}
              {now >= dateRange.start && now <= dateRange.end && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary"
                  style={{
                    left: `${
                      ((now.getTime() - dateRange.start.getTime()) /
                        (dateRange.end.getTime() - dateRange.start.getTime())) *
                      100
                    }%`,
                  }}
                >
                  <div className="absolute -top-1 -left-2 w-4 h-4 bg-primary rounded-full border-2 border-background" />
                </div>
              )}

              {/* Month markers */}
              {viewMode !== 'year' && (
                <div className="absolute inset-0 flex text-xs text-muted-foreground">
                  {Array.from({ length: viewMode === 'month' ? 4 : 3 }, (_, i) => (
                    <div
                      key={i}
                      className="flex-1 flex items-center justify-center border-l border-border first:border-l-0"
                    >
                      {viewMode === 'month'
                        ? `Week ${i + 1}`
                        : new Date(
                            dateRange.start.getFullYear(),
                            dateRange.start.getMonth() + i,
                            15
                          ).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Goals on timeline */}
            <div className="space-y-3 mt-8">
              {goalsWithTargetDate.map((goal) => {
                const style = getGoalTimelineStyle(goal)
                const progress = calculateGoalProgress({
                  initial_value: goal.initial_value,
                  current_value: goal.current_value ?? 0,
                  target_value: goal.target_value,
                })

                const progressBarColor =
                  goal.status === 'completed'
                    ? 'bg-blue-500'
                    : goal.status === 'archived'
                    ? 'bg-gray-500'
                    : 'bg-green-500'

                return (
                  <div key={goal.id} className="relative">
                    <div
                      className="absolute top-0 h-full bg-secondary rounded"
                      style={{ left: style.left, width: style.width }}
                    >
                      <div
                        className={`h-full rounded transition-all ${progressBarColor}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <Card className="relative hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold truncate">{goal.title}</h4>
                              {goal.status === 'completed' ? (
                                <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
                                  Completed
                                </Badge>
                              ) : goal.status === 'archived' ? (
                                <Badge className="bg-gray-500 hover:bg-gray-600 text-white">
                                  Archived
                                </Badge>
                              ) : (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white">
                                  Active
                                </Badge>
                              )}
                            </div>
                            {goal.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {goal.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>
                                {goal.current_value} / {goal.target_value} {goal.unit}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(goal.created_at).toLocaleDateString()} →{' '}
                                {goal.target_date
                                  ? new Date(goal.target_date).toLocaleDateString()
                                  : 'No deadline'}
                              </span>
                              <span>•</span>
                              <span>{Math.round(progress)}% complete</span>
                            </div>
                          </div>
                          <GoalActions goalId={goal.id} goalTitle={goal.title} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals without target dates */}
      {goalsWithoutTargetDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Open-ended Goals</CardTitle>
            <CardDescription>Goals without target dates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goalsWithoutTargetDate.map((goal) => {
                const progress = calculateGoalProgress({
                  initial_value: goal.initial_value,
                  current_value: goal.current_value ?? 0,
                  target_value: goal.target_value,
                })

                const progressColor = goal.status === 'completed' ? 'bg-blue-500' : 'bg-green-500'

                return (
                  <Card key={goal.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base mb-1">{goal.title}</CardTitle>
                          {goal.description && (
                            <CardDescription className="text-xs">{goal.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {goal.status === 'completed' ? (
                            <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
                              Completed
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500 hover:bg-green-600 text-white">
                              Active
                            </Badge>
                          )}
                          <GoalActions goalId={goal.id} goalTitle={goal.title} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {goal.current_value} / {goal.target_value} {goal.unit}
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${progressColor}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Started {new Date(goal.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {visibleGoals.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No goals in this period</h3>
              <p className="text-muted-foreground">
                Try selecting a different time period or create a new goal
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
