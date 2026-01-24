'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Target,
  Award,
  AlertCircle,
  Lightbulb,
  Quote,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'

interface WeeklyAnalysis {
  id: string
  week_start_date: string
  week_end_date: string
  analysis_summary: string
  key_achievements: string[]
  areas_for_improvement: string[]
  recommendations: string[]
  motivational_quote: string
  weekly_stats: {
    workouts_completed: number
    total_duration_minutes: number
    avg_effort_level: number
    total_exercises: number
    workout_types: Record<string, number>
  }
  viewed_at: string | null
  is_dismissed: boolean
  generated_at: string
}

interface WeeklyAnalysisCardProps {
  analysis?: WeeklyAnalysis
  onDismiss?: (id: string) => void
  onView?: (id: string) => void
  isLoading?: boolean
}

export function WeeklyAnalysisCard({
  analysis,
  onDismiss,
  onView,
  isLoading = false
}: Readonly<WeeklyAnalysisCardProps>) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)

  // Mark as viewed when component mounts and analysis is not viewed yet
  useEffect(() => {
    if (analysis && !analysis.viewed_at && onView) {
      onView(analysis.id)
    }
  }, [analysis, onView])

  const handleDismiss = async () => {
    if (!analysis || !onDismiss) return
    setIsDismissing(true)
    onDismiss(analysis.id)
  }

  if (isLoading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-4/6"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return null
  }

  const weekRange = `${format(new Date(analysis.week_start_date), 'MMM d')} - ${format(new Date(analysis.week_end_date), 'MMM d, yyyy')}`

  return (
    <Card className="w-full border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Your Weekly Workout Analysis</CardTitle>
              {!analysis.viewed_at && (
                <Badge variant="default" className="ml-2">New</Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              {weekRange}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            disabled={isDismissing}
            className="h-8 w-8 -mt-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Motivational Quote - Always visible */}
        <div className="bg-primary/10 rounded-lg p-4 border-l-4 border-primary">
          <div className="flex gap-3">
            <Quote className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
            <p className="text-base font-medium italic text-foreground leading-relaxed">
              &ldquo;{analysis.motivational_quote}&rdquo;
            </p>
          </div>
        </div>

        {/* Weekly Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-lg p-3 border">
            <div className="text-2xl font-bold text-primary">
              {analysis.weekly_stats.workouts_completed}
            </div>
            <div className="text-xs text-muted-foreground">Workouts</div>
          </div>
          <div className="bg-card rounded-lg p-3 border">
            <div className="text-2xl font-bold text-primary">
              {Math.round(analysis.weekly_stats.total_duration_minutes)}
            </div>
            <div className="text-xs text-muted-foreground">Minutes</div>
          </div>
          <div className="bg-card rounded-lg p-3 border">
            <div className="text-2xl font-bold text-primary">
              {analysis.weekly_stats.avg_effort_level.toFixed(1)}/6
            </div>
            <div className="text-xs text-muted-foreground">Avg Effort</div>
          </div>
          <div className="bg-card rounded-lg p-3 border">
            <div className="text-2xl font-bold text-primary">
              {analysis.weekly_stats.total_exercises}
            </div>
            <div className="text-xs text-muted-foreground">Exercises</div>
          </div>
        </div>

        {/* Toggle Details Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              View Full Analysis
            </>
          )}
        </Button>

        {/* Expandable Detailed Analysis */}
        {isExpanded && (
          <div className="space-y-4 pt-2 animate-in slide-in-from-top-2">
            {/* Analysis Summary */}
            <div>
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Weekly Summary
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {analysis.analysis_summary}
              </p>
            </div>

            {/* Key Achievements */}
            {analysis.key_achievements.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  Key Achievements
                </h4>
                <ul className="space-y-2">
                  {analysis.key_achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-yellow-500 mt-0.5">✓</span>
                      <span className="text-muted-foreground">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Improvement */}
            {analysis.areas_for_improvement.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-2">
                  {analysis.areas_for_improvement.map((area, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-green-500" />
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">→</span>
                      <span className="text-muted-foreground">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
