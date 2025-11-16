'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createWorkout } from '@/lib/workouts/actions'
import { toast } from 'sonner'
import { gymEquipment, equipmentCategories, getEquipmentType, type ExerciseType } from '@/lib/data/gym-equipment'
import { EffortSelector } from '@/components/ui/effort-selector'

interface Exercise {
  name: string
  type: ExerciseType
  // Strength fields
  sets?: string
  reps?: string
  weight?: string
  // Cardio fields
  duration?: string
  distance?: string
  speed?: string
  calories?: string
  resistance?: string
  incline?: string
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [effortLevel, setEffortLevel] = useState(3) // Default to Moderate
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', type: 'strength', sets: '', reps: '', weight: '' }
  ])

  const addExercise = () => {
    setExercises([...exercises, { name: '', type: 'strength', sets: '', reps: '', weight: '' }])
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const updateExercise = (index: number, field: string, value: string) => {
    const updated = [...exercises]

    // If updating the name, also update the type
    if (field === 'name') {
      const exerciseType = getEquipmentType(value) || 'strength'
      updated[index] = {
        ...updated[index],
        name: value,
        type: exerciseType,
        // Clear fields that don't apply to the new type
        ...(exerciseType === 'cardio' ? {
          sets: undefined,
          reps: undefined,
          weight: undefined,
        } : {
          duration: undefined,
          distance: undefined,
          speed: undefined,
          calories: undefined,
          resistance: undefined,
          incline: undefined,
        })
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }

    setExercises(updated)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)

    // Add exercises as JSON string to FormData
    formData.append('exercises', JSON.stringify(exercises))

    // Add effort level
    formData.append('effort_level', effortLevel.toString())

    const result = await createWorkout(formData)

    setLoading(false)

    if (result.error) {
      setError(result.error)
      toast.error('Failed to save workout', {
        description: result.error
      })
    } else {
      toast.success('Workout saved successfully!', {
        description: 'Your workout has been logged and saved to your profile.'
      })
      // Wait a bit for the toast to show before redirecting
      setTimeout(() => {
        router.push('/workouts')
      }, 500)
    }
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
        {error && (
          <div className="mb-6 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
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
              <Label>Workout Effort Level</Label>
              <EffortSelector
                value={effortLevel}
                onChange={setEffortLevel}
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
                    <Label htmlFor={`exercise-select-${index}`}>Select Equipment/Exercise</Label>
                    <Select
                      value={exercise.name}
                      onValueChange={(value) => updateExercise(index, 'name', value)}
                      disabled={loading}
                    >
                      <SelectTrigger id={`exercise-select-${index}`}>
                        <SelectValue placeholder="Choose from list or type custom below" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentCategories.map((category) => (
                          <SelectGroup key={category.value}>
                            <SelectLabel>{category.label}</SelectLabel>
                            {gymEquipment[category.value as keyof typeof gymEquipment]?.map((equipment) => (
                              <SelectItem key={equipment.name} value={equipment.name}>
                                {equipment.name}
                                {equipment.brands.length > 0 && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({equipment.brands[0]})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`exercise-name-${index}`}>Or Enter Custom Exercise</Label>
                    <Input
                      id={`exercise-name-${index}`}
                      placeholder="e.g., My Custom Exercise"
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Conditional inputs based on exercise type */}
                  {exercise.type === 'cardio' ? (
                    <>
                      {/* Cardio Inputs */}
                      <div className="space-y-2">
                        <Label htmlFor={`exercise-duration-${index}`}>Duration (minutes)</Label>
                        <Input
                          id={`exercise-duration-${index}`}
                          type="number"
                          placeholder="30"
                          value={exercise.duration || ''}
                          onChange={(e) => updateExercise(index, 'duration', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`exercise-distance-${index}`}>Distance (km)</Label>
                        <Input
                          id={`exercise-distance-${index}`}
                          type="number"
                          step="0.1"
                          placeholder="5.0"
                          value={exercise.distance || ''}
                          onChange={(e) => updateExercise(index, 'distance', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`exercise-speed-${index}`}>Speed (km/h)</Label>
                        <Input
                          id={`exercise-speed-${index}`}
                          type="number"
                          step="0.1"
                          placeholder="10.0"
                          value={exercise.speed || ''}
                          onChange={(e) => updateExercise(index, 'speed', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`exercise-resistance-${index}`}>Resistance Level</Label>
                        <Input
                          id={`exercise-resistance-${index}`}
                          type="number"
                          placeholder="8"
                          value={exercise.resistance || ''}
                          onChange={(e) => updateExercise(index, 'resistance', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`exercise-incline-${index}`}>Incline (%)</Label>
                        <Input
                          id={`exercise-incline-${index}`}
                          type="number"
                          step="0.1"
                          placeholder="2.0"
                          value={exercise.incline || ''}
                          onChange={(e) => updateExercise(index, 'incline', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`exercise-calories-${index}`}>Calories</Label>
                        <Input
                          id={`exercise-calories-${index}`}
                          type="number"
                          placeholder="250"
                          value={exercise.calories || ''}
                          onChange={(e) => updateExercise(index, 'calories', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Strength Inputs */}
                      <div className="space-y-2">
                        <Label htmlFor={`exercise-sets-${index}`}>Sets</Label>
                        <Input
                          id={`exercise-sets-${index}`}
                          type="number"
                          placeholder="3"
                          value={exercise.sets || ''}
                          onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`exercise-reps-${index}`}>Reps</Label>
                        <Input
                          id={`exercise-reps-${index}`}
                          type="number"
                          placeholder="10"
                          value={exercise.reps || ''}
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
                          value={exercise.weight || ''}
                          onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </>
                  )}
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
