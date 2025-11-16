'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewWorkoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [exercises, setExercises] = useState<Array<{ name: string; sets: string; reps: string; weight: string }>>([
    { name: '', sets: '', reps: '', weight: '' }
  ])

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: '', reps: '', weight: '' }])
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const updateExercise = (index: number, field: string, value: string) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    // TODO: Save to Supabase
    console.log('Workout data:', { exercises })

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      router.push('/workouts')
    }, 1000)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Log New Workout</h1>
        <p className="text-muted-foreground">
          Record your workout session and track your progress
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Workout Details</CardTitle>
            <CardDescription>Enter the basic information about your workout</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workout Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Upper Body Strength"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                placeholder="60"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Notes</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="How did you feel? Any observations?"
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Exercises</CardTitle>
                <CardDescription>Add exercises performed during this workout</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                Add Exercise
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {exercises.map((exercise, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Exercise {index + 1}</h4>
                  {exercises.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`exercise-name-${index}`}>Exercise Name</Label>
                    <Input
                      id={`exercise-name-${index}`}
                      placeholder="e.g., Bench Press"
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`exercise-sets-${index}`}>Sets</Label>
                    <Input
                      id={`exercise-sets-${index}`}
                      type="number"
                      placeholder="3"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`exercise-reps-${index}`}>Reps</Label>
                    <Input
                      id={`exercise-reps-${index}`}
                      type="number"
                      placeholder="10"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`exercise-weight-${index}`}>Weight (kg)</Label>
                    <Input
                      id={`exercise-weight-${index}`}
                      type="number"
                      step="0.1"
                      placeholder="50"
                      value={exercise.weight}
                      onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Saving...' : 'Save Workout'}
          </Button>
          <Button type="button" variant="outline" asChild disabled={loading}>
            <Link href="/workouts">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
