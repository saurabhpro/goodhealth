'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@/lib/auth/hooks'
import type { Theme, AccentTheme } from '@/components/theme-provider'

export interface UserPreferences {
  theme: Theme
  accentTheme: AccentTheme
  weightUnit: 'kg' | 'lbs'
  distanceUnit: 'km' | 'miles'
  notificationPreferences: {
    workout_reminders: boolean
    goal_progress: boolean
    weekly_summary: boolean
  }
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  accentTheme: 'default',
  weightUnit: 'kg',
  distanceUnit: 'km',
  notificationPreferences: {
    workout_reminders: false,
    goal_progress: false,
    weekly_summary: false,
  },
}

export function usePreferences() {
  const { user } = useUser()
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load preferences from API
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setPreferences(DEFAULT_PREFERENCES)
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/profile')
        
        if (!response.ok) {
          console.error('Error fetching preferences:', response.statusText)
          setPreferences(DEFAULT_PREFERENCES)
          setLoading(false)
          return
        }

        const result = await response.json()
        const data = result.profile

        if (data) {
          setPreferences({
            theme: (data.theme as Theme) || DEFAULT_PREFERENCES.theme,
            accentTheme: (data.accent_theme as AccentTheme) || DEFAULT_PREFERENCES.accentTheme,
            weightUnit: (data.weight_unit as 'kg' | 'lbs') || DEFAULT_PREFERENCES.weightUnit,
            distanceUnit: (data.distance_unit as 'km' | 'miles') || DEFAULT_PREFERENCES.distanceUnit,
            notificationPreferences: (data.notification_preferences as UserPreferences['notificationPreferences']) || DEFAULT_PREFERENCES.notificationPreferences,
          })
        }
      } catch (err) {
        console.error('Error loading preferences:', err)
        setError(err as Error)
        setPreferences(DEFAULT_PREFERENCES)
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [user])

  // Save preferences to API
  const savePreferences = useCallback(
    async (newPreferences: Partial<UserPreferences>) => {
      if (!user) {
        const error = new Error('User must be logged in to save preferences')
        console.error('Save preferences error:', error)
        return { success: false, error }
      }

      try {
        const updateData: Record<string, unknown> = {}

        if (newPreferences.theme !== undefined) {
          updateData.theme = newPreferences.theme
        }
        if (newPreferences.accentTheme !== undefined) {
          updateData.accent_theme = newPreferences.accentTheme
        }
        if (newPreferences.weightUnit !== undefined) {
          updateData.weight_unit = newPreferences.weightUnit
        }
        if (newPreferences.distanceUnit !== undefined) {
          updateData.distance_unit = newPreferences.distanceUnit
        }
        if (newPreferences.notificationPreferences !== undefined) {
          updateData.notification_preferences = newPreferences.notificationPreferences
        }

        console.log('Updating preferences with data:', updateData)

        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update preferences')
        }

        const result = await response.json()
        console.log('Preferences updated successfully:', result)

        // Update local state
        setPreferences((prev) => ({ ...prev, ...newPreferences }))

        return { success: true }
      } catch (err) {
        console.error('Error saving preferences:', err)
        setError(err as Error)
        return { success: false, error: err as Error }
      }
    },
    [user]
  )

  return {
    preferences,
    loading,
    error,
    savePreferences,
  }
}
