import React, { useMemo } from 'react'
import { formatMonthYear } from '@/utils/formatters.js'

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토']

function getCellColor(count) {
  if (count === 0) return '#E2E8F0'
  if (count === 1) return '#B5D4F4'
  if (count <= 3) return '#378ADD'
  return '#185FA5'
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function shiftMonth(yyyyMm, delta) {
  const [y, m] = yyyyMm.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export default function ActivityHeatmap({
  records = [],
  currentMonth,       // 'YYYY-MM'
  onMonthChange,      // (YYYY-MM) => void
  onDateClick,        // (YYYY-MM-DD) => void
  jumpedDate = null,  // YYYY-MM-DD | null
}) {
  const todayStr = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  }, [])

  // Count records per day in this month
  const countMap = useMemo(() => {
    const map = new Map()
    records.forEach(r => {
      if (r.date && r.date.startsWith(currentMonth)) {
        map.set(r.date, (map.get(r.date) || 0) + 1)
      }
    })
    return map
  }, [records, currentMonth])

  // Build grid cells
  const cells = useMemo(() => {
    const [y, m] = currentMonth.split('-').map(Number)
    const firstDay = new Date(y, m - 1, 1)
    const daysInMonth = new Date(y, m, 0).getDate()
    const startDow = firstDay.getDay() // 0 = Sun
    const result = []
    for (let i = 0; i < startDow; i++) result.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      result.push(`${currentMonth}-${pad(d)}`)
    }
    return result
  }, [currentMonth])

  const handlePrev = () => onMonthChange && onMonthChange(shiftMonth(currentMonth, -1))
  const handleNext = () => onMonthChange && onMonthChange(shiftMonth(currentMonth, 1))

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card p-4 select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrev}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 transition-colors text-base leading-none"
        >
          ‹
        </button>
        <span className="text-xs font-semibold text-slate-700">
          {formatMonthYear(currentMonth + '-01')}
        </span>
        <button
          onClick={handleNext}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 transition-colors text-base leading-none"
        >
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(d => (
          <div
            key={d}
            className="text-center font-semibold text-slate-400 uppercase py-0.5"
            style={{ fontSize: 6 }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="grid grid-cols-7 gap-[3px]">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`empty-${i}`} style={{ aspectRatio: '1' }} />
          const count = countMap.get(dateStr) || 0
          const isToday = dateStr === todayStr
          const isJumped = dateStr === jumpedDate
          const bg = getCellColor(count)
          const outline = isJumped
            ? '2px solid #D85A30'
            : isToday
            ? '1.5px solid #378ADD'
            : 'none'
          const hasRecords = count > 0
          return (
            <div
              key={dateStr}
              title={`${dateStr}: ${count}건`}
              onClick={() => hasRecords && onDateClick && onDateClick(dateStr)}
              style={{
                aspectRatio: '1',
                backgroundColor: bg,
                outline,
                outlineOffset: '-1px',
                borderRadius: 3,
                cursor: hasRecords ? 'pointer' : 'default',
                transition: 'outline 0.15s',
              }}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        {['#E2E8F0', '#B5D4F4', '#378ADD', '#185FA5'].map((c, i) => (
          <div
            key={i}
            style={{ width: 10, height: 10, backgroundColor: c, borderRadius: 2, flexShrink: 0 }}
          />
        ))}
        <span className="text-[9px] text-slate-400 ml-0.5">밀도</span>
      </div>
    </div>
  )
}
