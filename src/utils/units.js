// Unit handling for value-based achievement conditions.
//
// A condition with a unit only counts records whose unit is the same, or one
// that converts cleanly (m → km, ml → L, 분 → 시간 …). Records logged without a
// unit are assumed to use the condition's unit, so a quick "5" in a running
// category still counts toward a km goal. Anything else (e.g. 30 분 toward a km
// goal) is left out instead of being summed as if it were kilometres.

// unit → [dimension, factor to the dimension's base unit]
const UNIT_TABLE = {
  km: ['length', 1000],
  m: ['length', 1],
  킬로미터: ['length', 1000],
  미터: ['length', 1],

  kg: ['mass', 1000],
  g: ['mass', 1],
  킬로그램: ['mass', 1000],
  그램: ['mass', 1],

  l: ['volume', 1000],
  리터: ['volume', 1000],
  ml: ['volume', 1],
  밀리리터: ['volume', 1],

  시간: ['time', 3600],
  h: ['time', 3600],
  hr: ['time', 3600],
  분: ['time', 60],
  min: ['time', 60],
  초: ['time', 1],
  sec: ['time', 1],

  원: ['krw', 1],
  만원: ['krw', 10000],
}

export function normalizeUnit(unit) {
  if (unit == null) return ''
  return String(unit).replace(/\s+/g, '').toLowerCase()
}

/**
 * Convert `value` from a record's unit into the condition's unit.
 * Returns null when the units can't be compared.
 */
export function convertValue(value, fromUnit, toUnit) {
  const to = normalizeUnit(toUnit)
  const from = normalizeUnit(fromUnit)
  if (!to || !from || from === to) return value
  const a = UNIT_TABLE[from]
  const b = UNIT_TABLE[to]
  if (a && b && a[0] === b[0]) return (value * a[1]) / b[1]
  return null
}

/** Numeric value of a record expressed in `unit`, or null if it can't count. */
export function recordValueIn(record, unit) {
  if (record.value == null || record.value === '') return null
  const value = Number(record.value)
  if (!Number.isFinite(value)) return null
  const converted = convertValue(value, record.unit, unit)
  if (converted == null) return null
  // Keep float noise (0.1 + 0.2) out of sums and comparisons.
  return Math.round(converted * 1e6) / 1e6
}
