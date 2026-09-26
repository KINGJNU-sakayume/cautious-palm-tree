// Suggestions for the record form, based on the achievements that a record in
// a given category would count toward.

import { getCategoryPath } from './categoryTree.js'
import { hasMinimum, normalizeTag } from './achievementEvaluator.js'

const VALUE_CONDITIONS = ['cumulative', 'single', 'daily_cumulative', 'period_cumulative', 'cross_category_cumulative']
const THRESHOLD_CONDITIONS = ['count', 'days', 'streak']

function parts(condition) {
  return condition?.type === 'composite' ? condition.conditions || [] : [condition]
}

function lineageOf(categoryId, categories) {
  return new Set(getCategoryPath(categoryId, categories).map(c => c.id))
}

/** Units a condition measures values in, e.g. ['km'] (composites included). */
export function conditionUnits(condition) {
  const units = []
  for (const part of parts(condition)) {
    if (!part?.unit) continue
    if (VALUE_CONDITIONS.includes(part.type) || (THRESHOLD_CONDITIONS.includes(part.type) && hasMinimum(part))) {
      units.push(part.unit)
    }
  }
  return units
}

/**
 * Achievements a record in `categoryId` counts toward: those whose category is
 * the record's category or one of its ancestors (or none), plus those that add
 * up this category as a source. Secret ones are left out unless `includeHidden`.
 */
export function achievementsCovering(categoryId, achievements, categories, { includeHidden = false } = {}) {
  if (!categoryId) return []
  const lineage = lineageOf(categoryId, categories)
  const feeds = part => part?.type === 'cross_category_cumulative' && (part.sources || []).some(s => lineage.has(s.categoryId))
  return achievements.filter(a => {
    if (!includeHidden && a.isHidden && !a.isEarned) return false
    if (a.condition?.type === 'cross_category_cumulative') return feeds(a.condition)
    return a.categoryId == null || lineage.has(a.categoryId) || parts(a.condition).some(feeds)
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

/**
 * Units the relevant achievements are measured in, most used first, e.g. ['km'].
 * The first one is what a new record in this category is filled in with.
 */
export function achievementUnits(categoryId, achievements, categories) {
  const counts = new Map()
  for (const a of achievementsCovering(categoryId, achievements, categories)) {
    for (const unit of new Set(conditionUnits(a.condition))) counts.set(unit, (counts.get(unit) || 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([unit]) => unit)
}

/** Units used before in this category, most frequent first. */
export function recentUnits(categoryId, records) {
  const counts = new Map()
  for (const r of records) {
    if (r.categoryId === categoryId && r.unit) counts.set(r.unit, (counts.get(r.unit) || 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([unit]) => unit)
}
