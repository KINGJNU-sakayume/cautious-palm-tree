/**
 * Achievement Evaluation Engine
 *
 * evaluateAchievements — called after a new record is saved
 * evaluateMetaAchievements — called after each regular achievement is unlocked
 */

/**
 * @typedef {'AND'|'OR'} LogicalOperator
 *
 * @typedef {Object} ConditionSource
 * @property {string} categoryId
 * @property {'sum'|'max'|'last'} aggregation
 *
 * @typedef {Object} Condition
 * @property {string} type
 * @property {number} [target]
 * @property {string} [tag]
 * @property {string[]} [tags]
 * @property {string[]} [achievementIds]
 * @property {string} [categoryId]
 * @property {LogicalOperator} [operator]
 * @property {Condition[]} [conditions]
 * @property {ConditionSource[]} [sources]
 *
 * @typedef {Object} AchievementRecord
 * @property {string} id
 * @property {string} categoryId
 * @property {string} date          YYYY-MM-DD
 * @property {number|null} value
 * @property {string[]} tags
 * @property {string[]} unlockedAchievementIds
 *
 * @typedef {Object} Achievement
 * @property {string} id
 * @property {string|null} categoryId
 * @property {string} type          'one-time' | 'repeatable' | 'meta'
 * @property {boolean} isEarned
 * @property {string|null} earnedAt
 * @property {Condition} condition
 * @property {boolean} [_softDeleted]
 *
 * @typedef {Object} ProgressResult
 * @property {number} progress
 * @property {string[]|null} completedTags
 * @property {Object|undefined} completedDates
 */

// ── Local date helpers ────────────────────────────────────────────────────────
// Uses local timezone to match date strings stored by todayStr() in formatters.js

function todayLocalStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// Uses local timezone for consistent day-boundary calculation
function prevDateStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() - 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function calcStreak(dateset) {
  const today = todayLocalStr()
  const yesterday = prevDateStr(today)
  const startDate = dateset.has(today)
    ? today
    : dateset.has(yesterday) ? yesterday : null
  if (!startDate) return 0

  let count = 0
  let cur = startDate
  for (let i = 0; i < 365; i++) {
    if (dateset.has(cur)) { count++; cur = prevDateStr(cur) }
    else break
  }
  return count
}

// ── Single-condition evaluator ────────────────────────────────────────────────

/**
 * Evaluate a single condition against the record set.
 * `records` should include the newRecord already appended.
 * `newRecord` is passed separately so 'single' checks use it directly.
 * @param {Condition} condition
 * @param {AchievementRecord[]} records
 * @param {AchievementRecord} newRecord
 * @returns {boolean}
 */
export function evaluateCondition(condition, records, newRecord) {
  const categoryRecords = records.filter(r => r.categoryId === newRecord.categoryId)

  switch (condition.type) {
    case 'action':
      return categoryRecords.length >= 1

    case 'count':
      return categoryRecords.length >= condition.target

    case 'cumulative': {
      const total = categoryRecords.reduce((sum, r) => sum + (r.value || 0), 0)
      return total >= condition.target
    }

    case 'single':
      return (newRecord.value || 0) >= condition.target

    case 'streak': {
      const dateset = new Set(categoryRecords.map(r => r.date))
      return calcStreak(dateset) >= condition.target
    }

    case 'daily_cumulative': {
      const byDate = {}
      for (const r of categoryRecords) {
        byDate[r.date] = (byDate[r.date] || 0) + (r.value || 0)
      }
      return Object.values(byDate).some(total => total >= condition.target)
    }

    case 'composite': {
      const results = condition.conditions.map(sub => evaluateCondition(sub, records, newRecord))
      if (condition.operator === 'AND') return results.every(Boolean)
      if (condition.operator === 'OR') return results.some(Boolean)
      return false
    }

    /**
     * tag_match: at least one record in this category contains the specified tag.
     * condition shape: { type: 'tag_match', tag: string }
     */
    case 'tag_match': {
      return categoryRecords.some(r => (r.tags || []).includes(condition.tag))
    }

    /**
     * tag_count: number of records in this category that contain the specified tag >= target.
     * condition shape: { type: 'tag_count', tag: string, target: number }
     */
    case 'tag_count': {
      const matching = categoryRecords.filter(r => (r.tags || []).includes(condition.tag))
      return matching.length >= condition.target
    }

    /**
     * tag_set_complete: all tags in condition.tags appear at least once across category records.
     * condition shape: { type: 'tag_set_complete', tags: string[], target: number }
     */
    case 'tag_set_complete': {
      const seen = new Set(categoryRecords.flatMap(r => r.tags || []))
      const matched = condition.tags.filter(t => seen.has(t)).length
      return matched >= condition.tags.length
    }

    default:
      return false
  }
}

// ── evaluateAchievements ──────────────────────────────────────────────────────

/**
 * Evaluate all non-earned achievements for the category of newRecord,
 * plus any cross-category (no categoryId) achievements.
 * Returns array of achievement IDs that are now fulfilled.
 *
 * @param {AchievementRecord} newRecord - the just-saved record
 * @param {AchievementRecord[]} allRecords - all records INCLUDING newRecord
 * @param {Achievement[]} allAchievements - current achievements state
 * @returns {string[]} IDs of newly unlocked achievements
 */
export function evaluateAchievements(newRecord, allRecords, allAchievements) {
  // Group 1: achievements tied to this specific category
  const categoryCandidates = allAchievements.filter(
    a => a.categoryId === newRecord.categoryId && !a.isEarned && a.type !== 'meta'
  )

  // Group 2: cross-category achievements (categoryId is null/undefined)
  // Re-evaluated on every record save regardless of category
  const crossCandidates = allAchievements.filter(
    a => !a.categoryId && !a.isEarned && a.type !== 'meta'
  )

  const unlocked = []
  for (const achievement of [...categoryCandidates, ...crossCandidates]) {
    if (evaluateCondition(achievement.condition, allRecords, newRecord)) {
      unlocked.push(achievement.id)
    }
  }
  return unlocked
}

// ── evaluateMetaAchievements ──────────────────────────────────────────────────

/**
 * After a regular achievement is unlocked, check if any meta achievements are now fulfilled.
 * `allAchievements` should already reflect the newly unlocked state (isEarned = true for the just-unlocked ones).
 *
 * @param {Achievement[]} allAchievements - current achievements state (with newly unlocked already set)
 * @param {AchievementRecord[]} allRecords - all records (needed for cross_category_cumulative)
 * @returns {string[]} IDs of meta achievements newly unlocked
 */
export function evaluateMetaAchievements(allAchievements, allRecords = []) {
  const metaCandidates = allAchievements.filter(a => a.type === 'meta' && !a.isEarned)
  const unlocked = []

  for (const meta of metaCandidates) {
    const cond = meta.condition
    let fulfilled = false

    switch (cond.type) {
      case 'meta_count': {
        const count = allAchievements.filter(
          a => a.categoryId === cond.categoryId && a.isEarned && a.type !== 'meta'
        ).length
        fulfilled = count >= cond.target
        break
      }
      case 'meta_list': {
        fulfilled = cond.achievementIds.every(id => {
          const a = allAchievements.find(x => x.id === id)
          return a && a.isEarned && a.type !== 'meta'
        })
        break
      }
      case 'meta_clear': {
        const categoryAchievements = allAchievements.filter(
          a => a.categoryId === cond.categoryId && a.type !== 'meta'
        )
        fulfilled = categoryAchievements.length > 0 && categoryAchievements.every(a => a.isEarned)
        break
      }
      case 'cross_category_cumulative': {
        const total = (cond.sources || []).reduce((sum, src) => {
          const srcRecords = allRecords.filter(r => r.categoryId === src.categoryId)
          if (!srcRecords.length) return sum
          let val = 0
          if (src.aggregation === 'max')  val = Math.max(...srcRecords.map(r => r.value || 0))
          if (src.aggregation === 'last') val = srcRecords[srcRecords.length - 1]?.value || 0
          if (src.aggregation === 'sum')  val = srcRecords.reduce((s, r) => s + (r.value || 0), 0)
          return sum + val
        }, 0)
        fulfilled = total >= cond.target
        break
      }
      default:
        break
    }

    if (fulfilled) {
      unlocked.push(meta.id)
    }
  }

  return unlocked
}

// ── computeProgressFull ───────────────────────────────────────────────────────

/**
 * Compute current progress for a non-earned achievement.
 * @param {Achievement} achievement
 * @param {AchievementRecord[]} allRecords
 * @returns {ProgressResult}
 */
export function computeProgressFull(achievement, allRecords) {
  const { condition, categoryId } = achievement

  // cross_category_cumulative has no categoryId — handle before filtering
  if (condition.type === 'cross_category_cumulative') {
    const progress = (condition.sources || []).reduce((sum, src) => {
      const srcRecords = allRecords.filter(r => r.categoryId === src.categoryId)
      if (!srcRecords.length) return sum
      if (src.aggregation === 'max')  return sum + Math.max(...srcRecords.map(r => r.value || 0))
      if (src.aggregation === 'last') return sum + (srcRecords[srcRecords.length - 1]?.value || 0)
      if (src.aggregation === 'sum')  return sum + srcRecords.reduce((s, r) => s + (r.value || 0), 0)
      return sum
    }, 0)
    return { progress, completedTags: null }
  }

  const categoryRecords = allRecords.filter(r => r.categoryId === categoryId)

  switch (condition.type) {
    case 'count':
      return { progress: categoryRecords.length, completedTags: null }

    case 'cumulative':
      return { progress: categoryRecords.reduce((sum, r) => sum + (r.value || 0), 0), completedTags: null }

    case 'single':
      return { progress: Math.max(...categoryRecords.map(r => r.value || 0), 0), completedTags: null }

    case 'streak': {
      const dateset = new Set(categoryRecords.map(r => r.date))
      return { progress: calcStreak(dateset), completedTags: null }
    }

    case 'daily_cumulative': {
      const byDate = {}
      for (const r of categoryRecords) {
        byDate[r.date] = (byDate[r.date] || 0) + (r.value || 0)
      }
      const values = Object.values(byDate)
      const progress = values.length > 0 ? Math.max(...values) : 0
      return { progress, completedTags: null }
    }

    case 'action':
      return { progress: categoryRecords.length >= 1 ? 1 : 0, completedTags: null }

    case 'tag_match':
      return { progress: categoryRecords.some(r => (r.tags || []).includes(condition.tag)) ? 1 : 0, completedTags: null }

    case 'tag_count':
      return { progress: categoryRecords.filter(r => (r.tags || []).includes(condition.tag)).length, completedTags: null }

    case 'tag_set_complete': {
      const seen = new Set(categoryRecords.flatMap(r => r.tags || []))
      const completedTags = condition.tags.filter(t => seen.has(t))
      const completedDates = {}
      for (const tag of completedTags) {
        const dates = categoryRecords
          .filter(r => (r.tags || []).includes(tag))
          .map(r => r.date)
        completedDates[tag] = dates.sort()[0]
      }
      return { progress: completedTags.length, completedTags, completedDates }
    }

    case 'composite': {
      const subResults = (condition.conditions || []).map(sub =>
        computeProgressFull({ condition: sub, categoryId }, allRecords)
      )
      if (subResults.length === 0) return { progress: 0, completedTags: null }

      const getRatio = (sub, result) => result.progress / (sub.target || 1)

      let chosen
      if (condition.operator === 'AND') {
        chosen = subResults.reduce((min, r, i) =>
          getRatio(condition.conditions[i], r) < getRatio(condition.conditions[min.i], subResults[min.i])
            ? { i, r } : min
        , { i: 0, r: subResults[0] })
      } else {
        chosen = subResults.reduce((max, r, i) =>
          getRatio(condition.conditions[i], r) > getRatio(condition.conditions[max.i], subResults[max.i])
            ? { i, r } : max
        , { i: 0, r: subResults[0] })
      }
      return { progress: chosen.r.progress, completedTags: null }
    }

    default:
      return { progress: 0, completedTags: null }
  }
}

// ── computeProgress (backward-compatible wrapper) ─────────────────────────────

/**
 * Compute current progress value for a non-earned achievement.
 * Thin wrapper around computeProgressFull for backward compatibility.
 * @param {Achievement} achievement
 * @param {AchievementRecord[]} allRecords
 * @returns {number}
 */
export function computeProgress(achievement, allRecords) {
  return computeProgressFull(achievement, allRecords).progress
}
