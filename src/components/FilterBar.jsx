import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import { getCategoryPath } from '@/utils/categoryTree.js'

export default function FilterBar({ filters, onChange }) {
  const { categories } = useApp()
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const catDropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setCatDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleCategory = (id) => {
    const current = filters.categories || []
    const next = current.includes(id)
      ? current.filter(c => c !== id)
      : [...current, id]
    onChange({ ...filters, categories: next })
  }

  const selectedCatLabels = (filters.categories || [])
    .map(id => {
      const path = getCategoryPath(id, categories)
      return path[path.length - 1]?.name || id
    })
    .join(', ')

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-card">
      {/* Date range */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
          From
        </label>
        <input
          type="date"
          value={filters.startDate || ''}
          onChange={e => onChange({ ...filters, startDate: e.target.value })}
          className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
          To
        </label>
        <input
          type="date"
          value={filters.endDate || ''}
          onChange={e => onChange({ ...filters, endDate: e.target.value })}
          className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {/* Category multi-select */}
      <div ref={catDropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setCatDropdownOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:border-primary transition-colors"
        >
          <span className="text-slate-500">
            {(filters.categories || []).length === 0
              ? 'All Categories'
              : selectedCatLabels || `${filters.categories.length} selected`}
          </span>
          <span className="text-slate-400">▾</span>
        </button>

        {catDropdownOpen && (
          <div className="absolute z-20 top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-panel max-h-64 overflow-y-auto animate-fade-in">
            <div className="p-2 space-y-0.5">
              <button
                type="button"
                onClick={() => onChange({ ...filters, categories: [] })}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  (filters.categories || []).length === 0
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(filters.categories || []).includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700 truncate">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Type toggle */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
        {['all', 'records', 'achievements'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => onChange({ ...filters, type: t })}
            className={[
              'px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors',
              filters.type === t
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {t === 'all' ? 'All' : t === 'records' ? 'Records' : 'Achievements'}
          </button>
        ))}
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={() => onChange({ startDate: '', endDate: '', categories: [], type: 'all' })}
        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        Reset
      </button>
    </div>
  )
}
