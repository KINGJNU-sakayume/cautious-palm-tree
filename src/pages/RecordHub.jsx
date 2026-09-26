import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ActivityCalendar from '@/components/ActivityCalendar.jsx'
import RecordCard, { Highlight } from '@/components/RecordCard.jsx'
import RecordFab from '@/components/RecordFab.jsx'
import EmptyState from '@/components/EmptyState.jsx'
import Modal from '@/components/Modal.jsx'
import Medal, { TierLabel } from '@/components/Medal.jsx'
import { CategoryList } from '@/components/CategoryPicker.jsx'
import { useApp } from '@/context/AppContext.jsx'
import { useUI } from '@/context/UIContext.jsx'
import { getCategoryPathLabel, getSubtreeIds } from '@/utils/categoryTree.js'
import { addDays, longestStreak, todayStr, uniqueSortedDates } from '@/utils/dates.js'
import { formatDateWithWeekday, formatNumber } from '@/utils/formatters.js'
import { JUMP_HIGHLIGHT_MS } from '@/constants/timing.js'
import { CalendarIcon, ChevronDownIcon, FolderIcon, NotebookIcon, PlusIcon, SearchIcon, XIcon } from '@/components/Icons.jsx'

const GROUPS_PER_PAGE = 30
const TYPE_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'records', label: '기록' },
  { id: 'achievements', label: '업적 달성' },
]

function monthStats(records, month) {
  const inMonth = records.filter(r => r.date.startsWith(month))
  const dates = uniqueSortedDates(inMonth)
  return { count: inMonth.length, days: dates.length, streak: longestStreak(dates) }
}

function UnlockRow({ achievement, terms, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full flex items-center gap-3 rounded-2xl bg-accent-soft/60 px-4 py-2.5 text-left transition-colors hover:bg-accent-soft"
    >
      <Medal tier={achievement.tier} earned size={30} />
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold text-accent-ink">업적 달성</span>
        <span className="block text-base font-semibold text-ink truncate">
          <Highlight text={achievement.title} terms={terms} />
        </span>
      </span>
      <TierLabel tier={achievement.tier} />
    </button>
  )
}

export default function RecordHub() {
  const { records, achievements, categories } = useApp()
  const { openRecordEditor, openAchievement } = useUI()
  const location = useLocation()
  const navigate = useNavigate()

  const [categoryId, setCategoryId] = useState(() => location.state?.categoryId ?? null)
  const [type, setType] = useState('all')
  const [search, setSearch] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [month, setMonth] = useState(() => todayStr().slice(0, 7))
  const [highlighted, setHighlighted] = useState(null)
  const [pageCount, setPageCount] = useState(1)
  const [pendingJump, setPendingJump] = useState(null)
  const sentinelRef = useRef(null)
  const feedRef = useRef(null)
  const highlightTimer = useRef(null)

  // Clear router state so a refresh doesn't keep an old filter.
  useEffect(() => {
    if (location.state?.categoryId) navigate('.', { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeCategory = categoryId && categories.some(c => c.id === categoryId) ? categoryId : null
  const scope = useMemo(() => (activeCategory ? getSubtreeIds(activeCategory, categories) : null), [activeCategory, categories])
  const terms = useMemo(() => search.trim().toLowerCase().split(/\s+/).filter(Boolean), [search])

  const scopedRecords = useMemo(
    () => (scope ? records.filter(r => scope.has(r.categoryId)) : records),
    [records, scope],
  )

  const groups = useMemo(() => {
    const matches = (text) => terms.every(t => text.toLowerCase().includes(t))
    const byDate = new Map()
    const push = (date, entry) => {
      if (!byDate.has(date)) byDate.set(date, { records: [], unlocks: [] })
      byDate.get(date)[entry.kind === 'record' ? 'records' : 'unlocks'].push(entry.item)
    }

    if (type !== 'achievements') {
      for (const r of scopedRecords) {
        if (terms.length > 0) {
          const haystack = [
            r.categoryId ? getCategoryPathLabel(r.categoryId, categories) : '미분류',
            r.memo, (r.tags || []).join(' '), r.value != null ? `${r.value}${r.unit ?? ''}` : '',
          ].join(' ')
          if (!matches(haystack)) continue
        }
        push(r.date, { kind: 'record', item: r })
      }
    }
    if (type !== 'records') {
      for (const a of achievements) {
        if (!a.isEarned) continue
        if (scope && !scope.has(a.categoryId)) continue
        if (terms.length > 0 && !matches(`${a.title} ${a.description}`)) continue
        push(a.earnedAt, { kind: 'unlock', item: a })
      }
    }
    return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [scopedRecords, achievements, categories, scope, terms, type])

  const visibleGroups = groups.slice(0, pageCount * GROUPS_PER_PAGE)
  const hasMore = visibleGroups.length < groups.length
  const totalShown = groups.reduce((n, [, g]) => n + g.records.length + g.unlocks.length, 0)

  useEffect(() => { setPageCount(1) }, [activeCategory, type, search])

  // Load more date groups as the end of the list comes into view.
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setPageCount(p => p + 1)
    }, { rootMargin: '400px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, visibleGroups.length])

  // Follow the calendar month to whatever date is at the top of the feed.
  useEffect(() => {
    const headers = feedRef.current?.querySelectorAll('[data-date]')
    if (!headers?.length) return undefined
    const observer = new IntersectionObserver((entries) => {
      const top = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (top) setMonth(top.target.dataset.date.slice(0, 7))
    }, { rootMargin: '-64px 0px -70% 0px' })
    headers.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [visibleGroups])

  const jumpTo = useCallback((date) => {
    const index = groups.findIndex(([d]) => d === date)
    if (index < 0) return
    setCalendarOpen(false)
    if (index >= pageCount * GROUPS_PER_PAGE) setPageCount(Math.ceil((index + 1) / GROUPS_PER_PAGE))
    setPendingJump(date)
  }, [groups, pageCount])

  useEffect(() => {
    if (!pendingJump) return
    const el = document.getElementById(`day-${pendingJump}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setHighlighted(pendingJump)
    setPendingJump(null)
    clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setHighlighted(null), JUMP_HIGHLIGHT_MS)
  }, [pendingJump, visibleGroups])

  useEffect(() => () => clearTimeout(highlightTimer.current), [])

  const stats = useMemo(() => monthStats(scopedRecords, month), [scopedRecords, month])
  const today = todayStr()
  const yesterday = addDays(today, -1)
  const filtersActive = !!activeCategory || type !== 'all' || terms.length > 0

  const calendarPanel = (
    <>
      <ActivityCalendar
        records={scopedRecords}
        month={month}
        onMonthChange={setMonth}
        onDayClick={jumpTo}
        highlightedDate={highlighted}
      />
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[['기록', `${stats.count}개`], ['기록한 날', `${stats.days}일`], ['최장 연속', `${stats.streak}일`]].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-sunken px-2 py-2.5">
            <dt className="text-xs text-ink-2">{label}</dt>
            <dd className="mt-0.5 text-md font-bold text-ink tabular">{value}</dd>
          </div>
        ))}
      </dl>
    </>
  )

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 pt-5 md:pt-8 pb-28 md:pb-12 flex gap-8 items-start">
      <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-[calc(3.5rem+2rem)]">
        <div className="card p-4">{calendarPanel}</div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-ink">
            기록 <span className="text-lg font-semibold text-ink-3 tabular">{formatNumber(records.length)}</span>
          </h1>
          <button type="button" className="hidden md:inline-flex btn btn-primary" onClick={() => openRecordEditor({ categoryId: activeCategory })}>
            <PlusIcon size={18} strokeWidth={2.2} /> 기록하기
          </button>
        </header>

        <div className="mt-4 space-y-2.5">
          <div className="relative">
            <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="메모, 태그, 카테고리로 찾기"
              aria-label="기록 검색"
              className="input h-11 pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setPickerOpen(true)} className={`chip ${activeCategory ? 'chip-active' : ''}`}>
              <FolderIcon size={15} />
              <span className="max-w-[180px] truncate">
                {activeCategory ? categories.find(c => c.id === activeCategory)?.name : '모든 카테고리'}
              </span>
              <ChevronDownIcon size={14} />
            </button>
            <div className="flex items-center rounded-full bg-sunken p-0.5" role="group" aria-label="보기">
              {TYPE_FILTERS.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setType(f.id)}
                  aria-pressed={type === f.id}
                  className={`h-7 px-3 rounded-full text-sm font-medium transition-colors ${type === f.id ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setCalendarOpen(v => !v)} className={`lg:hidden chip ${calendarOpen ? 'chip-active' : ''}`} aria-expanded={calendarOpen}>
              <CalendarIcon size={15} /> 달력
            </button>
            {filtersActive && (
              <button
                type="button"
                onClick={() => { setCategoryId(null); setType('all'); setSearch('') }}
                className="text-sm font-medium text-ink-2 hover:text-ink px-1"
              >
                필터 지우기
              </button>
            )}
          </div>
        </div>

        {calendarOpen && <div className="lg:hidden mt-3 card p-4 animate-fade-in">{calendarPanel}</div>}

        <div ref={feedRef} className="mt-6">
          {groups.length === 0 ? (
            <div className="card">
              {records.length === 0 ? (
                <EmptyState
                  icon={<NotebookIcon size={22} />}
                  title="아직 기록이 없어요"
                  body="오늘 한 일을 하나 남겨 보세요. 기록이 쌓이면 여기에 날짜별로 모여요."
                  action={<button type="button" className="btn btn-sm btn-primary" onClick={() => openRecordEditor({})}>첫 기록 남기기</button>}
                />
              ) : (
                <EmptyState
                  icon={<SearchIcon size={22} />}
                  title="조건에 맞는 기록이 없어요"
                  body="검색어나 필터를 바꿔 보세요."
                  action={
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setCategoryId(null); setType('all'); setSearch('') }}>
                      <XIcon size={16} /> 필터 지우기
                    </button>
                  }
                />
              )}
            </div>
          ) : (
            <>
              {filtersActive && <p className="mb-3 text-sm text-ink-2">{formatNumber(totalShown)}개 찾았어요</p>}
              <div className="space-y-6">
                {visibleGroups.map(([date, group]) => (
                  <section key={date} id={`day-${date}`} data-date={date} className="scroll-mt-20" aria-label={formatDateWithWeekday(date)}>
                    <h2
                      className={[
                        'sticky top-14 z-10 -mx-1 px-1 py-2 bg-paper/95 backdrop-blur flex items-center gap-2 text-sm font-semibold transition-colors',
                        highlighted === date ? 'text-warn' : 'text-ink-2',
                      ].join(' ')}
                    >
                      {formatDateWithWeekday(date)}
                      {(date === today || date === yesterday) && (
                        <span className="tag h-5">{date === today ? '오늘' : '어제'}</span>
                      )}
                      <span className="ml-auto text-xs font-normal text-ink-3">
                        {group.records.length > 0 && `기록 ${group.records.length}`}
                        {group.records.length > 0 && group.unlocks.length > 0 && ' · '}
                        {group.unlocks.length > 0 && `업적 ${group.unlocks.length}`}
                      </span>
                    </h2>
                    <div className="mt-1 space-y-2">
                      {group.records.map(r => (
                        <RecordCard key={r.id} record={r} relativeTo={activeCategory} highlightTerms={terms} />
                      ))}
                      {group.unlocks.map(a => (
                        <UnlockRow key={a.id} achievement={a} terms={terms} onOpen={() => openAchievement(a.id)} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              <div ref={sentinelRef} className="h-8" />
              {!hasMore && groups.length > 3 && (
                <p className="py-4 text-center text-sm text-ink-3">여기까지가 모든 기록이에요.</p>
              )}
            </>
          )}
        </div>
      </div>

      <RecordFab categoryId={activeCategory} />

      <Modal open={pickerOpen} title="카테고리로 보기" size="sm" onClose={() => setPickerOpen(false)} bodyClassName="p-0">
        <CategoryList
          value={activeCategory}
          onChange={(id) => { setCategoryId(id); setPickerOpen(false) }}
          allowNone
          noneLabel="모든 카테고리"
          maxHeight={420}
        />
      </Modal>
    </div>
  )
}
