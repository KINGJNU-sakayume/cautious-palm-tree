import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext.jsx'
import TrophyTierBadge from '@/components/TrophyTierBadge.jsx'
import ProgressBar from '@/components/ProgressBar.jsx'
import {
  TrophyIcon,
  CheckIcon,
  XIcon,
  CalendarIcon,
  FlameIcon,
  StarFilledIcon,
  PlusIcon,
} from '@/components/Icons.jsx'
import { formatDate, tierLabel } from '@/utils/formatters.js'
import { getDescendantIds } from '@/utils/categoryTree.js'
import { usePinnedAchievements } from '@/hooks/usePinnedAchievements.js'

const TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legendary']
const TIER_ORDER = { legendary: 5, diamond: 4, platinum: 3, gold: 2, silver: 1, bronze: 0 }
const RARE_THRESHOLD = 8.4

// Tier accent colors for the filled slot icon square
const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#9ca3af',
  gold: '#f59e0b',
  platinum: '#6366f1',
  diamond: '#06b6d4',
  legendary: '#7F77DD',
}

function computeStreak(records) {
  const dateset = new Set(records.map(r => r.date))
  const today = new Date()
  let longest = 0
  let current = 0
  for (let i = 0; i < 730; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (dateset.has(s)) {
      current++
      if (current > longest) longest = current
    } else {
      current = 0
    }
  }
  return longest
}

// ── Pin Slot ──────────────────────────────────────────────────────────────────

function PinSlot({ index, achievement, onClick }) {
  const isLegendary = achievement?.tier === 'legendary'

  if (!achievement) {
    return (
      <button
        onClick={onClick}
        className="flex-1 min-w-0 min-h-[96px] flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        aria-label={`슬롯 ${index + 1} 추가`}
      >
        <PlusIcon size={18} />
        <span className="text-xs font-medium">슬롯 추가</span>
      </button>
    )
  }

  const color = TIER_COLORS[achievement.tier] || '#9ca3af'

  return (
    <button
      onClick={onClick}
      className={[
        'flex-1 min-w-0 min-h-[96px] flex flex-col gap-2 p-3 rounded-xl border-2 border-slate-200 bg-slate-50 hover:border-slate-300 transition-all cursor-pointer text-left',
        isLegendary ? 'pin-slot-legendary' : '',
      ].filter(Boolean).join(' ')}
      aria-label={`슬롯 ${index + 1}: ${achievement.title} — 편집`}
    >
      <TrophyTierBadge tier={achievement.tier} size="xs" />
      <div
        className="w-8 h-8 rounded-md flex-shrink-0"
        style={{ background: color + '33', border: `1.5px solid ${color}66` }}
      />
      <span className="text-xs font-medium text-slate-900 leading-snug line-clamp-2">
        {achievement.title}
      </span>
    </button>
  )
}

// ── Pin Modal ─────────────────────────────────────────────────────────────────

function PinModal({ slotIndex, pinnedIds, earned, categories, onPin, onClear, onClose }) {
  const cardRef = useRef(null)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // Sort earned: highest tier first, then newest date first
  const sortedEarned = useMemo(() => {
    return [...earned].sort((a, b) => {
      const tierDiff = (TIER_ORDER[b.tier] ?? 0) - (TIER_ORDER[a.tier] ?? 0)
      if (tierDiff !== 0) return tierDiff
      return (b.earnedAt || '').localeCompare(a.earnedAt || '')
    })
  }, [earned])

  const currentPinnedId = pinnedIds[slotIndex]
  const isSlotFilled = !!currentPinnedId

  const getCategoryName = useCallback(
    (categoryId) => categories.find(c => c.id === categoryId)?.name || '',
    [categories]
  )

  const content = (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        ref={cardRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-type-section font-medium text-slate-900">
            핀 설정 — 슬롯 {slotIndex + 1}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-100"
            aria-label="닫기"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Achievement list */}
        <div className="overflow-y-auto scrollbar-thin flex-1">
          {sortedEarned.length === 0 && (
            <p className="text-sm text-slate-400 py-8 text-center">획득한 업적이 없습니다</p>
          )}
          {sortedEarned.map(a => {
            const isPinnedHere = a.id === currentPinnedId
            return (
              <button
                key={a.id}
                onClick={() => onPin(slotIndex, a.id)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left',
                  isPinnedHere ? 'border-l-4 border-blue-500 bg-blue-50 hover:bg-blue-50' : 'border-l-4 border-transparent',
                ].join(' ')}
              >
                <TrophyTierBadge tier={a.tier} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                  <p className="text-xs text-slate-400 truncate">{getCategoryName(a.categoryId)}</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(a.earnedAt)}</span>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        {isSlotFilled && (
          <div className="border-t border-slate-100 px-5 py-3">
            <button
              onClick={() => onClear(slotIndex)}
              className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
            >
              슬롯 비우기
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return ReactDOM.createPortal(content, document.body)
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AchievementShowcase() {
  const { achievements, records, categories } = useApp()
  const navigate = useNavigate()
  const { pinnedIds, pinAchievement, clearSlot } = usePinnedAchievements()

  const [activeTierFilter, setActiveTierFilter] = useState(null)
  const [showAllRecent, setShowAllRecent] = useState(false)
  const [openSlotIndex, setOpenSlotIndex] = useState(null)
  const [activeCatFilter, setActiveCatFilter] = useState(null)

  const earned = useMemo(() => achievements.filter(a => a.isEarned), [achievements])
  const locked = useMemo(() => achievements.filter(a => !a.isEarned), [achievements])

  const longestStreak = useMemo(() => computeStreak(records), [records])

  const rareEarnedCount = useMemo(
    () => earned.filter(a => a.rarity != null && a.rarity <= RARE_THRESHOLD).length,
    [earned]
  )

  const tierCounts = useMemo(
    () => TIERS.reduce((acc, tier) => {
      acc[tier] = earned.filter(a => a.tier === tier).length
      return acc
    }, {}),
    [earned]
  )

  const rootCategories = useMemo(
    () => categories.filter(c => c.parentId === null),
    [categories]
  )

  // Recursive category progress
  const categoryProgress = useMemo(() => {
    return rootCategories.map(cat => {
      const descendants = getDescendantIds(cat.id, categories)
      const scope = new Set([cat.id, ...descendants])
      const catAchs = achievements.filter(a => scope.has(a.categoryId))
      const total = catAchs.length
      const earnedCount = catAchs.filter(a => a.isEarned).length
      const pct = total > 0 ? Math.round((earnedCount / total) * 100) : 0
      return { cat, earnedCount, total, pct }
    })
      .filter(x => x.total > 0)
      .sort((a, b) => b.pct - a.pct)
  }, [rootCategories, categories, achievements])

  const displayedCategoryProgress = useMemo(() => {
    if (!activeCatFilter) return categoryProgress
    return categoryProgress.filter(x => x.cat.id === activeCatFilter)
  }, [categoryProgress, activeCatFilter])

  // Recent earned: sorted by date desc, filtered by active tier
  const recentEarned = useMemo(() => {
    let list = [...earned].sort((a, b) =>
      (b.earnedAt || '').localeCompare(a.earnedAt || '')
    )
    if (activeTierFilter) list = list.filter(a => a.tier === activeTierFilter)
    return showAllRecent ? list : list.slice(0, 8)
  }, [earned, activeTierFilter, showAllRecent])

  const totalRecentCount = useMemo(() => {
    if (activeTierFilter) return earned.filter(a => a.tier === activeTierFilter).length
    return earned.length
  }, [earned, activeTierFilter])

  // Handle tier chip click
  const handleTierChip = useCallback((tier) => {
    setActiveTierFilter(prev => prev === tier ? null : tier)
    setShowAllRecent(false)
  }, [])

  // Handle pin actions
  const handlePin = useCallback((slotIndex, achievementId) => {
    pinAchievement(slotIndex, achievementId)
    setOpenSlotIndex(null)
  }, [pinAchievement])

  const handleClear = useCallback((slotIndex) => {
    clearSlot(slotIndex)
    setOpenSlotIndex(null)
  }, [clearSlot])

  // Stats configuration
  const stats = [
    {
      label: '전체',
      value: achievements.length,
      icon: <TrophyIcon size={14} className="text-slate-400" />,
      accent: null,
    },
    {
      label: '획득',
      value: earned.length,
      icon: <CheckIcon size={14} className="text-green-400" />,
      accent: '#22c55e',
    },
    {
      label: '잠김',
      value: locked.length,
      icon: <XIcon size={14} className="text-slate-400" />,
      accent: '#94a3b8',
    },
    {
      label: '기록',
      value: records.length,
      icon: <CalendarIcon size={14} className="text-blue-400" />,
      accent: '#0066FF',
    },
    {
      label: '최장 연속',
      value: `${longestStreak}일`,
      icon: <FlameIcon size={14} className="text-orange-400" />,
      accent: '#CC4204',
    },
    {
      label: '희귀 획득',
      value: rareEarnedCount,
      icon: <StarFilledIcon size={14} className="text-amber-400" />,
      accent: '#f59e0b',
      tooltip: '희귀도 8.4% 이하인 업적 중 획득한 수',
    },
  ]

  return (
    <div className="h-full overflow-y-auto bg-[#F8FAFC] scrollbar-thin">
      <div className="max-w-[960px] mx-auto px-6 py-6 space-y-6">

        {/* ── Page Title ───────────────────────────────────────────── */}
        <h1 className="text-type-page font-medium text-slate-900">업적 쇼케이스</h1>

        {/* ── Stats Row ────────────────────────────────────────────── */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm px-8 py-6">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="relative group text-center">
                <div className="flex justify-center mb-1">{stat.icon}</div>
                <div
                  className="text-type-page font-medium tracking-tight truncate"
                  style={stat.accent ? { color: stat.accent } : { color: '#1e293b' }}
                >
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1 flex items-center justify-center gap-1">
                  {stat.label}
                  {stat.tooltip && (
                    <span className="text-slate-300 text-[10px] leading-none cursor-help select-none">ⓘ</span>
                  )}
                </div>
                {stat.tooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {stat.tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Tier Chips Row ───────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide mr-1">티어별</span>
          {TIERS.map(tier => {
            const count = tierCounts[tier] || 0
            const isActive = activeTierFilter === tier
            return (
              <button
                key={tier}
                onClick={() => handleTierChip(tier)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all',
                  isActive
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                  count === 0 ? 'opacity-45' : '',
                ].filter(Boolean).join(' ')}
                title={`${tierLabel(tier)} 업적 필터`}
              >
                <TrophyTierBadge tier={tier} size="xs" />
                <span className="text-sm font-medium text-slate-700">{count}</span>
              </button>
            )
          })}
        </div>

        {/* ── Pinned Achievements ──────────────────────────────────── */}
        <section className="rounded-xl bg-white border border-slate-200 shadow-card px-5 py-4">
          <h2 className="text-type-section font-medium text-slate-900 mb-3">핀된 업적</h2>

          {/* Desktop: flex row; Mobile: 3+2 grid via CSS class */}
          <div className="pin-slots-grid">
            {[0, 1, 2, 3, 4].map(i => {
              const pinnedId = pinnedIds[i]
              const achievement = pinnedId ? earned.find(a => a.id === pinnedId) ?? null : null
              return (
                <PinSlot
                  key={i}
                  index={i}
                  achievement={achievement}
                  onClick={() => setOpenSlotIndex(i)}
                />
              )
            })}
          </div>

          <p className="text-xs text-slate-500 mt-3 text-center">
            {earned.length === 0
              ? '업적을 획득하면 이곳에 고정할 수 있습니다.'
              : '최대 5개 · 클릭해서 편집'}
          </p>
        </section>

        {/* ── Two-Column Lower Section ─────────────────────────────── */}
        <div className="showcase-lower items-start">

          {/* Left: Recent Achievements */}
          <section className="bg-white border border-slate-200 rounded-2xl px-5 py-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
              최근 획득
              {activeTierFilter && (
                <span className="ml-1 normal-case font-medium text-primary">
                  · {tierLabel(activeTierFilter)}
                </span>
              )}
            </h2>

            {recentEarned.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                {activeTierFilter ? '해당 티어의 획득 업적이 없습니다' : '획득한 업적이 없습니다'}
              </p>
            ) : (
              <div className="space-y-1">
                {recentEarned.map(a => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <TrophyTierBadge tier={a.tier} size="xs" />
                    <span className="text-sm font-medium text-slate-800 flex-1 truncate">{a.title}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(a.earnedAt)}</span>
                  </div>
                ))}
              </div>
            )}

            {!showAllRecent && totalRecentCount > 8 && (
              <button
                onClick={() => setShowAllRecent(true)}
                className="mt-3 text-xs text-primary font-medium hover:underline w-full text-center"
              >
                더 보기 ({totalRecentCount - 8}개 더)
              </button>
            )}
          </section>

          {/* Right: Category Progress */}
          <section className="bg-white border border-slate-200 rounded-2xl px-5 py-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
              카테고리 진행률
            </h2>

            {/* Category filter chips */}
            <div className="flex gap-1.5 flex-wrap mb-4">
              <button
                onClick={() => setActiveCatFilter(null)}
                className={[
                  'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                  !activeCatFilter
                    ? 'bg-primary text-white border-primary'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                전체
              </button>
              {rootCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCatFilter(prev => prev === cat.id ? null : cat.id)}
                  className={[
                    'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                    activeCatFilter === cat.id
                      ? 'bg-primary text-white border-primary'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Progress list */}
            {displayedCategoryProgress.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">카테고리가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {displayedCategoryProgress.map(({ cat, earnedCount, total, pct }) => (
                  <button
                    key={cat.id}
                    onClick={() => navigate('/', { state: { categoryId: cat.id } })}
                    className="w-full text-left group"
                  >
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-700 group-hover:text-primary transition-colors truncate">
                        {cat.name}
                      </span>
                      <span className="text-slate-400 flex-shrink-0 ml-2">{earnedCount}/{total}</span>
                    </div>
                    <div
                      className="w-full bg-slate-100 rounded-sm overflow-hidden"
                      style={{ height: 4, borderRadius: 2 }}
                    >
                      <div
                        className="transition-all duration-500"
                        style={{
                          height: 4,
                          width: `${pct}%`,
                          background: '#378ADD',
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

      </div>

      {/* ── Pin Modal ────────────────────────────────────────────────── */}
      {openSlotIndex !== null && (
        <PinModal
          slotIndex={openSlotIndex}
          pinnedIds={pinnedIds}
          earned={earned}
          categories={categories}
          onPin={handlePin}
          onClear={handleClear}
          onClose={() => setOpenSlotIndex(null)}
        />
      )}
    </div>
  )
}
