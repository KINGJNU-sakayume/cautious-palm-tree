import React, { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import Sidebar from '@/components/Sidebar.jsx'
import SummaryStatCard from '@/components/SummaryStatCard.jsx'
import RecordEditor from '@/components/RecordEditor.jsx'
import RecordCard from '@/components/RecordCard.jsx'
import AchievementCard from '@/components/AchievementCard.jsx'
import TrophyTierBadge from '@/components/TrophyTierBadge.jsx'
import ProgressBar from '@/components/ProgressBar.jsx'
import { getCategoryPath, getDirectChildren, getDescendantIds } from '@/utils/categoryTree.js'
import { formatDate, conditionSummaryText } from '@/utils/formatters.js'

function computeStreak(records, categoryId) {
  const dateset = new Set(
    records.filter(r => r.categoryId === categoryId).map(r => r.date)
  )
  const today = new Date()
  let count = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    if (dateset.has(s)) count++
    else break
  }
  return count
}

function ChildCategoryGroup({ category, achievements, records }) {
  const [expanded, setExpanded] = useState(false)
  const catAchievements = achievements.filter(a => a.categoryId === category.id)
  const earned = catAchievements.filter(a => a.isEarned).length
  const total = catAchievements.length

  if (total === 0) return null

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`text-slate-400 transition-transform ${expanded ? '' : '-rotate-90'}`}>▾</span>
          <span className="font-semibold text-sm text-slate-700">{category.name}</span>
        </div>
        <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full font-medium">
          {earned} / {total} 획득
        </span>
      </button>

      {expanded && (
        <div className="p-3 grid grid-cols-2 gap-2 bg-white">
          {catAchievements.map(a => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { categories, records, achievements } = useApp()
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories.find(c => c.parentId === null)?.id || null
  )

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)
  const breadcrumb = selectedCategoryId
    ? getCategoryPath(selectedCategoryId, categories).map(c => c.name).join(' › ')
    : ''

  // Direct records in this category
  const categoryRecords = useMemo(
    () => records.filter(r => r.categoryId === selectedCategoryId),
    [records, selectedCategoryId]
  )

  // Achievements directly linked to this node
  const categoryAchievements = useMemo(
    () => achievements.filter(a => a.categoryId === selectedCategoryId),
    [achievements, selectedCategoryId]
  )

  const earnedAchievements = categoryAchievements.filter(a => a.isEarned)
  const inProgressAchievements = categoryAchievements.filter(a => !a.isEarned)

  // Stats
  const streak = selectedCategoryId ? computeStreak(records, selectedCategoryId) : 0
  const latestRecord = categoryRecords.length > 0
    ? [...categoryRecords].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null
  const recentRecords = [...categoryRecords]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)

  // Direct children
  const directChildren = getDirectChildren(selectedCategoryId, categories)

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 h-full overflow-hidden">
        <Sidebar
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      </div>

      {/* Main panel */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto bg-neutral-50 scrollbar-thin">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {/* Header */}
          {selectedCategory ? (
            <>
              <div>
                <div className="text-xs text-slate-400 font-medium mb-1">{breadcrumb}</div>
                <h1 className="text-2xl font-extrabold text-slate-900">{selectedCategory.name}</h1>
              </div>

              {/* Summary stat cards */}
              <div className="grid grid-cols-4 gap-3">
                <SummaryStatCard
                  label="기록"
                  value={categoryRecords.length}
                  icon="📋"
                  accent="#0066FF"
                />
                <SummaryStatCard
                  label="업적"
                  value={`${earnedAchievements.length} / ${categoryAchievements.length}`}
                  icon="🏆"
                  accent="#f59e0b"
                />
                <SummaryStatCard
                  label="현재 연속"
                  value={`${streak}d`}
                  icon="🔥"
                  accent={streak >= 7 ? '#CC4204' : '#5B75BA'}
                />
                <SummaryStatCard
                  label="최근 기록"
                  value={latestRecord ? formatDate(latestRecord.date) : '—'}
                  icon="📅"
                />
              </div>

              {/* Record editor */}
              <RecordEditor selectedCategoryId={selectedCategoryId} />

              {/* Recent records */}
              {recentRecords.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                    최근 기록
                  </h2>
                  <div className="space-y-2">
                    {recentRecords.map(r => (
                      <RecordCard key={r.id} record={r} showDate />
                    ))}
                  </div>
                </section>
              )}

              {/* Earned achievements */}
              {earnedAchievements.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                    획득 ({earnedAchievements.length})
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {earnedAchievements.map(a => (
                      <AchievementCard key={a.id} achievement={a} />
                    ))}
                  </div>
                </section>
              )}

              {/* In progress / locked achievements */}
              {inProgressAchievements.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                    진행 중 / 잠김 ({inProgressAchievements.length})
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {inProgressAchievements.map(a => (
                      <AchievementCard key={a.id} achievement={a} />
                    ))}
                  </div>
                </section>
              )}

              {/* Child category groups */}
              {directChildren.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                    하위 카테고리
                  </h2>
                  <div className="space-y-3">
                    {directChildren.map(child => (
                      <ChildCategoryGroup
                        key={child.id}
                        category={child}
                        achievements={achievements}
                        records={records}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <span className="text-5xl mb-4">📁</span>
              <p className="text-lg font-semibold">시작할 카테고리를 선택하세요</p>
              <p className="text-sm mt-1">또는 사이드바에서 새로 만드세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
