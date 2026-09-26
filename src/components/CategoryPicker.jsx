import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import { buildTree, getCategoryPath, getCategoryPathLabel, visibleIdsForQuery } from '@/utils/categoryTree.js'
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, SearchIcon } from './Icons.jsx'

/**
 * Searchable, expandable category list. Used inside CategoryPicker and in
 * sheets that only need to pick a category.
 */
export function CategoryList({ value, onChange, allowNone = false, noneLabel = '카테고리 없음', disabledIds = null, maxHeight = 256 }) {
  const { categories } = useApp()
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(
    () => new Set(value ? getCategoryPath(value, categories).slice(0, -1).map(c => c.id) : []),
  )

  const tree = useMemo(() => buildTree(categories), [categories])
  const visible = useMemo(() => visibleIdsForQuery(query, categories), [query, categories])

  const toggle = (categoryId) => setExpanded(prev => {
    const next = new Set(prev)
    if (next.has(categoryId)) next.delete(categoryId)
    else next.add(categoryId)
    return next
  })

  const rowClass = (selected, disabled) => [
    'flex-1 min-w-0 flex items-center gap-2 h-9 px-2.5 rounded-lg text-left text-base transition-colors',
    selected ? 'bg-accent-soft text-accent-ink font-semibold' : 'text-ink hover:bg-sunken',
    disabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : '',
  ].join(' ')

  const renderNode = (node, depth) => {
    if (visible && !visible.has(node.id)) return null
    const hasChildren = node.children.length > 0
    const isOpen = visible ? true : expanded.has(node.id)
    const isSelected = node.id === value
    const isDisabled = !!disabledIds?.has(node.id)
    return (
      <li key={node.id}>
        <div className="flex items-center" style={{ paddingLeft: depth * 16 }}>
          <button
            type="button"
            onClick={() => toggle(node.id)}
            className={`w-8 h-8 flex-shrink-0 inline-flex items-center justify-center rounded-md text-ink-3 hover:text-ink ${hasChildren && !visible ? '' : 'invisible'}`}
            aria-label={isOpen ? `${node.name} 접기` : `${node.name} 펼치기`}
            tabIndex={hasChildren && !visible ? 0 : -1}
          >
            {isOpen ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
          </button>
          <button type="button" disabled={isDisabled} onClick={() => onChange(node.id)} className={rowClass(isSelected, isDisabled)}>
            <span className="truncate">{node.name}</span>
            {isSelected && <CheckIcon size={16} className="ml-auto flex-shrink-0" />}
          </button>
        </div>
        {hasChildren && isOpen && <ul>{node.children.map(child => renderNode(child, depth + 1))}</ul>}
      </li>
    )
  }

  return (
    <div>
      <div className="relative border-b border-line">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="카테고리 찾기"
          aria-label="카테고리 찾기"
          className="w-full h-10 pl-9 pr-3 bg-transparent text-base text-ink placeholder:text-ink-3 outline-none"
        />
      </div>
      <ul className="overflow-y-auto overscroll-contain scrollbar-thin p-1.5" style={{ maxHeight }}>
        {allowNone && !query && (
          <li className="flex items-center">
            <span className="w-8 flex-shrink-0" />
            <button type="button" onClick={() => onChange(null)} className={rowClass(!value, false)}>
              <span className="truncate">{noneLabel}</span>
              {!value && <CheckIcon size={16} className="ml-auto flex-shrink-0" />}
            </button>
          </li>
        )}
        {tree.map(node => renderNode(node, 0))}
        {visible && visible.size === 0 && (
          <li className="px-3 py-4 text-sm text-ink-3 text-center">'{query}' 검색 결과가 없어요.</li>
        )}
      </ul>
    </div>
  )
}

/**
 * Category select that expands in place (no floating popover), so it works
 * inside sheets and scroll containers on any screen size.
 */
export default function CategoryPicker({
  value,
  onChange,
  placeholder = '카테고리 선택',
  allowNone = false,
  noneLabel = '카테고리 없음',
  disabledIds = null,
  id,
}) {
  const { categories } = useApp()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const selectedLabel = value ? getCategoryPathLabel(value, categories) : ''

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div ref={rootRef}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="input flex items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className={`truncate ${selectedLabel || (allowNone && !value) ? 'text-ink' : 'text-ink-3'}`}>
          {selectedLabel || (allowNone ? noneLabel : placeholder)}
        </span>
        <ChevronDownIcon size={16} className={`flex-shrink-0 text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-2 card shadow-card overflow-hidden animate-fade-in">
          <CategoryList
            value={value}
            onChange={(next) => { onChange(next); setOpen(false) }}
            allowNone={allowNone}
            noneLabel={noneLabel}
            disabledIds={disabledIds}
          />
        </div>
      )}
    </div>
  )
}
