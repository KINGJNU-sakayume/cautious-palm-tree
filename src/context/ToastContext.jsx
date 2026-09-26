import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { generateId } from '@/utils/formatters.js'
import { TOAST_DISMISS_ANIM_MS, TOAST_STAGGER_MS } from '@/constants/timing.js'

const ToastStateContext = createContext(null)
const ToastApiContext = createContext(null)

const DURATION_MS = { achievement: 6000, success: 3500, info: 5000, error: 7000 }
const WITH_ACTION_MS = 7000
const MAX_VISIBLE = 4

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts(list => list.map(t => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), TOAST_DISMISS_ANIM_MS)
  }, [])

  const push = useCallback((toast) => {
    const id = generateId('toast')
    setToasts(list => [...list.slice(-(MAX_VISIBLE - 1)), { ...toast, id, leaving: false }])
    const duration = toast.duration ?? (toast.action ? WITH_ACTION_MS : DURATION_MS[toast.kind])
    timers.current.set(id, setTimeout(() => dismiss(id), duration))
    return id
  }, [dismiss])

  const api = useMemo(() => ({
    success: (message, options) => push({ kind: 'success', message, ...options }),
    info: (message, options) => push({ kind: 'info', message, ...options }),
    error: (message, options) => push({ kind: 'error', message, ...options }),
    /** Celebrate newly earned achievements, one after another. */
    achievements: (list) => list.forEach((achievement, i) => {
      setTimeout(() => push({ kind: 'achievement', achievement }), i * TOAST_STAGGER_MS)
    }),
    dismiss,
  }), [push, dismiss])

  return (
    <ToastApiContext.Provider value={api}>
      <ToastStateContext.Provider value={toasts}>{children}</ToastStateContext.Provider>
    </ToastApiContext.Provider>
  )
}

/** toast.success('저장했어요'), toast.error(…), toast.achievements([...]) */
export function useToast() {
  const api = useContext(ToastApiContext)
  if (!api) throw new Error('useToast must be used within a ToastProvider')
  return api
}

export function useToastList() {
  const toasts = useContext(ToastStateContext)
  if (!toasts) throw new Error('useToastList must be used within a ToastProvider')
  return toasts
}
