import { useState, useCallback } from 'react'

const STORAGE_KEY = 'pinned-achievements'
const SLOT_COUNT = 5

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return Array(SLOT_COUNT).fill(null)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return Array(SLOT_COUNT).fill(null)
    // Ensure exactly SLOT_COUNT entries
    const result = Array(SLOT_COUNT).fill(null)
    for (let i = 0; i < SLOT_COUNT; i++) {
      result[i] = parsed[i] ?? null
    }
    return result
  } catch {
    return Array(SLOT_COUNT).fill(null)
  }
}

export function usePinnedAchievements() {
  const [pinnedIds, setPinnedIds] = useState(loadFromStorage)

  const pinAchievement = useCallback((slotIndex, achievementId) => {
    setPinnedIds(prev => {
      const next = [...prev]
      // Remove from any other slot first (no duplicates)
      for (let i = 0; i < next.length; i++) {
        if (next[i] === achievementId) next[i] = null
      }
      next[slotIndex] = achievementId
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clearSlot = useCallback((slotIndex) => {
    setPinnedIds(prev => {
      const next = [...prev]
      next[slotIndex] = null
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { pinnedIds, pinAchievement, clearSlot }
}
