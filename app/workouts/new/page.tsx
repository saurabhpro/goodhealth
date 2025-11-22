'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createWorkout } from '@/lib/workouts/actions'
import { toast } from 'sonner'
import { gymEquipment, equipmentCategories, getEquipmentType, type ExerciseType } from '@/lib/data/gym-equipment'
import { EffortSelector } from '@/components/ui/effort-selector'
import { SelfieUpload } from '@/components/selfie-upload'

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

function NewWorkoutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const [loading, setLoading] = useState(false)
  const [loadingTemplate, setLoadingTemplate] = useState(!!sessionId)
  const [error, setError] = useState<string | null>(null)
  const [effortLevel, setEffortLevel] = useState(3) // Default to Moderate
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', type: 'strength', sets: '', reps: '', weight: '' }
  ])
  const [createdWorkoutId, setCreatedWorkoutId] = useState<string | null>(null)
  const [showSelfieUpload, setShowSelfieUpload] = useState(false)
  const [sessionDetails, setSessionDetails] = useState<{
    session: { workout_name?: string; [key: string]: unknown };
    template: { [key: string]: unknown } | null
  } | null>(null)
  const [defaultWorkoutName, setDefaultWorkoutName] = useState('')

  // Fetch session details and pre-populate exercises if sessionId is present
  useEffect(() => {
    if (!sessionId) {
      console.log('No sessionId found in URL')
      return
    }

    console.log('Fetching session details for sessionId:', sessionId)

    const fetchSessionDetails = async () => {
      try {
        setLoadingTemplate(true)
        const url = `/api/workout-plans/sessions/${sessionId}/details`
        console.log('Fetching from:', url)
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Failed to fetch session details')
        }

        const data = await response.json()
        console.log('Session details received:', data)
        setSessionDetails(data)

        // Set default workout name from session
        if (data.session?.workout_name) {
          console.log('Setting workout name:', data.session.workout_name)
          setDefaultWorkoutName(data.session.workout_name)
        }

        // Pre-populate exercises from template
        if (data.exercises && data.exercises.length > 0) {
          console.log('Pre-populating exercises:', data.exercises)
          const mappedExercises = data.exercises.map((ex: {
            name?: string;
            type?: string;
            sets?: number;
            reps?: number;
            weight?: number;
            duration?: number;
            distance?: number;
            speed?: number;
            calories?: number;
            resistance?: number;
            incline?: number;
          }) => ({
            name: ex.name || '',
            type: ex.type || 'strength',
            sets: ex.sets?.toString() || '',
            reps: ex.reps?.toString() || '',
            weight: ex.weight?.toString() || '',
            duration: ex.duration?.toString() || '',
            distance: ex.distance?.toString() || '',
            speed: ex.speed?.toString() || '',
            calories: ex.calories?.toString() || '',
            resistance: ex.resistance?.toString() || '',
            incline: ex.incline?.toString() || '',
          }))
          console.log('Mapped exercises:', mappedExercises)
          setExercises(mappedExercises)

          toast.success('Workout template loaded!', {
            description: `${mappedExercises.length} exercises pre-filled from your plan`
          })
        } else {
          console.log('No exercises found in session data')
        }
      } catch (err) {
        console.error('Error fetching session details:', err)
        toast.error('Failed to load workout template', {
          description: 'You can still create the workout manually'
        })
      } finally {
        setLoadingTemplate(false)
      }
    }

    fetchSessionDetails()
  }, [sessionId])

  const addExercise = () => {
    setExercises([...exercises, { name: '', type: 'strength', sets: '', reps: '', weight: '' }])
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const updateExercise = (index: number, field: string, value: string) => {
    const updated = [...exercises]

    // If updating the type, clear fields that don't apply
    if (field === 'type') {
      const exerciseType = value as ExerciseType
      updated[index] = {
        ...updated[index],
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
    }
    // If updating the name, try to auto-detect type from predefined list
    else if (field === 'name') {
      const detectedType = getEquipmentType(value)
      // Only auto-update type if we found a match in the predefined list
      if (detectedType) {
        updated[index] = {
          ...updated[index],
          name: value,
          type: detectedType,
          // Clear fields that don't apply to the detected type
          ...(detectedType === 'cardio' ? {
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
        // For custom names, just update the name, keep the current type
        updated[index] = { ...updated[index], name: value }
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

    // Add session ID if present
    if (sessionId) {
      formData.append('session_id', sessionId)
    }

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

      // Set the created workout ID and show selfie upload option
      if (result.workoutId) {
        setCreatedWorkoutId(result.workoutId)
        setShowSelfieUpload(true)
      } else {
        // If no workout ID, just redirect
        setTimeout(() => {
          router.push('/workouts')
        }, 500)
      }
    }
  }

  // If workout is created and selfie upload is shown
  if (showSelfieUpload && createdWorkoutId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Workout Saved!</h1>
          <p className="text-muted-foreground">
            Want to add a selfie to track your progress?
          </p>
        </div>

        <div className="space-y-6">
          <SelfieUpload
            workoutId={createdWorkoutId}
            onUploadComplete={() => {
              toast.success('Selfie added!')
              setTimeout(() => {
                router.push('/workouts')
              }, 500)
            }}
          />

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/workouts')}
              className="flex-1"
            >
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Log New Workout</h1>
        <p className="text-muted-foreground">
          {sessionId && sessionDetails
            ? `Recording workout from your plan: ${sessionDetails.session.workout_name}`
            : 'Record your workout session and track your progress'}
        </p>
      </div>

      {loadingTemplate && (
        <div className="mb-6 rounded-md bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          Loading workout template...
        </div>
      )}

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
                defaultValue={defaultWorkoutName}
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
                    <Label htmlFor={`exercise-name-${index}`}>Exercise Name</Label>
                    <Input
                      id={`exercise-name-${index}`}
                      placeholder="Type exercise name or select from dropdown"
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      required
                      disabled={loading}
                      list={`exercise-list-${index}`}
                    />
                    <datalist id={`exercise-list-${index}`}>
                      {equipmentCategories.map((category) =>
                        gymEquipment[category.value]?.map((equipment) => (
                          <option key={equipment.name} value={equipment.name}>
                            {equipment.name}
                            {equipment.brands.length > 0 && ` (${equipment.brands[0]})`}
                          </option>
                        ))
                      )}
                    </datalist>
                    <p className="text-xs text-muted-foreground mt-1">
                      Start typing to see suggestions or enter a custom exercise name
                    </p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`exercise-type-${index}`}>Exercise Type</Label>
                    <Select
                      value={exercise.type}
                      onValueChange={(value) => updateExercise(index, 'type', value as ExerciseType)}
                      disabled={loading}
                    >
                      <SelectTrigger id={`exercise-type-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strength">💪 Strength (sets, reps, weight)</SelectItem>
                        <SelectItem value="cardio">🏃 Cardio (duration, distance, speed)</SelectItem>
                        <SelectItem value="functional">⚡ Functional (sets, reps)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select the type to show relevant input fields below
                    </p>
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
                      {/* Strength/Functional Inputs */}
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
                      {exercise.type === 'strength' && (
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
                      )}
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

export default function NewWorkoutPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <NewWorkoutForm />
    </Suspense>
  )
}
