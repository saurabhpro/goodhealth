'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EffortSelector } from '@/components/ui/effort-selector'
import { toast } from 'sonner'
import { updateWorkout } from '@/lib/workouts/actions'
import { gymEquipment, equipmentCategories, getEquipmentType, type ExerciseType } from '@/lib/data/gym-equipment'
import type { Database } from '@/types/database'

type Workout = Database['public']['Tables']['workouts']['Row']
type Exercise = Database['public']['Tables']['exercises']['Row']

interface WorkoutEditFormProps {
  workout: Workout
  exercises: Exercise[]
}

interface ExerciseFormData {
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

export function WorkoutEditForm({ workout, exercises: initialExercises }: WorkoutEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [effortLevel, setEffortLevel] = useState(workout.effort_level || 3)

  // Convert database exercises to form format
  const [exercises, setExercises] = useState<ExerciseFormData[]>(
    initialExercises.length > 0
      ? initialExercises.map(ex => ({
          name: ex.name,
          type: (ex.exercise_type || 'strength') as ExerciseType,
          // Strength fields
          sets: ex.sets?.toString() || '',
          reps: ex.reps?.toString() || '',
          weight: ex.weight?.toString() || '',
          // Cardio fields
          duration: ex.duration_minutes?.toString() || '',
          distance: ex.distance?.toString() || '',
          speed: ex.speed?.toString() || '',
          calories: ex.calories?.toString() || '',
          resistance: ex.resistance_level?.toString() || '',
          incline: ex.incline?.toString() || '',
        }))
      : [{ name: '', type: 'strength' as ExerciseType, sets: '', reps: '', weight: '' }]
  )

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)

    // Add exercises as JSON string to FormData
    formData.append('exercises', JSON.stringify(exercises))
    formData.set('effort_level', effortLevel.toString())

    const result = await updateWorkout(workout.id, formData)

    if (result.error) {
      toast.error('Failed to update workout', {
        description: result.error,
      })
    } else {
      toast.success('Workout updated!', {
        description: 'Your workout has been successfully updated.',
      })
      router.push(`/workouts/${workout.id}`)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Workout Details</CardTitle>
          <CardDescription>Update the basic information about your workout</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workout Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={workout.name}
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
              defaultValue={workout.date}
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
              defaultValue={workout.duration_minutes || ''}
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
              defaultValue={workout.description || ''}
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
              <CardDescription>Add or modify exercises for this workout</CardDescription>
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
                      gymEquipment[category.value as keyof typeof gymEquipment]?.map((equipment) => (
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
          {loading ? 'Updating...' : 'Update Workout'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/workouts/${workout.id}`)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
