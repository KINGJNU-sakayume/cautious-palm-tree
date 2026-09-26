import React from 'react'

/** `value` is a 0–1 ratio. */
export default function ProgressBar({ value = 0, height = 6, className = '', label }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div
      className={`w-full rounded-full bg-sunken overflow-hidden ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}
