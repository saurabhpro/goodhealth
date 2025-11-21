'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'

type Theme = 'light' | 'dark' | 'system'
type AccentTheme = 'default' | 'blue' | 'gray'

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

  // Initialize theme from localStorage or default to system
  const [theme, setThemeState] = useState<Theme>(() => {
    if (!isClient) return 'system'
    const stored = globalThis.localStorage.getItem('theme') as Theme | null
    return stored || 'system'
  })

  // Initialize accent theme from localStorage or default to 'default'
  const [accentTheme, setAccentThemeState] = useState<AccentTheme>(() => {
    if (!isClient) return 'default'
    const stored = globalThis.localStorage.getItem('accentTheme') as AccentTheme | null
    return stored || 'default'
  })

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
    root.classList.remove('accent-blue', 'accent-gray')
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

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    if (globalThis.localStorage !== undefined) {
      globalThis.localStorage.setItem('theme', newTheme)
    }
  }

  const setAccentTheme = (newAccent: AccentTheme) => {
    setAccentThemeState(newAccent)
    if (globalThis.localStorage !== undefined) {
      globalThis.localStorage.setItem('accentTheme', newAccent)
    }
  }

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme, accentTheme, setAccentTheme }),
    [theme, resolvedTheme, accentTheme]
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
