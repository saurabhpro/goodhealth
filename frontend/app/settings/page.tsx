'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUser } from '@/lib/auth/hooks'
import { usePreferences } from '@/lib/preferences/hooks'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { loading: userLoading } = useUser()
  const { preferences, loading: prefsLoading, savePreferences } = usePreferences()
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'miles'>('km')
  const [workoutReminders, setWorkoutReminders] = useState(false)
  const [goalProgress, setGoalProgress] = useState(false)
  const [weeklySummary, setWeeklySummary] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load preferences when they're available
  useEffect(() => {
    if (preferences) {
      setWeightUnit(preferences.weightUnit)
      setDistanceUnit(preferences.distanceUnit)
      setWorkoutReminders(preferences.notificationPreferences.workout_reminders)
      setGoalProgress(preferences.notificationPreferences.goal_progress)
      setWeeklySummary(preferences.notificationPreferences.weekly_summary)
    }
  }, [preferences])

  async function handleSave() {
    setSaving(true)

    try {
      const result = await savePreferences({
        weightUnit,
        distanceUnit,
        notificationPreferences: {
          workout_reminders: workoutReminders,
          goal_progress: goalProgress,
          weekly_summary: weeklySummary,
        },
      })

      if (result.success) {
        toast.success('Settings saved!', {
          description: 'Your preferences have been updated successfully.'
        })
      } else {
        const errorMsg = result.error?.message || 'Please try again later.'
        console.error('Save failed:', result.error)
        toast.error('Failed to save settings', {
          description: errorMsg
        })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      const errorMsg = error instanceof Error ? error.message : 'Please try again later.'
      toast.error('Failed to save settings', {
        description: errorMsg
      })
    } finally {
      setSaving(false)
    }
  }

  const loading = userLoading || prefsLoading

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Customize your GoodHealth experience
        </p>
      </div>

      {/* Units & Measurements */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Units & Measurements</CardTitle>
          <CardDescription>Choose your preferred units for tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weightUnit">Weight Unit</Label>
            <Select value={weightUnit} onValueChange={(value) => setWeightUnit(value as 'kg' | 'lbs')}>
              <SelectTrigger id="weightUnit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="lbs">Pounds (lbs)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="distanceUnit">Distance Unit</Label>
            <Select value={distanceUnit} onValueChange={(value) => setDistanceUnit(value as 'km' | 'miles')}>
              <SelectTrigger id="distanceUnit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="km">Kilometers (km)</SelectItem>
                <SelectItem value="miles">Miles (mi)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Workout Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded to log your workouts
              </p>
            </div>
            <Button
              variant={workoutReminders ? "default" : "outline"}
              size="sm"
              onClick={() => setWorkoutReminders(!workoutReminders)}
            >
              {workoutReminders ? "On" : "Off"}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Goal Progress Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about your goal milestones
              </p>
            </div>
            <Button
              variant={goalProgress ? "default" : "outline"}
              size="sm"
              onClick={() => setGoalProgress(!goalProgress)}
            >
              {goalProgress ? "On" : "Off"}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Summary</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly progress report
              </p>
            </div>
            <Button
              variant={weeklySummary ? "default" : "outline"}
              size="sm"
              onClick={() => setWeeklySummary(!weeklySummary)}
            >
              {weeklySummary ? "On" : "Off"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Privacy & Data</CardTitle>
          <CardDescription>Control your data and privacy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to others
              </p>
            </div>
            <Button variant="outline" size="sm">
              Private
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full">
              Export My Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Delete Account</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
