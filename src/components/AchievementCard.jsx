import React from 'react'
import Medal, { TierLabel } from './Medal.jsx'
import ProgressBar from './ProgressBar.jsx'
import { useApp } from '@/context/AppContext.jsx'
import { useUI } from '@/context/UIContext.jsx'
import { describeCondition, hasMeasurableProgress, progressLabel, progressRatio } from '@/utils/achievementText.js'
import { getCategoryPathLabel } from '@/utils/categoryTree.js'
import { formatDateShort } from '@/utils/formatters.js'
import { AlertIcon, CheckIcon } from './Icons.jsx'

/**
 * Achievement summary: medal, title, description and either progress or the
 * date it was earned. Opens the detail sheet unless `onClick` is given;
 * `isStatic` renders it as plain content (e.g. an editor preview).
 */
export default function AchievementCard({ achievement: a, onClick, showCategory = false, isStatic = false, className = '' }) {
  const { categories } = useApp()
  const { openAchievement } = useUI()
  const secret = a.isHidden && !a.isEarned
  const measurable = hasMeasurableProgress(a.condition)

  const Tag = isStatic ? 'div' : 'button'
  const interactiveProps = isStatic
    ? {}
    : { type: 'button', onClick: onClick ?? (() => openAchievement(a.id)) }

  return (
    <Tag
      {...interactiveProps}
      className={`group w-full text-left card px-4 py-3.5 flex gap-3.5 transition-colors ${isStatic ? '' : 'hover:border-line-strong hover:bg-sunken/40'} ${className}`}
    >
      <Medal tier={a.tier} earned={a.isEarned} hidden={a.isHidden} size={44} className="mt-0.5" />

      <span className="flex-1 min-w-0">
        {showCategory && !secret && (
          <span className="block text-xs text-ink-3 truncate mb-0.5">
            {a.categoryId ? getCategoryPathLabel(a.categoryId, categories) : '모든 기록'}
          </span>
        )}
        <span className="flex items-baseline gap-2">
          <span className={`flex-1 min-w-0 truncate text-base font-semibold ${secret ? 'text-ink-2' : 'text-ink'}`}>
            {secret ? '숨겨진 업적' : a.title}
          </span>
          {!secret && <TierLabel tier={a.tier} className="flex-shrink-0" />}
        </span>

        <span className="block mt-0.5 text-sm text-ink-2 line-clamp-2">
          {secret ? '조건을 채우면 이름과 내용이 공개돼요.' : a.description}
        </span>

        {a.error ? (
          <span className="mt-2 flex items-center gap-1 text-xs font-medium text-danger">
            <AlertIcon size={14} /> {a.error}
          </span>
        ) : a.isEarned ? (
          <span className="mt-2 flex items-center gap-1 text-xs font-medium text-accent-ink">
            <CheckIcon size={14} strokeWidth={2.4} /> {formatDateShort(a.earnedAt)} 달성
          </span>
        ) : secret ? null : measurable ? (
          <span className="mt-2.5 flex items-center gap-3">
            <ProgressBar value={progressRatio(a)} className="flex-1" label={`${a.title} 진행도`} />
            <span className="flex-shrink-0 text-xs font-medium text-ink-2 tabular">{progressLabel(a)}</span>
          </span>
        ) : (
          <span className="mt-2 block text-xs text-ink-3">{describeCondition(a.condition, { categories, achievement: a })}</span>
        )}
      </span>
    </Tag>
  )
}
