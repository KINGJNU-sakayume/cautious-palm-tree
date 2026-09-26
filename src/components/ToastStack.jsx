import React from 'react'
import { createPortal } from 'react-dom'
import Medal, { TierLabel } from './Medal.jsx'
import { useToast, useToastList } from '@/context/ToastContext.jsx'
import { useUI } from '@/context/UIContext.jsx'
import { AlertIcon, CheckIcon, InfoIcon, XIcon } from './Icons.jsx'

const KIND_ICON = {
  success: <CheckIcon size={18} strokeWidth={2.2} className="text-accent" />,
  info: <InfoIcon size={18} className="text-ink-2" />,
  error: <AlertIcon size={18} className="text-danger" />,
}

function AchievementToast({ toast, onDismiss }) {
  const { openAchievement } = useUI()
  const a = toast.achievement
  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => { openAchievement(a.id); onDismiss() }}
        className="w-full flex items-center gap-3 pl-3.5 pr-10 py-3 text-left"
      >
        <Medal tier={a.tier} earned size={44} />
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-xs font-semibold text-accent-ink">업적 달성</span>
            <TierLabel tier={a.tier} />
          </span>
          <span className="block text-base font-semibold text-ink truncate">{a.title}</span>
          {a.description && <span className="block text-sm text-ink-2 truncate">{a.description}</span>}
        </span>
      </button>
      <button type="button" onClick={onDismiss} className="icon-btn w-8 h-8 absolute top-2 right-2" aria-label="알림 닫기">
        <XIcon size={16} />
      </button>
    </div>
  )
}

function MessageToast({ toast, onDismiss }) {
  return (
    <div className="flex items-center gap-3 pl-4 pr-2 py-2.5 min-h-[52px]" role={toast.kind === 'error' ? 'alert' : 'status'}>
      <span className="flex-shrink-0">{KIND_ICON[toast.kind]}</span>
      <p className="flex-1 min-w-0 text-base text-ink">{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          onClick={() => { toast.action.onClick(); onDismiss() }}
          className="btn btn-sm btn-ghost text-accent-ink hover:text-accent-ink font-semibold"
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" onClick={onDismiss} className="icon-btn w-8 h-8 flex-shrink-0" aria-label="알림 닫기">
        <XIcon size={16} />
      </button>
    </div>
  )
}

export default function ToastStack() {
  const toasts = useToastList()
  const { dismiss } = useToast()

  // Portalled so toasts stay usable while a dialog makes the app inert.
  // Phones: above the tab bar and the floating record button.
  // Larger screens: bottom-left, clear of the side sheet's save button.
  return createPortal(
    <div
      className="fixed z-[60] inset-x-0 bottom-[calc(var(--tabbar-h)+84px+env(safe-area-inset-bottom))] md:bottom-6 md:right-auto md:left-6 flex flex-col items-center md:items-start gap-2 px-4 md:px-0 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={[
            'pointer-events-auto w-full max-w-sm card shadow-pop overflow-hidden',
            toast.leaving ? 'animate-toast-out' : 'animate-toast-in',
          ].join(' ')}
        >
          {toast.kind === 'achievement'
            ? <AchievementToast toast={toast} onDismiss={() => dismiss(toast.id)} />
            : <MessageToast toast={toast} onDismiss={() => dismiss(toast.id)} />}
        </div>
      ))}
    </div>,
    document.body,
  )
}
