// Local-time date helpers. Every date in the app is a 'YYYY-MM-DD' string in the
// user's timezone, so these never go through UTC parsing (new Date('YYYY-MM-DD')).

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function pad(n) {
  return String(n).padStart(2, '0')
}

export function toDateStr(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayStr() {
  return toDateStr(new Date())
}

export function parseDateStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isValidDateStr(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false
  return toDateStr(parseDateStr(value)) === value
}

export function addDays(dateStr, days) {
  const date = parseDateStr(dateStr)
  date.setDate(date.getDate() + days)
  return toDateStr(date)
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from, to) {
  return Math.round((parseDateStr(to) - parseDateStr(from)) / 86400000)
}

export function uniqueSortedDates(records) {
  return [...new Set(records.map(r => r.date).filter(isValidDateStr))].sort()
}

/** Longest run of consecutive days in an ascending list of unique dates. */
export function longestStreak(sortedDates) {
  let longest = 0
  let run = 0
  let prev = null
  for (const date of sortedDates) {
    run = prev && addDays(prev, 1) === date ? run + 1 : 1
    if (run > longest) longest = run
    prev = date
  }
  return longest
}

/**
 * Consecutive days ending today — or yesterday, so a streak isn't shown as
 * broken before the user has had a chance to log today.
 */
export function currentStreak(sortedDates, today = todayStr()) {
  const set = new Set(sortedDates)
  let cursor = set.has(today) ? today : addDays(today, -1)
  let count = 0
  while (set.has(cursor)) {
    count++
    cursor = addDays(cursor, -1)
  }
  return count
}
