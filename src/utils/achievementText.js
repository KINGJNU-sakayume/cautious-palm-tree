// Human-readable text for achievement conditions and progress.

import { BINARY_CONDITION_TYPES } from './achievementEvaluator.js'
import { formatAmount, formatNumber } from './formatters.js'

const AGGREGATION_LABELS = { max: '최고 기록', sum: '누적', last: '최근 기록' }

function categoryName(categories, id) {
  return categories.find(c => c.id === id)?.name ?? '삭제된 카테고리'
}

/**
 * One-line rule, e.g. '한 번에 21.1km 이상', "'야외' 태그 기록 5회".
 * `achievement` is only needed for meta conditions (their scope is the
 * achievement's own category).
 */
export function describeCondition(condition, { categories = [], achievement = null } = {}) {
  if (!condition) return ''
  const unit = condition.unit || ''
  switch (condition.type) {
    case 'action':
      return '첫 기록 남기기'
    case 'count':
      return `기록 ${formatNumber(condition.target)}회`
    case 'cumulative':
      return `누적 ${formatAmount(condition.target, unit)}`
    case 'single':
      return `한 번에 ${formatAmount(condition.target, unit)} 이상`
    case 'daily_cumulative':
      return `하루 합계 ${formatAmount(condition.target, unit)} 이상`
    case 'streak':
      return `${formatNumber(condition.target)}일 연속 기록`
    case 'tag_match':
      return `'${condition.tag}' 태그 기록`
    case 'tag_count':
      return `'${condition.tag}' 태그 기록 ${formatNumber(condition.target)}회`
    case 'tag_set_complete':
      return `태그 ${(condition.tags || []).length}개 모두 기록`
    case 'cross_category_cumulative': {
      const sources = condition.sources || []
      const names = sources.map(s => categoryName(categories, s.categoryId)).join('·')
      const modes = [...new Set(sources.map(s => s.aggregation || 'sum'))]
      const how = modes.length === 1 ? `${AGGREGATION_LABELS[modes[0]]} 합` : '합산'
      return `${names} ${how} ${formatAmount(condition.target, unit)} 이상`
    }
    case 'composite': {
      const parts = (condition.conditions || []).map(c => describeCondition(c, { categories }))
      return parts.join(condition.operator === 'OR' ? ' 또는 ' : ' + ')
    }
    case 'manual':
      return '직접 달성 체크'
    case 'meta_count':
    case 'meta_clear': {
      const scopeId = condition.categoryId !== undefined ? condition.categoryId : achievement?.categoryId
      const scopeName = scopeId ? categoryName(categories, scopeId) : null
      if (condition.type === 'meta_count') {
        return `${scopeName ? `${scopeName} ` : ''}업적 ${formatNumber(condition.target)}개 달성`
      }
      return scopeName ? `${scopeName} 업적 모두 달성` : '모든 업적 달성'
    }
    case 'meta_list':
      return `지정한 업적 ${(condition.achievementIds || []).length}개 모두 달성`
    default:
      return ''
  }
}

/** Whether a progress bar makes sense for this condition. */
export function hasMeasurableProgress(condition) {
  return !!condition && !BINARY_CONDITION_TYPES.includes(condition.type)
}

/**
 * Progress next to the bar, e.g. '12.5 / 21.1km', '최장 3 / 7일'.
 * Returns null for done/not-done conditions.
 */
export function progressLabel(achievement) {
  const { condition, progress = 0, target = 1 } = achievement
  if (!hasMeasurableProgress(condition)) return null
  const unit = condition.unit || ''
  const pair = (suffix = '') => `${formatNumber(progress)} / ${formatNumber(target)}${suffix}`
  switch (condition.type) {
    case 'count':
    case 'tag_count':
      return pair('회')
    case 'cumulative':
    case 'cross_category_cumulative':
      return pair(unit)
    case 'single':
      return `최고 ${pair(unit)}`
    case 'daily_cumulative':
      return `하루 최고 ${pair(unit)}`
    case 'streak':
      return `최장 ${pair('일')}`
    case 'tag_set_complete':
    case 'meta_count':
    case 'meta_list':
    case 'meta_clear':
      return pair('개')
    case 'composite':
      return `${progress}%`
    default:
      return pair()
  }
}

export function progressRatio(achievement) {
  if (achievement.isEarned) return 1
  const { progress = 0, target = 1 } = achievement
  return target > 0 ? Math.max(0, Math.min(1, progress / target)) : 0
}
