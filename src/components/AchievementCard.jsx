import React from 'react'
import TrophyTierBadge from './TrophyTierBadge.jsx'
import ProgressBar from './ProgressBar.jsx'
import { formatDate, conditionSummaryText } from '@/utils/formatters.js'

export default function AchievementCard({ achievement, onClick }) {
  const isHiddenLocked = achievement.isHidden && !achievement.isEarned

  return (
    <div
      onClick={onClick}
      className={[
        'bg-white border rounded-xl shadow-card px-4 py-3 transition-all cursor-pointer select-none',
        achievement.isEarned ? 'border-slate-200 hover:shadow-card-hover' : 'border-slate-200',
        !achievement.isEarned && !isHiddenLocked ? 'opacity-80' : '',
        achievement.rarity < 5 && achievement.isEarned ? 'achievement-rare-border' : '',
        onClick ? 'hover:shadow-card-hover hover:-translate-y-0.5' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <TrophyTierBadge tier={achievement.tier} size="xs" />
            {achievement.rarity < 5 && achievement.isEarned && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Rare</span>
            )}
          </div>
          <div
            className={`font-bold text-sm leading-snug ${
              !achievement.isEarned ? 'text-slate-500' : 'text-slate-900'
            }`}
          >
            {isHiddenLocked ? '???' : achievement.title}
          </div>
          {!isHiddenLocked && achievement.description && (
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
              {achievement.description}
            </p>
          )}
        </div>
        {achievement.isEarned ? (
          <span className="text-green-500 text-lg flex-shrink-0">✓</span>
        ) : (
          <span className="text-slate-300 text-lg flex-shrink-0">🔒</span>
        )}
      </div>

      {achievement.isEarned && achievement.earnedAt && (
        <div className="mt-2 text-xs text-slate-400">{formatDate(achievement.earnedAt)}</div>
      )}

      {!achievement.isEarned && !isHiddenLocked && achievement.condition && (
        <div className="mt-2">
          <div className="text-xs text-slate-400 mb-1">{conditionSummaryText(achievement.condition, achievement.progress)}</div>
          <ProgressBar
            current={achievement.progress || 0}
            target={
              achievement.condition.target ||
              (achievement.condition.conditions?.[0]?.target) ||
              1
            }
            tier={achievement.tier}
            heightClass="h-2"
          />
        </div>
      )}
    </div>
  )
}
