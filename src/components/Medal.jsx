import React from 'react'
import { getTier, tint } from '@/constants/tiers.js'
import { StarFilledIcon, StarIcon } from './Icons.jsx'

/**
 * Round tier medal. Earned: solid tier colour. Not yet: a faint outline.
 * Hidden and not yet earned: a neutral '?' so nothing is given away.
 */
export default function Medal({ tier, earned = false, hidden = false, size = 40, className = '' }) {
  const t = getTier(tier)
  const iconSize = Math.round(size * 0.48)
  const base = `inline-flex items-center justify-center rounded-full flex-shrink-0 select-none ${className}`

  if (hidden && !earned) {
    return (
      <span
        className={`${base} bg-sunken text-ink-3 font-semibold border border-dashed border-line-strong`}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
        aria-hidden="true"
      >
        ?
      </span>
    )
  }

  if (earned) {
    return (
      <span
        className={`${base} text-white`}
        style={{
          width: size,
          height: size,
          background: t.color,
          boxShadow: `inset 0 0 0 ${Math.max(2, Math.round(size / 14))}px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.15)`,
        }}
        aria-hidden="true"
      >
        <StarFilledIcon size={iconSize} />
      </span>
    )
  }

  return (
    <span
      className={base}
      style={{ width: size, height: size, background: tint(t.hex, 0.1), boxShadow: `inset 0 0 0 1.5px ${tint(t.hex, 0.5)}`, color: t.hex }}
      aria-hidden="true"
    >
      <StarIcon size={iconSize} strokeWidth={1.6} />
    </span>
  )
}

export function TierLabel({ tier, className = '' }) {
  const t = getTier(tier)
  return (
    <span className={`text-xs font-semibold ${className}`} style={{ color: t.ink }}>
      {t.label}
    </span>
  )
}
