'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Check, X, Calendar, Clock, Target, Repeat, Weight, Play } from 'lucide-react'
import type { WorkoutPlanSession } from '@/types'

const ERROR_FAILED_TO_UPDATE = 'Failed to update session'

function showRescheduleComingSoon() {
  toast.info('Reschedule feature coming soon!')
}

interface SessionDetailModalProps {
  session: WorkoutPlanSession
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function SessionDetailModal({
  session,
  open,
  onOpenChange,
  onUpdate
}: Readonly<SessionDetailModalProps>) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState(session.notes || '')

  function handleStartWorkout() {
    console.log('Start Workout clicked for session:', session.id)
    // Navigate to workout form with sessionId parameter
    const url = `/workouts/new?sessionId=${session.id}`
    console.log('Navigating to:', url)
    router.push(url)
    onOpenChange(false)
  }

  async function handleComplete() {
    setLoading(true)
    try {
      const response = await fetch(`/api/workout-plans/sessions/${session.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })

      if (response.ok) {
        toast.success('Session marked as completed!')
        onUpdate?.()
        onOpenChange(false)
      } else {
        toast.error(ERROR_FAILED_TO_UPDATE)
      }
    } catch {
      toast.error(ERROR_FAILED_TO_UPDATE)
    } finally {
      setLoading(false)
    }
  }

  async function handleSkip() {
    setLoading(true)
    try {
      const response = await fetch(`/api/workout-plans/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'skipped', notes })
      })

      if (response.ok) {
        toast.success('Session marked as skipped')
        onUpdate?.()
        onOpenChange(false)
      } else {
        toast.error(ERROR_FAILED_TO_UPDATE)
      }
    } catch {
      toast.error(ERROR_FAILED_TO_UPDATE)
    } finally {
      setLoading(false)
    }
  }

  const exercises = Array.isArray(session.exercises) ? session.exercises : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{session.workout_name}</DialogTitle>
          <DialogDescription>
            {session.day_name} - Week {session.week_number}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Session Info */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">
                {session.workout_type}
              </Badge>
              {session.intensity_level && (
                <Badge variant="outline">
                  {session.intensity_level} intensity
                </Badge>
              )}
              {session.estimated_duration && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {session.estimated_duration} min
                </Badge>
              )}
              <Badge
                variant={
                  session.status === 'completed' ? 'default' :
                  session.status === 'skipped' ? 'destructive' :
                  'outline'
                }
              >
                {session.status}
              </Badge>
            </div>

            {/* Muscle Groups */}
            {session.muscle_groups && session.muscle_groups.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Target Muscle Groups</h3>
                <div className="flex flex-wrap gap-2">
                  {session.muscle_groups.map((group, i) => (
                    <Badge key={i} variant="secondary">
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Exercises */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Exercises ({exercises.length})
              </h3>
              <div className="space-y-4">
                {exercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No exercises defined for this session
                  </p>
                ) : (
                  exercises.map((exercise, index: number) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const ex = exercise as any
                    return (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{ex.name || ''}</h4>
                          {ex.muscle_group && (
                            <p className="text-xs text-muted-foreground">
                              {ex.muscle_group}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Repeat className="h-3 w-3 text-muted-foreground" />
                          <span>
                            <strong>{ex.sets || '-'}</strong> sets
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          <span>
                            <strong>{ex.reps || ex.duration || '-'}</strong>{' '}
                            {ex.reps ? 'reps' : ex.duration ? 'sec' : ''}
                          </span>
                        </div>
                        {ex.weight && (
                          <div className="flex items-center gap-2">
                            <Weight className="h-3 w-3 text-muted-foreground" />
                            <span>
                              <strong>{ex.weight}</strong> {ex.weight_unit || 'kg'}
                            </span>
                          </div>
                        )}
                      </div>

                      {ex.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          {ex.notes}
                        </p>
                      )}
                    </div>
                    )
                  })
                )}
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-sm font-semibold">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this workout session..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                rows={3}
                disabled={loading || session.status === 'completed'}
              />
            </div>

            {/* Completed Info */}
            {session.status === 'completed' && session.completed_at && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <Check className="inline h-4 w-4 mr-1" />
                  Completed on {new Date(session.completed_at).toLocaleDateString()} at{' '}
                  {new Date(session.completed_at).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        {session.status === 'scheduled' && (
          <div className="flex gap-2 flex-wrap pt-4 border-t">
            <Button
              onClick={handleStartWorkout}
              disabled={loading}
              className="flex-1"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Workout
            </Button>
            <Button
              variant="outline"
              onClick={handleComplete}
              disabled={loading}
            >
              <Check className="mr-2 h-4 w-4" />
              Mark Complete
            </Button>
            <Button
              variant="outline"
              onClick={showRescheduleComingSoon}
              disabled={loading}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Reschedule
            </Button>
            <Button
              variant="destructive"
              onClick={handleSkip}
              disabled={loading}
            >
              <X className="mr-2 h-4 w-4" />
              Skip
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
