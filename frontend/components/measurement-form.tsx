'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createMeasurement } from '@/lib/measurements/actions'
import type { Database } from '@/types/database'

type Measurement = Database['public']['Tables']['body_measurements']['Row']

interface MeasurementFormProps {
  latestMeasurement?: Measurement | null
}

export function MeasurementForm({ latestMeasurement }: Readonly<MeasurementFormProps>) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)

    const result = await createMeasurement(formData)

    if (result.error) {
      toast.error('Failed to save measurement', {
        description: result.error,
      })
    } else {
      toast.success('Measurement saved!', {
        description: 'Your body measurement has been recorded.',
      })
      router.push('/measurements')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Date */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Measurement Date</CardTitle>
          <CardDescription>When was this measurement taken?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="measured_at">Date & Time</Label>
            <Input
              id="measured_at"
              name="measured_at"
              type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)}
              required
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Body Composition */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Body Composition</CardTitle>
          <CardDescription>Weight, body fat, muscle mass, and more</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                step="0.1"
                placeholder="70.5"
                defaultValue={latestMeasurement?.weight?.toString() || ''}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                name="height"
                type="number"
                step="0.1"
                placeholder="175.0"
                defaultValue={latestMeasurement?.height?.toString() || ''}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body_fat_percentage">Body Fat (%)</Label>
              <Input
                id="body_fat_percentage"
                name="body_fat_percentage"
                type="number"
                step="0.1"
                placeholder="15.5"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="muscle_mass">Muscle Mass (kg)</Label>
              <Input
                id="muscle_mass"
                name="muscle_mass"
                type="number"
                step="0.1"
                placeholder="55.0"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bone_mass">Bone Mass (kg)</Label>
              <Input
                id="bone_mass"
                name="bone_mass"
                type="number"
                step="0.1"
                placeholder="3.2"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="water_percentage">Water (%)</Label>
              <Input
                id="water_percentage"
                name="water_percentage"
                type="number"
                step="0.1"
                placeholder="60.0"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein_percentage">Protein (%)</Label>
              <Input
                id="protein_percentage"
                name="protein_percentage"
                type="number"
                step="0.1"
                placeholder="18.5"
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Body Measurements */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Body Measurements</CardTitle>
          <CardDescription>Circumference measurements in centimeters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="neck">Neck (cm)</Label>
              <Input
                id="neck"
                name="neck"
                type="number"
                step="0.1"
                placeholder="38.0"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shoulders">Shoulders (cm)</Label>
              <Input
                id="shoulders"
                name="shoulders"
                type="number"
                step="0.1"
                placeholder="110.0"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chest">Chest (cm)</Label>
              <Input
                id="chest"
                name="chest"
                type="number"
                step="0.1"
                placeholder="95.0"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waist">Waist (cm)</Label>
              <Input
                id="waist"
                name="waist"
                type="number"
                step="0.1"
                placeholder="80.0"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hips">Hips (cm)</Label>
              <Input
                id="hips"
                name="hips"
                type="number"
                step="0.1"
                placeholder="95.0"
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Arms */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Arms</CardTitle>
          <CardDescription>Arm measurements in centimeters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bicep_left">Bicep Left (cm)</Label>
              <Input
                id="bicep_left"
                name="bicep_left"
                type="number"
                step="0.1"
                placeholder="35.0"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bicep_right">Bicep Right (cm)</Label>
              <Input
                id="bicep_right"
                name="bicep_right"
                type="number"
                step="0.1"
                placeholder="35.0"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forearm_left">Forearm Left (cm)</Label>
              <Input
                id="forearm_left"
                name="forearm_left"
                type="number"
                step="0.1"
                placeholder="28.0"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forearm_right">Forearm Right (cm)</Label>
              <Input
                id="forearm_right"
                name="forearm_right"
                type="number"
                step="0.1"
                placeholder="28.0"
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Legs</CardTitle>
          <CardDescription>Leg measurements in centimeters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thigh_left">Thigh Left (cm)</Label>
              <Input
                id="thigh_left"
                name="thigh_left"
                type="number"
                step="0.1"
                placeholder="55.0"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thigh_right">Thigh Right (cm)</Label>
              <Input
                id="thigh_right"
                name="thigh_right"
                type="number"
                step="0.1"
                placeholder="55.0"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calf_left">Calf Left (cm)</Label>
              <Input
                id="calf_left"
                name="calf_left"
                type="number"
                step="0.1"
                placeholder="38.0"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calf_right">Calf Right (cm)</Label>
              <Input
                id="calf_right"
                name="calf_right"
                type="number"
                step="0.1"
                placeholder="38.0"
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Additional Metrics</CardTitle>
          <CardDescription>BMR, metabolic age, and visceral fat</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bmr">BMR (kcal)</Label>
              <Input
                id="bmr"
                name="bmr"
                type="number"
                placeholder="1800"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metabolic_age">Metabolic Age (years)</Label>
              <Input
                id="metabolic_age"
                name="metabolic_age"
                type="number"
                placeholder="25"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visceral_fat">Visceral Fat Level</Label>
              <Input
                id="visceral_fat"
                name="visceral_fat"
                type="number"
                placeholder="5"
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Any observations or comments about this measurement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Feeling great today! Started a new training program..."
              rows={4}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : 'Save Measurement'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/measurements')}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
