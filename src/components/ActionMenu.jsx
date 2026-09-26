import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Small popup menu anchored to a DOMRect (e.g. the "⋯" button that opened it).
 * items: [{ label, icon, onSelect, tone: 'danger' }, { divider: true }, …]
 */
export default function ActionMenu({ anchor, items, onClose, label = '메뉴' }) {
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const [position, setPosition] = useState({ top: anchor.bottom + 4, left: anchor.left, visibility: 'hidden' })

  useLayoutEffect(() => {
    const el = ref.current
    const width = el.offsetWidth
    const height = el.offsetHeight
    const left = Math.max(8, Math.min(anchor.right - width, window.innerWidth - width - 8))
    let top = anchor.bottom + 4
    if (top + height > window.innerHeight - 8) top = Math.max(8, anchor.top - height - 4)
    setPosition({ top, left, visibility: 'visible' })
  }, [anchor])

  useEffect(() => {
    const el = ref.current
    const buttons = () => [...el.querySelectorAll('[role="menuitem"]')]
    buttons()[0]?.focus({ preventScroll: true })

    const close = () => onCloseRef.current()
    const onPointerDown = (e) => { if (!el.contains(e.target)) close() }
    const onKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault()
        close()
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const list = buttons()
        const i = list.indexOf(document.activeElement)
        const next = e.key === 'ArrowDown' ? (i + 1) % list.length : (i - 1 + list.length) % list.length
        list[next]?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [])

  return createPortal(
    <div ref={ref} role="menu" aria-label={label} className="fixed z-[55] min-w-[200px] card shadow-pop py-1.5 animate-fade-in" style={position}>
      {items.map((item, i) => (item.divider ? (
        <div key={`divider-${i}`} className="my-1.5 border-t border-line" role="separator" />
      ) : (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          onClick={() => { onCloseRef.current(); item.onSelect() }}
          className={[
            'w-full flex items-center gap-3 px-3.5 h-10 text-base text-left outline-none transition-colors',
            item.tone === 'danger' ? 'text-danger hover:bg-danger-soft focus:bg-danger-soft' : 'text-ink hover:bg-sunken focus:bg-sunken',
          ].join(' ')}
        >
          <span className={item.tone === 'danger' ? '' : 'text-ink-3'}>{item.icon}</span>
          {item.label}
        </button>
      )))}
    </div>,
    document.body,
  )
}
