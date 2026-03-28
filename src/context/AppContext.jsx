import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { categories as initialCategories } from '@/data/categories.js'
import { achievements as initialAchievements } from '@/data/achievements.js'
import { records as initialRecords } from '@/data/records.js'
import { evaluateAchievements, evaluateMetaAchievements, computeProgress } from '@/utils/achievementEvaluator.js'
import { getDescendantIds } from '@/utils/categoryTree.js'
import { generateId, todayStr } from '@/utils/formatters.js'
import { useToast } from './ToastContext.jsx'

const AppContext = createContext(null)

const initialState = {
  categories: initialCategories,
  records: initialRecords,
  achievements: initialAchievements,
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

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // ── Category actions ────────────────────────────────────────────────
  const addCategory = useCallback((categoryData) => {
    const category = {
      id: generateId('cat'),
      name: categoryData.name,
      parentId: categoryData.parentId || null,
    }
    dispatch({ type: 'MANAGE_CATEGORY', op: 'add', category })
    return category
  }, [])

  const renameCategory = useCallback((id, name) => {
    dispatch({ type: 'MANAGE_CATEGORY', op: 'rename', id, name })
  }, [])

  /**
   * Move a category to a new parent.
   * Pass newParentId = null to promote the node to root level.
   * Circular-reference guard: callers (CategoryTree) are responsible for
   * not passing a descendant as the new parent.
   */
  const reparentCategory = useCallback((id, newParentId) => {
    dispatch({ type: 'MANAGE_CATEGORY', op: 'reparent', id, parentId: newParentId ?? null })
  }, [])

  const deleteCategory = useCallback((id) => {
    dispatch({ type: 'DELETE_CATEGORY', id })
  }, [])

  // ── Achievement actions ─────────────────────────────────────────────
  const addAchievement = useCallback((achievementData) => {
    const achievement = {
      id: generateId('ach'),
      isEarned: false,
      earnedAt: null,
      progress: 0,
      ...achievementData,
    }
    dispatch({ type: 'ADD_ACHIEVEMENT', achievement })
    return achievement
  }, [])

  const updateAchievement = useCallback((achievement) => {
    dispatch({ type: 'UPDATE_ACHIEVEMENT', achievement })
  }, [])

  const deleteAchievement = useCallback((id) => {
    dispatch({ type: 'DELETE_ACHIEVEMENT', id })
  }, [])

  // ── Record save flow ────────────────────────────────────────────────
  const saveRecord = useCallback((recordData, onUnlocked) => {
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
    if (allUnlockedIds.length > 0) {
      dispatch({ type: 'UPDATE_RECORD_UNLOCKS', recordId: newRecord.id, achievementIds: allUnlockedIds })
    }

    if (onUnlocked && allUnlockedIds.length > 0) {
      const unlockedAchievements = allUnlockedIds
        .map(id => nextAchievements.find(a => a.id === id))
        .filter(Boolean)
      onUnlocked(unlockedAchievements)
    }

    return newRecord
  }, [state.records, state.achievements])

  const value = {
    categories: state.categories,
    records: state.records,
    achievements: state.achievements.filter(a => !a._softDeleted),
    allAchievements: state.achievements,
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
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within an AppProvider')
  return ctx
}
