import { supabase } from './supabase.js'

// ── Mapping: DB row (snake_case) ↔ JS object (camelCase) ─────────────────────

function rowToCategory(row) {
  return { id: row.id, name: row.name, parentId: row.parent_id }
}

function categoryToRow(c) {
  return { id: c.id, name: c.name, parent_id: c.parentId ?? null }
}

function rowToRecord(row) {
  return {
    id: row.id,
    categoryId: row.category_id,
    date: row.date,
    value: row.value,
    unit: row.unit,
    memo: row.memo,
    photoUrl: row.photo_url,
    tags: row.tags ?? [],
    unlockedAchievementIds: row.unlocked_achievement_ids ?? [],
  }
}

function recordToRow(r) {
  return {
    id: r.id,
    category_id: r.categoryId,
    date: r.date,
    value: r.value ?? null,
    unit: r.unit ?? null,
    memo: r.memo ?? null,
    photo_url: r.photoUrl ?? null,
    tags: r.tags ?? [],
    unlocked_achievement_ids: r.unlockedAchievementIds ?? [],
  }
}

function rowToAchievement(row) {
  const a = {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    tier: row.tier,
    type: row.type,
    condition: row.condition ?? {},
    rarity: row.rarity,
    isHidden: row.is_hidden,
    isEarned: row.is_earned,
    earnedAt: row.earned_at,
    progress: row.progress,
  }
  if (row.soft_deleted) a._softDeleted = true
  return a
}

function achievementToRow(a) {
  return {
    id: a.id,
    title: a.title,
    description: a.description ?? null,
    category_id: a.categoryId,
    tier: a.tier,
    type: a.type,
    condition: a.condition ?? {},
    rarity: a.rarity ?? null,
    is_hidden: a.isHidden ?? false,
    is_earned: a.isEarned ?? false,
    earned_at: a.earnedAt ?? null,
    progress: a.progress ?? 0,
    soft_deleted: a._softDeleted ?? false,
  }
}

// ── Fetch all ─────────────────────────────────────────────────────────────────

export async function fetchAllCategories() {
  const { data, error } = await supabase.from('categories').select('*')
  if (error) throw error
  return data.map(rowToCategory)
}

export async function fetchAllRecords() {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data.map(rowToRecord)
}

export async function fetchAllAchievements() {
  const { data, error } = await supabase.from('achievements').select('*')
  if (error) throw error
  return data.map(rowToAchievement)
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function upsertCategory(category) {
  const { error } = await supabase
    .from('categories')
    .upsert(categoryToRow(category), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function bulkUpsertCategories(categories) {
  const { error } = await supabase
    .from('categories')
    .upsert(categories.map(categoryToRow), { onConflict: 'id' })
  if (error) throw error
}

// ── Records ───────────────────────────────────────────────────────────────────

export async function upsertRecord(record) {
  const { error } = await supabase
    .from('records')
    .upsert(recordToRow(record), { onConflict: 'id' })
  if (error) throw error
}

export async function bulkUpsertRecords(records) {
  const { error } = await supabase
    .from('records')
    .upsert(records.map(recordToRow), { onConflict: 'id' })
  if (error) throw error
}

// ── Achievements ──────────────────────────────────────────────────────────────

export async function upsertAchievement(achievement) {
  const { error } = await supabase
    .from('achievements')
    .upsert(achievementToRow(achievement), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteAchievement(id) {
  const { error } = await supabase.from('achievements').delete().eq('id', id)
  if (error) throw error
}

export async function bulkUpsertAchievements(achievements) {
  const { error } = await supabase
    .from('achievements')
    .upsert(achievements.map(achievementToRow), { onConflict: 'id' })
  if (error) throw error
}
