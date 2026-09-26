import { describe, it, expect } from 'vitest'
import {
  createDefaultState, migrateV1, normalizeState, stateFromPayload, toBackup, upgradeCatalog, SCHEMA_VERSION,
} from './appState.js'
import { fingerprintAchievement, fingerprintV1Achievement } from './fingerprint.js'
import { currentCatalogSnapshot, snapshotDigest } from './catalogSnapshot.js'
import { catalogUpgradeNotice } from './localStore.js'
import { achievements as catalog1Achievements } from './fixtures/catalog1Achievements.js'
import { categories as catalog1Categories } from './fixtures/catalog1Categories.js'
import { LEGACY_CATALOG_FINGERPRINTS } from '@/data/legacyCatalog.js'
import { CATALOG_DIGEST, CATALOG_SNAPSHOTS, CATALOG_VERSION } from '@/data/catalogHistory.js'
import { achievements as catalog } from '@/data/achievements.js'
import { categories } from '@/data/categories.js'

// Exact v1 definitions of two built-ins, plus the runtime fields v1 stored.
const v1Run001 = {
  id: 'ach-run-001', title: '첫 걸음', description: '첫 번째 러닝 세션을 기록하세요.', categoryId: 'cat-running',
  tier: 'bronze', type: 'one-time', condition: { type: 'action' }, rarity: null, isHidden: false,
  isEarned: true, earnedAt: '2026-09-20', progress: 1,
}
const v1Bench004 = {
  id: 'ach-bench-004', title: '꾸준한 벤치 프레서', description: '벤치 프레스 세션을 총 20회 기록하세요.',
  categoryId: 'cat-bench-press', tier: 'silver', type: 'one-time', condition: { type: 'count', target: 20 },
  rarity: null, isHidden: false, isEarned: false, earnedAt: null, progress: 3,
}
const v1Run002Edited = {
  id: 'ach-run-002', title: '내가 바꾼 이름', description: '총 10회 달리기를 완료하세요.', categoryId: 'cat-running',
  tier: 'silver', type: 'one-time', condition: { type: 'count', target: 10 }, rarity: null, isHidden: false,
  isEarned: false, earnedAt: null, progress: 2, progressFormat: '{current}/{total}', completedStyle: 'bold',
}
const v1Custom = {
  id: 'ach-mine', title: '내 업적', description: '', conditionDisplay: '비밀 조건', categoryId: 'cat-books',
  tier: 'legendary', type: 'one-time', condition: { type: 'count', target: 3 }, rarity: 2, isHidden: true,
  isEarned: false, earnedAt: null, progress: 0,
}
const v1Meta = {
  id: 'ach-my-meta', title: '내 메타', description: '', categoryId: null, tier: 'gold', type: 'meta',
  condition: { type: 'meta_list', achievementIds: ['ach-mine', 'ach-bench-004'] }, isHidden: false,
}

function v1Data(achievements) {
  return {
    categories,
    records: [
      { id: 'rec-1', categoryId: 'cat-running', date: '2026-09-20', value: 5, unit: 'km', memo: '첫 러닝', photoUrl: null, tags: ['야외'], unlockedAchievementIds: ['ach-run-001'] },
      { id: 'rec-2', categoryId: 'cat-gone', date: '2026-09-21', value: '3', unit: '', memo: '', photoUrl: null, tags: [] },
    ],
    achievements,
  }
}

describe('v1 → v2 migration', () => {
  it('the embedded fingerprints match the v1 catalog', () => {
    expect(fingerprintV1Achievement(v1Run001)).toBe(LEGACY_CATALOG_FINGERPRINTS['ach-run-001'])
    expect(fingerprintV1Achievement(v1Bench004)).toBe(LEGACY_CATALOG_FINGERPRINTS['ach-bench-004'])
    expect(fingerprintV1Achievement(v1Run002Edited)).not.toBe(LEGACY_CATALOG_FINGERPRINTS['ach-run-002'])
  })

  const state = migrateV1(
    v1Data([v1Run001, v1Bench004, v1Run002Edited, v1Custom, v1Meta, { ...v1Custom, id: 'ach-soft', _softDeleted: true }]),
    { favorites: ['cat-running', 'cat-gone'], pinned: ['ach-run-001', 'ach-bench-004'], categoryDefaults: { 'cat-running': { defaultUnit: 'km', defaultTags: ['야외'], autoApply: true } } },
  )
  const byId = new Map(state.achievements.map(a => [a.id, a]))
  const catalogById = new Map(catalog.map(a => [a.id, a]))

  it('replaces untouched built-ins with the current catalog version', () => {
    expect(byId.get('ach-run-001')).toEqual(catalogById.get('ach-run-001'))
  })

  it('drops untouched built-ins that were removed from the catalog', () => {
    expect(byId.has('ach-bench-004')).toBe(false)
  })

  it('keeps edited built-ins and user-made achievements without v1-only fields', () => {
    expect(byId.get('ach-run-002')).toEqual({
      id: 'ach-run-002', title: '내가 바꾼 이름', description: '총 10회 달리기를 완료하세요.',
      categoryId: 'cat-running', tier: 'silver', condition: { type: 'count', target: 10 }, isHidden: false,
    })
    expect(byId.get('ach-mine')).toMatchObject({ tier: 'diamond', description: '비밀 조건', isHidden: true })
    expect(byId.get('ach-mine')).not.toHaveProperty('rarity')
  })

  it('drops soft-deleted achievements and dangling meta references', () => {
    expect(byId.has('ach-soft')).toBe(false)
    expect(byId.get('ach-my-meta').condition.achievementIds).toEqual(['ach-mine'])
  })

  it('does not bring back built-ins the user deleted, but adds new ones', () => {
    expect(byId.has('ach-run-008')).toBe(false)
    expect(byId.has('ach-all-001')).toBe(true)
    expect(byId.has('ach-deadlift-001')).toBe(true)
  })

  it('skips new built-ins whose category the user deleted', () => {
    const v1Meta001 = {
      id: 'ach-meta-001', title: '피트니스 입문 완성', description: '러닝 2개와 벤치 프레스·스쿼트·사이클링 입문 업적을 모두 획득하세요.',
      categoryId: 'cat-fitness', tier: 'gold', type: 'meta', rarity: null, isHidden: false,
      condition: { type: 'meta_list', achievementIds: ['ach-run-001', 'ach-run-002', 'ach-bench-001', 'ach-squat-001', 'ach-cycling-001'] },
    }
    expect(fingerprintV1Achievement(v1Meta001)).toBe(LEGACY_CATALOG_FINGERPRINTS['ach-meta-001'])
    const withoutDeadlift = migrateV1({ ...v1Data([v1Run001, v1Meta001]), categories: categories.filter(c => c.id !== 'cat-deadlift') })
    const ids = new Set(withoutDeadlift.achievements.map(a => a.id))
    expect(ids.has('ach-deadlift-001')).toBe(false)
    // …including achievements that only reference it as a source
    expect(ids.has('ach-strength-003')).toBe(false)
    expect(withoutDeadlift.achievements.every(a => a.categoryId === null || withoutDeadlift.categories.some(c => c.id === a.categoryId))).toBe(true)
    // and the meta list that pointed at it drops the reference
    expect(withoutDeadlift.achievements.find(a => a.id === 'ach-meta-001').condition.achievementIds).not.toContain('ach-deadlift-001')
  })

  it('keeps records and cleans them up', () => {
    expect(state.records).toEqual([
      { id: 'rec-1', categoryId: 'cat-running', date: '2026-09-20', value: 5, unit: 'km', memo: '첫 러닝', photoUrl: null, tags: ['야외'] },
      { id: 'rec-2', categoryId: null, date: '2026-09-21', value: 3, unit: null, memo: null, photoUrl: null, tags: [] },
    ])
  })

  it('moves the old separate settings into prefs', () => {
    expect(state.prefs.favorites).toEqual(['cat-running'])
    expect(state.prefs.pinned).toEqual(['ach-run-001', null, null, null, null])
    expect(state.prefs.categoryDefaults['cat-running']).toEqual({ defaultUnit: 'km', defaultTags: ['야외'], autoApply: true })
  })

  it('gives a v1 user the new default categories and their achievements', () => {
    const migrated = migrateV1({ ...v1Data([v1Run001]), categories: catalog1Categories })
    const categoryIds = new Set(migrated.categories.map(c => c.id))
    expect(categoryIds.has('cat-walking')).toBe(true)
    expect(categoryIds.has('cat-health')).toBe(true)
    expect(migrated.achievements.some(a => a.id === 'ach-walk-001')).toBe(true)
    expect(migrated.catalogVersion).toBe(CATALOG_VERSION)
  })
})

describe('catalog upgrade (catalog 1 → current)', () => {
  // A user who has used the catalog-1 app: default categories and achievements,
  // a few changes of their own, some records and settings.
  const records = [
    { id: 'rec-1', categoryId: 'cat-running', date: '2026-09-20', value: 5, unit: 'km', memo: null, photoUrl: null, tags: [] },
    { id: 'rec-2', categoryId: 'cat-cycling', date: '2026-09-21', value: 20, unit: 'km', memo: null, photoUrl: null, tags: [] },
  ]
  const mine = {
    id: 'ach-mine', title: '내 업적', description: '', categoryId: 'cat-mine', tier: 'gold',
    condition: { type: 'count', target: 3 }, isHidden: false,
  }
  function catalog1State({ achievements = catalog1Achievements, categories = catalog1Categories } = {}) {
    return normalizeState({
      categories: [...categories, { id: 'cat-mine', name: '내 카테고리', parentId: 'cat-fitness' }],
      records,
      achievements: [...achievements, mine],
      prefs: { pinned: ['ach-run-006', 'ach-run-001'], homeCategoryId: 'cat-running' },
    })
  }
  const catalogById = new Map(createDefaultState().achievements.map(a => [a.id, a]))

  it('the catalog-1 fixture matches the stored snapshot', () => {
    const state = normalizeState({ categories: catalog1Categories, records: [], achievements: catalog1Achievements })
    const fingerprints = Object.fromEntries(state.achievements.map(a => [a.id, fingerprintAchievement(a)]))
    expect(fingerprints).toEqual(CATALOG_SNAPSHOTS[1].achievements)
    expect(state.categories).toEqual(CATALOG_SNAPSHOTS[1].categories)
  })

  it('states saved before catalog versions existed are catalog 1', () => {
    expect(catalog1State().catalogVersion).toBe(1)
    expect(createDefaultState().catalogVersion).toBe(CATALOG_VERSION)
  })

  it('brings an untouched catalog-1 state up to the full current catalog', () => {
    const upgraded = upgradeCatalog(catalog1State())
    expect(upgraded.catalogVersion).toBe(CATALOG_VERSION)
    const ids = upgraded.achievements.map(a => a.id)
    expect(ids).toEqual([...catalog.map(a => a.id), 'ach-mine'])
    for (const a of upgraded.achievements.filter(x => x.id !== 'ach-mine')) expect(a).toEqual(catalogById.get(a.id))
    // default categories first as the user had them, new ones after
    expect(upgraded.categories.map(c => c.id)).toEqual([
      ...catalog1Categories.map(c => c.id), 'cat-mine',
      ...categories.map(c => c.id).filter(id => !catalog1Categories.some(c => c.id === id)),
    ])
  })

  it('updates built-ins the user never edited and keeps the ones they did', () => {
    const edited = catalog1Achievements.map(a => (a.id === 'ach-run-002' ? { ...a, title: '내가 바꾼 이름' } : a))
    const upgraded = upgradeCatalog(catalog1State({ achievements: edited }))
    const byId = new Map(upgraded.achievements.map(a => [a.id, a]))
    expect(byId.get('ach-run-002').title).toBe('내가 바꾼 이름')
    expect(byId.get('ach-run-006').description).toBe(catalogById.get('ach-run-006').description) // 철각, reworded
    expect(byId.get('ach-career-002')).toMatchObject({ categoryId: 'cat-certificates', condition: { type: 'action' } })
    expect(byId.get('ach-mine')).toEqual(mine)
  })

  it('does not bring back achievements or categories the user deleted', () => {
    // Deleting 사이클링 in the app also deletes its achievements and drops them
    // from combinations (so 올라운더 counts as edited).
    const cyclingIds = new Set(catalog1Achievements.filter(a => a.categoryId === 'cat-cycling').map(a => a.id))
    const achievements = catalog1Achievements
      .filter(a => !cyclingIds.has(a.id) && a.id !== 'ach-run-008')
      .map(a => (a.condition.type === 'meta_list'
        ? { ...a, condition: { ...a.condition, achievementIds: a.condition.achievementIds.filter(id => !cyclingIds.has(id)) } }
        : a))
    const upgraded = upgradeCatalog(catalog1State({
      achievements,
      categories: catalog1Categories.filter(c => c.id !== 'cat-cycling'),
    }))
    const ids = new Set(upgraded.achievements.map(a => a.id))
    const categoryIds = new Set(upgraded.categories.map(c => c.id))
    expect(ids.has('ach-run-008')).toBe(false)
    expect(categoryIds.has('cat-cycling')).toBe(false)
    // nothing new goes into a deleted category, or combines achievements that aren't there
    expect(ids.has('ach-cycling-004')).toBe(false)
    expect(ids.has('ach-fitness-015')).toBe(false) // the triathlon needs a cycling achievement
    expect(ids.has('ach-walk-001')).toBe(true)
    expect(upgraded.achievements.find(a => a.id === 'ach-meta-001').condition.achievementIds).not.toContain('ach-cycling-001')
  })

  it('skips new subcategories of a category the user deleted', () => {
    const withoutCareer = catalog1Categories.filter(c => c.id !== 'cat-career')
    const upgraded = upgradeCatalog(catalog1State({ categories: withoutCareer }))
    const categoryIds = new Set(upgraded.categories.map(c => c.id))
    expect(categoryIds.has('cat-work')).toBe(false)
    expect(categoryIds.has('cat-certificates')).toBe(false)
    expect(upgraded.achievements.some(a => a.categoryId === 'cat-work')).toBe(false)
  })

  it('renames default categories only when the user kept the old name', () => {
    const renamed = catalog1Categories.map(c => (c.id === 'cat-meal-prep' ? { ...c, name: '도시락' } : c))
    expect(upgradeCatalog(catalog1State()).categories.find(c => c.id === 'cat-meal-prep').name).toBe('요리')
    expect(upgradeCatalog(catalog1State({ categories: renamed })).categories.find(c => c.id === 'cat-meal-prep').name).toBe('도시락')
  })

  it('keeps records and settings', () => {
    const before = catalog1State()
    const upgraded = upgradeCatalog(before)
    expect(upgraded.records).toEqual(before.records)
    expect(upgraded.prefs).toEqual(before.prefs)
  })

  it('runs once, and would change nothing if it ran again', () => {
    const upgraded = upgradeCatalog(catalog1State())
    expect(upgradeCatalog(upgraded)).toBe(upgraded)
    expect(upgradeCatalog({ ...upgraded, catalogVersion: 1 })).toEqual(upgraded)
  })

  it('tells a returning user what was added, once', () => {
    const before = catalog1State()
    const upgraded = upgradeCatalog(before)
    const added = upgraded.achievements.length - before.achievements.length
    expect(catalogUpgradeNotice(before, upgraded)).toContain(`업적 ${added}개`)
    expect(catalogUpgradeNotice(upgraded, upgradeCatalog(upgraded))).toBeNull()
  })

  it('upgrades stored payloads and backups from before catalog versions', () => {
    const payload = JSON.parse(JSON.stringify({ schemaVersion: SCHEMA_VERSION, data: catalog1State() }))
    delete payload.data.catalogVersion
    const state = stateFromPayload(payload)
    expect(state.catalogVersion).toBe(CATALOG_VERSION)
    expect(state.achievements.length).toBe(catalog.length + 1)
  })
})

describe('catalog history', () => {
  it('has a snapshot of every earlier catalog', () => {
    for (let v = 1; v < CATALOG_VERSION; v++) expect(CATALOG_SNAPSHOTS[v], `catalog ${v}`).toBeDefined()
  })

  it('CATALOG_DIGEST matches the shipped catalog (see src/data/catalogHistory.js when you change it)', () => {
    expect(snapshotDigest(currentCatalogSnapshot())).toBe(CATALOG_DIGEST)
  })
})

describe('payloads', () => {
  it('reads v1 storage payloads and v2 backups', () => {
    const fromV1 = stateFromPayload({ schemaVersion: 1, data: v1Data([v1Run001]) })
    expect(fromV1.records).toHaveLength(2)

    const backup = JSON.parse(JSON.stringify(toBackup(fromV1)))
    expect(backup.schemaVersion).toBe(SCHEMA_VERSION)
    expect(stateFromPayload(backup)).toEqual(fromV1)
  })

  it('rejects unrelated or newer files with a readable message', () => {
    expect(() => stateFromPayload({ foo: 1 })).toThrow('백업 파일이 아니에요')
    expect(() => stateFromPayload({ schemaVersion: 99, data: { categories: [], records: [], achievements: [] } }))
      .toThrow('새로운 버전')
  })

  it('default state ships the full catalog and no records', () => {
    const state = createDefaultState()
    expect(state.records).toEqual([])
    expect(state.achievements).toHaveLength(catalog.length)
    expect(state.prefs.pinned).toHaveLength(5)
  })

  it('normalizeState repairs broken category trees', () => {
    const state = normalizeState({
      categories: [
        { id: 'a', name: 'A', parentId: 'b' },
        { id: 'b', name: 'B', parentId: 'a' },
        { id: 'c', name: '', parentId: 'missing' },
      ],
      records: [],
      achievements: [],
    })
    expect(state.categories.filter(c => c.parentId === null).map(c => c.id).sort()).toEqual(['a', 'c'])
    expect(state.categories.find(c => c.id === 'c').name).toBe('이름 없는 카테고리')
  })
})
