import React from 'react'
import TrophyTierBadge from './TrophyTierBadge.jsx'
import ProgressBar from './ProgressBar.jsx'
import { formatDate, conditionSummaryText, typeLabel, getConditionTarget } from '@/utils/formatters.js'

export default function AchievementListItem({ achievement, onClick, isSelected = false }) {
  const isHiddenLocked = achievement.isHidden && !achievement.isEarned
  const isRare = achievement.rarity < 5

  return (
    <div
      onClick={onClick}
      className={[
        'group flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all',
        isSelected
          ? 'bg-primary/5 border-primary/30 shadow-sm'
          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300',
        !achievement.isEarned ? 'opacity-75' : '',
        isRare && achievement.isEarned ? 'achievement-rare-border' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Left: tier badge + state icon */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-0.5">
        <TrophyTierBadge tier={achievement.tier} size="sm" showLabel={false} />
        {achievement.isEarned ? (
          <span className="text-green-500 text-sm">✓</span>
        ) : (
          <span className="text-slate-300 text-sm">🔒</span>
        )}
      </div>

      {/* Center: title + description + progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span
            className={`font-bold text-sm ${
              !achievement.isEarned ? 'text-slate-400' : 'text-slate-900'
            } ${achievement.isEarned ? '' : 'grayscale'}`}
          >
            {isHiddenLocked ? '???' : achievement.title}
          </span>
          {isRare && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
              희귀
            </span>
          )}
          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
            {typeLabel(achievement.type)}
          </span>
        </div>

        {!isHiddenLocked && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-1">
            {achievement.description}
          </p>
        )}

        {!achievement.isEarned && !isHiddenLocked && achievement.condition && (
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{achievement.conditionDisplay || conditionSummaryText(achievement.condition, achievement.progress)}</span>
              {achievement.condition.target && (
                <span className="text-xs text-slate-400">
                  {achievement.progress || 0} / {getConditionTarget(achievement.condition)}
                </span>
              )}
            </div>
            <ProgressBar
              current={achievement.progress || 0}
              target={getConditionTarget(achievement.condition)}
              tier={achievement.tier}
              heightClass="h-2"
            />
          </div>
        )}

        {achievement.isEarned && achievement.earnedAt && (
          <div className="text-xs text-green-500 font-medium mt-0.5">
            획득: {formatDate(achievement.earnedAt)}
          </div>
        )}
      </div>

      {/* Right: rarity */}
      <div className="flex-shrink-0 text-right pt-0.5">
        <span className="text-xs text-slate-400">{achievement.rarity}%</span>
      </div>
    </div>
  )
}
