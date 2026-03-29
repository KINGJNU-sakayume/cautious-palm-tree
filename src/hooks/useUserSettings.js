import { useState } from 'react'

const STORAGE_KEY = 'user-settings'
const DEFAULTS = { showConditions: true }

export function useUserSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
    } catch {
      return DEFAULTS
    }
  })

  const updateSettings = (updates) => {
    const next = { ...settings, ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSettings(next)
  }

  return { settings, updateSettings }
}
