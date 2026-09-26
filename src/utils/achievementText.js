// Human-readable text for achievement conditions and progress.

import { BINARY_CONDITION_TYPES, hasMinimum, periodMinDays } from './achievementEvaluator.js'
import { formatAmount, formatNumber } from './formatters.js'
import { tierLabel } from '../constants/tiers.js'

const AGGREGATION_LABELS = { max: '최고 기록', sum: '누적', last: '최근 기록' }

/** period_cumulative: '한 달 합계 100km 이상'. */
export const SUM_PERIOD_LABELS = { week: '한 주', month: '한 달', year: '한 해' }

/** period_streak: '4주 연속', '12개월 연속'. */
export const STREAK_PERIOD_UNITS = { week: '주', month: '개월' }

function categoryName(categories, id) {
  return categories.find(c => c.id === id)?.name ?? '삭제된 카테고리'
}

function describePeriodStreak(condition) {
  const once = Number(condition.target) === 1
  const n = `${formatNumber(condition.target)}${STREAK_PERIOD_UNITS[condition.period] ?? ''} 연속`
  const minDays = periodMinDays(condition)
  if (condition.period === 'week') {
    const perWeek = minDays === 7 ? '7일 모두 기록' : `${minDays}일 이상 기록`
    if (once) return `한 주에 ${perWeek}`
    return minDays > 1 ? `주 ${perWeek} ${n}` : `매주 기록 ${n}`
  }
  if (once) return `한 달에 ${minDays}일 이상 기록`
  return minDays > 1 ? `한 달에 ${minDays}일 이상 기록 ${n}` : `매달 기록 ${n}`
}

/**
 * One-line rule, e.g. '한 번에 21.1km 이상', "'야외' 태그 기록 5회".
 * `achievement` is needed for rules whose scope is the achievement's own
 * category (meta conditions and category_count).
 */
export function describeCondition(condition, { categories = [], achievement = null } = {}) {
  if (!condition) return ''
  const unit = condition.unit || ''
  const minimum = hasMinimum(condition) ? formatAmount(condition.minValue, unit) : null
  switch (condition.type) {
    case 'action':
      return '첫 기록 남기기'
    case 'count':
      return minimum ? `${minimum} 이상 기록 ${formatNumber(condition.target)}회` : `기록 ${formatNumber(condition.target)}회`
    case 'days':
      return minimum ? `하루 ${minimum} 이상인 날 ${formatNumber(condition.target)}일` : `기록한 날 ${formatNumber(condition.target)}일`
    case 'streak':
      return minimum ? `하루 ${minimum} 이상 ${formatNumber(condition.target)}일 연속` : `${formatNumber(condition.target)}일 연속 기록`
    case 'period_streak':
      return describePeriodStreak(condition)
    case 'cumulative':
      return `누적 ${formatAmount(condition.target, unit)}`
    case 'single':
      return `한 번에 ${formatAmount(condition.target, unit)} 이상`
    case 'daily_cumulative':
      return `하루 합계 ${formatAmount(condition.target, unit)} 이상`
    case 'period_cumulative':
      return `${SUM_PERIOD_LABELS[condition.period] ?? ''} 합계 ${formatAmount(condition.target, unit)} 이상`
    case 'tag_match':
      return `'${condition.tag}' 태그 기록`
    case 'tag_count':
      return `'${condition.tag}' 태그 기록 ${formatNumber(condition.target)}회`
    case 'tag_set_complete':
      return `태그 ${(condition.tags || []).length}개 모두 기록`
    case 'category_count':
      return achievement?.categoryId
        ? `하위 카테고리 ${formatNumber(condition.target)}곳에 기록`
        : `카테고리 ${formatNumber(condition.target)}곳에 기록`
    case 'cross_category_cumulative': {
      const sources = condition.sources || []
      const names = sources.map(s => categoryName(categories, s.categoryId)).join('·')
      const modes = [...new Set(sources.map(s => s.aggregation || 'sum'))]
      const how = modes.length === 1 ? `${AGGREGATION_LABELS[modes[0]]} 합` : '합산'
      return `${names} ${how} ${formatAmount(condition.target, unit)} 이상`
    }
    case 'composite': {
      const parts = (condition.conditions || []).map(c => describeCondition(c, { categories, achievement }))
      return parts.join(condition.operator === 'OR' ? ' 또는 ' : ' + ')
    }
    case 'manual':
      return '직접 달성 체크'
    case 'meta_count':
    case 'meta_clear': {
      const scopeId = condition.categoryId !== undefined ? condition.categoryId : achievement?.categoryId
      const scopeName = scopeId ? categoryName(categories, scopeId) : null
      if (condition.type === 'meta_count') {
        const tier = condition.minTier && condition.minTier !== 'bronze'
          ? `${tierLabel(condition.minTier)}${condition.minTier === 'diamond' ? '' : ' 이상'} `
          : ''
        return `${scopeName ? `${scopeName} ` : ''}${tier}업적 ${formatNumber(condition.target)}개 달성`
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
    case 'days':
      return pair('일')
    case 'cumulative':
    case 'cross_category_cumulative':
      return pair(unit)
    case 'single':
      return `최고 ${pair(unit)}`
    case 'daily_cumulative':
      return `하루 최고 ${pair(unit)}`
    case 'period_cumulative':
      return `${SUM_PERIOD_LABELS[condition.period] ?? ''} 최고 ${pair(unit)}`
    case 'streak':
      return `최장 ${pair('일')}`
    case 'period_streak':
      return `최장 ${pair(STREAK_PERIOD_UNITS[condition.period] ?? '')}`
    case 'category_count':
      return pair('곳')
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
