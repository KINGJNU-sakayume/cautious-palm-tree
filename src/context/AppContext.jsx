import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { categories as initialCategories } from '@/data/categories.js'
import { achievements as initialAchievements } from '@/data/achievements.js'
import { records as initialRecords } from '@/data/records.js'
import { evaluateAchievements, evaluateMetaAchievements, computeProgressFull } from '@/utils/achievementEvaluator.js'
import { getDescendantIds } from '@/utils/categoryTree.js'
import { generateId, todayStr } from '@/utils/formatters.js'

const AppContext = createContext(null)

const initialState = {
  categories: initialCategories,
  records: initialRecords,
  achievements: initialAchievements,
}

function appReducer(state, action) {
  switch (action.type) {
    case 'ADD_RECORD':
      return { ...state, records: [...state.records, action.record] }
    case 'UPDATE_RECORD':
      return { ...state, records: state.records.map(r => r.id === action.record.id ? { ...r, ...action.record } : r) }
    case 'DELETE_RECORD':
      return { ...state, records: state.records.filter(r => r.id !== action.id) }
    case 'UPDATE_RECORD_UNLOCKS':
      return {
        ...state,
        records: state.records.map(r =>
          r.id === action.recordId
            ? { ...r, unlockedAchievementIds: [...(r.unlockedAchievementIds || []), ...action.achievementIds] }
            : r
        ),
      }
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
      return { ...state, achievements: state.achievements.filter(a => a.id !== action.id) }
    case 'UPDATE_ACHIEVEMENTS_PROGRESS':
      return {
        ...state,
        achievements: state.achievements.map(a => {
          const update = action.updates.find(u => u.id === a.id)
          if (!update) return a
          return {
            ...a,
            progress: update.progress,
            ...(update.completedTags !== undefined ? { completedTags: update.completedTags } : {}),
            ...(update.completedDates !== undefined ? { completedDates: update.completedDates } : {}),
          }
        }),
      }
    case 'MANAGE_CATEGORY': {
      if (action.op === 'add') return { ...state, categories: [...state.categories, action.category] }
      if (action.op === 'rename') {
        return { ...state, categories: state.categories.map(c => c.id === action.id ? { ...c, name: action.name } : c) }
      }
      if (action.op === 'reparent') {
        return { ...state, categories: state.categories.map(c => c.id === action.id ? { ...c, parentId: action.parentId } : c) }
      }
      return state
    }
    case 'DELETE_CATEGORY': {
      const deletedIds = [action.id, ...getDescendantIds(action.id, state.categories)]
      return {
        ...state,
        categories: state.categories.filter(c => !deletedIds.includes(c.id)),
        records: state.records.map(r => deletedIds.includes(r.categoryId) ? { ...r, categoryId: null } : r),
        achievements: state.achievements.map(a =>
          deletedIds.includes(a.categoryId) ? { ...a, _softDeleted: true } : a
        ),
      }
    }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const addCategory = useCallback(async (categoryData) => {
    const category = {
      id: generateId('cat'),
      name: categoryData.name,
      parentId: categoryData.parentId || null,
    }
    dispatch({ type: 'MANAGE_CATEGORY', op: 'add', category })
    return category
  }, [])

  const renameCategory = useCallback(async (id, name) => {
    dispatch({ type: 'MANAGE_CATEGORY', op: 'rename', id, name })
  }, [])

  const reparentCategory = useCallback(async (id, newParentId) => {
    dispatch({ type: 'MANAGE_CATEGORY', op: 'reparent', id, parentId: newParentId ?? null })
  }, [])

  const deleteCategory = useCallback(async (id) => {
    dispatch({ type: 'DELETE_CATEGORY', id })
  }, [])

  const addAchievement = useCallback(async (achievementData) => {
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

  const updateAchievement = useCallback(async (achievement) => {
    dispatch({ type: 'UPDATE_ACHIEVEMENT', achievement })
  }, [])

  const deleteAchievement = useCallback(async (id) => {
    dispatch({ type: 'DELETE_ACHIEVEMENT', id })
  }, [])

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
      unlockedIds.includes(a.id) ? { ...a, isEarned: true, earnedAt: newRecord.date } : a
    )
    unlockedIds.forEach(id => dispatch({ type: 'UNLOCK_ACHIEVEMENT', id, earnedAt: newRecord.date }))

    const metaUnlockedIds = evaluateMetaAchievements(nextAchievements, nextRecords)
    nextAchievements = nextAchievements.map(a =>
      metaUnlockedIds.includes(a.id) ? { ...a, isEarned: true, earnedAt: newRecord.date } : a
    )
    metaUnlockedIds.forEach(id => dispatch({ type: 'UNLOCK_ACHIEVEMENT', id, earnedAt: newRecord.date }))

    const progressUpdates = state.achievements
      .filter(a => (a.categoryId === newRecord.categoryId || !a.categoryId) && !a.isEarned && a.type !== 'meta' && !unlockedIds.includes(a.id))
      .map(a => ({ id: a.id, ...computeProgressFull(a, nextRecords) }))

    if (progressUpdates.length > 0) {
      dispatch({ type: 'UPDATE_ACHIEVEMENTS_PROGRESS', updates: progressUpdates })
    }

    const allUnlockedIds = [...unlockedIds, ...metaUnlockedIds]
    if (allUnlockedIds.length > 0) {
      dispatch({ type: 'UPDATE_RECORD_UNLOCKS', recordId: newRecord.id, achievementIds: allUnlockedIds })
      onUnlocked?.(allUnlockedIds.map(id => nextAchievements.find(a => a.id === id)).filter(Boolean))
    }

    return { ...newRecord, unlockedAchievementIds: allUnlockedIds }
  }, [state.records, state.achievements])

  const updateRecord = useCallback(async (recordData) => {
    dispatch({ type: 'UPDATE_RECORD', record: recordData })
  }, [])

  const deleteRecord = useCallback(async (id) => {
    dispatch({ type: 'DELETE_RECORD', id })
  }, [])

  const value = {
    categories: state.categories,
    records: state.records,
    achievements: state.achievements.filter(a => !a._softDeleted),
    allAchievements: state.achievements,
    loading: false,
    dbError: null,
    persistenceMode: 'repository-static',
    addCategory,
    renameCategory,
    reparentCategory,
    deleteCategory,
    addAchievement,
    updateAchievement,
    deleteAchievement,
    saveRecord,
    updateRecord,
    deleteRecord,
    dispatch,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within an AppProvider')
  return ctx
}
