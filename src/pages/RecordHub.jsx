import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import Calendar from '@/components/Calendar.jsx'
import RecordCard from '@/components/RecordCard.jsx'
import RecordEditor from '@/components/RecordEditor.jsx'
import UnlockLogCard from '@/components/UnlockLogCard.jsx'
import FilterBar from '@/components/FilterBar.jsx'
import { formatDate, todayStr } from '@/utils/formatters.js'

function getDateMinus(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function RecordHub() {
  const { records, achievements, categories, deleteRecord } = useApp()

  const [calendarOpen, setCalendarOpen] = useState(() => window.innerWidth >= 768)
  const [editingRecord, setEditingRecord] = useState(null)

  const [filters, setFilters] = useState({
    startDate: getDateMinus(30),
    endDate: todayStr(),
    categories: [],
    type: 'all',
  })

  const [selectedDate, setSelectedDate] = useState(null)
  const dateRefs = useRef(new Map())
  const feedRef = useRef(null)

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

  // ── Filter entries ──
  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      if (filters.startDate && entry.date < filters.startDate) return false
      if (filters.endDate && entry.date > filters.endDate) return false
      if ((filters.categories || []).length > 0) {
        if (entry.kind === 'record' && !filters.categories.includes(entry.record.categoryId)) return false
        if (entry.kind === 'achievement' && !filters.categories.includes(entry.achievement.categoryId)) return false
      }
      if (filters.type === 'records' && entry.kind !== 'record') return false
      if (filters.type === 'achievements' && entry.kind !== 'achievement') return false
      return true
    })
  }, [allEntries, filters])

  // ── Group by date, newest first ──
  const groupedEntries = useMemo(() => {
    const groups = new Map()
    filteredEntries.forEach(entry => {
      if (!groups.has(entry.date)) groups.set(entry.date, [])
      groups.get(entry.date).push(entry)
    })
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredEntries])

  // ── Scroll to date when calendar date is selected ──
  useEffect(() => {
    if (!selectedDate) return
    const el = dateRefs.current.get(selectedDate)
    if (el && feedRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedDate])

  return (
    <div className="flex h-full min-h-0">

      {/* ── Left: Calendar panel ─────────────────────────────────── */}
      <div
        className={[
          'flex-shrink-0 h-full border-r border-slate-200 bg-white scrollbar-thin',
          'transition-[width] duration-300 overflow-hidden',
          calendarOpen ? 'w-72' : 'w-10',
        ].join(' ')}
      >
        {/* Panel header — always visible */}
        <div className="flex items-center justify-between px-3 pt-4 pb-2">
          {calendarOpen && (
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">캘린더</h2>
          )}
          <button
            onClick={() => setCalendarOpen(v => !v)}
            title={calendarOpen ? '캘린더 접기' : '캘린더 펼치기'}
            className={[
              'flex items-center justify-center w-6 h-6 rounded-md text-slate-400',
              'hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0',
              !calendarOpen && 'mx-auto',
            ].join(' ')}
          >
            {calendarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Collapsible content */}
        {calendarOpen && (
          <div className="px-4 pb-4 space-y-4 overflow-y-auto h-[calc(100%-48px)] scrollbar-thin">
            <Calendar
              records={records}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              <span>기록 있음</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Feed ──────────────────────────────────────────── */}
      <div ref={feedRef} className="flex-1 min-w-0 h-full overflow-y-auto bg-[#F8FAFC] scrollbar-thin">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-slate-900">기록 허브</h1>
            <span className="text-sm text-slate-400">{filteredEntries.length}개 항목</span>
          </div>

          {/* Filter bar */}
          <FilterBar filters={filters} onChange={setFilters} />

          {/* Feed groups */}
          {groupedEntries.length > 0 ? (
            groupedEntries.map(([date, entries]) => (
              <div
                key={date}
                ref={el => {
                  if (el) dateRefs.current.set(date, el)
                  else dateRefs.current.delete(date)
                }}
              >
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3 sticky top-0 bg-[#F8FAFC] py-1 z-10">
                  <h3 className="text-sm font-bold text-slate-700">{formatDate(date)}</h3>
                  <div className="flex-1 border-t border-slate-200" />
                  <span className="text-xs text-slate-400">
                    {entries.length}개 항목
                  </span>
                </div>

                {/* Entries */}
                <div className="space-y-2 pl-1">
                  {entries.map((entry, i) =>
                    entry.kind === 'record'
                      ? <RecordCard key={`r-${entry.record.id}-${i}`} record={entry.record} onEdit={setEditingRecord} />
                      : <UnlockLogCard key={`a-${entry.achievement.id}-${i}`} achievement={entry.achievement} />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <span className="text-5xl mb-4">📭</span>
              <p className="text-lg font-semibold">항목이 없습니다</p>
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
