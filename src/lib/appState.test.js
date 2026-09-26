import { describe, it, expect } from 'vitest'
import { createDefaultState, migrateV1, normalizeState, stateFromPayload, toBackup, SCHEMA_VERSION } from './appState.js'
import { fingerprintV1Achievement } from './fingerprint.js'
import { LEGACY_CATALOG_FINGERPRINTS } from '@/data/legacyCatalog.js'
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
