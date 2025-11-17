'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Database } from '@/types/database'

type Measurement = Database['public']['Tables']['body_measurements']['Row']

interface MeasurementsChartProps {
  measurements: Measurement[]
}

type MetricKey =
  | 'weight'
  | 'body_fat_percentage'
  | 'muscle_mass'
  | 'waist'
  | 'chest'
  | 'hips'
  | 'bicep_left'
  | 'bicep_right'

interface MetricConfig {
  key: MetricKey
  label: string
  unit: string
  color: string
  betterWhenDecreasing?: boolean // true = decrease is good (weight, body fat), false/undefined = increase is good
}

const METRICS: MetricConfig[] = [
  { key: 'weight', label: 'Weight', unit: 'kg', color: '#8884d8', betterWhenDecreasing: true },
  { key: 'body_fat_percentage', label: 'Body Fat %', unit: '%', color: '#82ca9d', betterWhenDecreasing: true },
  { key: 'muscle_mass', label: 'Muscle Mass', unit: 'kg', color: '#ffc658', betterWhenDecreasing: false },
  { key: 'waist', label: 'Waist', unit: 'cm', color: '#ff7c7c', betterWhenDecreasing: true },
  { key: 'chest', label: 'Chest', unit: 'cm', color: '#8dd1e1', betterWhenDecreasing: false },
  { key: 'hips', label: 'Hips', unit: 'cm', color: '#d084d0' }, // neutral
  { key: 'bicep_left', label: 'Bicep (L)', unit: 'cm', color: '#a4de6c', betterWhenDecreasing: false },
  { key: 'bicep_right', label: 'Bicep (R)', unit: 'cm', color: '#ffa07a', betterWhenDecreasing: false },
]

export function MeasurementsChart({ measurements }: MeasurementsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('weight')

  const chartData = useMemo(() => {
    // Sort by date ascending for chart
    const sorted = [...measurements].sort(
      (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
    )

    return sorted.map((m) => ({
      date: new Date(m.measured_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      fullDate: m.measured_at,
      value: m[selectedMetric],
    })).filter(item => item.value !== null)
  }, [measurements, selectedMetric])

  const currentMetric = METRICS.find(m => m.key === selectedMetric)!

  const stats = useMemo(() => {
    const values = chartData.map(d => d.value).filter((v): v is number => v !== null)
    if (values.length === 0) return null

    const latest = values[values.length - 1]
    const earliest = values[0]
    const change = latest - earliest
    const changePercent = earliest !== 0 ? (change / earliest) * 100 : 0
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)

    // Determine if the change is "good" based on metric type
    const isPositiveChange = currentMetric.betterWhenDecreasing === true
      ? change < 0  // For weight/body fat, decrease is good
      : currentMetric.betterWhenDecreasing === false
      ? change > 0  // For muscle/biceps, increase is good
      : null        // Neutral metrics

    return {
      latest,
      earliest,
      change,
      changePercent,
      avg,
      max,
      min,
      isPositiveChange,
    }
  }, [chartData, currentMetric])

  if (measurements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Chart</CardTitle>
          <CardDescription>Track your measurements over time</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No measurements to display. Add your first measurement to see your progress over time.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Progress Chart</CardTitle>
            <CardDescription>Track your measurements over time</CardDescription>
          </div>
          <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricKey)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRICS.map((metric) => (
                <SelectItem key={metric.key} value={metric.key}>
                  {metric.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No {currentMetric.label.toLowerCase()} data available
          </p>
        ) : (
          <>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Latest</p>
                  <p className="text-lg font-bold">
                    {stats.latest.toFixed(1)} {currentMetric.unit}
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Change</p>
                  <p className={`text-lg font-bold ${
                    stats.isPositiveChange === null
                      ? 'text-muted-foreground'
                      : stats.isPositiveChange
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(1)} {currentMetric.unit}
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Change %</p>
                  <p className={`text-lg font-bold ${
                    stats.isPositiveChange === null
                      ? 'text-muted-foreground'
                      : stats.isPositiveChange
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Average</p>
                  <p className="text-lg font-bold">
                    {stats.avg.toFixed(1)} {currentMetric.unit}
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Range</p>
                  <p className="text-sm font-bold">
                    {stats.min.toFixed(1)} - {stats.max.toFixed(1)}
                  </p>
                </div>
              </div>
            )}
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{
                      value: `${currentMetric.label} (${currentMetric.unit})`,
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12 }
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="text-sm font-medium mb-1">
                              {new Date(data.fullDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-sm">
                              <span className="font-semibold">{currentMetric.label}:</span>{' '}
                              {data.value?.toFixed(1)} {currentMetric.unit}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={currentMetric.color}
                    strokeWidth={2}
                    dot={{ fill: currentMetric.color, r: 4 }}
                    activeDot={{ r: 6 }}
                    name={currentMetric.label}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
