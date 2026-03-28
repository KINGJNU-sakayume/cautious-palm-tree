import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react'
import { categories as initialCategories } from '@/data/categories.js'
import { achievements as initialAchievements } from '@/data/achievements.js'
import { records as initialRecords } from '@/data/records.js'
import { evaluateAchievements, evaluateMetaAchievements, computeProgress } from '@/utils/achievementEvaluator.js'
import { getDescendantIds } from '@/utils/categoryTree.js'
import { generateId, todayStr } from '@/utils/formatters.js'
import { useToast } from './ToastContext.jsx'
import {
  fetchAllCategories,
  fetchAllRecords,
  fetchAllAchievements,
  upsertCategory,
  deleteCategory as dbDeleteCategory,
  upsertRecord,
  upsertAchievement,
  deleteAchievement as dbDeleteAchievement,
  bulkUpsertCategories,
  bulkUpsertRecords,
  bulkUpsertAchievements,
} from '@/lib/db.js'
import { seedIfEmpty, topoSortCategories } from '@/lib/seed.js'

const AppContext = createContext(null)

const emptyState = {
  categories: [],
  records: [],
  achievements: [],
}

function appReducer(state, action) {
  switch (action.type) {
    // ── Records ──────────────────────────────────────────────────────────
    case 'ADD_RECORD':
      return { ...state, records: [...state.records, action.record] }

    case 'UPDATE_RECORD_UNLOCKS':
      return {
        ...state,
        records: state.records.map(r =>
          r.id === action.recordId
            ? { ...r, unlockedAchievementIds: [...(r.unlockedAchievementIds || []), ...action.achievementIds] }
            : r
        ),
      }

    // ── Achievements ──────────────────────────────────────────────────────
    case 'UNLOCK_ACHIEVEMENT':
      return {
        ...state,
        achievements: state.achievements.map(a =>
          a.id === action.id
            ? { ...a, isEarned: true, earnedAt: action.earnedAt || todayStr(), progress: a.condition?.target ?? a.progress }
            : a
        ),
      }

    case 'ADD_ACHIEVEMENT':
      return { ...state, achievements: [...state.achievements, action.achievement] }

    case 'UPDATE_ACHIEVEMENT':
      return {
        ...state,
        achievements: state.achievements.map(a =>
          a.id === action.achievement.id ? { ...a, ...action.achievement } : a
        ),
      }

    case 'DELETE_ACHIEVEMENT':
      return {
        ...state,
        achievements: state.achievements.filter(a => a.id !== action.id),
      }

    case 'UPDATE_ACHIEVEMENTS_PROGRESS':
      return {
        ...state,
        achievements: state.achievements.map(a => {
          const update = action.updates.find(u => u.id === a.id)
          return update ? { ...a, progress: update.progress } : a
        }),
      }

    case 'SOFT_DELETE_ACHIEVEMENTS_FOR_CATEGORY':
      return {
        ...state,
        achievements: state.achievements.map(a =>
          action.categoryIds.includes(a.categoryId) ? { ...a, _softDeleted: true } : a
        ),
      }

    // ── Categories ────────────────────────────────────────────────────────
    /**
     * MANAGE_CATEGORY — single action for all non-destructive category operations.
     *
     *   op: 'add'      — add a new category leaf
     *       payload: { category: { id, name, parentId } }
     *
     *   op: 'rename'   — change a category's display name
     *       payload: { id, name }
     *
     *   op: 'reparent' — move a category to a new parent (or root)
     *       payload: { id, parentId }   (parentId === null → root)
     */
    case 'MANAGE_CATEGORY': {
      const { op } = action
      if (op === 'add') {
        return { ...state, categories: [...state.categories, action.category] }
      }
      if (op === 'rename') {
        return {
          ...state,
          categories: state.categories.map(c =>
            c.id === action.id ? { ...c, name: action.name } : c
          ),
        }
      }
      if (op === 'reparent') {
        return {
          ...state,
          categories: state.categories.map(c =>
            c.id === action.id ? { ...c, parentId: action.parentId } : c
          ),
        }
      }
      return state
    }

    case 'DELETE_CATEGORY': {
      const allDeletedIds = [action.id, ...getDescendantIds(action.id, state.categories)]
      return {
        ...state,
        categories: state.categories.filter(c => !allDeletedIds.includes(c.id)),
        records: state.records.map(r =>
          allDeletedIds.includes(r.categoryId) ? { ...r, categoryId: null } : r
        ),
        achievements: state.achievements.map(a =>
          allDeletedIds.includes(a.categoryId) ? { ...a, _softDeleted: true } : a
        ),
      }
    }

    case 'IMPORT_DATA':
      return {
        categories: action.data.categories,
        records: action.data.records,
        achievements: action.data.achievements,
      }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, emptyState)
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(null)

  // ── Bootstrap: load from Supabase on mount ───────────────────────────
  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      try {
        const [cats, recs, achs] = await Promise.all([
          fetchAllCategories(),
          fetchAllRecords(),
          fetchAllAchievements(),
        ])

        if (cats.length === 0 || recs.length === 0 || achs.length === 0) {
          await seedIfEmpty({
            categoriesCount: cats.length,
            recordsCount: recs.length,
            achievementsCount: achs.length,
          })
          const [cats2, recs2, achs2] = await Promise.all([
            fetchAllCategories(),
            fetchAllRecords(),
            fetchAllAchievements(),
          ])
          if (!cancelled) {
            dispatch({ type: 'IMPORT_DATA', data: { categories: cats2, records: recs2, achievements: achs2 } })
          }
        } else {
          if (!cancelled) {
            dispatch({ type: 'IMPORT_DATA', data: { categories: cats, records: recs, achievements: achs } })
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Supabase bootstrap error:', err)
          setDbError(err.message)
          // Fallback to static data so the app remains usable offline
          dispatch({
            type: 'IMPORT_DATA',
            data: { categories: initialCategories, records: initialRecords, achievements: initialAchievements },
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    bootstrap()
    return () => { cancelled = true }
  }, [])

  // ── Category actions ────────────────────────────────────────────────
  const addCategory = useCallback(async (categoryData) => {
    const category = {
      id: generateId('cat'),
      name: categoryData.name,
      parentId: categoryData.parentId || null,
    }
    dispatch({ type: 'MANAGE_CATEGORY', op: 'add', category })
    try { await upsertCategory(category) }
    catch (err) { console.error('addCategory DB error:', err) }
    return category
  }, [])

  const renameCategory = useCallback(async (id, name) => {
    dispatch({ type: 'MANAGE_CATEGORY', op: 'rename', id, name })
    const cat = state.categories.find(c => c.id === id)
    try { await upsertCategory({ id, name, parentId: cat?.parentId ?? null }) }
    catch (err) { console.error('renameCategory DB error:', err) }
  }, [state.categories])

  /**
   * Move a category to a new parent.
   * Pass newParentId = null to promote the node to root level.
   * Circular-reference guard: callers (CategoryTree) are responsible for
   * not passing a descendant as the new parent.
   */
  const reparentCategory = useCallback(async (id, newParentId) => {
    dispatch({ type: 'MANAGE_CATEGORY', op: 'reparent', id, parentId: newParentId ?? null })
    const cat = state.categories.find(c => c.id === id)
    try { await upsertCategory({ ...cat, parentId: newParentId ?? null }) }
    catch (err) { console.error('reparentCategory DB error:', err) }
  }, [state.categories])

  const deleteCategory = useCallback(async (id) => {
    dispatch({ type: 'DELETE_CATEGORY', id })
    try { await dbDeleteCategory(id) }
    catch (err) { console.error('deleteCategory DB error:', err) }
  }, [])

  // ── Achievement actions ─────────────────────────────────────────────
  const addAchievement = useCallback(async (achievementData) => {
    const achievement = {
      id: generateId('ach'),
      isEarned: false,
      earnedAt: null,
      progress: 0,
      ...achievementData,
    }
    dispatch({ type: 'ADD_ACHIEVEMENT', achievement })
    try { await upsertAchievement(achievement) }
    catch (err) { console.error('addAchievement DB error:', err) }
    return achievement
  }, [])

  const updateAchievement = useCallback(async (achievement) => {
    dispatch({ type: 'UPDATE_ACHIEVEMENT', achievement })
    try { await upsertAchievement(achievement) }
    catch (err) { console.error('updateAchievement DB error:', err) }
  }, [])

  const deleteAchievement = useCallback(async (id) => {
    dispatch({ type: 'DELETE_ACHIEVEMENT', id })
    try { await dbDeleteAchievement(id) }
    catch (err) { console.error('deleteAchievement DB error:', err) }
  }, [])

  // ── Record save flow ────────────────────────────────────────────────
  const saveRecord = useCallback(async (recordData, onUnlocked) => {
    const newRecord = {
      id: generateId('rec'),
      categoryId: recordData.categoryId,
      date: recordData.date || todayStr(),
      value: recordData.value != null ? Number(recordData.value) : null,
      unit: recordData.unit || null,
      memo: recordData.memo || null,
      photoUrl: recordData.photoUrl || null,
      tags: Array.isArray(recordData.tags) ? recordData.tags : [],
      unlockedAchievementIds: [],
    }

    const nextRecords = [...state.records, newRecord]
    dispatch({ type: 'ADD_RECORD', record: newRecord })

    const unlockedIds = evaluateAchievements(newRecord, nextRecords, state.achievements)

    let nextAchievements = state.achievements.map(a =>
      unlockedIds.includes(a.id) ? { ...a, isEarned: true, earnedAt: todayStr() } : a
    )
    unlockedIds.forEach(id => {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', id, earnedAt: todayStr() })
    })

    const metaUnlockedIds = evaluateMetaAchievements(nextAchievements)
    nextAchievements = nextAchievements.map(a =>
      metaUnlockedIds.includes(a.id) ? { ...a, isEarned: true, earnedAt: todayStr() } : a
    )
    metaUnlockedIds.forEach(id => {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', id, earnedAt: todayStr() })
    })

    // Update partial progress for non-earned achievements in this category
    const progressUpdates = state.achievements
      .filter(a => a.categoryId === newRecord.categoryId && !a.isEarned && a.type !== 'meta' && !unlockedIds.includes(a.id))
      .map(a => ({ id: a.id, progress: computeProgress(a, nextRecords) }))
    if (progressUpdates.length > 0) {
      dispatch({ type: 'UPDATE_ACHIEVEMENTS_PROGRESS', updates: progressUpdates })
    }

    const allUnlockedIds = [...unlockedIds, ...metaUnlockedIds]
    const finalRecord = { ...newRecord, unlockedAchievementIds: allUnlockedIds }
    if (allUnlockedIds.length > 0) {
      dispatch({ type: 'UPDATE_RECORD_UNLOCKS', recordId: newRecord.id, achievementIds: allUnlockedIds })
    }

    if (onUnlocked && allUnlockedIds.length > 0) {
      const unlockedAchievements = allUnlockedIds
        .map(id => nextAchievements.find(a => a.id === id))
        .filter(Boolean)
      onUnlocked(unlockedAchievements)
    }

    // Persist to Supabase
    try {
      await upsertRecord(finalRecord)

      const achievementsToUpsert = [
        ...allUnlockedIds.map(id => nextAchievements.find(a => a.id === id)).filter(Boolean),
        ...progressUpdates
          .map(u => {
            const a = state.achievements.find(a => a.id === u.id)
            return a ? { ...a, progress: u.progress } : null
          })
          .filter(Boolean),
      ]
      if (achievementsToUpsert.length > 0) {
        await bulkUpsertAchievements(achievementsToUpsert)
      }
    } catch (err) {
      console.error('saveRecord DB error:', err)
    }

    return newRecord
  }, [state.records, state.achievements])

  // ── Data Import / Export ───────────────────────────────────────────
  const exportData = useCallback(() => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: state.categories,
      records: state.records,
      achievements: state.achievements,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `achievement-library-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [state])

  const importData = useCallback(async (jsonData) => {
    if (
      !Array.isArray(jsonData.categories) ||
      !Array.isArray(jsonData.records) ||
      !Array.isArray(jsonData.achievements)
    ) {
      throw new Error('유효하지 않은 데이터 형식입니다')
    }
    dispatch({ type: 'IMPORT_DATA', data: jsonData })
    try {
      await bulkUpsertCategories(topoSortCategories(jsonData.categories))
      await bulkUpsertRecords(jsonData.records)
      await bulkUpsertAchievements(jsonData.achievements)
    } catch (err) {
      console.error('importData DB error:', err)
    }
  }, [])

  const value = {
    categories: state.categories,
    records: state.records,
    achievements: state.achievements.filter(a => !a._softDeleted),
    allAchievements: state.achievements,
    loading,
    dbError,
    // Category actions
    addCategory,
    renameCategory,
    reparentCategory,
    deleteCategory,
    // Achievement actions
    addAchievement,
    updateAchievement,
    deleteAchievement,
    // Record action
    saveRecord,
    // Raw dispatch for advanced use
    dispatch,
    // Data portability
    exportData,
    importData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within an AppProvider')
  return ctx
}
