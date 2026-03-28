import React from 'react'
import { formatDate } from '@/utils/formatters.js'
import { getCategoryPath } from '@/utils/categoryTree.js'
import { useApp } from '@/context/AppContext.jsx'

const CATEGORY_COLORS = {
  'cat-fitness':     '#F0997B',
  'cat-learning':    '#9FE1CB',
  'cat-mindfulness': '#AFA9EC',
  'cat-nutrition':   '#97C459',
  'cat-travel':      '#7EC8E3',
  'cat-creative':    '#F9C784',
  'cat-career':      '#A8C5DA',
  'cat-finance':     '#B5EAD7',
  'cat-tech':        '#C7B8EA',
  'cat-social':      '#FFB7B2',
}
const DEFAULT_ACCENT = '#CBD5E1'

function highlightText(text, terms) {
  if (!terms || terms.length === 0 || !text) return text
  const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-yellow-100 rounded-sm">{part}</mark>
      : part
  )
}

export default function RecordCard({ record, showDate = false, compact = false, onEdit, highlightTerms }) {
  const { categories } = useApp()

  const path = getCategoryPath(record.categoryId, categories)
  const rootId = path[0]?.id ?? null
  const accentColor = CATEGORY_COLORS[rootId] ?? DEFAULT_ACCENT

  // Show last 2 path segments
  const pathLabel = path.length > 0
    ? path.slice(-2).map(c => c.name).join(' › ')
    : 'Unknown'

  const terms = highlightTerms && highlightTerms.length > 0 ? highlightTerms : null

  return (
    <div
      className="relative group bg-white border border-slate-200 rounded-lg shadow-card hover:shadow-card-hover transition-shadow overflow-hidden"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(record)}
          className="absolute top-2 right-2 p-1 rounded-md text-slate-300 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100 z-10"
          aria-label="기록 수정"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      )}

      <div className="px-3 py-2.5">
        {showDate && (
          <div className="text-[9px] font-medium text-primary mb-1">{formatDate(record.date)}</div>
        )}

        {/* Top row: path (left) + value (right) */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div
            className="text-slate-400 truncate flex-shrink-0"
            style={{ fontSize: 7, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={path.map(c => c.name).join(' › ')}
          >
            {pathLabel}
          </div>

          {(record.value != null || record.unit) && (
            <div
              className="text-slate-800 flex-shrink-0 tabular-nums"
              style={{ fontSize: 11, fontWeight: 500 }}
            >
              {record.value != null ? record.value : '—'}
              {record.unit && (
                <span className="text-slate-500 ml-0.5" style={{ fontSize: 9 }}>{record.unit}</span>
              )}
            </div>
          )}
        </div>

        {/* Memo */}
        {record.memo && (
          <p
            className="text-slate-500 truncate"
            style={{ fontSize: 7 }}
          >
            {terms ? highlightText(record.memo, terms) : record.memo}
          </p>
        )}

        {/* Tags */}
        {record.tags && record.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {record.tags.map(tag => (
              <span
                key={tag}
                className="bg-primary/10 text-primary rounded-full px-1.5 py-px"
                style={{ fontSize: 9 }}
              >
                {terms ? highlightText(tag, terms) : tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
