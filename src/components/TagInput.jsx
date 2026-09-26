import React, { useState } from 'react'
import { normalizeTag } from '@/utils/achievementEvaluator.js'
import { XIcon } from './Icons.jsx'

/** Chips plus a text box. Enter or comma adds a tag; Backspace on empty removes the last. */
export default function TagInput({ value, onChange, placeholder = '입력 후 Enter', id, ariaLabel }) {
  const [draft, setDraft] = useState('')

  const add = (raw) => {
    const tag = raw.trim().replace(/^#+/, '').trim()
    setDraft('')
    if (!tag || value.some(t => normalizeTag(t) === normalizeTag(tag))) return
    onChange([...value, tag])
  }

  const onKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return // Korean IME is still composing the syllable
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const onPaste = (e) => {
    const text = e.clipboardData.getData('text')
    if (!text.includes(',') && !text.includes('\n')) return
    e.preventDefault()
    const next = [...value]
    for (const piece of text.split(/[,\n]/)) {
      const tag = piece.trim().replace(/^#+/, '').trim()
      if (tag && !next.some(t => normalizeTag(t) === normalizeTag(tag))) next.push(tag)
    }
    onChange(next)
  }

  return (
    <div className="input h-auto min-h-10 flex flex-wrap items-center gap-1.5 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
      {value.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-lg bg-accent-soft text-accent-ink text-sm font-medium">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter(t => t !== tag))}
            className="w-5 h-5 inline-flex items-center justify-center rounded hover:bg-accent/10"
            aria-label={`'${tag}' 빼기`}
          >
            <XIcon size={13} />
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={value.length === 0 ? placeholder : ''}
        aria-label={ariaLabel}
        className="flex-1 min-w-[96px] h-7 bg-transparent outline-none text-base text-ink placeholder:text-ink-3"
        autoComplete="off"
      />
    </div>
  )
}
