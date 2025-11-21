'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { updateGoal } from '@/lib/goals/actions'
import type { Database } from '@/types/database'

type Goal = Database['public']['Tables']['goals']['Row']

interface GoalEditFormProps {
  readonly goal: Goal
}

const UNIT_OPTIONS = [
  { value: 'workouts', label: 'Workouts' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'days', label: 'Days' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'lbs', label: 'Pounds (lbs)' },
  { value: 'km', label: 'Kilometers (km)' },
  { value: 'miles', label: 'Miles' },
  { value: 'reps', label: 'Repetitions' },
]

export function GoalEditForm({ goal }: GoalEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = await updateGoal(goal.id, formData)

    if (result.error) {
      toast.error('Failed to update goal', {
        description: result.error,
      })
    } else {
      toast.success('Goal updated!', {
        description: 'Your goal has been successfully updated.',
      })
      router.push('/goals')
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={goal.title}
              placeholder="e.g., Run 100km this month"
              required
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={goal.description || ''}
              placeholder="Add more details about your goal..."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Current Value */}
          <div className="space-y-2">
            <Label htmlFor="current_value">Current Value</Label>
            <Input
              id="current_value"
              name="current_value"
              type="number"
              step="0.01"
              defaultValue={goal.current_value ?? undefined}
              placeholder="0"
              required
              disabled={loading}
            />
          </div>

          {/* Target Value */}
          <div className="space-y-2">
            <Label htmlFor="target_value">Target Value</Label>
            <Input
              id="target_value"
              name="target_value"
              type="number"
              step="0.01"
              defaultValue={goal.target_value}
              placeholder="100"
              required
              disabled={loading}
            />
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <select
              id="unit"
              name="unit"
              defaultValue={goal.unit}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
              disabled={loading}
            >
              {UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="target_date">Target Date (Optional)</Label>
            <Input
              id="target_date"
              name="target_date"
              type="date"
              defaultValue={goal.target_date || ''}
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Updating...' : 'Update Goal'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/goals')}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
