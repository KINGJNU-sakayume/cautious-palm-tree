// Browser persistence. Everything lives in localStorage on this device only,
// which is why the settings screen offers backup files.

import { createDefaultState, stateFromPayload, toPayload } from './appState.js'

// The key predates schema v2; the payload carries its own schemaVersion.
export const STORAGE_KEY = 'achievement-library:state:v1'

// Settings that v1 kept under separate keys; read once while migrating.
const LEGACY_PREF_KEYS = {
  favorites: 'category-favorites',
  pinned: 'pinned-achievements',
  categoryDefaults: 'category-defaults',
}

function storage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null // e.g. storage disabled by the browser
  }
}

function readLegacyPrefs(ls) {
  const prefs = {}
  for (const [field, key] of Object.entries(LEGACY_PREF_KEYS)) {
    try {
      const raw = ls.getItem(key)
      if (raw) prefs[field] = JSON.parse(raw)
    } catch {
      // ignore unreadable legacy values
    }
  }
  return prefs
}

/**
 * @returns {{ state: object, notice: string|null }}
 * `notice` explains when stored data couldn't be used as-is.
 */
export function loadAppState() {
  const ls = storage()
  if (!ls) return { state: createDefaultState(), notice: '이 브라우저에서는 데이터를 저장할 수 없어요. 새로고침하면 기록이 사라져요.' }

  const legacyPrefs = readLegacyPrefs(ls)
  let raw = null
  try {
    raw = ls.getItem(STORAGE_KEY)
    if (!raw) return { state: createDefaultState(legacyPrefs), notice: null }
    return { state: stateFromPayload(JSON.parse(raw), legacyPrefs), notice: null }
  } catch (error) {
    console.warn('Stored app state could not be read; starting fresh.', error)
    // Keep the unreadable copy so nothing is silently lost (once per distinct copy).
    try {
      const prefix = `${STORAGE_KEY}:unreadable-`
      const alreadyKept = Object.keys(ls).some(key => key.startsWith(prefix) && ls.getItem(key) === raw)
      if (raw && !alreadyKept) ls.setItem(`${prefix}${Date.now()}`, raw)
    } catch {
      // storage full — nothing more we can do
    }
    return {
      state: createDefaultState(legacyPrefs),
      notice: '저장된 데이터를 읽지 못해 새로 시작했어요. 이전 데이터는 브라우저 저장소에 따로 보관해 두었어요.',
    }
  }
}

export function serializeState(state) {
  return JSON.stringify(toPayload(state))
}

/** Throws when the browser refuses to store (usually because it's full). */
export function writeSerializedState(serialized) {
  const ls = storage()
  if (!ls) return
  ls.setItem(STORAGE_KEY, serialized)
}

export function isQuotaError(error) {
  return error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014
}
