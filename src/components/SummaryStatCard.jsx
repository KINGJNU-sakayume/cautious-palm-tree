import React from 'react'

export default function SummaryStatCard({ label, value, icon, accent, sub }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card px-4 py-4 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg leading-none">{icon}</span>}
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
          {label}
        </span>
      </div>
      <div
        className="text-2xl font-extrabold leading-tight truncate"
        style={accent ? { color: accent } : {}}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-slate-400 truncate">{sub}</div>}
    </div>
  )
}
