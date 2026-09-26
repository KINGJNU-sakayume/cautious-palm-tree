import { parseDateStr, todayStr, daysBetween } from './dates.js'

export { todayStr }

const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

/** '2026-03-15' → '2026년 3월 15일' */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = parseDateStr(dateStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** '2026-03-15' → '3월 15일' (the year is added when it isn't this year) */
export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = parseDateStr(dateStr)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return `${sameYear ? '' : `${d.getFullYear()}년 `}${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** '오늘', '어제', otherwise '3월 15일' */
export function formatDayLabel(dateStr, today = todayStr()) {
  const diff = daysBetween(dateStr, today)
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  return formatDateShort(dateStr)
}

/** '2026-03-15' → '3월 15일 일요일' */
export function formatDateWithWeekday(dateStr) {
  if (!dateStr) return ''
  return `${formatDateShort(dateStr)} ${WEEKDAYS[parseDateStr(dateStr).getDay()]}`
}

/** '2026-03' → '2026년 3월' */
export function formatMonth(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number)
  return `${y}년 ${m}월`
}

/** '오늘', '어제', '3일 전', '2주 전', '5개월 전', '1년 전' */
export function relativeDay(dateStr, today = todayStr()) {
  if (!dateStr) return ''
  const diff = daysBetween(dateStr, today)
  if (diff < 0) return formatDateShort(dateStr)
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  if (diff < 7) return `${diff}일 전`
  if (diff < 30) return `${Math.floor(diff / 7)}주 전`
  if (diff < 365) return `${Math.floor(diff / 30)}개월 전`
  return `${Math.floor(diff / 365)}년 전`
}

/** 12345.6789 → '12,345.679', 42.195 → '42.195' */
export function formatNumber(value, maxFractionDigits = 3) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  return n.toLocaleString('ko-KR', { maximumFractionDigits: maxFractionDigits })
}

/** Value with its unit, written the Korean way: '5.2km', '1,000페이지'. */
export function formatAmount(value, unit) {
  return `${formatNumber(value)}${unit ? unit.trim() : ''}`
}

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
