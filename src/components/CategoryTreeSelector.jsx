import React, { useState, useRef, useEffect } from 'react'
import { buildTree, getCategoryPath } from '@/utils/categoryTree.js'
import { useApp } from '@/context/AppContext.jsx'

function TreePickerNode({ node, depth, onSelect, expandedIds, toggleExpand }) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedIds.has(node.id)

  return (
    <div>
      <div
        className="flex items-center gap-1 px-3 py-1.5 hover:bg-slate-100 cursor-pointer rounded"
        style={{ paddingLeft: `${(depth * 12) + 12}px` }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); toggleExpand(node.id) }}
          className={`w-4 h-4 flex items-center justify-center text-slate-400 flex-shrink-0 transition-transform ${
            isExpanded ? '' : '-rotate-90'
          } ${hasChildren ? 'visible' : 'invisible'}`}
        >
          ▾
        </button>
        <span
          className="flex-1 text-sm text-slate-700 truncate"
          onClick={() => onSelect(node.id)}
        >
          {node.name}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <TreePickerNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CategoryTreeSelector({ value, onChange, placeholder = 'Select category...' }) {
  const { categories } = useApp()
  const [open, setOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState(new Set())
  const containerRef = useRef(null)
  const tree = buildTree(categories)

  // Build path label for selected value
  const selectedPath = value ? getCategoryPath(value, categories).map(c => c.name).join(' › ') : ''

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelect = (id) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-left hover:border-primary focus:outline-none focus:border-primary transition-colors"
      >
        <span className={selectedPath ? 'text-slate-800 truncate' : 'text-slate-400'}>
          {selectedPath || placeholder}
        </span>
        <span className={`text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-panel max-h-64 overflow-y-auto animate-fade-in">
          <div className="py-1">
            {tree.map(node => (
              <TreePickerNode
                key={node.id}
                node={node}
                depth={0}
                onSelect={handleSelect}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
