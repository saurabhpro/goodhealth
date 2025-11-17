'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
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
  const isClient = typeof globalThis.window !== 'undefined'

  // Initialize theme from localStorage or default to system
  const [theme, setThemeState] = useState<Theme>(() => {
    if (!isClient) return 'system'
    const stored = globalThis.localStorage.getItem('theme') as Theme | null
    return stored || 'system'
  })

  // Calculate resolved theme
  const resolvedTheme: 'light' | 'dark' = useMemo(() => {
    if (!isClient) return 'light'
    if (theme === 'system') {
      return getSystemTheme()
    }
    return theme
  }, [theme, isClient])

  // Apply theme to document
  useEffect(() => {
    if (!isClient) return

    const root = globalThis.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)

    // Update meta theme-color
    const metaThemeColor = globalThis.document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#000000' : '#ffffff'
      )
    }
  }, [resolvedTheme, isClient])

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
    if (typeof globalThis.localStorage !== 'undefined') {
      globalThis.localStorage.setItem('theme', newTheme)
    }
  }

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, resolvedTheme]
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
