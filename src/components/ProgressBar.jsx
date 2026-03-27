import React from 'react'

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#9ca3af',
  gold: '#f59e0b',
  platinum: '#6366f1',
  diamond: '#06b6d4',
  red_diamond: '#CC4204',
}

export default function ProgressBar({
  current = 0,
  target = 1,
  tier,
  color,
  heightClass = 'h-3',
  showLabel = false,
  className = '',
}) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
  const fillColor = color || (tier ? TIER_COLORS[tier] : '#0066FF')

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: fillColor }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>{current}</span>
          <span>{target}</span>
        </div>
      )}
    </div>
  )
}
