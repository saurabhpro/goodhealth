'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { TrendingUp, TrendingDown, Minus, Trash2 } from 'lucide-react'
import { deleteMeasurement } from '@/lib/measurements/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'

type Measurement = Database['public']['Tables']['body_measurements']['Row']

interface MeasurementsListProps {
  measurements: Measurement[]
}

// Define which measurements are better when decreasing (true) vs increasing (false/undefined)
const BETTER_WHEN_DECREASING: Record<string, boolean> = {
  weight: true,
  body_fat_percentage: true,
  waist: true,
  // These are better when increasing:
  muscle_mass: false,
  chest: false,
  bicep_left: false,
  bicep_right: false,
  // hips is neutral/context-dependent
}

function calculateTrend(current: number | null, previous: number | null): 'up' | 'down' | 'stable' | 'none' {
  if (current === null || previous === null) return 'none'
  const diff = current - previous
  if (Math.abs(diff) < 0.1) return 'stable'
  return diff > 0 ? 'up' : 'down'
}

/**
 * Determines if a trend direction is positive for a given measurement field.
 * @returns true = good, false = bad, null = neutral
 */
function getIsPositiveTrend(
  trend: 'up' | 'down' | 'stable',
  fieldName?: string
): boolean | null {
  if (!fieldName) return null
  
  const betterWhenDecreasing = BETTER_WHEN_DECREASING[fieldName]
  
  // Fields where decrease is good (weight, body fat, waist)
  if (betterWhenDecreasing === true) {
    return trend === 'down'
  }
  
  // Fields where increase is good (muscle, biceps, chest)
  if (betterWhenDecreasing === false) {
    return trend === 'up'
  }
  
  // Neutral fields
  return null
}

/**
 * Determines the color class for a trend indicator.
 */
function getTrendColor(
  trend: 'up' | 'down' | 'stable',
  isPositiveTrend: boolean | null
): string {
  if (trend === 'stable') {
    return 'text-muted-foreground'
  }
  
  if (isPositiveTrend === null) {
    return 'text-blue-600' // Neutral color
  }
  
  return isPositiveTrend ? 'text-green-600' : 'text-red-600'
}

function TrendIndicator({
  trend,
  value,
  fieldName
}: Readonly<{
  trend: 'up' | 'down' | 'stable' | 'none';
  value?: string;
  fieldName?: string;
}>) {
  if (trend === 'none') return null

  const isPositiveTrend = getIsPositiveTrend(trend, fieldName)
  const color = getTrendColor(trend, isPositiveTrend)

  return (
    <span className="inline-flex items-center gap-1 text-xs ml-2">
      {trend === 'up' && <TrendingUp className={`w-3 h-3 ${color}`} />}
      {trend === 'down' && <TrendingDown className={`w-3 h-3 ${color}`} />}
      {trend === 'stable' && <Minus className={`w-3 h-3 ${color}`} />}
      {value && (
        <span className={color}>
          {value}
        </span>
      )}
    </span>
  )
}

export function MeasurementsList({ measurements }: Readonly<MeasurementsListProps>) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (measurementId: string) => {
    setDeletingId(measurementId)

    const result = await deleteMeasurement(measurementId)

    if (result.error) {
      toast.error('Failed to delete measurement', {
        description: result.error,
      })
    } else {
      toast.success('Measurement deleted', {
        description: 'Your measurement has been removed.',
      })
      router.refresh()
    }

    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      {measurements.map((measurement, index) => {
        const previousMeasurement = measurements[index + 1]

        return (
          <Card key={measurement.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>
                    {new Date(measurement.measured_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </CardTitle>
                  {index === 0 && <Badge variant="default">Latest</Badge>}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === measurement.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Measurement?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your measurement from{' '}
                        {new Date(measurement.measured_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        . This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(measurement.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Body Composition */}
                {(measurement.weight || measurement.body_fat_percentage || measurement.muscle_mass) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Body Composition</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {measurement.weight && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Weight</p>
                          <p className="text-lg font-semibold">
                            {measurement.weight} kg
                            <TrendIndicator
                              trend={calculateTrend(measurement.weight, previousMeasurement?.weight)}
                              value={
                                previousMeasurement?.weight
                                  ? `${(measurement.weight - previousMeasurement.weight).toFixed(1)} kg`
                                  : undefined
                              }
                              fieldName="weight"
                            />
                          </p>
                        </div>
                      )}
                      {measurement.body_fat_percentage && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Body Fat</p>
                          <p className="text-lg font-semibold">
                            {measurement.body_fat_percentage}%
                            <TrendIndicator
                              trend={calculateTrend(
                                measurement.body_fat_percentage,
                                previousMeasurement?.body_fat_percentage
                              )}
                              value={
                                previousMeasurement?.body_fat_percentage
                                  ? `${(measurement.body_fat_percentage - previousMeasurement.body_fat_percentage).toFixed(1)}%`
                                  : undefined
                              }
                              fieldName="body_fat_percentage"
                            />
                          </p>
                        </div>
                      )}
                      {measurement.muscle_mass && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Muscle Mass</p>
                          <p className="text-lg font-semibold">
                            {measurement.muscle_mass} kg
                            <TrendIndicator
                              trend={calculateTrend(measurement.muscle_mass, previousMeasurement?.muscle_mass)}
                              value={
                                previousMeasurement?.muscle_mass
                                  ? `${(measurement.muscle_mass - previousMeasurement.muscle_mass).toFixed(1)} kg`
                                  : undefined
                              }
                              fieldName="muscle_mass"
                            />
                          </p>
                        </div>
                      )}
                      {measurement.water_percentage && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Water</p>
                          <p className="text-lg font-semibold">{measurement.water_percentage}%</p>
                        </div>
                      )}
                      {measurement.bone_mass && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Bone Mass</p>
                          <p className="text-lg font-semibold">{measurement.bone_mass} kg</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Body Measurements */}
                {(measurement.waist || measurement.chest || measurement.hips) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Body Measurements</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {measurement.chest && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Chest</p>
                          <p className="text-lg font-semibold">
                            {measurement.chest} cm
                            <TrendIndicator
                              trend={calculateTrend(measurement.chest, previousMeasurement?.chest)}
                              fieldName="chest"
                            />
                          </p>
                        </div>
                      )}
                      {measurement.waist && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Waist</p>
                          <p className="text-lg font-semibold">
                            {measurement.waist} cm
                            <TrendIndicator
                              trend={calculateTrend(measurement.waist, previousMeasurement?.waist)}
                              fieldName="waist"
                            />
                          </p>
                        </div>
                      )}
                      {measurement.hips && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Hips</p>
                          <p className="text-lg font-semibold">
                            {measurement.hips} cm
                            <TrendIndicator
                              trend={calculateTrend(measurement.hips, previousMeasurement?.hips)}
                              fieldName="hips"
                            />
                          </p>
                        </div>
                      )}
                      {measurement.shoulders && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Shoulders</p>
                          <p className="text-lg font-semibold">{measurement.shoulders} cm</p>
                        </div>
                      )}
                      {measurement.neck && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Neck</p>
                          <p className="text-lg font-semibold">{measurement.neck} cm</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Arms */}
                {(measurement.bicep_left || measurement.bicep_right || measurement.forearm_left || measurement.forearm_right) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Arms</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {measurement.bicep_left && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Bicep (L)</p>
                          <p className="text-lg font-semibold">
                            {measurement.bicep_left} cm
                            <TrendIndicator
                              trend={calculateTrend(measurement.bicep_left, previousMeasurement?.bicep_left)}
                              fieldName="bicep_left"
                            />
                          </p>
                        </div>
                      )}
                      {measurement.bicep_right && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Bicep (R)</p>
                          <p className="text-lg font-semibold">
                            {measurement.bicep_right} cm
                            <TrendIndicator
                              trend={calculateTrend(measurement.bicep_right, previousMeasurement?.bicep_right)}
                              fieldName="bicep_right"
                            />
                          </p>
                        </div>
                      )}
                      {measurement.forearm_left && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Forearm (L)</p>
                          <p className="text-lg font-semibold">{measurement.forearm_left} cm</p>
                        </div>
                      )}
                      {measurement.forearm_right && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Forearm (R)</p>
                          <p className="text-lg font-semibold">{measurement.forearm_right} cm</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Legs */}
                {(measurement.thigh_left || measurement.thigh_right || measurement.calf_left || measurement.calf_right) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Legs</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {measurement.thigh_left && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Thigh (L)</p>
                          <p className="text-lg font-semibold">{measurement.thigh_left} cm</p>
                        </div>
                      )}
                      {measurement.thigh_right && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Thigh (R)</p>
                          <p className="text-lg font-semibold">{measurement.thigh_right} cm</p>
                        </div>
                      )}
                      {measurement.calf_left && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Calf (L)</p>
                          <p className="text-lg font-semibold">{measurement.calf_left} cm</p>
                        </div>
                      )}
                      {measurement.calf_right && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Calf (R)</p>
                          <p className="text-lg font-semibold">{measurement.calf_right} cm</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Metrics */}
                {(measurement.bmr || measurement.metabolic_age || measurement.visceral_fat) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Additional Metrics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {measurement.bmr && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">BMR</p>
                          <p className="text-lg font-semibold">{measurement.bmr} kcal</p>
                        </div>
                      )}
                      {measurement.metabolic_age && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Metabolic Age</p>
                          <p className="text-lg font-semibold">{measurement.metabolic_age} years</p>
                        </div>
                      )}
                      {measurement.visceral_fat && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Visceral Fat</p>
                          <p className="text-lg font-semibold">{measurement.visceral_fat}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {measurement.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{measurement.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
