import React, { useState, useMemo, useEffect } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import Sidebar from '@/components/Sidebar.jsx'
import SummaryStatCard from '@/components/SummaryStatCard.jsx'
import RecordEditor from '@/components/RecordEditor.jsx'
import RecordCard from '@/components/RecordCard.jsx'
import AchievementCard from '@/components/AchievementCard.jsx'
import TrophyTierBadge from '@/components/TrophyTierBadge.jsx'
import ProgressBar from '@/components/ProgressBar.jsx'
import {
  ClipboardIcon, TrophyIcon, FlameIcon, CalendarIcon, MenuIcon, XIcon,
} from '@/components/Icons.jsx'
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
          <span className="font-medium text-type-card text-slate-700">{category.name}</span>
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
  const { categories, records, achievements, deleteRecord } = useApp()
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories.find(c => c.parentId === null)?.id || null
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [quickLogOpen, setQuickLogOpen] = useState(false)

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)
  const breadcrumbPath = selectedCategoryId
    ? getCategoryPath(selectedCategoryId, categories)
    : []

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
    .slice(0, 5)

  // Direct children
  const directChildren = getDirectChildren(selectedCategoryId, categories)

  // Close quick log and edit modal on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setQuickLogOpen(false)
        setEditingRecord(null)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Close quick log when category changes
  useEffect(() => {
    setQuickLogOpen(false)
  }, [selectedCategoryId])

  return (
    <div className="flex h-full min-h-0">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={[
          'flex-shrink-0 h-full overflow-hidden z-30 transition-transform duration-300',
          'fixed md:static top-0 left-0 bottom-0',
          'w-56',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <Sidebar
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(id) => { setSelectedCategoryId(id); setSidebarOpen(false) }}
        />
      </div>

      {/* Main panel */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto bg-neutral-50 scrollbar-thin">
        <div className="px-6 py-6 space-y-6">
          {/* Mobile sidebar toggle */}
          <button
            className="md:hidden flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 -mt-2 -ml-1 mb-0 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors self-start"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon size={18} />
            <span>카테고리</span>
          </button>

          {/* Header */}
          {selectedCategory ? (
            <>
              <div className="flex items-start justify-between gap-4">
                {/* Breadcrumb + title */}
                <div>
                  <nav className="flex items-center gap-1 text-type-secondary text-slate-400 mb-1 flex-wrap">
                    {breadcrumbPath.map((segment, i) => (
                      <React.Fragment key={segment.id}>
                        {i > 0 && <span className="select-none">›</span>}
                        <button
                          onClick={() => setSelectedCategoryId(segment.id)}
                          className={[
                            'transition-colors',
                            i === breadcrumbPath.length - 1
                              ? 'text-slate-600 font-medium cursor-default'
                              : 'hover:text-slate-600 hover:underline',
                          ].join(' ')}
                        >
                          {segment.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </nav>
                  <h1 className="text-type-page font-medium text-slate-900">{selectedCategory.name}</h1>
                </div>

                {/* Quick Log button */}
                <button
                  onClick={() => setQuickLogOpen(true)}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark active:scale-95 transition-all shadow-sm mt-1"
                >
                  <span className="text-base leading-none">+</span>
                  <span>기록추가</span>
                </button>
              </div>

              {/* Summary stat cards — full width 4-column row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SummaryStatCard
                  label="기록"
                  value={categoryRecords.length}
                  icon={<ClipboardIcon size={16} />}
                  accent="#0066FF"
                />
                <SummaryStatCard
                  label="업적"
                  value={`${earnedAchievements.length} / ${categoryAchievements.length}`}
                  icon={<TrophyIcon size={16} />}
                  accent="#f59e0b"
                />
                <SummaryStatCard
                  label="현재 연속"
                  value={`${streak}d`}
                  icon={<FlameIcon size={16} />}
                  accent={streak >= 7 ? '#CC4204' : '#5B75BA'}
                />
                <SummaryStatCard
                  label="최근 기록"
                  value={latestRecord ? formatDate(latestRecord.date) : '—'}
                  icon={<CalendarIcon size={16} />}
                />
              </div>

              {/* Two-column content area */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
                {/* Left column — Recent records */}
                <section>
                  <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500 mb-3">
                    최근 기록
                  </h2>
                  {recentRecords.length > 0 ? (
                    <div className="space-y-2">
                      {recentRecords.map(r => (
                        <RecordCard key={r.id} record={r} showDate onEdit={setEditingRecord} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 py-6 text-center bg-white border border-slate-100 rounded-xl">
                      아직 기록이 없습니다. 기록추가로 첫 기록을 추가해보세요!
                    </p>
                  )}
                </section>

                {/* Right column — Achievements */}
                <div className="space-y-6">
                  {earnedAchievements.length > 0 && (
                    <section>
                      <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500 mb-3">
                        획득 ({earnedAchievements.length})
                      </h2>
                      <div className="grid grid-cols-1 gap-3">
                        {earnedAchievements.map(a => (
                          <AchievementCard key={a.id} achievement={a} />
                        ))}
                      </div>
                    </section>
                  )}

                  {inProgressAchievements.length > 0 && (
                    <section>
                      <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500 mb-3">
                        진행 중 / 잠김 ({inProgressAchievements.length})
                      </h2>
                      <div className="grid grid-cols-1 gap-3">
                        {inProgressAchievements.map(a => (
                          <AchievementCard key={a.id} achievement={a} />
                        ))}
                      </div>
                    </section>
                  )}

                  {earnedAchievements.length === 0 && inProgressAchievements.length === 0 && (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      이 카테고리에는 아직 업적이 없습니다
                    </p>
                  )}
                </div>
              </div>

              {/* Child category groups — full width below grid */}
              {directChildren.length > 0 && (
                <section>
                  <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500 mb-3">
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
              <p className="text-lg font-medium">시작할 카테고리를 선택하세요</p>
              <p className="text-sm mt-1">또는 사이드바에서 새로 만드세요</p>
            </div>
          )}
        </div>
      </div>

      {/* 기록추가 modal */}
      {quickLogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setQuickLogOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <RecordEditor
              selectedCategoryId={selectedCategoryId}
              onClose={() => setQuickLogOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Edit record modal */}
      {editingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingRecord(null) }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <RecordEditor
              selectedCategoryId={editingRecord.categoryId}
              initialRecord={editingRecord}
              onClose={() => setEditingRecord(null)}
              onDelete={async (id) => { await deleteRecord(id); setEditingRecord(null) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
