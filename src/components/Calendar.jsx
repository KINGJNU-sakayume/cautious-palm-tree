import React, { useState } from 'react'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa']

export default function Calendar({ records = [], selectedDate, onSelectDate }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-indexed

  // Build set of date strings with records
  const recordDateSet = new Set(records.map(r => r.date))

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
  const startDow = firstDay.getDay() // 0=Sun
  const daysInMonth = lastDay.getDate()

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const pad = (n) => String(n).padStart(2, '0')

  const handleDayClick = (day) => {
    if (!day) return
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
    if (recordDateSet.has(dateStr)) {
      onSelectDate && onSelectDate(dateStr)
    }
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          ‹
        </button>
        <span className="text-sm font-bold text-slate-800">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-400 uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
          const hasRecord = recordDateSet.has(dateStr)
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate

          return (
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              className={[
                'relative flex flex-col items-center rounded-lg py-1 text-xs font-medium transition-colors',
                hasRecord ? 'cursor-pointer hover:bg-primary/10' : 'cursor-default',
                isSelected ? 'bg-primary text-white' : '',
                isToday && !isSelected ? 'font-extrabold text-primary' : '',
                !isSelected && !isToday ? 'text-slate-600' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span>{day}</span>
              {hasRecord && (
                <span
                  className={`w-1 h-1 rounded-full mt-0.5 ${
                    isSelected ? 'bg-white' : 'bg-primary'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
