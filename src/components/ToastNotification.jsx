import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/context/ToastContext.jsx'
import TrophyTierBadge from './TrophyTierBadge.jsx'
import { tierSubtext } from '@/utils/formatters.js'

export default function ToastNotification({ toast }) {
  const { dismissToast } = useToast()
  const navigate = useNavigate()
  const { id, achievement, isLeaving } = toast

  const handleClick = () => {
    navigate('/showcase')
    dismissToast(id)
  }

  return (
    <div
      className={[
        'relative flex items-start gap-3 bg-white border border-slate-200 rounded-2xl shadow-panel px-4 py-3.5 w-80 cursor-pointer select-none overflow-hidden',
        isLeaving ? 'animate-slide-out-right' : 'animate-slide-in-right',
      ].join(' ')}
      onClick={handleClick}
    >
      {/* Tier accent left border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{
          backgroundColor: {
            bronze: '#cd7f32', silver: '#9ca3af', gold: '#f59e0b',
            platinum: '#6366f1', diamond: '#06b6d4', legendary: '#7F77DD',
          }[achievement.tier] || '#0066FF',
        }}
      />

      {/* Trophy icon */}
      <div className="flex-shrink-0 ml-1">
        <span className="text-2xl">🏆</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
            업적 달성
          </span>
          <TrophyTierBadge tier={achievement.tier} size="xs" />
        </div>
        <div className="font-medium text-sm text-slate-900 truncate mb-0.5">
          {achievement.title}
        </div>
        <div className="text-xs text-slate-500">
          {tierSubtext(achievement.tier)}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); dismissToast(id) }}
        className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded transition-colors"
      >
        ×
      </button>
    </div>
  )
}
