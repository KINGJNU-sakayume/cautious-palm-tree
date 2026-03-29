import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import ActivityHeatmap from '@/components/ActivityHeatmap.jsx'
import RecordCard from '@/components/RecordCard.jsx'
import RecordEditor from '@/components/RecordEditor.jsx'
import UnlockLogCard from '@/components/UnlockLogCard.jsx'
import FilterBar from '@/components/FilterBar.jsx'
import { formatDate, todayStr, dateToMonth } from '@/utils/formatters.js'
import { getCategoryPath } from '@/utils/categoryTree.js'
import { JUMP_HIGHLIGHT_MS } from '@/constants/timing.js'

const BATCH_SIZE = 30

function computeMonthStats(records, yyyyMm) {
  const monthRecords = records.filter(r => r.date && r.date.startsWith(yyyyMm))

  const total = monthRecords.length

  const dateSet = new Set(monthRecords.map(r => r.date))
  const activeDays = dateSet.size

  // Longest consecutive streak within the month
  const sortedDates = Array.from(dateSet).sort()
  let longest = sortedDates.length > 0 ? 1 : 0
  let current = sortedDates.length > 0 ? 1 : 0
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1])
    const cur = new Date(sortedDates[i])
    const diff = (cur - prev) / (1000 * 60 * 60 * 24)
    if (diff === 1) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }

  // This week count (Sun–Sat week containing today)
  const today = new Date(todayStr())
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const thisWeek = monthRecords.filter(r => r.date >= fmt(weekStart) && r.date <= fmt(weekEnd)).length

  // Top dates by record count for quick jump
  const countByDate = {}
  monthRecords.forEach(r => { countByDate[r.date] = (countByDate[r.date] || 0) + 1 })
  const topDates = Object.entries(countByDate)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([date, count]) => ({ date, count }))

  return { total, activeDays, longestStreak: longest, thisWeek, topDates }
}

export default function RecordHub() {
  const { records, achievements, categories, deleteRecord } = useApp()

  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768)
  const [editingRecord, setEditingRecord] = useState(null)

  const [filters, setFilters] = useState({
    categories: [],
    type: 'all',
    search: '',
  })

  const [currentMonth, setCurrentMonth] = useState(() => todayStr().slice(0, 7))
  const [jumpedDate, setJumpedDate] = useState(null)
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)

  const feedRef = useRef(null)
  const sentinelRef = useRef(null)
  const headerObserverRef = useRef(null)
  const jumpTimerRef = useRef(null)

  // ── Build feed entries: records + achievement unlocks ──
  const allEntries = useMemo(() => {
    const entries = []
    records.forEach(r => {
      entries.push({ kind: 'record', date: r.date, record: r })
      ;(r.unlockedAchievementIds || []).forEach(achId => {
        const ach = achievements.find(a => a.id === achId)
        if (ach) entries.push({ kind: 'achievement', date: r.date, achievement: ach })
      })
    })
    return entries
  }, [records, achievements])

  // ── Filter entries (no date range — category, type, search only) ──
  const searchTerms = useMemo(
    () => filters.search.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [filters.search]
  )

  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      if ((filters.categories || []).length > 0) {
        if (entry.kind === 'record' && !filters.categories.includes(entry.record.categoryId)) return false
        if (entry.kind === 'achievement' && !filters.categories.includes(entry.achievement.categoryId)) return false
      }
      if (filters.type === 'records' && entry.kind !== 'record') return false
      if (filters.type === 'achievements' && entry.kind !== 'achievement') return false
      if (searchTerms.length > 0 && entry.kind === 'record') {
        const r = entry.record
        const catPath = getCategoryPath(r.categoryId, categories).map(c => c.name).join(' ').toLowerCase()
        const memo = (r.memo || '').toLowerCase()
        const tags = (r.tags || []).join(' ').toLowerCase()
        const combined = `${catPath} ${memo} ${tags}`
        if (!searchTerms.every(t => combined.includes(t))) return false
      }
      return true
    })
  }, [allEntries, filters.categories, filters.type, searchTerms, categories])

  // ── Group by date, newest first ──
  const groupedEntries = useMemo(() => {
    const groups = new Map()
    filteredEntries.forEach(entry => {
      if (!groups.has(entry.date)) groups.set(entry.date, [])
      groups.get(entry.date).push(entry)
    })
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredEntries])

  // ── Slice for infinite scroll ──
  const visibleGroups = useMemo(
    () => groupedEntries.slice(0, visibleCount),
    [groupedEntries, visibleCount]
  )
  const allLoaded = visibleCount >= groupedEntries.length

  // Reset visibleCount when filters change
  useEffect(() => { setVisibleCount(BATCH_SIZE) }, [filters])

  // ── Sentinel IntersectionObserver (load more) ──
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !allLoaded) {
          setVisibleCount(v => v + BATCH_SIZE)
        }
      },
      { rootMargin: '200px' }
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [allLoaded])

  // ── Header IntersectionObserver (heatmap month sync) ──
  useEffect(() => {
    if (headerObserverRef.current) headerObserverRef.current.disconnect()

    const obs = new IntersectionObserver(
      (entries) => {
        // Find the entry nearest the top of the viewport
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length === 0) return
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const topEntry = visible[0]
        const dateStr = topEntry.target.dataset.date
        if (dateStr) {
          const month = dateStr.slice(0, 7)
          setCurrentMonth(prev => prev !== month ? month : prev)
        }
      },
      { rootMargin: '-10% 0px -70% 0px' }
    )
    headerObserverRef.current = obs

    // Observe all rendered date headers
    const headers = feedRef.current?.querySelectorAll('[data-date]')
    headers?.forEach(el => obs.observe(el))

    return () => obs.disconnect()
  }, [visibleGroups])

  // ── Scroll to date on heatmap click ──
  const handleHeatmapDateClick = useCallback((dateStr) => {
    if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current)
    setJumpedDate(dateStr)
    const el = document.getElementById(`date-${dateStr}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    jumpTimerRef.current = setTimeout(() => setJumpedDate(null), JUMP_HIGHLIGHT_MS)
  }, [])

  useEffect(() => () => { if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current) }, [])

  // ── Monthly stats ──
  const monthStats = useMemo(() => computeMonthStats(records, currentMonth), [records, currentMonth])

  return (
    <div className="flex h-full min-h-0">

      {/* ── Left: Sidebar ─────────────────────────────────── */}
      <div
        className={[
          'flex-shrink-0 h-full border-r border-slate-200 bg-white scrollbar-thin',
          'transition-[width] duration-300 overflow-hidden',
          sidebarOpen ? 'w-72' : 'w-10',
        ].join(' ')}
      >
        {/* Panel header — always visible */}
        <div className="flex items-center justify-between px-3 pt-4 pb-2">
          {sidebarOpen && (
            <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">활동</h2>
          )}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            title={sidebarOpen ? '사이드바 접기' : '사이드바 펼치기'}
            className={[
              'flex items-center justify-center w-6 h-6 rounded-md text-slate-400',
              'hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0',
              !sidebarOpen && 'mx-auto',
            ].join(' ')}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {sidebarOpen && (
          <div className="px-4 pb-4 space-y-4 overflow-y-auto h-[calc(100%-48px)] scrollbar-thin">
            {/* Activity Heatmap */}
            <ActivityHeatmap
              records={records}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onDateClick={handleHeatmapDateClick}
              jumpedDate={jumpedDate}
            />

            {/* Divider */}
            <div className="border-t border-slate-200" />

            {/* Monthly summary stats */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-700">
                월간 요약
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: '총 기록', value: `${monthStats.total}건` },
                  { label: '활동일', value: `${monthStats.activeDays}일` },
                  { label: '최장 연속', value: <span style={{ color: '#378ADD' }}>{monthStats.longestStreak}일</span> },
                  { label: '이번 주', value: `${monthStats.thisWeek}건` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className="text-xl font-medium text-slate-800">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick jump */}
            {monthStats.topDates.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  빠른 이동
                </h3>
                <div className="space-y-1">
                  {monthStats.topDates.map(({ date, count }) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => handleHeatmapDateClick(date)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                    >
                      <span className="text-[10px] text-slate-600">{formatDate(date)}</span>
                      <span className="flex items-center gap-1 text-[9px] text-slate-400 group-hover:text-primary transition-colors">
                        {count}건 ↓
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right: Feed ──────────────────────────────────────────── */}
      <div ref={feedRef} className="flex-1 min-w-0 h-full overflow-y-auto bg-[#F8FAFC] scrollbar-thin">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">

          {/* Page header */}
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-type-page font-medium text-slate-900 whitespace-nowrap">
              기록 허브
              <span className="ml-2 text-sm font-normal text-slate-400">
                · 전체 {filteredEntries.length}건
              </span>
            </h1>
            {/* Search input */}
            <div className="relative flex-shrink-0 w-48">
              <input
                type="search"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                placeholder="메모, 태그, 카테고리 검색"
                className="w-full pl-7 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-primary bg-white"
              />
              <svg
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
          </div>

          {/* Filter bar */}
          <FilterBar filters={filters} onChange={setFilters} />

          {/* Feed groups */}
          {visibleGroups.length > 0 ? (
            <>
              {visibleGroups.map(([date, entries]) => {
                const isJumped = jumpedDate === date
                return (
                  <div
                    key={date}
                    id={`date-${date}`}
                    data-date={date}
                  >
                    {/* Date group header */}
                    <div
                      className="flex items-center gap-3 mb-2 sticky top-0 py-1 z-10 transition-colors"
                      style={{
                        background: '#F8FAFC',
                        borderLeft: isJumped ? '2px solid #D85A30' : '2px solid transparent',
                        paddingLeft: isJumped ? 6 : 8,
                      }}
                    >
                      <h3
                        className="whitespace-nowrap transition-colors"
                        style={{
                          fontSize: 9,
                          fontWeight: 500,
                          color: isJumped ? '#D85A30' : '#94a3b8',
                        }}
                      >
                        {formatDate(date)}
                      </h3>
                      <div className="flex-1 border-t border-slate-200" />
                      <span className="text-[9px] text-slate-400 whitespace-nowrap">
                        {entries.length}건
                      </span>
                    </div>

                    {/* Entries */}
                    <div className="space-y-1.5 pl-1">
                      {entries.map((entry, i) =>
                        entry.kind === 'record'
                          ? (
                            <RecordCard
                              key={`r-${entry.record.id}-${i}`}
                              record={entry.record}
                              onEdit={setEditingRecord}
                              highlightTerms={searchTerms.length > 0 ? searchTerms : undefined}
                            />
                          )
                          : <UnlockLogCard key={`a-${entry.achievement.id}-${i}`} achievement={entry.achievement} />
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Sentinel + status */}
              <div ref={sentinelRef} className="h-4" />
              {allLoaded ? (
                <p className="text-center text-xs text-slate-400 py-4">모두 불러왔습니다</p>
              ) : (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <span className="text-5xl mb-4">📭</span>
              <p className="text-lg font-medium">항목이 없습니다</p>
              <p className="text-sm mt-1">필터를 조정해 보세요</p>
            </div>
          )}
        </div>
      </div>

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
