import React, { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import TrophyTierBadge from '@/components/TrophyTierBadge.jsx'
import AchievementListItem from '@/components/AchievementListItem.jsx'
import ProgressBar from '@/components/ProgressBar.jsx'
import { formatDate, conditionSummaryText, tierLabel, achievementStatusText, rarityText } from '@/utils/formatters.js'
import { getCategoryPath } from '@/utils/categoryTree.js'

const TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'red_diamond']

function computeStreak(records) {
  const dateset = new Set(records.map(r => r.date))
  const today = new Date()
  let longest = 0
  let current = 0
  for (let i = 0; i < 730; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    if (dateset.has(s)) {
      current++
      if (current > longest) longest = current
    } else {
      current = 0
    }
  }
  return longest
}

function HighTierDisplayCase({ achievements }) {
  const highTierEarned = achievements.filter(
    a => (a.tier === 'red_diamond' || a.tier === 'diamond') && a.isEarned
  )

  if (highTierEarned.length === 0) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-8 flex flex-col items-center justify-center min-h-36 text-center">
        {/* Decorative placeholder silhouettes */}
        <div className="flex items-end justify-center gap-4 mb-5 opacity-20 pointer-events-none select-none">
          {[48, 64, 48].map((size, i) => (
            <div
              key={i}
              className="rounded-xl flex items-center justify-center bg-slate-700 border border-slate-600"
              style={{ width: size, height: size }}
            >
              <span style={{ fontSize: size * 0.5 }}>💎</span>
            </div>
          ))}
        </div>

        {/* Lock icon */}
        <div className="text-4xl mb-3 animate-pulse">🔒</div>

        {/* Korean motivational text */}
        <p className="text-lg font-extrabold text-white mb-1">
          최고의 영광이 이곳에 전시됩니다
        </p>
        <p className="text-base font-semibold text-amber-400 mb-2">
          위대한 도전을 시작하세요!
        </p>
        <p className="text-xs text-slate-400 max-w-xs">
          다이아몬드 및 레드 다이아몬드 업적을 획득하면 이곳에 전시됩니다.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">💎</span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          최고 등급 전시관
        </span>
      </div>
      <div className="flex gap-3 flex-wrap">
        {highTierEarned.map(a => {
          const isRed = a.tier === 'red_diamond'
          return (
            <div
              key={a.id}
              className={[
                'flex flex-col gap-2 rounded-xl px-4 py-3 min-w-36 flex-1',
                isRed
                  ? 'bg-gradient-to-br from-red-950 to-orange-900 ring-1 ring-red-500/40'
                  : 'bg-gradient-to-br from-cyan-950 to-slate-900 ring-1 ring-cyan-500/40',
              ].join(' ')}
            >
              <TrophyTierBadge tier={a.tier} size="sm" />
              <p className="text-sm font-bold text-white leading-snug">{a.title}</p>
              {a.earnedAt && (
                <p className={`text-xs font-medium ${isRed ? 'text-red-300' : 'text-cyan-300'}`}>
                  {formatDate(a.earnedAt)}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailPanel({ achievement, onClose }) {
  if (!achievement) return null
  return (
    <div className="flex-1 sm:border-l border-slate-200 bg-white p-5 overflow-y-auto scrollbar-thin animate-fade-in sm:static absolute inset-0 z-10">
      <div className="flex items-start justify-between gap-2 mb-4">
        <TrophyTierBadge tier={achievement.tier} size="lg" />
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
      </div>

      <h2 className="text-xl font-extrabold text-slate-900 mb-1">
        {achievement.isHidden && !achievement.isEarned ? '???' : achievement.title}
      </h2>

      {(!achievement.isHidden || achievement.isEarned) && (
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">{achievement.description}</p>
      )}

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">티어</span>
          <span className="font-semibold">{tierLabel(achievement.tier)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">희귀도</span>
          <span className={`font-semibold ${achievement.rarity < 5 ? 'text-amber-500' : ''}`}>
            {rarityText(achievement.rarity)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">상태</span>
          <span className={`font-semibold ${achievement.isEarned ? 'text-green-500' : 'text-slate-400'}`}>
            {achievementStatusText(achievement.isEarned)}
          </span>
        </div>
        {achievement.isEarned && achievement.earnedAt && (
          <div className="flex justify-between">
            <span className="text-slate-500">획득일</span>
            <span className="font-semibold">{formatDate(achievement.earnedAt)}</span>
          </div>
        )}
        {(!achievement.isHidden || achievement.isEarned) && (
          <div>
            <span className="text-slate-500 block mb-1.5">조건</span>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium">
              {conditionSummaryText(achievement.condition, achievement.progress)}
            </div>
          </div>
        )}
        {!achievement.isEarned && achievement.condition?.target && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>진행도</span>
              <span>{achievement.progress || 0} / {achievement.condition.target}</span>
            </div>
            <ProgressBar
              current={achievement.progress || 0}
              target={achievement.condition.target}
              tier={achievement.tier}
              heightClass="h-3"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function AchievementShowcase() {
  const { achievements, records, categories } = useApp()
  const [selectedCategoryId, setSelectedCategoryId] = useState(null) // null = All
  const [selectedAchievement, setSelectedAchievement] = useState(null)

  const earned = achievements.filter(a => a.isEarned)
  const locked = achievements.filter(a => !a.isEarned)
  const longestStreak = useMemo(() => computeStreak(records), [records])
  const rarestEarned = useMemo(() => {
    const e = earned.filter(a => a.rarity != null)
    return e.length > 0 ? e.reduce((min, a) => a.rarity < min.rarity ? a : min, e[0]) : null
  }, [earned])

  // Root categories for left nav
  const rootCategories = categories.filter(c => c.parentId === null)

  // Filter achievements by selected category
  const filteredAchievements = useMemo(() => {
    if (!selectedCategoryId) return achievements
    return achievements.filter(a => a.categoryId === selectedCategoryId)
  }, [achievements, selectedCategoryId])

  // Recent unlocks (last 5 earned)
  const recentUnlocks = useMemo(() => {
    return [...earned]
      .sort((a, b) => (b.earnedAt || '').localeCompare(a.earnedAt || ''))
      .slice(0, 5)
  }, [earned])

  // Category progress bars
  const categoryProgress = useMemo(() => {
    return rootCategories.map(cat => {
      const catAchs = achievements.filter(a => a.categoryId === cat.id || a.categoryId?.startsWith(cat.id))
      const total = catAchs.length
      const earnedCount = catAchs.filter(a => a.isEarned).length
      return { cat, earnedCount, total }
    }).filter(x => x.total > 0)
  }, [categories, achievements])

  // Tier counts
  const tierCounts = useMemo(() => {
    return TIERS.reduce((acc, tier) => {
      acc[tier] = earned.filter(a => a.tier === tier).length
      return acc
    }, {})
  }, [earned])

  const hasDetailPanel = !!selectedAchievement

  return (
    <div className="h-full overflow-y-auto bg-[#F8FAFC] scrollbar-thin">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">

        {/* ── Global Stats Header ──────────────────────────────────── */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-card px-8 py-6 space-y-6">
          <h1 className="text-2xl font-extrabold text-slate-900">업적 쇼케이스</h1>

          {/* Stats row */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 border-b border-slate-100 pb-6">
            {[
              { label: '전체', value: achievements.length },
              { label: '획득', value: earned.length, accent: '#22c55e' },
              { label: '잠김', value: locked.length, accent: '#94a3b8' },
              { label: '기록', value: records.length, accent: '#0066FF' },
              { label: '최장 연속', value: `${longestStreak}d`, accent: '#CC4204' },
              {
                label: '최희귀 획득',
                value: rarestEarned ? `${rarestEarned.rarity}%` : '—',
                sub: rarestEarned?.title || '',
                accent: '#f59e0b',
              },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div
                  className="text-3xl font-extrabold tracking-tight truncate"
                  style={stat.accent ? { color: stat.accent } : {}}
                >
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">{stat.label}</div>
                {stat.sub && <div className="text-xs text-slate-400 mt-0.5 truncate">{stat.sub}</div>}
              </div>
            ))}
          </div>

          {/* Tier count row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-1">티어별</span>
            {TIERS.map(tier => (
              <div key={tier} className="flex items-center gap-1.5">
                <TrophyTierBadge tier={tier} size="sm" />
                <span className="text-sm font-bold text-slate-700">{tierCounts[tier] || 0}</span>
              </div>
            ))}
          </div>

          {/* High-Tier Display Case */}
          <HighTierDisplayCase achievements={achievements} />
        </section>

        {/* ── WoW-style Browser ────────────────────────────────────── */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
          <div className="flex flex-col sm:flex-row" style={{ minHeight: 500 }}>
            {/* Left: category list — horizontal scroll on mobile */}
            <div className="sm:w-48 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-slate-200 sm:py-3 overflow-x-auto sm:overflow-y-auto scrollbar-thin flex sm:flex-col flex-row">
              <button
                onClick={() => { setSelectedCategoryId(null); setSelectedAchievement(null) }}
                className={[
                  'flex-shrink-0 sm:w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap',
                  selectedCategoryId === null
                    ? 'bg-primary/10 text-primary sm:border-r-2 border-primary border-b-2 sm:border-b-0'
                    : 'hover:bg-slate-50 text-slate-600',
                ].join(' ')}
              >
                전체
              </button>
              {rootCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategoryId(cat.id); setSelectedAchievement(null) }}
                  className={[
                    'flex-shrink-0 sm:w-full text-left px-4 py-2.5 text-sm transition-colors whitespace-nowrap',
                    selectedCategoryId === cat.id
                      ? 'bg-primary/10 text-primary font-semibold sm:border-r-2 border-primary border-b-2 sm:border-b-0'
                      : 'hover:bg-slate-50 text-slate-600',
                  ].join(' ')}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Right: content */}
            <div className="flex flex-1 min-w-0 relative">
              {/* Achievement list */}
              <div className={`overflow-y-auto scrollbar-thin p-4 space-y-3 ${hasDetailPanel ? 'hidden sm:block sm:w-1/2' : 'flex-1'}`}>
                {/* Recent unlocks */}
                {!selectedCategoryId && recentUnlocks.length > 0 && (
                  <div className="mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      최근 획득
                    </h3>
                    <div className="space-y-1.5">
                      {recentUnlocks.map(a => (
                        <div key={a.id} className="flex items-center gap-3 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
                          <TrophyTierBadge tier={a.tier} size="xs" />
                          <span className="text-sm font-semibold text-slate-800 flex-1 truncate">{a.title}</span>
                          <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(a.earnedAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category progress grid */}
                {!selectedCategoryId && categoryProgress.length > 0 && (
                  <div className="mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      카테고리 진행률
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {categoryProgress.map(({ cat, earnedCount, total }) => (
                        <div key={cat.id} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-700 truncate">{cat.name}</span>
                            <span className="text-slate-400 flex-shrink-0 ml-1">{earnedCount}/{total}</span>
                          </div>
                          <ProgressBar current={earnedCount} target={total} heightClass="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievement list */}
                <div>
                  {selectedCategoryId && (
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      {categories.find(c => c.id === selectedCategoryId)?.name} 업적
                    </h3>
                  )}
                  {filteredAchievements.length === 0 && (
                    <div className="text-sm text-slate-400 py-6 text-center">이 카테고리에 업적이 없습니다</div>
                  )}
                  <div className="space-y-2">
                    {filteredAchievements.map(a => (
                      <AchievementListItem
                        key={a.id}
                        achievement={a}
                        isSelected={selectedAchievement?.id === a.id}
                        onClick={() => setSelectedAchievement(
                          selectedAchievement?.id === a.id ? null : a
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Detail panel */}
              {hasDetailPanel && (
                <DetailPanel
                  achievement={selectedAchievement}
                  onClose={() => setSelectedAchievement(null)}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
