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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react'
import { createUserTemplate } from '@/lib/workout-plans/preferences-actions'

type Exercise = {
  name: string
  sets: number
  reps: number
  weight?: number
  weight_unit?: string
  rest_seconds?: number
  notes?: string
}

export default function NewTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Template metadata
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [workoutType, setWorkoutType] = useState<string>('')
  const [intensityLevel, setIntensityLevel] = useState<string>('')
  const [difficultyLevel, setDifficultyLevel] = useState<string>('')
  const [estimatedDuration, setEstimatedDuration] = useState<number>(60)

  // Exercises
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', sets: 3, reps: 10 }
  ])

  function addExercise() {
    setExercises([...exercises, { name: '', sets: 3, reps: 10 }])
  }

  function removeExercise(index: number) {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  function updateExercise(index: number, field: keyof Exercise, value: string | number) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Template name is required')
      return
    }

    if (exercises.length === 0 || !exercises[0].name) {
      toast.error('At least one exercise is required')
      return
    }

    setLoading(true)

    try {
      const { error } = await createUserTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        exercises: exercises.filter(ex => ex.name.trim()) as unknown as never,
        workout_type: workoutType || undefined,
        intensity_level: intensityLevel as 'low' | 'medium' | 'high' | undefined,
        difficulty_level: difficultyLevel as 'beginner' | 'intermediate' | 'advanced' | undefined,
        estimated_duration: estimatedDuration,
      })

      if (error) {
        toast.error('Failed to create template', { description: error })
        return
      }

      toast.success('Template created successfully!')
      router.push('/workout-plans/templates')
    } catch (error) {
      toast.error('Failed to create template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/workout-plans/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create Workout Template</h1>
        <p className="text-muted-foreground mt-2">
          Define a reusable workout template with exercises
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Give your template a name and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Upper Body Strength"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your workout template..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="10"
                  max="180"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classification */}
        <Card>
          <CardHeader>
            <CardTitle>Classification</CardTitle>
            <CardDescription>
              Help categorize your template (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workoutType">Workout Type</Label>
                <Select value={workoutType} onValueChange={setWorkoutType}>
                  <SelectTrigger id="workoutType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intensity">Intensity</Label>
                <Select value={intensityLevel} onValueChange={setIntensityLevel}>
                  <SelectTrigger id="intensity">
                    <SelectValue placeholder="Select intensity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exercises */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Exercises</CardTitle>
                <CardDescription>
                  Add exercises to your template
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                <Plus className="mr-2 h-4 w-4" />
                Add Exercise
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {exercises.map((exercise, index) => (
              <div key={index}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Exercise {index + 1}</Label>
                    {exercises.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExercise(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`exercise-${index}-name`}>Exercise Name</Label>
                      <Input
                        id={`exercise-${index}-name`}
                        value={exercise.name}
                        onChange={(e) => updateExercise(index, 'name', e.target.value)}
                        placeholder="e.g., Bench Press"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`exercise-${index}-sets`}>Sets</Label>
                        <Input
                          id={`exercise-${index}-sets`}
                          type="number"
                          min="1"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`exercise-${index}-reps`}>Reps</Label>
                        <Input
                          id={`exercise-${index}-reps`}
                          type="number"
                          min="1"
                          value={exercise.reps}
                          onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`exercise-${index}-weight`}>Weight (optional)</Label>
                        <Input
                          id={`exercise-${index}-weight`}
                          type="number"
                          min="0"
                          step="0.5"
                          value={exercise.weight || ''}
                          onChange={(e) => updateExercise(index, 'weight', parseFloat(e.target.value))}
                          placeholder="kg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`exercise-${index}-rest`}>Rest (sec)</Label>
                        <Input
                          id={`exercise-${index}-rest`}
                          type="number"
                          min="0"
                          step="15"
                          value={exercise.rest_seconds || ''}
                          onChange={(e) => updateExercise(index, 'rest_seconds', parseInt(e.target.value))}
                          placeholder="90"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`exercise-${index}-notes`}>Notes (optional)</Label>
                      <Input
                        id={`exercise-${index}-notes`}
                        value={exercise.notes || ''}
                        onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                        placeholder="Form cues, variations, etc."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Template
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
