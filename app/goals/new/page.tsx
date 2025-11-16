'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewGoalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [unit, setUnit] = useState('kg')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    // TODO: Save to Supabase
    const formData = new FormData(event.currentTarget)
    console.log('Goal data:', Object.fromEntries(formData))

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      router.push('/goals')
    }, 1000)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Goal</h1>
        <p className="text-muted-foreground">
          Set a new fitness goal to track and achieve
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Goal Details</CardTitle>
            <CardDescription>Define what you want to achieve</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Bench Press 100kg"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Why is this goal important to you?"
                disabled={loading}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="target_value">Target Value</Label>
                <Input
                  id="target_value"
                  name="target_value"
                  type="number"
                  step="0.1"
                  placeholder="100"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select name="unit" value={unit} onValueChange={setUnit} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                    <SelectItem value="reps">Repetitions</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="km">Kilometers</SelectItem>
                    <SelectItem value="miles">Miles</SelectItem>
                    <SelectItem value="workouts">Workouts</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current_value">Current Value</Label>
                <Input
                  id="current_value"
                  name="current_value"
                  type="number"
                  step="0.1"
                  placeholder="80"
                  defaultValue="0"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_date">Target Date (Optional)</Label>
                <Input
                  id="target_date"
                  name="target_date"
                  type="date"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Preview</h3>
              <p className="text-sm text-muted-foreground">
                Your goal will track progress from your current value to your target value.
                Update progress manually or let the app track it automatically based on your workouts.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Creating...' : 'Create Goal'}
          </Button>
          <Button type="button" variant="outline" asChild disabled={loading}>
            <Link href="/goals">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
