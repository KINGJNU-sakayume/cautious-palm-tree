import React, { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { XIcon } from './Icons.jsx'

// Open modals, topmost last — Escape and focus trapping only apply to the top one.
const openStack = []
let savedBodyOverflow = ''

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }

/**
 * Dialog that becomes a bottom sheet on phones.
 * variant="drawer" slides in from the right on larger screens instead.
 */
export default function Modal({
  open = true,
  onClose,
  title,
  headerExtra = null,
  children,
  footer = null,
  variant = 'dialog',
  size = 'md',
  bodyClassName = 'px-5 py-4',
}) {
  const id = useId()
  const titleId = `${id}-title`
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    const panel = panelRef.current
    const previouslyFocused = document.activeElement

    const appRoot = document.getElementById('root')
    if (openStack.length === 0) {
      savedBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      // Keep keyboard focus and screen readers inside the dialog.
      if (appRoot) appRoot.inert = true
    }
    openStack.push(id)

    const initial = panel.querySelector('[data-autofocus]') || panel
    initial.focus({ preventScroll: true })

    const onKeyDown = (e) => {
      if (openStack[openStack.length - 1] !== id) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current?.()
      } else if (e.key === 'Tab') {
        const items = [...panel.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null)
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      openStack.splice(openStack.indexOf(id), 1)
      if (openStack.length === 0) {
        document.body.style.overflow = savedBodyOverflow
        if (appRoot) appRoot.inert = false
      }
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus({ preventScroll: true })
    }
  }, [open, id])

  if (!open) return null

  const isDrawer = variant === 'drawer'

  return createPortal(
    <div
      className={[
        'fixed inset-0 z-50 flex',
        isDrawer ? 'items-stretch justify-end' : 'items-end sm:items-center justify-center sm:p-6',
      ].join(' ')}
    >
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => onCloseRef.current?.()} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={[
          'relative flex flex-col bg-surface shadow-pop outline-none w-full',
          isDrawer
            ? 'h-full sm:w-[480px] sm:rounded-l-2xl animate-drawer-in'
            : `max-h-[92dvh] rounded-t-2xl sm:rounded-2xl animate-sheet-in ${SIZES[size] || SIZES.md}`,
        ].join(' ')}
      >
        {title != null && (
          <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-line">
            <h2 id={titleId} className="flex-1 min-w-0 text-lg font-semibold text-ink truncate">{title}</h2>
            {headerExtra}
            <button type="button" onClick={() => onCloseRef.current?.()} className="icon-btn -mr-2" aria-label="닫기">
              <XIcon size={20} />
            </button>
          </div>
        )}
        <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin ${bodyClassName} ${footer ? '' : 'pb-safe'}`}>
          {children}
        </div>
        {footer && <div className="border-t border-line px-5 py-3 pb-safe">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
