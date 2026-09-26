const STORAGE_KEY = 'achievement-library:state:v1'
const SCHEMA_VERSION = 1

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function loadAppState(fallbackState) {
  if (typeof window === 'undefined' || !window.localStorage) return clone(fallbackState)

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return clone(fallbackState)
    const parsed = JSON.parse(raw)
    if (
      parsed?.schemaVersion !== SCHEMA_VERSION ||
      !Array.isArray(parsed?.data?.categories) ||
      !Array.isArray(parsed?.data?.records) ||
      !Array.isArray(parsed?.data?.achievements)
    ) return clone(fallbackState)
    return parsed.data
  } catch (error) {
    console.warn('Failed to load local app state; using repository defaults.', error)
    return clone(fallbackState)
  }
}

export function saveAppState(state) {
  if (typeof window === 'undefined' || !window.localStorage) return
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ schemaVersion: SCHEMA_VERSION, data: state })
  )
}

export const appStorageKey = STORAGE_KEY
