/**
 * Achievement evaluation engine.
 *
 * Earned state is never stored. Every time records, achievements or categories
 * change, each achievement is re-derived from the full record history:
 *
 *   evaluateAchievements(achievements, records, categories)
 *     → Map<achievementId, AchievementResult>
 *
 * This keeps results correct when records are back-dated, edited or deleted,
 * when an achievement is created after the fact, and when categories move.
 * `earnedAt` is the date on which the condition was first satisfied.
 *
 * Scope: an achievement counts the records of its category *and every
 * subcategory*. An achievement without a category counts every record.
 *
 * @typedef {Object} AchievementResult
 * @property {boolean} earned
 * @property {string|null} earnedAt       YYYY-MM-DD
 * @property {number} progress            same scale as `target`
 * @property {number} target
 * @property {string[]} [completedTags]   tag_set_complete only
 * @property {Object<string,string>} [completedDates]
 * @property {string} [error]             set when the condition is invalid
 */

import { addDays, isValidDateStr } from './dates.js'
import { recordValueIn } from './units.js'

export const META_CONDITION_TYPES = ['meta_count', 'meta_list', 'meta_clear']

/** Conditions that are simply done / not done — no progress bar. */
export const BINARY_CONDITION_TYPES = ['action', 'tag_match', 'manual']

/** Record-based conditions that may be combined inside a composite. */
export const COMPOSABLE_CONDITION_TYPES = [
  'action', 'count', 'cumulative', 'single', 'daily_cumulative', 'streak',
  'tag_match', 'tag_count', 'tag_set_complete', 'cross_category_cumulative',
]

const EPSILON = 1e-9

export function isMetaCondition(condition) {
  return META_CONDITION_TYPES.includes(condition?.type)
}

/** Tags compare without '#', spaces or letter case: '#한강 대교' === '한강대교'. */
export function normalizeTag(tag) {
  return String(tag ?? '').replace(/^#+/, '').replace(/\s+/g, '').toLowerCase()
}

function positiveNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

function positiveInteger(value) {
  const n = positiveNumber(value)
  return n != null && Number.isInteger(n) ? n : null
}

function round(n) {
  return Math.round(n * 1e6) / 1e6
}

function maxDate(dates) {
  return dates.reduce((a, b) => (a > b ? a : b))
}

function minDate(dates) {
  return dates.reduce((a, b) => (a < b ? a : b))
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Returns a user-facing message when the condition can't be evaluated,
 * or null when it is valid.
 */
export function conditionError(condition, { nested = false } = {}) {
  if (!condition || typeof condition !== 'object') return '달성 조건을 골라 주세요.'
  switch (condition.type) {
    case 'action':
      return null
    case 'count':
    case 'tag_count':
      if (condition.type === 'tag_count' && !normalizeTag(condition.tag)) return '태그를 입력해 주세요.'
      return positiveInteger(condition.target) ? null : '목표 횟수를 1 이상의 정수로 입력해 주세요.'
    case 'streak':
      return positiveInteger(condition.target) ? null : '연속 일수를 1 이상의 정수로 입력해 주세요.'
    case 'cumulative':
    case 'single':
    case 'daily_cumulative':
      return positiveNumber(condition.target) ? null : '목표 값을 0보다 크게 입력해 주세요.'
    case 'tag_match':
      return normalizeTag(condition.tag) ? null : '태그를 입력해 주세요.'
    case 'tag_set_complete':
      return (condition.tags || []).some(t => normalizeTag(t)) ? null : '모을 태그를 하나 이상 입력해 주세요.'
    case 'cross_category_cumulative':
      if (!(condition.sources || []).some(s => s?.categoryId)) return '합산할 카테고리를 하나 이상 골라 주세요.'
      return positiveNumber(condition.target) ? null : '목표 값을 0보다 크게 입력해 주세요.'
    case 'composite': {
      if (nested) return '조건 묶음 안에 다시 묶음을 넣을 수 없어요.'
      const parts = condition.conditions || []
      if (parts.length === 0) return '조건을 하나 이상 추가해 주세요.'
      for (const part of parts) {
        if (!COMPOSABLE_CONDITION_TYPES.includes(part?.type)) return '함께 묶을 수 없는 조건이 있어요.'
        const error = conditionError(part, { nested: true })
        if (error) return error
      }
      return null
    }
    case 'manual':
      return nested ? '직접 체크 조건은 다른 조건과 묶을 수 없어요.' : null
    case 'meta_count':
      return positiveInteger(condition.target) ? null : '목표 개수를 1 이상의 정수로 입력해 주세요.'
    case 'meta_list':
      return (condition.achievementIds || []).length > 0 ? null : '달성해야 할 업적을 하나 이상 골라 주세요.'
    case 'meta_clear':
      return null
    default:
      return '알 수 없는 조건이에요.'
  }
}

// ── Context: chronological records and category scopes ────────────────────────

function createContext(records, categories) {
  const children = new Map()
  for (const c of categories) {
    if (!c.parentId) continue
    if (!children.has(c.parentId)) children.set(c.parentId, [])
    children.get(c.parentId).push(c.id)
  }

  const subtreeCache = new Map()
  function subtree(rootId) {
    if (!subtreeCache.has(rootId)) {
      const ids = new Set([rootId])
      const queue = [rootId]
      while (queue.length > 0) {
        for (const child of children.get(queue.shift()) || []) {
          if (!ids.has(child)) {
            ids.add(child)
            queue.push(child)
          }
        }
      }
      subtreeCache.set(rootId, ids)
    }
    return subtreeCache.get(rootId)
  }

  // Oldest first; records on the same day keep the order they were added in.
  const chronological = records
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => isValidDateStr(record.date))
    .sort((a, b) => (a.record.date === b.record.date ? a.index - b.index : a.record.date < b.record.date ? -1 : 1))
    .map(({ record }) => record)

  const scopeCache = new Map()
  function recordsIn(categoryId) {
    const key = categoryId ?? ''
    if (!scopeCache.has(key)) {
      const scope = categoryId ? subtree(categoryId) : null
      scopeCache.set(key, scope ? chronological.filter(r => scope.has(r.categoryId)) : chronological)
    }
    return scopeCache.get(key)
  }

  return { recordsIn, subtree }
}

function result(earnedAt, progress, target, extra = {}) {
  return { earned: earnedAt != null, earnedAt: earnedAt ?? null, progress: round(progress), target, ...extra }
}

function invalid(error) {
  return { earned: false, earnedAt: null, progress: 0, target: 1, error }
}

// ── Record-based conditions ───────────────────────────────────────────────────

function evaluateRecordCondition(condition, scopeId, ctx) {
  const records = ctx.recordsIn(scopeId)

  switch (condition.type) {
    case 'action': {
      const first = records[0]
      return result(first?.date, first ? 1 : 0, 1)
    }

    case 'count': {
      const target = positiveInteger(condition.target)
      return result(records[target - 1]?.date, records.length, target)
    }

    case 'cumulative': {
      const target = positiveNumber(condition.target)
      let sum = 0
      let earnedAt = null
      for (const record of records) {
        const value = recordValueIn(record, condition.unit)
        if (value == null) continue
        sum += value
        if (!earnedAt && sum >= target - EPSILON) earnedAt = record.date
      }
      return result(earnedAt, sum, target)
    }

    case 'single': {
      const target = positiveNumber(condition.target)
      let best = 0
      let earnedAt = null
      for (const record of records) {
        const value = recordValueIn(record, condition.unit)
        if (value == null) continue
        if (value > best) best = value
        if (!earnedAt && value >= target - EPSILON) earnedAt = record.date
      }
      return result(earnedAt, best, target)
    }

    case 'daily_cumulative': {
      const target = positiveNumber(condition.target)
      const byDate = new Map()
      let best = 0
      let earnedAt = null
      for (const record of records) {
        const value = recordValueIn(record, condition.unit)
        if (value == null) continue
        const total = (byDate.get(record.date) || 0) + value
        byDate.set(record.date, total)
        if (total > best) best = total
        if (!earnedAt && total >= target - EPSILON) earnedAt = record.date
      }
      return result(earnedAt, best, target)
    }

    case 'streak': {
      // Longest run of consecutive days ever, so back-filled days count too.
      const target = positiveInteger(condition.target)
      let run = 0
      let longest = 0
      let earnedAt = null
      let prev = null
      for (const date of new Set(records.map(r => r.date))) {
        run = prev && addDays(prev, 1) === date ? run + 1 : 1
        if (run > longest) longest = run
        if (!earnedAt && run >= target) earnedAt = date
        prev = date
      }
      return result(earnedAt, longest, target)
    }

    case 'tag_match': {
      const tag = normalizeTag(condition.tag)
      const first = records.find(r => (r.tags || []).some(t => normalizeTag(t) === tag))
      return result(first?.date, first ? 1 : 0, 1)
    }

    case 'tag_count': {
      const tag = normalizeTag(condition.tag)
      const target = positiveInteger(condition.target)
      const tagged = records.filter(r => (r.tags || []).some(t => normalizeTag(t) === tag))
      return result(tagged[target - 1]?.date, tagged.length, target)
    }

    case 'tag_set_complete': {
      const wanted = new Map()
      for (const tag of condition.tags || []) {
        const key = normalizeTag(tag)
        if (key && !wanted.has(key)) wanted.set(key, tag)
      }
      const completedDates = {}
      for (const record of records) {
        for (const tag of record.tags || []) {
          const original = wanted.get(normalizeTag(tag))
          if (original && !completedDates[original]) completedDates[original] = record.date
        }
      }
      const completedTags = [...wanted.values()].filter(tag => completedDates[tag])
      const earnedAt = completedTags.length === wanted.size ? maxDate(Object.values(completedDates)) : null
      return result(earnedAt, completedTags.length, wanted.size, { completedTags, completedDates })
    }

    case 'cross_category_cumulative':
      return evaluateCrossCategory(condition, ctx)

    case 'composite': {
      const parts = condition.conditions.map(part => evaluateRecordCondition(part, scopeId, ctx))
      const ratios = parts.map(p => (p.earned ? 1 : Math.max(0, Math.min(1, p.progress / p.target))))
      let earnedAt = null
      if (condition.operator === 'OR') {
        const earned = parts.filter(p => p.earned)
        if (earned.length > 0) earnedAt = minDate(earned.map(p => p.earnedAt))
      } else if (parts.every(p => p.earned)) {
        earnedAt = maxDate(parts.map(p => p.earnedAt))
      }
      const ratio = condition.operator === 'OR' ? Math.max(...ratios) : Math.min(...ratios)
      return result(earnedAt, Math.floor(ratio * 100), 100, { parts })
    }

    default:
      return invalid('알 수 없는 조건이에요.')
  }
}

/**
 * Sum of per-source aggregates, e.g. best bench + best squat + best deadlift.
 * Replayed day by day so `earnedAt` is the first day the total reached the target.
 */
function evaluateCrossCategory(condition, ctx) {
  const target = positiveNumber(condition.target)
  const sources = (condition.sources || []).filter(s => s?.categoryId)

  const eventsByDate = new Map()
  sources.forEach((source, sourceIndex) => {
    for (const record of ctx.recordsIn(source.categoryId)) {
      const value = recordValueIn(record, condition.unit)
      if (value == null) continue
      if (!eventsByDate.has(record.date)) eventsByDate.set(record.date, [])
      eventsByDate.get(record.date).push({ sourceIndex, value })
    }
  })

  const aggregates = sources.map(() => null)
  let total = 0
  let earnedAt = null
  for (const date of [...eventsByDate.keys()].sort()) {
    for (const { sourceIndex, value } of eventsByDate.get(date)) {
      const current = aggregates[sourceIndex]
      const mode = sources[sourceIndex].aggregation
      if (mode === 'max') aggregates[sourceIndex] = current == null ? value : Math.max(current, value)
      else if (mode === 'last') aggregates[sourceIndex] = value
      else aggregates[sourceIndex] = (current ?? 0) + value
    }
    total = aggregates.reduce((sum, v) => sum + (v ?? 0), 0)
    if (!earnedAt && total >= target - EPSILON) earnedAt = date
  }
  return result(earnedAt, total, target)
}

// ── Meta conditions (earned through other achievements) ───────────────────────

function evaluateMetaCondition(achievement, all, results, ctx) {
  const condition = achievement.condition
  // meta_count / meta_clear look at the achievement's own category unless the
  // condition names one explicitly (older data). No category → every achievement.
  const scopeId = condition.categoryId !== undefined ? condition.categoryId : achievement.categoryId
  const inScope = a => (scopeId ? ctx.subtree(scopeId).has(a.categoryId) : true)
  const pool = () => all.filter(a => a.id !== achievement.id && !isMetaCondition(a.condition) && inScope(a))

  switch (condition.type) {
    case 'meta_count': {
      const target = positiveInteger(condition.target)
      const dates = pool().map(a => results.get(a.id)).filter(r => r?.earned).map(r => r.earnedAt).sort()
      return result(dates[target - 1], dates.length, target)
    }

    case 'meta_list': {
      const known = new Set(all.map(a => a.id))
      const ids = [...new Set(condition.achievementIds)].filter(id => id !== achievement.id && known.has(id))
      if (ids.length === 0) return invalid('달성해야 할 업적이 모두 삭제됐어요.')
      const earned = ids.map(id => results.get(id)).filter(r => r?.earned)
      const earnedAt = earned.length === ids.length ? maxDate(earned.map(r => r.earnedAt)) : null
      return result(earnedAt, earned.length, ids.length)
    }

    case 'meta_clear': {
      const targets = pool()
      if (targets.length === 0) return invalid('이 카테고리에 대상 업적이 없어요.')
      const earned = targets.map(a => results.get(a.id)).filter(r => r?.earned)
      const earnedAt = earned.length === targets.length ? maxDate(earned.map(r => r.earnedAt)) : null
      return result(earnedAt, earned.length, targets.length)
    }

    default:
      return invalid('알 수 없는 조건이에요.')
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * @param {Object[]} achievements  achievement definitions
 * @param {Object[]} records
 * @param {Object[]} categories
 * @returns {Map<string, AchievementResult>}
 */
export function evaluateAchievements(achievements, records, categories) {
  const ctx = createContext(records, categories)
  const results = new Map()
  const metas = []

  for (const achievement of achievements) {
    const error = conditionError(achievement.condition)
    if (error) {
      results.set(achievement.id, invalid(error))
    } else if (isMetaCondition(achievement.condition)) {
      metas.push(achievement)
      results.set(achievement.id, result(null, 0, 1))
    } else if (achievement.condition.type === 'manual') {
      const date = isValidDateStr(achievement.manualEarnedAt) ? achievement.manualEarnedAt : null
      results.set(achievement.id, result(date, date ? 1 : 0, 1))
    } else {
      results.set(achievement.id, evaluateRecordCondition(achievement.condition, achievement.categoryId ?? null, ctx))
    }
  }

  // Meta achievements may depend on each other (meta_list), so repeat until
  // nothing changes. Earned state only grows between passes, so this settles.
  for (let pass = 0; pass <= metas.length; pass++) {
    let changed = false
    for (const meta of metas) {
      const prev = results.get(meta.id)
      const next = evaluateMetaCondition(meta, achievements, results, ctx)
      if (next.earned !== prev.earned || next.earnedAt !== prev.earnedAt || next.progress !== prev.progress) {
        changed = true
      }
      results.set(meta.id, next)
    }
    if (!changed) break
  }

  return results
}
