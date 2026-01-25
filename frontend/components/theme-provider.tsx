'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { useUser } from '@/lib/auth/hooks'

export type Theme = 'light' | 'dark' | 'system'
export type AccentTheme = 'default' | 'blue' | 'gray' | 'red' | 'green'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
  accentTheme: AccentTheme
  setAccentTheme: (accent: AccentTheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  readonly children: React.ReactNode
}

function getSystemTheme(): 'light' | 'dark' {
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Check if we're on the client side
  const isClient = globalThis.window !== undefined
  const { user } = useUser()

  // Initialize theme from localStorage
  const [theme, setThemeState] = useState<Theme>(() => {
    if (!isClient) return 'system'
    const stored = globalThis.localStorage.getItem('theme') as Theme | null
    return stored || 'system'
  })

  // Initialize accent theme from localStorage
  const [accentTheme, setAccentThemeState] = useState<AccentTheme>(() => {
    if (!isClient) return 'default'
    const stored = globalThis.localStorage.getItem('accentTheme') as AccentTheme | null
    return stored || 'default'
  })

  // Load preferences from API when user is available
  useEffect(() => {
    if (!user) return

    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/profile')
        if (!response.ok) return
        
        const data = await response.json()
        const profile = data.profile

        if (profile) {
          if (profile.theme) {
            setThemeState(profile.theme as Theme)
            globalThis.localStorage.setItem('theme', profile.theme)
          }
          if (profile.accent_theme) {
            setAccentThemeState(profile.accent_theme as AccentTheme)
            globalThis.localStorage.setItem('accentTheme', profile.accent_theme)
          }
        }
      } catch (err) {
        console.error('Error loading theme preferences:', err)
      }
    }

    loadPreferences()
  }, [user])

  // Calculate resolved theme
  const resolvedTheme: 'light' | 'dark' = useMemo(() => {
    if (!isClient) return 'light'
    if (theme === 'system') {
      return getSystemTheme()
    }
    return theme
  }, [theme, isClient])

  // Apply theme and accent to document
  useEffect(() => {
    if (!isClient) return

    const root = globalThis.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)

    // Apply accent theme
    root.classList.remove('accent-blue', 'accent-gray', 'accent-red', 'accent-green')
    if (accentTheme !== 'default') {
      root.classList.add(`accent-${accentTheme}`)
    }

    // Update meta theme-color based on accent
    const metaThemeColor = globalThis.document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      let color = resolvedTheme === 'dark' ? '#000000' : '#ffffff'
      if (accentTheme === 'blue') {
        color = resolvedTheme === 'dark' ? '#1a1f2e' : '#f5f7ff'
      } else if (accentTheme === 'gray') {
        color = resolvedTheme === 'dark' ? '#1c1d20' : '#f7f8f9'
      } else if (accentTheme === 'red') {
        color = resolvedTheme === 'dark' ? '#2e1a1a' : '#fff5f5'
      } else if (accentTheme === 'green') {
        color = resolvedTheme === 'dark' ? '#1a2e1a' : '#f5fff5'
      }
      metaThemeColor.setAttribute('content', color)
    }
  }, [resolvedTheme, accentTheme, isClient])

  // Listen for system theme changes
  useEffect(() => {
    if (!isClient || theme !== 'system') return

    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const systemTheme = getSystemTheme()
      globalThis.document.documentElement.classList.remove('light', 'dark')
      globalThis.document.documentElement.classList.add(systemTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, isClient])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    if (globalThis.localStorage !== undefined) {
      globalThis.localStorage.setItem('theme', newTheme)
    }
    // Save to API
    if (user) {
      fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      }).catch((error) => {
        console.error('Failed to save theme preference:', error)
      })
    }
  }, [user])

  const setAccentTheme = useCallback((newAccent: AccentTheme) => {
    setAccentThemeState(newAccent)
    if (globalThis.localStorage !== undefined) {
      globalThis.localStorage.setItem('accentTheme', newAccent)
    }
    // Save to API
    if (user) {
      fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accent_theme: newAccent }),
      }).catch((error) => {
        console.error('Failed to save accent theme preference:', error)
      })
    }
  }, [user])

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme, accentTheme, setAccentTheme }),
    [theme, resolvedTheme, accentTheme, setTheme, setAccentTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
