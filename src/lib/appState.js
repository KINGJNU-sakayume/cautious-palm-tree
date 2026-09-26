// Shape, defaults, normalisation and migrations for the persisted app state.
//
// v2 state:
//   { categories, records, achievements, prefs }
// Achievements hold definitions only — earned state is derived at runtime.

import { categories as defaultCategories } from '@/data/categories.js'
import { achievements as catalog } from '@/data/achievements.js'
import { LEGACY_CATALOG_FINGERPRINTS } from '@/data/legacyCatalog.js'
import { TIER_IDS } from '@/constants/tiers.js'
import { isValidDateStr } from '@/utils/dates.js'
import { generateId } from '@/utils/formatters.js'
import { fingerprintV1Achievement } from './fingerprint.js'

export const SCHEMA_VERSION = 2
export const PIN_SLOTS = 5
const APP_ID = 'achievement-library'

const clone = value => JSON.parse(JSON.stringify(value))

export function defaultPrefs() {
  return {
    favorites: [],
    pinned: Array(PIN_SLOTS).fill(null),
    categoryDefaults: {},
    homeCategoryId: null,
    lastCategoryId: null,
    introDismissed: false,
    lastBackupAt: null,
  }
}

export function createDefaultState(legacyPrefs = {}) {
  return normalizeState({
    categories: clone(defaultCategories),
    records: [],
    achievements: clone(catalog),
    prefs: legacyPrefs,
  })
}

// ── Normalisers ──────────────────────────────────────────────────────────────

function text(value) {
  return value == null ? '' : String(value).trim()
}

function optionalText(value) {
  const t = text(value)
  return t === '' ? null : t
}

function normalizeCategories(list) {
  const seen = new Set()
  const categories = []
  for (const c of Array.isArray(list) ? list : []) {
    if (!c || c.id == null || seen.has(String(c.id))) continue
    seen.add(String(c.id))
    categories.push({ id: String(c.id), name: text(c.name) || '이름 없는 카테고리', parentId: c.parentId ?? null })
  }
  const byId = new Map(categories.map(c => [c.id, c]))
  for (const c of categories) {
    if (c.parentId != null && !byId.has(c.parentId)) c.parentId = null
  }
  // Break parent cycles so every category is reachable from a root.
  for (const c of categories) {
    const visited = new Set([c.id])
    let parent = c.parentId
    while (parent != null) {
      if (visited.has(parent)) {
        c.parentId = null
        break
      }
      visited.add(parent)
      parent = byId.get(parent)?.parentId ?? null
    }
  }
  return categories
}

export function normalizeTags(tags) {
  const out = []
  for (const tag of Array.isArray(tags) ? tags : []) {
    const t = text(tag).replace(/^#+/, '').trim()
    if (t && !out.includes(t)) out.push(t)
  }
  return out
}

/**
 * A record as the record form saves it. The value is a number (or empty);
 * a unit without a value means nothing, so it is dropped.
 */
export function recordFromInput(input) {
  const raw = input.value === '' || input.value == null ? null : Number(String(input.value).replace(/,/g, ''))
  const value = Number.isFinite(raw) ? raw : null
  return {
    id: input.id || generateId('rec'),
    categoryId: input.categoryId ?? null,
    date: input.date,
    value,
    unit: value != null ? optionalText(input.unit) : null,
    memo: optionalText(input.memo),
    photoUrl: optionalText(input.photoUrl),
    tags: normalizeTags(input.tags),
  }
}

function normalizeRecord(r, categoryIds) {
  const value = r.value === '' || r.value == null ? null : Number(r.value)
  return {
    id: r.id ? String(r.id) : generateId('rec'),
    categoryId: r.categoryId != null && categoryIds.has(r.categoryId) ? r.categoryId : null,
    date: isValidDateStr(r.date) ? r.date : null,
    value: Number.isFinite(value) ? value : null,
    unit: optionalText(r.unit),
    memo: optionalText(r.memo),
    photoUrl: optionalText(r.photoUrl),
    tags: normalizeTags(r.tags),
  }
}

function normalizeCondition(condition) {
  if (!condition || typeof condition !== 'object') return { type: 'action' }
  const c = clone(condition)
  if (c.type === 'tag_set_complete') {
    c.tags = normalizeTags(c.tags)
    delete c.target
  }
  if (c.type === 'composite') {
    c.operator = c.operator === 'OR' ? 'OR' : 'AND'
    c.conditions = (Array.isArray(c.conditions) ? c.conditions : []).map(normalizeCondition)
  }
  if (c.type === 'meta_list') c.achievementIds = [...new Set(c.achievementIds || [])]
  return c
}

function normalizeTier(tier) {
  if (TIER_IDS.includes(tier)) return tier
  if (tier === 'legendary' || tier === 'red_diamond') return 'diamond'
  return 'bronze'
}

function normalizeAchievement(a, categoryIds) {
  const condition = normalizeCondition(a.condition)
  return {
    id: String(a.id),
    title: text(a.title) || '이름 없는 업적',
    // v1 had a separate "condition display text"; fold it into the description.
    description: text(a.description) || text(a.conditionDisplay),
    categoryId: a.categoryId != null && categoryIds.has(a.categoryId) ? a.categoryId : null,
    tier: normalizeTier(a.tier),
    condition,
    isHidden: !!a.isHidden,
    ...(condition.type === 'manual' ? { manualEarnedAt: isValidDateStr(a.manualEarnedAt) ? a.manualEarnedAt : null } : {}),
  }
}

function normalizePrefs(prefs, categoryIds, achievementIds) {
  const base = defaultPrefs()
  const p = prefs && typeof prefs === 'object' ? prefs : {}

  const favorites = [...new Set(Array.isArray(p.favorites) ? p.favorites : [])].filter(id => categoryIds.has(id))

  const pinned = base.pinned.map((_, i) => {
    const id = Array.isArray(p.pinned) ? p.pinned[i] : null
    return id != null && achievementIds.has(id) ? id : null
  })
  // No duplicates across slots.
  pinned.forEach((id, i) => { if (id && pinned.indexOf(id) !== i) pinned[i] = null })

  const categoryDefaults = {}
  for (const [id, d] of Object.entries(p.categoryDefaults && typeof p.categoryDefaults === 'object' ? p.categoryDefaults : {})) {
    if (!categoryIds.has(id) || !d) continue
    categoryDefaults[id] = {
      defaultUnit: text(d.defaultUnit),
      defaultTags: normalizeTags(d.defaultTags),
      autoApply: d.autoApply !== false,
    }
  }

  return {
    favorites,
    pinned,
    categoryDefaults,
    homeCategoryId: categoryIds.has(p.homeCategoryId) ? p.homeCategoryId : null,
    lastCategoryId: categoryIds.has(p.lastCategoryId) ? p.lastCategoryId : null,
    introDismissed: !!p.introDismissed,
    lastBackupAt: isValidDateStr(p.lastBackupAt) ? p.lastBackupAt : null,
  }
}

/** Sanitise a v2-shaped state (from storage or a backup file). */
export function normalizeState(data) {
  const categories = normalizeCategories(data?.categories)
  const categoryIds = new Set(categories.map(c => c.id))

  const recordIds = new Set()
  const records = []
  for (const r of Array.isArray(data?.records) ? data.records : []) {
    if (!r || typeof r !== 'object') continue
    const record = normalizeRecord(r, categoryIds)
    if (!record.date || recordIds.has(record.id)) continue
    recordIds.add(record.id)
    records.push(record)
  }

  const achievements = []
  const seen = new Set()
  for (const a of Array.isArray(data?.achievements) ? data.achievements : []) {
    if (!a || a.id == null || seen.has(String(a.id)) || a._softDeleted) continue
    seen.add(String(a.id))
    achievements.push(normalizeAchievement(a, categoryIds))
  }
  // Drop references to achievements that no longer exist.
  for (const a of achievements) {
    if (a.condition.type === 'meta_list') a.condition.achievementIds = a.condition.achievementIds.filter(id => seen.has(id))
  }

  return { categories, records, achievements, prefs: normalizePrefs(data?.prefs, categoryIds, seen) }
}

// ── v1 → v2 ──────────────────────────────────────────────────────────────────

/**
 * v1 stored earned/progress state inside each achievement and kept a few
 * settings under separate localStorage keys (passed in as `legacyPrefs`).
 * Built-in achievements the user never edited are swapped for the current
 * catalog; edited and user-made ones are kept as they are.
 */
export function migrateV1(data, legacyPrefs = {}) {
  const userAchievements = (Array.isArray(data?.achievements) ? data.achievements : []).filter(a => a && !a._softDeleted)
  const userById = new Map(userAchievements.map(a => [a.id, a]))
  const isUntouchedBuiltIn = a => {
    const fp = LEGACY_CATALOG_FINGERPRINTS[a.id]
    return !!fp && fingerprintV1Achievement(a) === fp
  }

  // New built-ins only make sense if the categories they point at still exist;
  // otherwise they'd silently become "any record" achievements.
  const userCategoryIds = new Set((Array.isArray(data?.categories) ? data.categories : []).map(c => c?.id))
  const categoriesExist = a => (a.categoryId == null || userCategoryIds.has(a.categoryId))
    && (a.condition.sources || []).every(s => userCategoryIds.has(s.categoryId))

  const achievements = []
  for (const builtIn of catalog) {
    const mine = userById.get(builtIn.id)
    if (mine) achievements.push(isUntouchedBuiltIn(mine) ? clone(builtIn) : mine)
    else if (!LEGACY_CATALOG_FINGERPRINTS[builtIn.id] && categoriesExist(builtIn)) achievements.push(clone(builtIn)) // new in v2
    // else: a v1 built-in the user deleted — keep it deleted
  }
  const catalogIds = new Set(catalog.map(a => a.id))
  for (const mine of userAchievements) {
    if (catalogIds.has(mine.id)) continue
    // User-made, or an edited built-in that the catalog no longer ships.
    if (!isUntouchedBuiltIn(mine)) achievements.push(mine)
  }

  return normalizeState({
    categories: data?.categories,
    records: data?.records,
    achievements,
    prefs: legacyPrefs,
  })
}

// ── Persisted payloads and backup files ───────────────────────────────────────

export function toPayload(state) {
  return { schemaVersion: SCHEMA_VERSION, data: state }
}

export function toBackup(state) {
  return { app: APP_ID, schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data: state }
}

/**
 * Turn a stored payload or a backup file into v2 state.
 * Throws with a user-facing message when the content isn't usable.
 */
export function stateFromPayload(payload, legacyPrefs = {}) {
  const data = payload?.data
  const hasLists = data && ['categories', 'records', 'achievements'].every(k => Array.isArray(data[k]))
  if (!hasLists) throw new Error('업적 라이브러리 백업 파일이 아니에요.')
  if (payload.schemaVersion === 1) return migrateV1(data, legacyPrefs)
  if (payload.schemaVersion === SCHEMA_VERSION) return normalizeState(data)
  throw new Error('이 앱보다 새로운 버전에서 만든 데이터라 읽을 수 없어요.')
}
