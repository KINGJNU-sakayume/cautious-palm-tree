import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { categories as initialCategories } from '@/data/categories.js'
import { achievements as initialAchievements } from '@/data/achievements.js'
import { records as initialRecords } from '@/data/records.js'
import { evaluateAchievements, evaluateMetaAchievements } from '@/utils/achievementEvaluator.js'
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

    case 'SOFT_DELETE_ACHIEVEMENTS_FOR_CATEGORY':
      // Hide achievements for deleted categories
      return {
        ...state,
        achievements: state.achievements.map(a =>
          action.categoryIds.includes(a.categoryId) ? { ...a, _softDeleted: true } : a
        ),
      }

    // ── Categories ────────────────────────────────────────────────────────
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.category] }

    case 'RENAME_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c =>
          c.id === action.id ? { ...c, name: action.name } : c
        ),
      }

    case 'DELETE_CATEGORY': {
      // Recursively delete all descendants
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
  // We need useToast — but ToastProvider is outside AppProvider in main.jsx
  // so we can't call it here. Instead, AppContext exposes a saveRecord function
  // that receives addToasts as a param, OR we use a callback pattern.
  // To keep the architecture clean: saveRecord is exposed as a method on the context value,
  // and we call useToast inside the AppProvider after wrapping works.
  // Since ToastProvider wraps AppProvider's children but not AppProvider itself,
  // we handle this by using a ref-based approach or by calling from components.
  // SOLUTION: AppContext provides a `saveRecord` that accepts an `onUnlocked` callback.
  // The Dashboard calls saveRecord and passes addToasts itself.

  // ── Category actions ────────────────────────────────────────────────
  const addCategory = useCallback((categoryData) => {
    const category = {
      id: generateId('cat'),
      name: categoryData.name,
      parentId: categoryData.parentId || null,
    }
    dispatch({ type: 'ADD_CATEGORY', category })
    return category
  }, [])

  const renameCategory = useCallback((id, name) => {
    dispatch({ type: 'RENAME_CATEGORY', id, name })
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
  /**
   * Save a record and run the full achievement evaluation flow.
   * @param {Object} recordData - partial record (categoryId, date, value, unit, memo, photoUrl)
   * @param {Function} onUnlocked - called with array of newly unlocked Achievement objects
   */
  const saveRecord = useCallback((recordData, onUnlocked) => {
    const newRecord = {
      id: generateId('rec'),
      categoryId: recordData.categoryId,
      date: recordData.date || todayStr(),
      value: recordData.value != null ? Number(recordData.value) : null,
      unit: recordData.unit || null,
      memo: recordData.memo || null,
      photoUrl: recordData.photoUrl || null,
      unlockedAchievementIds: [],
    }

    // Step 1: Build next-state records (before dispatching, to avoid stale reads)
    const nextRecords = [...state.records, newRecord]

    // Step 2: Dispatch ADD_RECORD
    dispatch({ type: 'ADD_RECORD', record: newRecord })

    // Step 3: Evaluate regular achievements
    const unlockedIds = evaluateAchievements(newRecord, nextRecords, state.achievements)

    // Step 4: Unlock each regular achievement + check for meta unlocks
    // We need to build an "imagined" achievements array with the newly unlocked ones marked
    let nextAchievements = state.achievements.map(a =>
      unlockedIds.includes(a.id) ? { ...a, isEarned: true, earnedAt: todayStr() } : a
    )

    unlockedIds.forEach(id => {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', id, earnedAt: todayStr() })
    })

    // Step 5: Evaluate meta achievements using the updated achievements array
    const metaUnlockedIds = evaluateMetaAchievements(nextAchievements)

    nextAchievements = nextAchievements.map(a =>
      metaUnlockedIds.includes(a.id) ? { ...a, isEarned: true, earnedAt: todayStr() } : a
    )

    metaUnlockedIds.forEach(id => {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', id, earnedAt: todayStr() })
    })

    // Step 6: Update the record's unlockedAchievementIds
    const allUnlockedIds = [...unlockedIds, ...metaUnlockedIds]
    if (allUnlockedIds.length > 0) {
      dispatch({ type: 'UPDATE_RECORD_UNLOCKS', recordId: newRecord.id, achievementIds: allUnlockedIds })
    }

    // Step 7: Notify caller with unlocked achievement objects for toasts
    if (onUnlocked && allUnlockedIds.length > 0) {
      const unlockedAchievements = allUnlockedIds.map(id =>
        nextAchievements.find(a => a.id === id)
      ).filter(Boolean)
      onUnlocked(unlockedAchievements)
    }

    return newRecord
  }, [state.records, state.achievements])

  const value = {
    categories: state.categories,
    records: state.records,
    achievements: state.achievements.filter(a => !a._softDeleted),
    allAchievements: state.achievements, // includes soft-deleted, for internal use
    // Category actions
    addCategory,
    renameCategory,
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
