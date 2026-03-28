import React from 'react'
import { tierLabel } from '@/utils/formatters.js'

// Full class strings — never dynamic interpolation (Tailwind JIT requirement)
const TIER_STYLES = {
  bronze: {
    bg: 'bg-[#cd7f32]',
    text: 'text-white',
    border: 'border-[#cd7f32]',
    glow: '',
    special: '',
  },
  silver: {
    bg: 'bg-[#9ca3af]',
    text: 'text-white',
    border: 'border-[#9ca3af]',
    glow: '',
    special: '',
  },
  gold: {
    bg: 'bg-[#f59e0b]',
    text: 'text-white',
    border: 'border-[#f59e0b]',
    glow: 'animate-glow-gold',
    special: '',
  },
  platinum: {
    bg: '',
    text: 'text-white',
    border: 'border-[#6366f1]',
    glow: '',
    special: 'tier-platinum-badge',
  },
  diamond: {
    bg: 'bg-[#06b6d4]',
    text: 'text-white',
    border: 'border-[#06b6d4]',
    glow: 'animate-glow-diamond',
    special: '',
  },
  legendary: {
    bg: '',
    text: '',
    border: '',
    glow: '',
    special: 'tier-badge-legendary',
  },
}

const SIZE_CLASSES = {
  xs: 'text-[9px] px-1.5 py-0.5 rounded',
  sm: 'text-[10px] px-2 py-0.5 rounded',
  md: 'text-xs px-2.5 py-1 rounded-md',
  lg: 'text-sm px-3 py-1.5 rounded-md font-semibold',
}

export default function TrophyTierBadge({ tier, size = 'sm', showLabel = true, className = '' }) {
  const styles = TIER_STYLES[tier] || TIER_STYLES.bronze
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm

  const label = showLabel ? tierLabel(tier) : ''

  const classes = [
    'inline-flex items-center font-semibold tracking-wide uppercase',
    sizeClass,
    styles.bg,
    styles.text,
    styles.glow,
    styles.special,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={classes}>{label || tier}</span>
}
