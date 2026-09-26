// Short, stable fingerprint of an achievement definition. Used by the storage
// migrations and catalog upgrades to tell an untouched built-in achievement
// from one the user edited.

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .filter(key => value[key] !== undefined)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value ?? null)
}

// FNV-1a, 32-bit
function hash(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

/** Fingerprint of the fields a user can edit in the v1 editor. */
export function fingerprintV1Achievement(a) {
  return hash(stableStringify({
    title: a.title ?? '',
    description: a.description ?? '',
    categoryId: a.categoryId ?? null,
    tier: a.tier ?? null,
    type: a.type ?? null,
    condition: a.condition ?? null,
    isHidden: !!a.isHidden,
  }))
}

/** Short hash of any JSON-like value; key order doesn't matter. */
export function digest(value) {
  return hash(stableStringify(value))
}

/**
 * Fingerprint of a (normalised) v2 achievement definition: the fields the
 * editor can change. `manualEarnedAt` is progress, not definition, so it's left out.
 */
export function fingerprintAchievement(a) {
  return digest({
    title: a.title ?? '',
    description: a.description ?? '',
    categoryId: a.categoryId ?? null,
    tier: a.tier ?? null,
    condition: a.condition ?? null,
    isHidden: !!a.isHidden,
  })
}
