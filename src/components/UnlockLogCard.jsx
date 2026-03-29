import React from 'react'
import { formatDate, conditionSummaryText } from '@/utils/formatters.js'
import TrophyTierBadge from './TrophyTierBadge.jsx'
import { useUserSettings } from '@/hooks/useUserSettings.js'

const TIER_BORDER_COLORS = {
  bronze: '#cd7f32',
  silver: '#9ca3af',
  gold: '#f59e0b',
  platinum: '#6366f1',
  diamond: '#06b6d4',
  legendary: '#7F77DD',
}

export default function UnlockLogCard({ achievement }) {
  const borderColor = TIER_BORDER_COLORS[achievement.tier] || '#0066FF'
  const conditionText = achievement.condition ? conditionSummaryText(achievement.condition) : null
  const { settings } = useUserSettings()

  return (
    <div
      className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 flex items-center gap-3"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
    >
      <div className="flex-shrink-0">
        <span className="text-xl">🏆</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Achievement Unlocked
          </span>
          <TrophyTierBadge tier={achievement.tier} size="xs" />
        </div>
        <div className="text-sm font-bold text-slate-800 truncate">{achievement.title}</div>

        {/* Unlock condition — one-line summary */}
        {conditionText && settings.showConditions && (
          <div className="text-xs text-slate-500 mt-0.5 truncate" title={conditionText}>
            {conditionText}
          </div>
        )}

        {achievement.earnedAt && (
          <div className="text-xs text-slate-400 mt-0.5">{formatDate(achievement.earnedAt)}</div>
        )}
      </div>
    </div>
  )
}
