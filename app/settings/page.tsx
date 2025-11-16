'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUser } from '@/lib/auth/hooks'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user, loading } = useUser()
  const [weightUnit, setWeightUnit] = useState('kg')
  const [distanceUnit, setDistanceUnit] = useState('km')
  const [notifications, setNotifications] = useState(true)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)

    // TODO: Save settings to Supabase or local storage
    console.log('Saving settings:', { weightUnit, distanceUnit, notifications })

    // Simulate API call
    setTimeout(() => {
      setSaving(false)
      toast.success('Settings saved!', {
        description: 'Your preferences have been updated successfully.'
      })
    }, 1000)
  }

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
            <Select value={weightUnit} onValueChange={setWeightUnit}>
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
            <Select value={distanceUnit} onValueChange={setDistanceUnit}>
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
              variant={notifications ? "default" : "outline"}
              size="sm"
              onClick={() => setNotifications(!notifications)}
            >
              {notifications ? "On" : "Off"}
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
              variant="outline"
              size="sm"
            >
              Off
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
              variant="outline"
              size="sm"
            >
              Off
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
