import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react'
import { categories as initialCategories } from '@/data/categories.js'
import { achievements as initialAchievements } from '@/data/achievements.js'
import { records as initialRecords } from '@/data/records.js'
import { evaluateAchievements, evaluateMetaAchievements, computeProgressFull } from '@/utils/achievementEvaluator.js'
import { getDescendantIds } from '@/utils/categoryTree.js'
import { generateId, todayStr } from '@/utils/formatters.js'
import { loadAppState, saveAppState } from '@/lib/localStore.js'

const AppContext = createContext(null)

const repositoryDefaults = {
  categories: initialCategories,
  records: initialRecords,
  achievements: initialAchievements,
}

function completionProgress(achievement) {
  const condition = achievement.condition
  if (!condition) return Math.max(achievement.progress || 0, 1)
  if (condition.type === 'composite') return 100
  if (condition.type === 'tag_set_complete') return condition.tags?.length || 1
  if (condition.type === 'meta_list') return condition.achievementIds?.length || 1
  return condition.target ?? Math.max(achievement.progress || 0, 1)
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
        records: state.records.map(r => r.id === action.recordId
          ? { ...r, unlockedAchievementIds: [...(r.unlockedAchievementIds || []), ...action.achievementIds] }
          : r),
      }
    case 'UNLOCK_ACHIEVEMENT':
      return {
        ...state,
        achievements: state.achievements.map(a => a.id === action.id
          ? { ...a, isEarned: true, earnedAt: action.earnedAt || todayStr(), progress: completionProgress(a) }
          : a),
      }
    case 'ADD_ACHIEVEMENT':
      return { ...state, achievements: [...state.achievements, action.achievement] }
    case 'UPDATE_ACHIEVEMENT':
      return { ...state, achievements: state.achievements.map(a => a.id === action.achievement.id ? { ...a, ...action.achievement } : a) }
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
      if (action.op === 'rename') return { ...state, categories: state.categories.map(c => c.id === action.id ? { ...c, name: action.name } : c) }
      if (action.op === 'reparent') return { ...state, categories: state.categories.map(c => c.id === action.id ? { ...c, parentId: action.parentId } : c) }
      return state
    }
    case 'DELETE_CATEGORY': {
      const allDeletedIds = [action.id, ...getDescendantIds(action.id, state.categories)]
      return {
        ...state,
        categories: state.categories.filter(c => !allDeletedIds.includes(c.id)),
        records: state.records.map(r => allDeletedIds.includes(r.categoryId) ? { ...r, categoryId: null } : r),
        achievements: state.achievements.map(a => allDeletedIds.includes(a.categoryId) ? { ...a, _softDeleted: true } : a),
      }
    }
    case 'IMPORT_DATA':
      return { categories: action.data.categories, records: action.data.records, achievements: action.data.achievements }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, repositoryDefaults, () => loadAppState(repositoryDefaults))
  const [storageError, setStorageError] = useState(null)

  useEffect(() => {
    try {
      saveAppState(state)
      setStorageError(null)
    } catch (error) {
      console.error('Local storage persistence error:', error)
      setStorageError(error.message || '브라우저 저장소에 데이터를 저장하지 못했습니다.')
    }
  }, [state])

  const addCategory = useCallback(async (categoryData) => {
    const category = { id: generateId('cat'), name: categoryData.name, parentId: categoryData.parentId || null }
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
    const achievement = { id: generateId('ach'), isEarned: false, earnedAt: null, progress: 0, ...achievementData }
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
    let nextAchievements = state.achievements.map(a => unlockedIds.includes(a.id) ? { ...a, isEarned: true, earnedAt: newRecord.date } : a)
    unlockedIds.forEach(id => dispatch({ type: 'UNLOCK_ACHIEVEMENT', id, earnedAt: newRecord.date }))

    const metaUnlockedIds = evaluateMetaAchievements(nextAchievements, nextRecords, state.categories)
    nextAchievements = nextAchievements.map(a => metaUnlockedIds.includes(a.id) ? { ...a, isEarned: true, earnedAt: newRecord.date } : a)
    metaUnlockedIds.forEach(id => dispatch({ type: 'UNLOCK_ACHIEVEMENT', id, earnedAt: newRecord.date }))

    const progressUpdates = state.achievements
      .filter(a => (a.categoryId === newRecord.categoryId || !a.categoryId) && !a.isEarned && a.type !== 'meta' && !a._softDeleted && !unlockedIds.includes(a.id))
      .map(a => {
        const { progress, completedTags, completedDates } = computeProgressFull(a, nextRecords)
        return { id: a.id, progress, completedTags, completedDates }
      })
    if (progressUpdates.length > 0) dispatch({ type: 'UPDATE_ACHIEVEMENTS_PROGRESS', updates: progressUpdates })

    const allUnlockedIds = [...unlockedIds, ...metaUnlockedIds]
    const finalRecord = { ...newRecord, unlockedAchievementIds: allUnlockedIds }
    if (allUnlockedIds.length > 0) {
      dispatch({ type: 'UPDATE_RECORD_UNLOCKS', recordId: newRecord.id, achievementIds: allUnlockedIds })
    }

    if (onUnlocked && allUnlockedIds.length > 0) {
      const unlockedAchievements = allUnlockedIds.map(id => nextAchievements.find(a => a.id === id)).filter(Boolean)
      onUnlocked(unlockedAchievements)
    }
    return finalRecord
  }, [state.records, state.achievements, state.categories])

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
    storageError,
    addCategory, renameCategory, reparentCategory, deleteCategory,
    addAchievement, updateAchievement, deleteAchievement,
    saveRecord, updateRecord, deleteRecord,
    dispatch,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within an AppProvider')
  return ctx
}
