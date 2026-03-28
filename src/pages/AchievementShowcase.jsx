import React, { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import TrophyTierBadge from '@/components/TrophyTierBadge.jsx'
import AchievementListItem from '@/components/AchievementListItem.jsx'
import ProgressBar from '@/components/ProgressBar.jsx'
import { formatDate, conditionSummaryText, tierLabel } from '@/utils/formatters.js'
import { getCategoryPath } from '@/utils/categoryTree.js'

const TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'red_diamond']
const ELITE_TIERS = new Set(['diamond', 'red_diamond'])

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

function AchievementTimeline({ achievements }) {
  const months = []
  const today = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    const count = achievements.filter(a => a.isEarned && a.earnedAt && a.earnedAt.startsWith(key)).length
    months.push({ key, label, count })
  }
  const maxCount = Math.max(...months.map(m => m.count), 1)

  return (
    <div className="flex items-end gap-2 h-16">
      {months.map(m => (
        <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-semibold text-slate-700">{m.count > 0 ? m.count : ''}</span>
          <div className="w-full bg-slate-100 rounded-sm overflow-hidden" style={{ height: 36 }}>
            <div
              className="bg-primary rounded-sm transition-all"
              style={{ height: `${(m.count / maxCount) * 100}%`, width: '100%', marginTop: 'auto' }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{m.label}</span>
        </div>
      ))}
    </div>
  )
}

function DetailPanel({ achievement, onClose }) {
  if (!achievement) return null
  return (
    <div className="flex-1 border-l border-slate-200 bg-white p-5 overflow-y-auto scrollbar-thin animate-fade-in">
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
          <span className="text-slate-500">Tier</span>
          <span className="font-semibold">{tierLabel(achievement.tier)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Rarity</span>
          <span className={`font-semibold ${achievement.rarity < 5 ? 'text-amber-500' : ''}`}>
            {achievement.rarity}% {achievement.rarity < 5 ? '(Rare)' : ''}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Status</span>
          <span className={`font-semibold ${achievement.isEarned ? 'text-green-500' : 'text-slate-400'}`}>
            {achievement.isEarned ? '✓ Earned' : '🔒 Locked'}
          </span>
        </div>
        {achievement.isEarned && achievement.earnedAt && (
          <div className="flex justify-between">
            <span className="text-slate-500">Earned</span>
            <span className="font-semibold">{formatDate(achievement.earnedAt)}</span>
          </div>
        )}
        {(!achievement.isHidden || achievement.isEarned) && (
          <div>
            <span className="text-slate-500 block mb-1.5">Condition</span>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium">
              {conditionSummaryText(achievement.condition)}
            </div>
          </div>
        )}
        {!achievement.isEarned && achievement.condition?.target && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Progress</span>
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

// ── EliteAchievementsSection ──────────────────────────────────────────────────
// Replaces the general achievement list in the default (no category selected) view.

function EliteAchievementsSection({ achievements, onSelect, selectedId }) {
  const eliteEarned = achievements.filter(a => ELITE_TIERS.has(a.tier) && a.isEarned)

  // Sort: red_diamond first, then diamond; within each tier by earnedAt desc.
  const sorted = [...eliteEarned].sort((a, b) => {
    if (a.tier !== b.tier) {
      return a.tier === 'red_diamond' ? -1 : 1
    }
    return (b.earnedAt || '').localeCompare(a.earnedAt || '')
  })

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
        <span>💎</span> Elite Achievements
        <span className="text-[10px] font-normal text-slate-400 normal-case tracking-normal">
          Diamond &amp; Red Diamond
        </span>
      </h3>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 px-4 text-center">
          <p className="text-sm font-semibold text-slate-400">No elite achievements earned yet</p>
          <p className="text-xs text-slate-400 mt-1">Diamond and Red Diamond tiers will appear here once unlocked.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(a => (
            <AchievementListItem
              key={a.id}
              achievement={a}
              isSelected={selectedId === a.id}
              onClick={() => onSelect(selectedId === a.id ? null : a)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── AchievementShowcase ───────────────────────────────────────────────────────

export default function AchievementShowcase() {
  const { achievements, records, categories } = useApp()
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedAchievement, setSelectedAchievement] = useState(null)

  const earned = achievements.filter(a => a.isEarned)
  const locked = achievements.filter(a => !a.isEarned)
  const longestStreak = useMemo(() => computeStreak(records), [records])
  const rarestEarned = useMemo(() => {
    const e = earned.filter(a => a.rarity != null)
    return e.length > 0 ? e.reduce((min, a) => a.rarity < min.rarity ? a : min, e[0]) : null
  }, [earned])

  const rootCategories = categories.filter(c => c.parentId === null)

  const filteredAchievements = useMemo(() => {
    if (!selectedCategoryId) return achievements
    return achievements.filter(a => a.categoryId === selectedCategoryId)
  }, [achievements, selectedCategoryId])

  const recentUnlocks = useMemo(() => (
    [...earned]
      .sort((a, b) => (b.earnedAt || '').localeCompare(a.earnedAt || ''))
      .slice(0, 5)
  ), [earned])

  const categoryProgress = useMemo(() => (
    rootCategories.map(cat => {
      const catAchs = achievements.filter(a => a.categoryId === cat.id || a.categoryId?.startsWith(cat.id))
      const total = catAchs.length
      const earnedCount = catAchs.filter(a => a.isEarned).length
      return { cat, earnedCount, total }
    }).filter(x => x.total > 0)
  ), [categories, achievements])

  const tierCounts = useMemo(() => (
    TIERS.reduce((acc, tier) => {
      acc[tier] = earned.filter(a => a.tier === tier).length
      return acc
    }, {})
  ), [earned])

  const hasDetailPanel = !!selectedAchievement

  return (
    <div className="h-full overflow-y-auto bg-[#F8FAFC] scrollbar-thin">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">

        {/* ── Global Stats Header ──────────────────────────────────── */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-card px-8 py-6 space-y-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Achievement Showcase</h1>

          {/* Stats row */}
          <div className="grid grid-cols-6 gap-4 border-b border-slate-100 pb-6">
            {[
              { label: 'Total', value: achievements.length },
              { label: 'Earned', value: earned.length, accent: '#22c55e' },
              { label: 'Locked', value: locked.length, accent: '#94a3b8' },
              { label: 'Records', value: records.length, accent: '#0066FF' },
              { label: 'Longest Streak', value: `${longestStreak}d`, accent: '#CC4204' },
              {
                label: 'Rarest Earned',
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
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-1">By Tier</span>
            {TIERS.map(tier => (
              <div key={tier} className="flex items-center gap-1.5">
                <TrophyTierBadge tier={tier} size="sm" />
                <span className="text-sm font-bold text-slate-700">{tierCounts[tier] || 0}</span>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Achievements Earned (Last 6 Months)
            </div>
            <AchievementTimeline achievements={achievements} />
          </div>
        </section>

        {/* ── WoW-style Browser ────────────────────────────────────── */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
          <div className="flex" style={{ minHeight: 500 }}>

            {/* Left: category list */}
            <div className="w-48 flex-shrink-0 border-r border-slate-200 py-3 overflow-y-auto scrollbar-thin">
              <button
                onClick={() => { setSelectedCategoryId(null); setSelectedAchievement(null) }}
                className={[
                  'w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors',
                  selectedCategoryId === null
                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                    : 'hover:bg-slate-50 text-slate-600',
                ].join(' ')}
              >
                All
              </button>
              {rootCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategoryId(cat.id); setSelectedAchievement(null) }}
                  className={[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors',
                    selectedCategoryId === cat.id
                      ? 'bg-primary/10 text-primary font-semibold border-r-2 border-primary'
                      : 'hover:bg-slate-50 text-slate-600',
                  ].join(' ')}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Right: content */}
            <div className="flex flex-1 min-w-0">

              {/* Achievement list / default panel */}
              <div className={`overflow-y-auto scrollbar-thin p-4 space-y-3 ${hasDetailPanel ? 'w-1/2' : 'flex-1'}`}>

                {/* ── Default view (no category selected) ── */}
                {!selectedCategoryId && (
                  <>
                    {/* Recent unlocks */}
                    {recentUnlocks.length > 0 && (
                      <div className="mb-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Recent Unlocks
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

                    {/* Category progress */}
                    {categoryProgress.length > 0 && (
                      <div className="mb-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Category Progress
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

                    {/* Elite Achievements — replaces the general earned list */}
                    <EliteAchievementsSection
                      achievements={achievements}
                      onSelect={setSelectedAchievement}
                      selectedId={selectedAchievement?.id}
                    />
                  </>
                )}

                {/* ── Category view ── */}
                {selectedCategoryId && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      {categories.find(c => c.id === selectedCategoryId)?.name} Achievements
                    </h3>
                    {filteredAchievements.length === 0 && (
                      <div className="text-sm text-slate-400 py-6 text-center">
                        No achievements in this category
                      </div>
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
                )}
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
