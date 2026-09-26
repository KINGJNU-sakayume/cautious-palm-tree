import React, { useMemo } from 'react'
import { todayStr } from '@/utils/dates.js'
import { formatMonth } from '@/utils/formatters.js'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons.jsx'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function shiftMonth(yyyyMm, delta) {
  const [y, m] = yyyyMm.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function cellStyle(count) {
  if (count === 0) return 'bg-sunken text-ink-3'
  if (count === 1) return 'bg-accent/25 text-ink'
  if (count <= 3) return 'bg-accent/55 text-ink'
  return 'bg-accent text-accent-on'
}

/**
 * Month calendar shaded by how many records each day has.
 * Days with records are buttons that jump to that day in the feed.
 */
export default function ActivityCalendar({ records, month, onMonthChange, onDayClick, highlightedDate = null }) {
  const today = todayStr()

  const counts = useMemo(() => {
    const map = new Map()
    for (const r of records) {
      if (r.date?.startsWith(month)) map.set(r.date, (map.get(r.date) || 0) + 1)
    }
    return map
  }, [records, month])

  const cells = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    const lead = new Date(y, m - 1, 1).getDay()
    const days = new Date(y, m, 0).getDate()
    return [
      ...Array(lead).fill(null),
      ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
    ]
  }, [month])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => onMonthChange(shiftMonth(month, -1))} className="icon-btn w-8 h-8" aria-label="이전 달">
          <ChevronLeftIcon size={18} />
        </button>
        <span className="text-base font-semibold text-ink">{formatMonth(month)}</span>
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(month, 1))}
          className="icon-btn w-8 h-8 disabled:opacity-30 disabled:hover:bg-transparent"
          disabled={month >= today.slice(0, 7)}
          aria-label="다음 달"
        >
          <ChevronRightIcon size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs text-ink-3">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} />
          const count = counts.get(date) || 0
          const day = Number(date.slice(8))
          const ring = date === highlightedDate
            ? 'ring-2 ring-warn'
            : date === today ? 'ring-1 ring-ink/40' : ''
          const className = `aspect-square rounded-md flex items-center justify-center text-xs font-medium tabular ${cellStyle(count)} ${ring}`
          return count > 0 ? (
            <button
              key={date}
              type="button"
              onClick={() => onDayClick(date)}
              className={`${className} hover:ring-2 hover:ring-accent transition-shadow`}
              aria-label={`${Number(date.slice(5, 7))}월 ${day}일, 기록 ${count}개`}
            >
              {day}
            </button>
          ) : (
            <div key={date} className={className} aria-hidden="true">{day}</div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-ink-3">
        적음
        {[0, 1, 2, 4].map(n => <span key={n} className={`w-3 h-3 rounded-sm ${cellStyle(n)}`} />)}
        많음
      </div>
    </div>
  )
}
