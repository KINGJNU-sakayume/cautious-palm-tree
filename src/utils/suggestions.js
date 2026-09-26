// Suggestions for the record form, based on the achievements that a record in
// a given category would count toward.

import { getCategoryPath } from './categoryTree.js'
import { normalizeTag } from './achievementEvaluator.js'

const VALUE_CONDITIONS = ['cumulative', 'single', 'daily_cumulative']

function parts(condition) {
  return condition?.type === 'composite' ? condition.conditions || [] : [condition]
}

function lineageOf(categoryId, categories) {
  return new Set(getCategoryPath(categoryId, categories).map(c => c.id))
}

/** Achievements a record in `categoryId` counts toward (secret ones excluded). */
export function achievementsCovering(categoryId, achievements, categories) {
  if (!categoryId) return []
  const lineage = lineageOf(categoryId, categories)
  return achievements.filter(a => {
    if (a.isHidden && !a.isEarned) return false
    if (a.condition?.type === 'cross_category_cumulative') {
      return (a.condition.sources || []).some(s => lineage.has(s.categoryId))
    }
    return a.categoryId == null || lineage.has(a.categoryId)
  })
}

/**
 * Tags that move an achievement forward, then tags used before in this category.
 * @returns {{ tag: string, fromAchievement: boolean }[]}
 */
export function suggestTags({ categoryId, achievements, categories, records, exclude = [] }) {
  const seen = new Set(exclude.map(normalizeTag))
  const out = []
  const add = (tag, fromAchievement) => {
    const key = normalizeTag(tag)
    if (!key || seen.has(key)) return
    seen.add(key)
    out.push({ tag, fromAchievement })
  }

  for (const a of achievementsCovering(categoryId, achievements, categories)) {
    for (const part of parts(a.condition)) {
      if (part.type === 'tag_match' || part.type === 'tag_count') add(part.tag, true)
      if (part.type === 'tag_set_complete') {
        const done = new Set(a.completedTags || [])
        for (const tag of part.tags || []) if (!done.has(tag)) add(tag, true)
      }
    }
  }

  const counts = new Map()
  for (const r of records) {
    if (r.categoryId !== categoryId) continue
    for (const tag of r.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1)
  }
  ;[...counts.entries()].sort((a, b) => b[1] - a[1]).forEach(([tag]) => add(tag, false))

  return out
}

/** Units the relevant achievements are measured in, e.g. ['km']. */
export function achievementUnits(categoryId, achievements, categories) {
  const units = new Set()
  for (const a of achievementsCovering(categoryId, achievements, categories)) {
    if (a.condition?.type === 'cross_category_cumulative' && a.condition.unit) units.add(a.condition.unit)
    for (const part of parts(a.condition)) {
      if (VALUE_CONDITIONS.includes(part.type) && part.unit) units.add(part.unit)
    }
  }
  return [...units]
}

/** Units used before in this category, most frequent first. */
export function recentUnits(categoryId, records) {
  const counts = new Map()
  for (const r of records) {
    if (r.categoryId === categoryId && r.unit) counts.set(r.unit, (counts.get(r.unit) || 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([unit]) => unit)
}
