import React from 'react'

export default function Switch({ checked, onChange, label, description, id }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 w-10 h-6 flex-shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-line-strong'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface shadow transition-transform ${checked ? 'translate-x-4' : ''}`}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-base text-ink">{label}</span>
        {description && <span className="block text-sm text-ink-3">{description}</span>}
      </span>
    </label>
  )
}
