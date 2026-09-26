// Shape, defaults, normalisation and migrations for the persisted app state.
//
// v2 state:
//   { categories, records, achievements, prefs, catalogVersion }
// Achievements hold definitions only — earned state is derived at runtime.
// `catalogVersion` is the built-in catalog the state was last brought up to;
// see upgradeCatalog().

import { categories as defaultCategories } from '@/data/categories.js'
import { achievements as catalog } from '@/data/achievements.js'
import { CATALOG_SNAPSHOTS, CATALOG_VERSION } from '@/data/catalogHistory.js'
import { LEGACY_CATALOG_FINGERPRINTS } from '@/data/legacyCatalog.js'
import { TIER_IDS } from '@/constants/tiers.js'
import { isValidDateStr } from '@/utils/dates.js'
import { generateId } from '@/utils/formatters.js'
import { fingerprintAchievement, fingerprintV1Achievement } from './fingerprint.js'

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
    catalogVersion: CATALOG_VERSION,
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

  // States saved before catalog versions existed hold catalog 1.
  const catalogVersion = Number.isInteger(data?.catalogVersion) && data.catalogVersion > 0 ? data.catalogVersion : 1

  return { categories, records, achievements, prefs: normalizePrefs(data?.prefs, categoryIds, seen), catalogVersion }
}

// ── Built-in catalog merges ──────────────────────────────────────────────────

/** Categories an achievement's rule adds up, besides its own. */
function sourceCategoryIds(condition) {
  const parts = condition?.type === 'composite' ? condition.conditions || [] : [condition]
  return parts.flatMap(part => (part?.sources || []).map(s => s?.categoryId))
}

function fromCatalog(builtIn, mine) {
  const a = clone(builtIn)
  // A manual check-off is progress, not definition — keep it.
  if (builtIn.condition.type === 'manual' && mine.manualEarnedAt) a.manualEarnedAt = mine.manualEarnedAt
  return a
}

/**
 * Merge the current built-in categories and achievements into stored ones.
 *
 * - A default category the user doesn't have is added under its parent,
 *   unless the previous catalog had it (then the user deleted it). A category
 *   still called by its previous default name takes the new name.
 * - A built-in achievement the user never edited (`isUntouched`) becomes the
 *   current version, or goes away with it; an edited one is kept as it is.
 * - A built-in that is new since the previous catalog (`wasShipped` false) is
 *   added when its categories exist; one the user deleted stays deleted. A new
 *   one that combines other achievements is only added when all of them are.
 *
 * @param {{ categories: Object[], achievements: Object[] }} stored
 * @param {{ previousCategories: Object[], wasShipped: (id: string) => boolean, isUntouched: (a: Object) => boolean }} previous
 */
function mergeCatalog(stored, { previousCategories, wasShipped, isUntouched }) {
  const previousById = new Map(previousCategories.map(c => [c.id, c]))
  const categories = stored.categories.map(c => ({ ...c }))
  const categoryById = new Map(categories.map(c => [c.id, c]))
  for (const def of defaultCategories) {
    const mine = categoryById.get(def.id)
    const previous = previousById.get(def.id)
    if (mine) {
      if (previous && mine.name === previous.name) mine.name = def.name
    } else if (!previous && (def.parentId == null || categoryById.has(def.parentId))) {
      const added = { ...def }
      categories.push(added)
      categoryById.set(added.id, added)
    }
  }

  const categoriesExist = a => (a.categoryId == null || categoryById.has(a.categoryId))
    && sourceCategoryIds(a.condition).every(id => categoryById.has(id))
  const mineById = new Map(stored.achievements.map(a => [a.id, a]))
  const added = new Set()
  let achievements = []
  for (const builtIn of catalog) {
    const mine = mineById.get(builtIn.id)
    if (mine) {
      achievements.push(isUntouched(mine) ? fromCatalog(builtIn, mine) : mine)
    } else if (!wasShipped(builtIn.id) && categoriesExist(builtIn)) {
      achievements.push(clone(builtIn))
      added.add(builtIn.id)
    }
  }
  const catalogIds = new Set(catalog.map(a => a.id))
  for (const mine of stored.achievements) {
    // User-made, or an edited built-in that the catalog no longer ships.
    if (!catalogIds.has(mine.id) && !isUntouched(mine)) achievements.push(mine)
  }

  for (let changed = true; changed;) {
    const present = new Set(achievements.map(a => a.id))
    const next = achievements.filter(a => !(added.has(a.id) && a.condition.type === 'meta_list'
      && a.condition.achievementIds.some(id => !present.has(id))))
    changed = next.length !== achievements.length
    achievements = next
  }

  return { categories, achievements }
}

let shippedCache = null

/** id → fingerprints of every version of that built-in ever shipped, current one included. */
function shippedFingerprints() {
  if (!shippedCache) {
    shippedCache = new Map()
    const add = (id, fp) => {
      if (!shippedCache.has(id)) shippedCache.set(id, new Set())
      shippedCache.get(id).add(fp)
    }
    for (const snapshot of Object.values(CATALOG_SNAPSHOTS)) {
      for (const [id, fp] of Object.entries(snapshot.achievements)) add(id, fp)
    }
    for (const a of createDefaultState().achievements) add(a.id, fingerprintAchievement(a))
  }
  return shippedCache
}

/**
 * Bring a stored v2 state up to the current built-in catalog (see mergeCatalog),
 * comparing it with the catalog it was last brought up to. Records, prefs and
 * anything the user made or edited stay as they are.
 */
export function upgradeCatalog(state) {
  const from = state.catalogVersion ?? 1
  if (from >= CATALOG_VERSION) return state
  const previous = CATALOG_SNAPSHOTS[from] ?? CATALOG_SNAPSHOTS[1]
  const fingerprints = shippedFingerprints()
  const merged = mergeCatalog(state, {
    previousCategories: previous.categories,
    wasShipped: id => id in previous.achievements,
    isUntouched: a => !!fingerprints.get(a.id)?.has(fingerprintAchievement(a)),
  })
  return normalizeState({ ...state, ...merged, catalogVersion: CATALOG_VERSION })
}

// ── v1 → v2 ──────────────────────────────────────────────────────────────────

/**
 * v1 stored earned/progress state inside each achievement and kept a few
 * settings under separate localStorage keys (passed in as `legacyPrefs`).
 * Built-in achievements the user never edited are swapped for the current
 * catalog; edited and user-made ones are kept as they are. v1 shipped the
 * same default categories as catalog 1.
 */
export function migrateV1(data, legacyPrefs = {}) {
  const merged = mergeCatalog(
    {
      categories: normalizeCategories(data?.categories),
      achievements: (Array.isArray(data?.achievements) ? data.achievements : []).filter(a => a && a.id != null && !a._softDeleted),
    },
    {
      previousCategories: CATALOG_SNAPSHOTS[1].categories,
      wasShipped: id => id in LEGACY_CATALOG_FINGERPRINTS,
      isUntouched: a => LEGACY_CATALOG_FINGERPRINTS[a.id] === fingerprintV1Achievement(a),
    },
  )
  return normalizeState({
    categories: merged.categories,
    records: data?.records,
    achievements: merged.achievements,
    prefs: legacyPrefs,
    catalogVersion: CATALOG_VERSION,
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
  if (payload.schemaVersion === SCHEMA_VERSION) return upgradeCatalog(normalizeState(data))
  throw new Error('이 앱보다 새로운 버전에서 만든 데이터라 읽을 수 없어요.')
}
