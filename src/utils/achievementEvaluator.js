/**
 * Achievement Evaluation Engine
 *
 * evaluateAchievements — called after a new record is saved
 * evaluateMetaAchievements — called after each regular achievement is unlocked
 */

/**
 * Evaluate a single condition against the record set.
 * `records` should include the newRecord already appended.
 * `newRecord` is passed separately so 'single' checks use it directly.
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
      // Collect unique dates with records in this category
      const dateset = new Set(categoryRecords.map(r => r.date))

      // Walk backwards from today counting consecutive days
      const today = new Date()
      let count = 0
      for (let i = 0; i < 365; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        if (dateset.has(dateStr)) {
          count++
        } else {
          break
        }
      }
      return count >= condition.target
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

    default:
      return false
  }
}

/**
 * Evaluate all non-earned achievements for the category of newRecord.
 * Returns array of achievement IDs that are now fulfilled.
 *
 * @param {Object} newRecord - the just-saved record
 * @param {Array} allRecords - all records INCLUDING newRecord
 * @param {Array} allAchievements - current achievements state
 * @returns {string[]} - IDs of newly unlocked achievements
 */
export function evaluateAchievements(newRecord, allRecords, allAchievements) {
  const candidates = allAchievements.filter(
    a => a.categoryId === newRecord.categoryId && !a.isEarned && a.type !== 'meta'
  )

  const unlocked = []
  for (const achievement of candidates) {
    if (evaluateCondition(achievement.condition, allRecords, newRecord)) {
      unlocked.push(achievement.id)
    }
  }
  return unlocked
}

/**
 * After a regular achievement is unlocked, check if any meta achievements are now fulfilled.
 * `allAchievements` should already reflect the newly unlocked state (isEarned = true for the just-unlocked ones).
 *
 * @param {Array} allAchievements - current achievements state (with newly unlocked already set)
 * @returns {string[]} - IDs of meta achievements newly unlocked
 */
export function evaluateMetaAchievements(allAchievements) {
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
          return a && a.isEarned
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
      default:
        break
    }

    if (fulfilled) {
      unlocked.push(meta.id)
    }
  }

  return unlocked
}

/**
 * Compute current progress value for a non-earned achievement
 * given the full records set.
 */
export function computeProgress(achievement, allRecords) {
  const { condition, categoryId } = achievement
  const categoryRecords = allRecords.filter(r => r.categoryId === categoryId)

  switch (condition.type) {
    case 'count':
      return categoryRecords.length
    case 'cumulative':
      return categoryRecords.reduce((sum, r) => sum + (r.value || 0), 0)
    case 'single':
      return Math.max(...categoryRecords.map(r => r.value || 0), 0)
    case 'streak': {
      const dateset = new Set(categoryRecords.map(r => r.date))
      const today = new Date()
      let count = 0
      for (let i = 0; i < 365; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        if (dateset.has(dateStr)) count++
        else break
      }
      return count
    }
    case 'action':
      return categoryRecords.length >= 1 ? 1 : 0
    case 'tag_match':
      return categoryRecords.some(r => (r.tags || []).includes(condition.tag)) ? 1 : 0
    case 'tag_count':
      return categoryRecords.filter(r => (r.tags || []).includes(condition.tag)).length
    default:
      return 0
  }
}
