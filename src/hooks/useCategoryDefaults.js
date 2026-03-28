// localStorage-backed per-category defaults.
// Storage key: 'category-defaults'
// Shape: { [categoryId]: { defaultUnit: string, defaultTags: string[], autoApply: boolean } }

const STORAGE_KEY = 'category-defaults'

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useCategoryDefaults() {
  function getDefaults(categoryId) {
    const all = readAll()
    return all[categoryId] ?? { defaultUnit: '', defaultTags: [], autoApply: true }
  }

  function setDefaultUnit(categoryId, unit) {
    const all = readAll()
    all[categoryId] = { ...getDefaults(categoryId), ...all[categoryId], defaultUnit: unit }
    writeAll(all)
  }

  function setDefaultTags(categoryId, tags) {
    const all = readAll()
    all[categoryId] = { ...getDefaults(categoryId), ...all[categoryId], defaultTags: tags }
    writeAll(all)
  }

  function setAutoApply(categoryId, value) {
    const all = readAll()
    all[categoryId] = { ...getDefaults(categoryId), ...all[categoryId], autoApply: value }
    writeAll(all)
  }

  return { getDefaults, setDefaultUnit, setDefaultTags, setAutoApply }
}
