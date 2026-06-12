'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { webLightTheme, webDarkTheme, Theme } from '@fluentui/react-components'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'auprism.theme'

function resolveTheme(mode: ThemeMode): Theme {
  if (mode === 'dark') return webDarkTheme
  if (mode === 'light') return webLightTheme
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return webDarkTheme
  }
  return webLightTheme
}

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  theme: Theme
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => {},
  theme: webLightTheme,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [theme, setTheme] = useState<Theme>(webLightTheme)

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode) ?? 'system'
    setModeState(saved)
    setTheme(resolveTheme(saved))
  }, [])

  const setMode = (newMode: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, newMode)
    setModeState(newMode)
    setTheme(resolveTheme(newMode))
  }

  return <ThemeContext.Provider value={{ mode, setMode, theme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
