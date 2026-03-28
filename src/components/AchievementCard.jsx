import React, { useState } from 'react'
import TrophyTierBadge from './TrophyTierBadge.jsx'
import ProgressBar from './ProgressBar.jsx'
import { formatDate, formatDateShort, conditionSummaryText, getConditionTarget, renderTemplate } from '@/utils/formatters.js'

// Tier fill colors for the progress bar
const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#9ca3af',
  gold: '#f59e0b',
  platinum: '#6366f1',
  diamond: '#06b6d4',
  legendary: '#7F77DD',
}

function CheckIcon({ className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-4 h-4 ${className}`}>
      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
    </svg>
  )
}

function LockIcon({ className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-4 h-4 ${className}`}>
      <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v4A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
    </svg>
  )
}

export default function AchievementCard({ achievement, onClick }) {
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const isHiddenLocked = achievement.isHidden && !achievement.isEarned
  const isTagSet = achievement.condition?.type === 'tag_set_complete'
  const tags = isTagSet ? (achievement.condition.tags || []) : []
  const current = achievement.progress || 0
  const total = isTagSet ? tags.length : getConditionTarget(achievement.condition)
  const tierColor = TIER_COLORS[achievement.tier] || '#9ca3af'

  // completedTags: if available on the achievement object, use it;
  // otherwise approximate by marking the first `current` tags as done
  const completedTags = achievement.completedTags
    ? achievement.completedTags
    : tags.slice(0, current)

  const displayedTags = showAll ? tags : tags.slice(0, 9)

  const expandTitle = achievement.expandTitle
    ? renderTemplate(achievement.expandTitle, { current, total })
    : `${total}개 항목 달성 현황`

  const progressSummary = achievement.progressFormat
    ? renderTemplate(achievement.progressFormat, { current, total })
    : null

  const handleCardClick = (e) => {
    if (isTagSet) {
      setChecklistOpen(v => !v)
    } else {
      onClick?.(e)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className={[
        'bg-white border rounded-xl shadow-card px-4 py-3 transition-all select-none',
        achievement.isEarned ? 'border-slate-200' : 'border-slate-200',
        !achievement.isEarned && !isHiddenLocked ? 'opacity-80' : '',
        achievement.rarity < 5 && achievement.isEarned ? 'achievement-rare-border' : '',
        isTagSet || onClick ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5' : '',
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
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {achievement.isEarned
            ? <CheckIcon className="text-green-500" />
            : <LockIcon className="text-slate-300" />
          }
          {isTagSet && (
            <span className={`text-slate-400 text-sm transition-transform duration-200 ${checklistOpen ? 'rotate-90' : ''}`}>
              ›
            </span>
          )}
        </div>
      </div>

      {achievement.isEarned && achievement.earnedAt && (
        <div className="mt-2 text-xs text-slate-400">{formatDate(achievement.earnedAt)}</div>
      )}

      {!achievement.isEarned && !isHiddenLocked && achievement.condition && !isTagSet && (
        <div className="mt-2">
          <div className="text-xs text-slate-400 mb-1">
            {progressSummary || conditionSummaryText(achievement.condition, achievement.progress)}
          </div>
          <ProgressBar
            current={achievement.progress || 0}
            target={getConditionTarget(achievement.condition)}
            tier={achievement.tier}
            heightClass="h-2"
          />
        </div>
      )}

      {/* Tag-set progress summary (collapsed state) */}
      {isTagSet && !checklistOpen && !achievement.isEarned && (
        <div className="mt-2">
          <div className="text-xs text-slate-400 mb-1">
            {progressSummary || conditionSummaryText(achievement.condition, current)}
          </div>
          <ProgressBar
            current={current}
            target={total}
            tier={achievement.tier}
            heightClass="h-2"
          />
        </div>
      )}

      {/* Expandable checklist */}
      {isTagSet && (
        <div className={`checklist-expand ${checklistOpen ? 'open' : ''}`}>
          <div className="mt-3 border-t border-slate-100 pt-3">
            {/* Checklist header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">{expandTitle}</span>
              <span className="text-[10px] text-slate-400">
                <span className="text-green-600">●</span> 완료 <span className="ml-1 text-slate-300">○</span> 미완료
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${total > 0 ? Math.round((current / total) * 100) : 0}%`, background: tierColor }}
              />
            </div>
            <div className="text-xs text-slate-500 mb-3">
              {current}개 완료 · {total - current}개 남음
            </div>

            {/* 3-column checklist grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {displayedTags.map((tag) => {
                const done = completedTags.includes(tag)
                const completedDate = achievement.completedDates?.[tag]
                return (
                  <div
                    key={tag}
                    className={`flex items-start gap-1 text-xs p-1 rounded ${done ? 'text-slate-800' : 'text-slate-400'}`}
                  >
                    {done ? (
                      <span className="w-4 h-4 flex-shrink-0 bg-[#EAF3DE] text-[#27500A] rounded flex items-center justify-center text-[9px] mt-px">
                        ✓
                      </span>
                    ) : (
                      <span className="w-4 h-4 flex-shrink-0 border border-slate-300 rounded mt-px" />
                    )}
                    <div className="min-w-0">
                      <div className={`leading-tight truncate ${done ? 'font-bold' : 'font-normal'}`}>
                        {tag}
                      </div>
                      {done && completedDate && (
                        <div className="text-[7px] text-[#639922] mt-px">{formatDateShort(completedDate)}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Show more */}
            {!showAll && tags.length > 9 && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowAll(true) }}
                className="mt-2 text-xs text-primary hover:underline"
              >
                + {tags.length - 9}개 더 보기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
