import { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

export default function ConfirmDialog({ open, title, body, confirmLabel = '삭제', onConfirm, onCancel }) {
  const confirmBtnRef = useRef(null)
  const cancelBtnRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  // Focus the cancel button when dialog opens
  useEffect(() => {
    if (open && cancelBtnRef.current) {
      cancelBtnRef.current.focus()
    }
  }, [open])

  // Trap focus inside dialog
  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return
    const focusable = [cancelBtnRef.current, confirmBtnRef.current].filter(Boolean)
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus() }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }

  if (!open) return null

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4">
        <h2 id="confirm-dialog-title" className="text-base font-medium text-slate-900">
          {title}
        </h2>
        {body && (
          <p className="text-sm text-slate-600 whitespace-pre-line">{body}</p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
