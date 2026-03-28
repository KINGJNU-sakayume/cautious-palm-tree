/**
 * Format a YYYY-MM-DD string as "2025년 3월 15일"
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Format a YYYY-MM-DD string as "3월 15일"
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

/**
 * Format a YYYY-MM-DD string as "2025년 3월"
 */
export function formatMonthYear(dateStr) {
  if (!dateStr) return ''
  const [year, month] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('ko-KR', { month: 'short', year: 'numeric' })
}

/**
 * Returns today as YYYY-MM-DD
 */
export function todayStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/**
 * Human-readable label for a tier string.
 */
export function tierLabel(tier) {
  const labels = {
    bronze: '브론즈',
    silver: '실버',
    gold: '골드',
    platinum: '플래티넘',
    diamond: '다이아몬드',
    red_diamond: '레드 다이아몬드',
  }
  return labels[tier] || tier
}

/**
 * Human-readable summary of an achievement condition.
 */
export function conditionSummaryText(condition) {
  if (!condition) return '—'
  switch (condition.type) {
    case 'action':
      return '기록 1개 이상 달성'
    case 'count':
      return `기록 ${condition.target}회 달성`
    case 'cumulative':
      return `${condition.target}${condition.unit ? ' ' + condition.unit : ''} 누적 달성`
    case 'single':
      return `단일 기록 ≥ ${condition.target}${condition.unit ? ' ' + condition.unit : ''}`
    case 'streak':
      return `${condition.target}일 연속 달성`
    case 'composite': {
      const parts = condition.conditions.map(c => conditionSummaryText(c))
      return parts.join(` ${condition.operator} `)
    }
    case 'meta_count':
      return `카테고리 내 업적 ${condition.target}개 획득`
    case 'meta_list':
      return `특정 업적 ${condition.achievementIds?.length || 0}개 획득`
    case 'meta_clear':
      return '카테고리 내 모든 업적 달성'
    default:
      return condition.type
  }
}

/**
 * Type label for display
 */
export function typeLabel(type) {
  const labels = {
    'one-time': '일회성',
    repeatable: '반복 가능',
    meta: '메타',
  }
  return labels[type] || type
}

/**
 * Returns a relative time string like "2일 전", "오늘"
 */
export function relativeTime(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`
  return `${Math.floor(diffDays / 365)}년 전`
}

/**
 * Generate a unique ID with a given prefix
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
