// Unit handling for value-based achievement conditions.
//
// A condition with a unit only counts records whose unit is the same, or one
// that converts cleanly (m → km, ml → L, 분 → 시간, 쪽 → 페이지 …). Records logged
// without a unit are assumed to use the condition's unit, so a quick "5" in a
// running category still counts toward a km goal. Anything else (e.g. 30 분
// toward a km goal) is left out instead of being summed as if it were kilometres.

// unit → [dimension, factor to the dimension's base unit]
const UNIT_TABLE = {
  km: ['length', 1000],
  킬로미터: ['length', 1000],
  m: ['length', 1],
  미터: ['length', 1],
  cm: ['length', 0.01],
  센티미터: ['length', 0.01],
  mi: ['length', 1609.344],
  mile: ['length', 1609.344],
  miles: ['length', 1609.344],
  마일: ['length', 1609.344],

  kg: ['mass', 1000],
  킬로그램: ['mass', 1000],
  g: ['mass', 1],
  그램: ['mass', 1],
  lb: ['mass', 453.59237],
  lbs: ['mass', 453.59237],
  파운드: ['mass', 453.59237],

  l: ['volume', 1000],
  리터: ['volume', 1000],
  ml: ['volume', 1],
  밀리리터: ['volume', 1],
  cc: ['volume', 1],

  시간: ['time', 3600],
  h: ['time', 3600],
  hr: ['time', 3600],
  hrs: ['time', 3600],
  hour: ['time', 3600],
  hours: ['time', 3600],
  분: ['time', 60],
  min: ['time', 60],
  mins: ['time', 60],
  minute: ['time', 60],
  minutes: ['time', 60],
  초: ['time', 1],
  sec: ['time', 1],
  secs: ['time', 1],
  second: ['time', 1],
  seconds: ['time', 1],

  원: ['krw', 1],
  krw: ['krw', 1],
  천원: ['krw', 1e3],
  만원: ['krw', 1e4],
  십만원: ['krw', 1e5],
  백만원: ['krw', 1e6],
  천만원: ['krw', 1e7],
  억: ['krw', 1e8],
  억원: ['krw', 1e8],

  페이지: ['pages', 1],
  쪽: ['pages', 1],
  p: ['pages', 1],
  page: ['pages', 1],
  pages: ['pages', 1],

  자: ['characters', 1],
  글자: ['characters', 1],

  걸음: ['steps', 1],
  보: ['steps', 1],
  step: ['steps', 1],
  steps: ['steps', 1],

  // Plain counters: 푸시업 50회 = 50개 = 50번.
  회: ['count', 1],
  번: ['count', 1],
  개: ['count', 1],
  rep: ['count', 1],
  reps: ['count', 1],

  kcal: ['energy', 1],
  칼로리: ['energy', 1],
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

/** Whether a value logged in `fromUnit` can count toward a goal in `toUnit`. */
export function canConvert(fromUnit, toUnit) {
  return convertValue(1, fromUnit, toUnit) != null
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

/**
 * What someone typed in the value box: '1,000' → 1000, '5.2km' → 5.2 and 'km',
 * '3만원' → 3 and '만원'. `error` is set when it isn't a number at all.
 * @returns {{ value: number|null, unit: string|null, error?: boolean }}
 */
export function parseValueInput(text) {
  const raw = String(text ?? '').trim()
  if (raw === '') return { value: null, unit: null }
  const match = raw.replace(/,/g, '').match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*([^\d\s.,+-][^\d]*)?$/)
  if (!match) return { value: null, unit: null, error: true }
  return { value: Number(match[1]), unit: match[2] ? match[2].trim() : null }
}
