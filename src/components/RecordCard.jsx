import React from 'react'
import { formatDate } from '@/utils/formatters.js'
import { getCategoryPath } from '@/utils/categoryTree.js'
import { useApp } from '@/context/AppContext.jsx'

export default function RecordCard({ record, showDate = false, compact = false, onEdit }) {
  const { categories } = useApp()

  const path = getCategoryPath(record.categoryId, categories)
  const pathLabel = path.map(c => c.name).join(' › ') || 'Unknown Category'

  return (
    <div className="relative group bg-white border border-slate-200 rounded-lg shadow-card px-4 py-3 hover:shadow-card-hover transition-shadow">
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(record)}
          className="absolute top-2 right-2 p-1 rounded-md text-slate-300 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="기록 수정"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className={`flex-1 min-w-0 ${onEdit ? 'pr-6' : ''}`}>
          {showDate && (
            <div className="text-xs font-medium text-primary mb-1">{formatDate(record.date)}</div>
          )}
          <div className="text-xs text-slate-400 truncate mb-1">{pathLabel}</div>
          {(record.value != null || record.unit) && (
            <div className="text-base font-medium text-slate-800">
              {record.value != null ? record.value : '—'}
              {record.unit && <span className="text-sm font-medium text-slate-500 ml-1">{record.unit}</span>}
            </div>
          )}
          {record.memo && (
            <p className={`text-sm text-slate-600 ${compact ? 'truncate' : 'mt-1'}`}>{record.memo}</p>
          )}
          {record.tags && record.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {record.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
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
