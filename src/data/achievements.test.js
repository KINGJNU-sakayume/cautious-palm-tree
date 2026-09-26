import { describe, it, expect } from 'vitest'
import { achievements } from './achievements.js'
import { categories } from './categories.js'
import { TIER_IDS } from '@/constants/tiers.js'
import { conditionError, evaluateAchievements, isMetaCondition, normalizeTag } from '@/utils/achievementEvaluator.js'
import { describeCondition } from '@/utils/achievementText.js'
import { achievementsCovering, conditionUnits } from '@/utils/suggestions.js'

const categoryIds = new Set(categories.map(c => c.id))
const achievementIds = new Set(achievements.map(a => a.id))
const parents = new Set(categories.map(c => c.parentId).filter(Boolean))
const leaves = categories.filter(c => !parents.has(c.id))

function parts(condition) {
  return condition.type === 'composite' ? condition.conditions : [condition]
}

describe('built-in achievement catalog', () => {
  it('has at least 500 achievements', () => {
    expect(achievements.length).toBeGreaterThanOrEqual(500)
  })

  it('has unique ids and titles', () => {
    expect(achievementIds.size).toBe(achievements.length)
    const titles = achievements.map(a => a.title)
    expect(titles.filter((t, i) => titles.indexOf(t) !== i)).toEqual([])
  })

  it.each(achievements.map(a => [a.id, a]))('%s is well formed', (_id, a) => {
    expect(a.title.trim()).not.toBe('')
    expect(a.title.length).toBeLessThanOrEqual(40) // the editor's limit
    expect(a.description.trim()).toMatch(/[.!]$/)
    expect(TIER_IDS).toContain(a.tier)
    expect(a.categoryId === null || categoryIds.has(a.categoryId)).toBe(true)
    expect(conditionError(a.condition)).toBeNull()
    expect(describeCondition(a.condition, { categories, achievement: a })).not.toBe('')

    const c = a.condition
    if (c.type === 'meta_list') {
      expect(c.achievementIds).not.toContain(a.id)
      for (const id of c.achievementIds) expect(achievementIds.has(id)).toBe(true)
    }
    if (c.type === 'meta_count' || c.type === 'meta_clear') expect(c).not.toHaveProperty('categoryId')
    for (const part of parts(c)) {
      if (part.type === 'cross_category_cumulative') {
        for (const s of part.sources) expect(categoryIds.has(s.categoryId)).toBe(true)
      }
      if (part.type === 'tag_set_complete') {
        expect(new Set(part.tags.map(normalizeTag)).size).toBe(part.tags.length)
      }
    }
    // A tag rule names its tag, so the suggestion chip in the record form makes sense.
    if (!a.isHidden && (c.type === 'tag_match' || c.type === 'tag_count')) {
      expect(a.description).toContain(`'${c.tag}'`)
    }
    // Secret achievements are only read once earned, so they congratulate.
    if (a.isHidden) expect(a.description).not.toContain('보세요')
  })

  it('starts with nothing earned and nothing invalid', () => {
    const results = evaluateAchievements(achievements, [], categories)
    for (const a of achievements) {
      const r = results.get(a.id)
      expect(r.earned, a.id).toBe(false)
      expect(r.error, a.id).toBeUndefined()
    }
  })

  it('gives every leaf category a first-record achievement and several goals', () => {
    for (const leaf of leaves) {
      const own = achievements.filter(a => a.categoryId === leaf.id)
      expect(own.length, leaf.name).toBeGreaterThanOrEqual(5)
      expect(own.some(a => a.condition.type === 'action'), leaf.name).toBe(true)
    }
  })

  it('measures each category in one unit, so a bare number means the same everywhere', () => {
    for (const category of categories) {
      const units = new Set()
      for (const a of achievementsCovering(category.id, achievements, categories, { includeHidden: true })) {
        for (const unit of conditionUnits(a.condition)) units.add(unit)
      }
      expect([...units].length, `${category.name}: ${[...units].join(', ')}`).toBeLessThanOrEqual(1)
    }
  })

  it('spreads achievements over every tier', () => {
    for (const tier of TIER_IDS) {
      expect(achievements.filter(a => a.tier === tier).length, tier).toBeGreaterThanOrEqual(30)
    }
    const metas = achievements.filter(a => isMetaCondition(a.condition))
    expect(metas.length).toBeLessThan(achievements.length / 10)
  })
})

describe('default categories', () => {
  it('have unique ids and valid parents', () => {
    expect(categoryIds.size).toBe(categories.length)
    for (const c of categories) expect(c.parentId === null || categoryIds.has(c.parentId), c.id).toBe(true)
  })

  it('have unique names among siblings', () => {
    const seen = new Set()
    for (const c of categories) {
      const key = `${c.parentId}/${c.name}`
      expect(seen.has(key), key).toBe(false)
      seen.add(key)
    }
  })
})
