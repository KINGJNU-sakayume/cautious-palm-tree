import { categories as seedCategories } from '@/data/categories.js'
import { records as seedRecords } from '@/data/records.js'
import { achievements as seedAchievements } from '@/data/achievements.js'
import { bulkUpsertCategories, bulkUpsertRecords, bulkUpsertAchievements } from '@/lib/db.js'

/**
 * Topological sort: roots first, then children level by level.
 * Required because the categories table self-references parent_id —
 * a parent row must exist before its children can be inserted.
 */
function topoSortCategories(cats) {
  const sorted = []
  const remaining = [...cats]
  const seen = new Set()

  for (let pass = 0; pass < cats.length; pass++) {
    const next = remaining.filter(c => c.parentId === null || seen.has(c.parentId))
    if (next.length === 0) break
    next.forEach(c => {
      sorted.push(c)
      seen.add(c.id)
    })
    next.forEach(c => remaining.splice(remaining.indexOf(c), 1))
  }

  return sorted
}

/**
 * Seeds Supabase tables from static data files if any table is empty.
 * Safe to call on every mount — upsert is idempotent.
 */
export async function seedIfEmpty({ categoriesCount, recordsCount, achievementsCount }) {
  if (categoriesCount === 0) {
    await bulkUpsertCategories(topoSortCategories(seedCategories))
  }
  if (recordsCount === 0) {
    await bulkUpsertRecords(seedRecords)
  }
  if (achievementsCount === 0) {
    await bulkUpsertAchievements(seedAchievements)
  }
}
