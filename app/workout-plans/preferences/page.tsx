'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2, Dumbbell, Clock, Target, Calendar } from 'lucide-react'
import { getUserPreferences, upsertUserPreferences } from '@/lib/workout-plans/preferences-actions'
import type { UserWorkoutPreferences } from '@/types'

const FOCUS_AREAS = [
  { value: 'upper_body', label: 'Upper Body' },
  { value: 'lower_body', label: 'Lower Body' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'core', label: 'Core' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'full_body', label: 'Full Body' },
]

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export default function WorkoutPreferencesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [preferences, setPreferences] = useState<Partial<UserWorkoutPreferences>>({
    liked_exercises: [],
    avoided_exercises: [],
    available_equipment: [],
    gym_access: true,
    preferred_duration: 60,
    min_duration: 30,
    max_duration: 90,
    focus_areas: [],
    constraints: '',
    injuries: [],
    preferred_days: [],
    avoid_days: [],
    preferred_time_of_day: 'morning',
    fitness_level: 'intermediate',
  })

  useEffect(() => {
    loadPreferences()
  }, [])

  async function loadPreferences() {
    try {
      const { preferences: data, error } = await getUserPreferences()

      if (error) {
        toast.error('Failed to load preferences', { description: error })
        return
      }

      if (data) {
        setPreferences(data)
      }
    } catch {
      toast.error('Failed to load preferences')
    } finally {
      setFetching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await upsertUserPreferences(preferences)

      if (error) {
        toast.error('Failed to save preferences', { description: error })
        return
      }

      toast.success('Preferences saved successfully!')
      router.push('/workout-plans')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  function toggleArrayItem<T>(array: T[], item: T): T[] {
    if (array.includes(item)) {
      return array.filter(i => i !== item)
    }
    return [...array, item]
  }

  if (fetching) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/workout-plans">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workout Plans
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Workout Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Customize your workout experience to match your goals and lifestyle
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fitness Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Fitness Level
            </CardTitle>
            <CardDescription>
              Your current fitness experience level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={preferences.fitness_level || 'intermediate'}
              onValueChange={(value) => setPreferences({ ...preferences, fitness_level: value as 'beginner' | 'intermediate' | 'advanced' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner - Just starting out</SelectItem>
                <SelectItem value="intermediate">Intermediate - Regular training</SelectItem>
                <SelectItem value="advanced">Advanced - Experienced athlete</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Duration Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Workout Duration
            </CardTitle>
            <CardDescription>
              How long do you prefer your workouts to be?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_duration">Minimum (minutes)</Label>
                <Input
                  id="min_duration"
                  type="number"
                  min="10"
                  max="180"
                  value={preferences.min_duration ?? 30}
                  onChange={(e) => setPreferences({ ...preferences, min_duration: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_duration">Preferred (minutes)</Label>
                <Input
                  id="preferred_duration"
                  type="number"
                  min="10"
                  max="180"
                  value={preferences.preferred_duration ?? 60}
                  onChange={(e) => setPreferences({ ...preferences, preferred_duration: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_duration">Maximum (minutes)</Label>
                <Input
                  id="max_duration"
                  type="number"
                  min="10"
                  max="180"
                  value={preferences.max_duration ?? 90}
                  onChange={(e) => setPreferences({ ...preferences, max_duration: Number.parseInt(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Focus Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Focus Areas
            </CardTitle>
            <CardDescription>
              Which muscle groups or training types do you want to focus on?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FOCUS_AREAS.map((area) => (
                <div key={area.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`focus-${area.value}`}
                    checked={preferences.focus_areas?.includes(area.value)}
                    onCheckedChange={() =>
                      setPreferences({
                        ...preferences,
                        focus_areas: toggleArrayItem(preferences.focus_areas || [], area.value),
                      })
                    }
                  />
                  <Label
                    htmlFor={`focus-${area.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {area.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Preferences
            </CardTitle>
            <CardDescription>
              When do you prefer to work out?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Time of Day</Label>
              <Select
                value={preferences.preferred_time_of_day || 'morning'}
                onValueChange={(value) => setPreferences({ ...preferences, preferred_time_of_day: value as 'morning' | 'afternoon' | 'evening' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (6 AM - 12 PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12 PM - 6 PM)</SelectItem>
                  <SelectItem value="evening">Evening (6 PM - 10 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Preferred Days</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={preferences.preferred_days?.includes(day.value)}
                      onCheckedChange={() =>
                        setPreferences({
                          ...preferences,
                          preferred_days: toggleArrayItem(preferences.preferred_days || [], day.value),
                        })
                      }
                    />
                    <Label
                      htmlFor={`day-${day.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Constraints & Injuries */}
        <Card>
          <CardHeader>
            <CardTitle>Limitations & Constraints</CardTitle>
            <CardDescription>
              Any injuries, limitations, or special considerations?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="E.g., Lower back injury, avoid overhead press, prefer low-impact cardio..."
              value={preferences.constraints || ''}
              onChange={(e) => setPreferences({ ...preferences, constraints: e.target.value })}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
