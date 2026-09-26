import React from 'react'
import { useApp } from '@/context/AppContext.jsx'
import { useUI } from '@/context/UIContext.jsx'
import { getCategoryPath } from '@/utils/categoryTree.js'
import { formatAmount, formatDayLabel } from '@/utils/formatters.js'

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Wraps search terms in <mark>. */
export function Highlight({ text, terms }) {
  if (!text || !terms?.length) return text ?? null
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi')
  return text.split(pattern).map((part, i) =>
    i % 2 === 1
      ? <mark key={i} className="bg-warn-soft text-ink rounded px-0.5">{part}</mark>
      : <React.Fragment key={i}>{part}</React.Fragment>,
  )
}

/**
 * One record. The whole card opens the editor.
 * `showDate` adds the day to the small line above the value; `relativeTo`
 * shortens the category path when the list is already inside a category.
 */
export default function RecordCard({ record, showDate = false, relativeTo = null, highlightTerms, className = '' }) {
  const { categories } = useApp()
  const { openRecordEditor } = useUI()
  const path = record.categoryId ? getCategoryPath(record.categoryId, categories) : []
  const cut = relativeTo ? path.findIndex(c => c.id === relativeTo) : -1
  const categoryLabel = record.categoryId
    ? path.slice(cut + 1).map(c => c.name).join(' › ')
    : '미분류'
  const meta = [showDate && formatDayLabel(record.date), categoryLabel].filter(Boolean)
  const hasValue = record.value != null

  return (
    <button
      type="button"
      onClick={() => openRecordEditor({ record })}
      className={`group w-full text-left card px-4 py-3.5 flex gap-3 transition-colors hover:border-line-strong hover:bg-sunken/40 ${className}`}
      aria-label={`${meta.join(' · ')} 기록 수정`}
    >
      <span className="flex-1 min-w-0">
        {meta.length > 0 && (
          <span className="block text-xs text-ink-3 truncate">
            <Highlight text={meta.join(' · ')} terms={highlightTerms} />
          </span>
        )}
        {hasValue && (
          <span className="block mt-0.5 text-lg font-bold text-ink tabular tracking-tight">
            {formatAmount(record.value, record.unit)}
          </span>
        )}
        {record.memo && (
          <span className={`block text-base text-ink whitespace-pre-line line-clamp-3 ${hasValue ? 'mt-0.5' : 'mt-1'}`}>
            <Highlight text={record.memo} terms={highlightTerms} />
          </span>
        )}
        {!hasValue && !record.memo && (
          <span className="block mt-1 text-base text-ink-2">기록했어요</span>
        )}
        {record.tags?.length > 0 && (
          <span className="mt-2 flex flex-wrap gap-1">
            {record.tags.map(tag => (
              <span key={tag} className="tag">
                #<Highlight text={tag} terms={highlightTerms} />
              </span>
            ))}
          </span>
        )}
      </span>
      {record.photoUrl && (
        <img
          src={record.photoUrl}
          alt=""
          loading="lazy"
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-line"
        />
      )}
    </button>
  )
}
