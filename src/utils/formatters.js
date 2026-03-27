/**
 * Format a YYYY-MM-DD string as "March 15, 2025"
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Format a YYYY-MM-DD string as "Mar 15"
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Format a YYYY-MM-DD string as "Mar 2025"
 */
export function formatMonthYear(dateStr) {
  if (!dateStr) return ''
  const [year, month] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    diamond: 'Diamond',
    red_diamond: 'Red Diamond',
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
      return 'Log at least 1 record'
    case 'count':
      return `Log ${condition.target} records`
    case 'cumulative':
      return `Accumulate ${condition.target}${condition.unit ? ' ' + condition.unit : ''}`
    case 'single':
      return `Single record ≥ ${condition.target}${condition.unit ? ' ' + condition.unit : ''}`
    case 'streak':
      return `${condition.target}-day streak`
    case 'composite': {
      const parts = condition.conditions.map(c => conditionSummaryText(c))
      return parts.join(` ${condition.operator} `)
    }
    case 'meta_count':
      return `Earn ${condition.target} achievements in category`
    case 'meta_list':
      return `Earn ${condition.achievementIds?.length || 0} specific achievements`
    case 'meta_clear':
      return 'Clear all achievements in category'
    default:
      return condition.type
  }
}

/**
 * Type label for display
 */
export function typeLabel(type) {
  const labels = {
    'one-time': 'One-time',
    repeatable: 'Repeatable',
    meta: 'Meta',
  }
  return labels[type] || type
}

/**
 * Returns a relative time string like "2 days ago", "just now"
 */
export function relativeTime(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`
}

/**
 * Generate a unique ID with a given prefix
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
