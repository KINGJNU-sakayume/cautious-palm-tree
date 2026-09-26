import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { evaluateAchievements, isMetaCondition } from '@/utils/achievementEvaluator.js'
import { getDescendantIds } from '@/utils/categoryTree.js'
import { generateId } from '@/utils/formatters.js'
import { getTier } from '@/constants/tiers.js'
import { createDefaultState, normalizeTags, stateFromPayload, toBackup, PIN_SLOTS } from '@/lib/appState.js'
import { STORAGE_KEY, isQuotaError, loadAppState, serializeState, writeSerializedState } from '@/lib/localStore.js'
import { useToast } from './ToastContext.jsx'

const AppContext = createContext(null)

// ── Reducer ──────────────────────────────────────────────────────────────────

function withoutAchievementRefs(achievements, removedIds) {
  return achievements.map(a => {
    if (a.condition.type !== 'meta_list') return a
    const ids = a.condition.achievementIds.filter(id => !removedIds.has(id))
    return ids.length === a.condition.achievementIds.length ? a : { ...a, condition: { ...a.condition, achievementIds: ids } }
  })
}

function withoutCategoryRefs(achievements, removedCategoryIds) {
  return achievements.map(a => {
    if (a.condition.type !== 'cross_category_cumulative') return a
    const sources = a.condition.sources.filter(s => !removedCategoryIds.has(s.categoryId))
    return sources.length === a.condition.sources.length ? a : { ...a, condition: { ...a.condition, sources } }
  })
}

function reducer(state, action) {
  switch (action.type) {
    case 'REPLACE':
      return action.state

    case 'RECORD_ADD':
      return {
        ...state,
        records: [...state.records, action.record],
        prefs: { ...state.prefs, lastCategoryId: action.record.categoryId ?? state.prefs.lastCategoryId },
      }
    case 'RECORD_RESTORE': {
      const records = [...state.records]
      records.splice(Math.min(action.index, records.length), 0, action.record)
      return { ...state, records }
    }
    case 'RECORD_UPDATE':
      return { ...state, records: state.records.map(r => (r.id === action.record.id ? action.record : r)) }
    case 'RECORD_DELETE':
      return { ...state, records: state.records.filter(r => r.id !== action.id) }

    case 'ACHIEVEMENT_ADD':
      return { ...state, achievements: [...state.achievements, action.achievement] }
    case 'ACHIEVEMENT_UPDATE':
      return { ...state, achievements: state.achievements.map(a => (a.id === action.achievement.id ? action.achievement : a)) }
    case 'ACHIEVEMENT_DELETE': {
      const removed = new Set([action.id])
      return {
        ...state,
        achievements: withoutAchievementRefs(state.achievements.filter(a => a.id !== action.id), removed),
        prefs: { ...state.prefs, pinned: state.prefs.pinned.map(id => (id === action.id ? null : id)) },
      }
    }

    case 'CATEGORY_ADD':
      return { ...state, categories: [...state.categories, action.category] }
    case 'CATEGORY_RENAME':
      return { ...state, categories: state.categories.map(c => (c.id === action.id ? { ...c, name: action.name } : c)) }
    case 'CATEGORY_MOVE':
      return { ...state, categories: state.categories.map(c => (c.id === action.id ? { ...c, parentId: action.parentId } : c)) }
    case 'CATEGORY_DELETE': {
      const target = state.categories.find(c => c.id === action.id)
      if (!target) return state
      const removed = new Set([action.id, ...getDescendantIds(action.id, state.categories)])
      const removedAchievements = new Set(state.achievements.filter(a => removed.has(a.categoryId)).map(a => a.id))
      const keep = (id) => (id && removed.has(id) ? null : id)
      const categoryDefaults = { ...state.prefs.categoryDefaults }
      removed.forEach(id => delete categoryDefaults[id])
      return {
        categories: state.categories.filter(c => !removed.has(c.id)),
        // Records move up to the deleted category's parent (or become uncategorised).
        records: state.records.map(r => (removed.has(r.categoryId) ? { ...r, categoryId: target.parentId ?? null } : r)),
        achievements: withoutCategoryRefs(
          withoutAchievementRefs(state.achievements.filter(a => !removedAchievements.has(a.id)), removedAchievements),
          removed,
        ),
        prefs: {
          ...state.prefs,
          favorites: state.prefs.favorites.filter(id => !removed.has(id)),
          pinned: state.prefs.pinned.map(id => (removedAchievements.has(id) ? null : id)),
          categoryDefaults,
          homeCategoryId: keep(state.prefs.homeCategoryId),
          lastCategoryId: keep(state.prefs.lastCategoryId),
        },
      }
    }

    case 'PREFS_PATCH':
      return { ...state, prefs: { ...state.prefs, ...action.patch } }

    default:
      return state
  }
}

// ── Input cleaning ───────────────────────────────────────────────────────────

function cleanRecord(input) {
  const value = input.value === '' || input.value == null ? null : Number(input.value)
  return {
    id: input.id || generateId('rec'),
    categoryId: input.categoryId ?? null,
    date: input.date,
    value: Number.isFinite(value) ? value : null,
    unit: input.unit?.trim() || null,
    memo: input.memo?.trim() || null,
    photoUrl: input.photoUrl || null,
    tags: normalizeTags(input.tags),
  }
}

function cleanAchievement(input) {
  const condition = JSON.parse(JSON.stringify(input.condition))
  // meta_count / meta_clear follow the achievement's own category.
  if (condition.type === 'meta_count' || condition.type === 'meta_clear') delete condition.categoryId
  if (condition.type === 'tag_set_complete') condition.tags = normalizeTags(condition.tags)
  return {
    id: input.id || generateId('ach'),
    title: input.title.trim(),
    description: (input.description || '').trim(),
    categoryId: input.categoryId ?? null,
    tier: getTier(input.tier).id,
    condition,
    isHidden: !!input.isHidden,
    ...(condition.type === 'manual' ? { manualEarnedAt: input.manualEarnedAt ?? null } : {}),
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const toast = useToast()
  const [boot] = useState(loadAppState)
  const [state, dispatch] = useReducer(reducer, boot.state)
  const [storageError, setStorageError] = useState(null)
  const [storageNotice, setStorageNotice] = useState(boot.notice)

  const stateRef = useRef(state)
  stateRef.current = state
  const lastSavedRef = useRef(null)
  // Set before changes that shouldn't celebrate or mourn achievements
  // (undo, importing a backup, syncing from another tab).
  const quietRef = useRef(false)

  // Persist every change.
  useEffect(() => {
    const serialized = serializeState(state)
    if (serialized === lastSavedRef.current) return
    try {
      writeSerializedState(serialized)
      lastSavedRef.current = serialized
      setStorageError(null)
    } catch (error) {
      console.error('Saving to localStorage failed:', error)
      setStorageError(isQuotaError(error)
        ? '브라우저 저장 공간이 가득 차서 마지막 변경을 저장하지 못했어요. 사진이 큰 기록을 정리하거나 백업 후 정리해 주세요.'
        : '브라우저에 데이터를 저장하지 못했어요. 이 탭을 닫기 전에 설정에서 백업해 두세요.')
    }
  }, [state])

  // Keep several open tabs in sync instead of letting them overwrite each other.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue || e.newValue === lastSavedRef.current) return
      try {
        const next = stateFromPayload(JSON.parse(e.newValue))
        lastSavedRef.current = e.newValue
        quietRef.current = true
        dispatch({ type: 'REPLACE', state: next })
      } catch (error) {
        console.warn('Ignoring unreadable state from another tab.', error)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Derived achievement state.
  const evaluation = useMemo(
    () => evaluateAchievements(state.achievements, state.records, state.categories),
    [state.achievements, state.records, state.categories],
  )
  const achievements = useMemo(() => state.achievements.map(a => {
    const r = evaluation.get(a.id)
    return {
      ...a,
      isEarned: r.earned,
      earnedAt: r.earnedAt,
      progress: r.progress,
      target: r.target,
      completedTags: r.completedTags,
      completedDates: r.completedDates,
      error: r.error ?? null,
    }
  }), [state.achievements, evaluation])

  // Celebrate newly earned achievements; say so when one is lost again.
  const earnedRef = useRef(null)
  useEffect(() => {
    const earnedNow = new Set(achievements.filter(a => a.isEarned).map(a => a.id))
    const before = earnedRef.current
    earnedRef.current = earnedNow
    if (!before) return
    if (quietRef.current) {
      quietRef.current = false
      return
    }
    // Cause before effect: record-based unlocks first, then the ones they completed.
    const gained = achievements
      .filter(a => a.isEarned && !before.has(a.id))
      .sort((a, b) => Number(isMetaCondition(a.condition)) - Number(isMetaCondition(b.condition))
        || getTier(b.tier).rank - getTier(a.tier).rank)
    const lost = achievements.filter(a => !a.isEarned && before.has(a.id))
    if (gained.length > 0) toast.achievements(gained)
    if (lost.length === 1) toast.info(`'${lost[0].title}' 업적이 다시 잠겼어요.`)
    else if (lost.length > 1) toast.info(`업적 ${lost.length}개가 다시 잠겼어요.`)
  }, [achievements, toast])

  // ── Records ──
  const addRecord = useCallback((input) => {
    const record = cleanRecord(input)
    dispatch({ type: 'RECORD_ADD', record })
    return record
  }, [])

  const updateRecord = useCallback((input) => {
    dispatch({ type: 'RECORD_UPDATE', record: cleanRecord(input) })
  }, [])

  const deleteRecord = useCallback((id) => {
    const index = stateRef.current.records.findIndex(r => r.id === id)
    if (index < 0) return
    const record = stateRef.current.records[index]
    dispatch({ type: 'RECORD_DELETE', id })
    toast.success('기록을 삭제했어요.', {
      action: {
        label: '되돌리기',
        onClick: () => {
          quietRef.current = true
          dispatch({ type: 'RECORD_RESTORE', record, index })
        },
      },
    })
  }, [toast])

  // ── Achievements ──
  const saveAchievement = useCallback((input) => {
    const achievement = cleanAchievement(input)
    const exists = stateRef.current.achievements.some(a => a.id === achievement.id)
    dispatch({ type: exists ? 'ACHIEVEMENT_UPDATE' : 'ACHIEVEMENT_ADD', achievement })
    return achievement
  }, [])

  const deleteAchievement = useCallback((id) => {
    dispatch({ type: 'ACHIEVEMENT_DELETE', id })
  }, [])

  const setManualEarned = useCallback((id, date) => {
    const current = stateRef.current.achievements.find(a => a.id === id)
    if (!current) return
    dispatch({ type: 'ACHIEVEMENT_UPDATE', achievement: { ...current, manualEarnedAt: date } })
  }, [])

  // ── Categories ──
  const addCategory = useCallback(({ name, parentId = null }) => {
    const category = { id: generateId('cat'), name: name.trim() || '새 카테고리', parentId }
    dispatch({ type: 'CATEGORY_ADD', category })
    return category
  }, [])

  const renameCategory = useCallback((id, name) => {
    if (name.trim()) dispatch({ type: 'CATEGORY_RENAME', id, name: name.trim() })
  }, [])

  const moveCategory = useCallback((id, parentId) => {
    const { categories } = stateRef.current
    if (parentId && (parentId === id || getDescendantIds(id, categories).includes(parentId))) return
    dispatch({ type: 'CATEGORY_MOVE', id, parentId: parentId ?? null })
  }, [])

  const deleteCategory = useCallback((id) => {
    dispatch({ type: 'CATEGORY_DELETE', id })
  }, [])

  // ── Preferences ──
  const setPrefs = useCallback((patch) => dispatch({ type: 'PREFS_PATCH', patch }), [])

  const toggleFavorite = useCallback((categoryId) => {
    const { favorites } = stateRef.current.prefs
    setPrefs({ favorites: favorites.includes(categoryId) ? favorites.filter(id => id !== categoryId) : [...favorites, categoryId] })
  }, [setPrefs])

  const setPinned = useCallback((slot, achievementId) => {
    const pinned = stateRef.current.prefs.pinned.map(id => (id === achievementId ? null : id))
    pinned[slot] = achievementId
    setPrefs({ pinned })
  }, [setPrefs])

  /** Pin to the first free slot. Returns false when all slots are taken. */
  const pinAchievement = useCallback((achievementId) => {
    const { pinned } = stateRef.current.prefs
    if (pinned.includes(achievementId)) return true
    const slot = pinned.indexOf(null)
    if (slot < 0) return false
    setPinned(slot, achievementId)
    return true
  }, [setPinned])

  const unpinAchievement = useCallback((achievementId) => {
    setPrefs({ pinned: stateRef.current.prefs.pinned.map(id => (id === achievementId ? null : id)) })
  }, [setPrefs])

  const setCategoryDefaults = useCallback((categoryId, patch) => {
    const all = stateRef.current.prefs.categoryDefaults
    const current = all[categoryId] ?? { defaultUnit: '', defaultTags: [], autoApply: true }
    setPrefs({ categoryDefaults: { ...all, [categoryId]: { ...current, ...patch } } })
  }, [setPrefs])

  // ── Data management ──
  const exportBackup = useCallback(() => toBackup(stateRef.current), [])

  /** Throws with a user-facing message when the file can't be used. */
  const importBackup = useCallback((payload) => {
    const next = stateFromPayload(payload)
    quietRef.current = true
    dispatch({ type: 'REPLACE', state: next })
    setStorageNotice(null)
    return next
  }, [])

  const resetAll = useCallback(() => {
    quietRef.current = true
    dispatch({ type: 'REPLACE', state: createDefaultState() })
    setStorageNotice(null)
  }, [])

  const value = useMemo(() => ({
    categories: state.categories,
    records: state.records,
    achievements,
    prefs: state.prefs,
    storageError,
    storageNotice,
    dismissStorageNotice: () => setStorageNotice(null),
    pinSlots: PIN_SLOTS,
    addRecord, updateRecord, deleteRecord,
    saveAchievement, deleteAchievement, setManualEarned,
    addCategory, renameCategory, moveCategory, deleteCategory,
    setPrefs, toggleFavorite, setPinned, pinAchievement, unpinAchievement, setCategoryDefaults,
    exportBackup, importBackup, resetAll,
  }), [
    state.categories, state.records, state.prefs, achievements, storageError, storageNotice,
    addRecord, updateRecord, deleteRecord, saveAchievement, deleteAchievement, setManualEarned,
    addCategory, renameCategory, moveCategory, deleteCategory,
    setPrefs, toggleFavorite, setPinned, pinAchievement, unpinAchievement, setCategoryDefaults,
    exportBackup, importBackup, resetAll,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within an AppProvider')
  return ctx
}
