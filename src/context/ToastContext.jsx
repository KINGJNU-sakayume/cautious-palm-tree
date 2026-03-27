import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react'
import { generateId } from '@/utils/formatters.js'

const ToastContext = createContext(null)

function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, { id: action.id, achievement: action.achievement, isLeaving: false }]
    case 'ADD_TOASTS':
      return [
        ...state,
        ...action.achievements.map(a => ({ id: generateId('toast'), achievement: a, isLeaving: false })),
      ]
    case 'START_DISMISS':
      return state.map(t => t.id === action.id ? { ...t, isLeaving: true } : t)
    case 'REMOVE_TOAST':
      return state.filter(t => t.id !== action.id)
    default:
      return state
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, [])
  // Keep a ref to auto-dismiss timers so we can cancel on manual dismiss
  const timers = useRef(new Map())

  const dismissToast = useCallback((id) => {
    // Cancel any pending timers
    if (timers.current.has(id)) {
      clearTimeout(timers.current.get(id))
      timers.current.delete(id)
    }
    dispatch({ type: 'START_DISMISS', id })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 300)
  }, [])

  const addToast = useCallback((achievement) => {
    const id = generateId('toast')
    dispatch({ type: 'ADD_TOAST', id, achievement })
    const timer = setTimeout(() => dismissToast(id), 4500)
    timers.current.set(id, timer)
  }, [dismissToast])

  const addToasts = useCallback((achievements) => {
    achievements.forEach((achievement, i) => {
      setTimeout(() => addToast(achievement), i * 300)
    })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, addToasts, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
