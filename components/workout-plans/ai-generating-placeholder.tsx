'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Brain, Dumbbell, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AIGeneratingPlaceholderProps {
  readonly planName?: string
  readonly weeksDuration?: number
  readonly workoutsPerWeek?: number
}

export function AIGeneratingPlaceholder({
  weeksDuration = 8,
  workoutsPerWeek = 4,
}: AIGeneratingPlaceholderProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { icon: Brain, text: 'Analyzing your fitness profile...', duration: 3000 },
    { icon: Dumbbell, text: 'Crafting personalized exercises...', duration: 3000 },
    { icon: Calendar, text: 'Optimizing your schedule...', duration: 3000 },
    { icon: Sparkles, text: 'Fine-tuning intensities...', duration: 3000 },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [steps.length])

  return (
    <Card className="relative overflow-hidden border-2 border-dashed border-purple-300 dark:border-purple-700 animate-pulse-slow">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-purple-950/20 animate-gradient-x" />

      <CardHeader className="relative">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            {/* Shimmer effect for title */}
            <div className="h-7 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer bg-[length:200%_100%]" />
            <div className="h-4 w-1/2 mt-2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer bg-[length:200%_100%]" />
          </div>
          <Badge className="relative bg-purple-500 hover:bg-purple-600 text-white animate-pulse-slow">
            <Sparkles className="mr-1 h-3 w-3 animate-spin-slow" />
            Generating...
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* AI Generation Status */}
        <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-purple-200 dark:border-purple-800">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            return (
              <div
                key={index}
                className={`flex items-center gap-2 transition-all duration-500 ${
                  index === currentStep
                    ? 'text-purple-600 dark:text-purple-400 scale-110'
                    : 'text-gray-400 dark:text-gray-600 scale-90 opacity-50'
                }`}
              >
                <StepIcon
                  className={`h-5 w-5 ${
                    index === currentStep ? 'animate-bounce' : ''
                  }`}
                />
              </div>
            )
          })}
        </div>

        <p className="text-sm text-center text-purple-600 dark:text-purple-400 font-medium animate-pulse">
          {steps[currentStep].text}
        </p>

        {/* Plan Details Shimmer */}
        <div className="flex gap-2 flex-wrap">
          <div className="h-6 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full animate-shimmer bg-[length:200%_100%]" />
          <div className="h-6 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full animate-shimmer bg-[length:200%_100%]" />
          <div className="h-6 w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full animate-shimmer bg-[length:200%_100%]" />
        </div>

        {/* Exercise List Shimmer */}
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded animate-shimmer bg-[length:200%_100%]"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 animate-progress-indeterminate" />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Creating {weeksDuration}-week plan with {workoutsPerWeek} workouts per week...
          </p>
        </div>

        {/* Buttons Shimmer */}
        <div className="flex gap-2 pt-2">
          <div className="flex-1 h-9 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer bg-[length:200%_100%]" />
          <div className="h-9 w-9 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer bg-[length:200%_100%]" />
          <div className="h-9 w-9 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer bg-[length:200%_100%]" />
        </div>
      </CardContent>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes progress-indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
          background-size: 200% 200%;
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 1.5s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </Card>
  )
}
