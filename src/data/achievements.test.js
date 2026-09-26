import { describe, it, expect } from 'vitest'
import { achievements } from './achievements.js'
import { categories } from './categories.js'
import { TIER_IDS } from '@/constants/tiers.js'
import { conditionError, evaluateAchievements, normalizeTag } from '@/utils/achievementEvaluator.js'
import { describeCondition } from '@/utils/achievementText.js'

const categoryIds = new Set(categories.map(c => c.id))
const achievementIds = new Set(achievements.map(a => a.id))

describe('built-in achievement catalog', () => {
  it('has unique ids', () => {
    expect(achievementIds.size).toBe(achievements.length)
  })

  it.each(achievements.map(a => [a.id, a]))('%s is well formed', (_id, a) => {
    expect(a.title.trim()).not.toBe('')
    expect(a.description.trim()).not.toBe('')
    expect(TIER_IDS).toContain(a.tier)
    expect(a.categoryId === null || categoryIds.has(a.categoryId)).toBe(true)
    expect(conditionError(a.condition)).toBeNull()
    expect(describeCondition(a.condition, { categories, achievement: a })).not.toBe('')

    const c = a.condition
    if (c.type === 'meta_list') {
      for (const id of c.achievementIds) expect(achievementIds.has(id)).toBe(true)
    }
    if (c.type === 'cross_category_cumulative') {
      for (const s of c.sources) expect(categoryIds.has(s.categoryId)).toBe(true)
    }
    if (c.type === 'tag_set_complete') {
      expect(new Set(c.tags.map(normalizeTag)).size).toBe(c.tags.length)
    }
  })

  it('starts with nothing earned and nothing invalid', () => {
    const results = evaluateAchievements(achievements, [], categories)
    for (const a of achievements) {
      const r = results.get(a.id)
      expect(r.earned, a.id).toBe(false)
      expect(r.error, a.id).toBeUndefined()
    }
  })

  it('has at least one achievement for every leaf category', () => {
    const parents = new Set(categories.map(c => c.parentId).filter(Boolean))
    const covered = new Set(achievements.map(a => a.categoryId))
    const uncovered = categories.filter(c => !parents.has(c.id) && !covered.has(c.id)).map(c => c.name)
    expect(uncovered).toEqual([])
  })
})
