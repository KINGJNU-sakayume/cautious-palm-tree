import React from 'react'
import { formatDate } from '@/utils/formatters.js'
import { getCategoryPath } from '@/utils/categoryTree.js'
import { useApp } from '@/context/AppContext.jsx'

export default function RecordCard({ record, showDate = false, compact = false }) {
  const { categories } = useApp()

  const path = getCategoryPath(record.categoryId, categories)
  const pathLabel = path.map(c => c.name).join(' › ') || 'Unknown Category'

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-card px-4 py-3 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {showDate && (
            <div className="text-xs font-medium text-primary mb-1">{formatDate(record.date)}</div>
          )}
          <div className="text-xs text-slate-400 truncate mb-1">{pathLabel}</div>
          {(record.value != null || record.unit) && (
            <div className="text-base font-bold text-slate-800">
              {record.value != null ? record.value : '—'}
              {record.unit && <span className="text-sm font-medium text-slate-500 ml-1">{record.unit}</span>}
            </div>
          )}
          {record.memo && (
            <p className={`text-sm text-slate-600 ${compact ? 'truncate' : 'mt-1'}`}>{record.memo}</p>
          )}
        </div>
        {record.photoUrl && (
          <img
            src={record.photoUrl}
            alt="Record photo"
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        )}
      </div>
    </div>
  )
}
