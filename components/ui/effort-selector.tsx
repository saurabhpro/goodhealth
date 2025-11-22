'use client'

import { cn } from '@/lib/utils'

interface EffortSelectorProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

const effortLevels = [
  {
    value: 1,
    label: 'Very Easy',
    color: 'bg-green-100 hover:bg-green-200 border-green-300',
    selectedColor: 'bg-green-500 border-green-600 text-white',
    icon: '😊',
    description: 'Light warm-up intensity'
  },
  {
    value: 2,
    label: 'Easy',
    color: 'bg-green-200 hover:bg-green-300 border-green-400',
    selectedColor: 'bg-green-600 border-green-700 text-white',
    icon: '🙂',
    description: 'Can talk easily'
  },
  {
    value: 3,
    label: 'Moderate',
    color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300',
    selectedColor: 'bg-yellow-500 border-yellow-600 text-white',
    icon: '😐',
    description: 'Slightly challenging'
  },
  {
    value: 4,
    label: 'Hard',
    color: 'bg-orange-200 hover:bg-orange-300 border-orange-400',
    selectedColor: 'bg-orange-600 border-orange-700 text-white',
    icon: '😓',
    description: 'Breathing heavily'
  },
  {
    value: 5,
    label: 'Very Hard',
    color: 'bg-red-200 hover:bg-red-300 border-red-400',
    selectedColor: 'bg-red-600 border-red-700 text-white',
    icon: '😰',
    description: 'Maximum effort zone'
  },
  {
    value: 6,
    label: 'Maximum',
    color: 'bg-red-300 hover:bg-red-400 border-red-500',
    selectedColor: 'bg-red-800 border-red-900 text-white',
    icon: '🥵',
    description: 'All-out effort'
  },
]

export function EffortSelector({ value, onChange, disabled = false }: Readonly<EffortSelectorProps>) {
  const selectedLevel = effortLevels.find(level => level.value === value)

  return (
    <div className="space-y-4">
      {/* Visual Heatmap Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {effortLevels.map((level) => {
          const isSelected = value === level.value
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => !disabled && onChange(level.value)}
              disabled={disabled}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all duration-200',
                'flex flex-col items-center gap-2 text-center',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected ? level.selectedColor : level.color,
                !disabled && 'cursor-pointer transform hover:scale-105'
              )}
            >
              <span className="text-2xl">{level.icon}</span>
              <span className={cn(
                'text-xs font-semibold',
                isSelected ? 'text-white' : 'text-gray-700'
              )}>
                {level.label}
              </span>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white" />
              )}
            </button>
          )
        })}
      </div>

      {/* Description */}
      {selectedLevel && (
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">{selectedLevel.label}:</span>{' '}
            {selectedLevel.description}
          </p>
        </div>
      )}

      {/* Alternative: Linear Scale View */}
      <div className="relative pt-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Very Easy</span>
          <span className="text-xs text-muted-foreground">Maximum</span>
        </div>
        <div className="relative h-2 mt-2 rounded-full bg-gradient-to-r from-green-300 via-yellow-300 via-orange-300 to-red-600">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow-lg transition-all duration-200"
            style={{
              left: `calc(${((value - 1) / 5) * 100}% - 8px)`
            }}
          />
        </div>
      </div>
    </div>
  )
}
