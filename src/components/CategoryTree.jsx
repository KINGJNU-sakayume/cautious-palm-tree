import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { buildTree, getDescendantIds, getCategoryPath } from '@/utils/categoryTree.js'
import { useApp } from '@/context/AppContext.jsx'
import { useCategoryDefaults } from '@/hooks/useCategoryDefaults.js'
import { useConfirm } from '@/hooks/useConfirm.jsx'
import {
  PencilIcon, PlusIcon, FolderIcon, TrashIcon, DotsIcon,
  StarIcon, StarFilledIcon, SettingsIcon, XIcon, CheckIcon,
} from '@/components/Icons.jsx'

// ── MoveToPopup ─────────────────────────────────────────────────────────────

function MoveToPopupNode({ node, depth, invalidIds, onSelect }) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0
  const isInvalid = invalidIds.has(node.id)

  return (
    <div>
      <div
        className={[
          'flex items-center gap-1 py-1.5 rounded-md text-sm select-none transition-colors',
          isInvalid
            ? 'opacity-35 cursor-not-allowed text-slate-400'
            : 'cursor-pointer hover:bg-primary/10 hover:text-primary text-slate-700',
        ].join(' ')}
        style={{ paddingLeft: `${depth * 12 + 8}px`, paddingRight: 8 }}
        onClick={() => !isInvalid && onSelect(node.id)}
        title={isInvalid ? '자기 자신 또는 하위 항목으로 이동할 수 없습니다' : undefined}
      >
        <span
          onClick={e => { e.stopPropagation(); if (hasChildren) setExpanded(v => !v) }}
          className={`w-4 h-4 inline-flex items-center justify-center text-slate-400 flex-shrink-0 text-xs ${hasChildren ? 'cursor-pointer' : 'invisible'}`}
        >
          {expanded ? '▾' : '▸'}
        </span>
        <span className="truncate">{node.name}</span>
        {isInvalid && (
          <span className="ml-1 text-[10px] text-slate-400 flex-shrink-0">✕</span>
        )}
      </div>
      {hasChildren && expanded && node.children.map(child => (
        <MoveToPopupNode
          key={child.id}
          node={child}
          depth={depth + 1}
          invalidIds={invalidIds}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function MoveToPopup({ nodeId, x, y, onClose, onSelect }) {
  const { categories } = useApp()
  const popupRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  const invalidIds = new Set([nodeId, ...getDescendantIds(nodeId, categories)])
  const tree = buildTree(categories)

  const clampedX = Math.min(x, window.innerWidth - 232)
  const clampedY = Math.min(y, window.innerHeight - 340)

  return ReactDOM.createPortal(
    <div
      ref={popupRef}
      className="fixed z-[60] bg-white border border-slate-200 rounded-xl shadow-xl w-56 overflow-hidden"
      style={{ top: clampedY, left: clampedX }}
    >
      <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Move to…</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm leading-none">✕</button>
      </div>
      <button
        onClick={() => onSelect(null)}
        className="w-full text-left px-3 py-2.5 text-sm text-primary font-medium hover:bg-primary/5 flex items-center gap-2 border-b border-slate-100"
      >
        <span className="text-base leading-none">↑</span>
        <span>Make Root (no parent)</span>
      </button>
      <div className="max-h-60 overflow-y-auto scrollbar-thin py-1">
        {tree.length === 0 && (
          <p className="text-xs text-slate-400 px-3 py-2">No categories available</p>
        )}
        {tree.map(node => (
          <MoveToPopupNode
            key={node.id}
            node={node}
            depth={0}
            invalidIds={invalidIds}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>,
    document.body
  )
}

// ── DefaultSettingsPanel ─────────────────────────────────────────────────────

function DefaultSettingsPanel({ categoryId, categoryName, x, y, onClose }) {
  const { getDefaults, setDefaultUnit, setDefaultTags, setAutoApply } = useCategoryDefaults()
  const panelRef = useRef(null)
  const [defaults, setDefaults] = useState(() => getDefaults(categoryId))
  const [unitInput, setUnitInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [addingUnit, setAddingUnit] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  const clampedX = Math.min(x, window.innerWidth - 264)
  const clampedY = Math.min(y, window.innerHeight - 320)

  const handleSetUnit = () => {
    const trimmed = unitInput.trim()
    if (trimmed) {
      setDefaultUnit(categoryId, trimmed)
      setDefaults(getDefaults(categoryId))
    }
    setAddingUnit(false)
    setUnitInput('')
  }

  const handleRemoveUnit = () => {
    setDefaultUnit(categoryId, '')
    setDefaults(prev => ({ ...prev, defaultUnit: '' }))
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !defaults.defaultTags.includes(trimmed)) {
      const next = [...defaults.defaultTags, trimmed]
      setDefaultTags(categoryId, next)
      setDefaults(prev => ({ ...prev, defaultTags: next }))
    }
    setTagInput('')
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddTag() }
    if (e.key === 'Escape') { setTagInput(''); }
  }

  const handleRemoveTag = (tag) => {
    const next = defaults.defaultTags.filter(t => t !== tag)
    setDefaultTags(categoryId, next)
    setDefaults(prev => ({ ...prev, defaultTags: next }))
  }

  const handleToggleAutoApply = () => {
    const next = !defaults.autoApply
    setAutoApply(categoryId, next)
    setDefaults(prev => ({ ...prev, autoApply: next }))
  }

  return ReactDOM.createPortal(
    <div
      ref={panelRef}
      className="fixed z-[60] bg-white border border-slate-200 rounded-xl shadow-xl w-64 overflow-hidden animate-fade-in"
      style={{ top: clampedY, left: clampedX }}
    >
      <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600 truncate">기본 설정 — {categoryName}</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
          <XIcon size={13} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Default unit */}
        <div>
          <div className="text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">기본 단위</div>
          {defaults.defaultUnit ? (
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
              {defaults.defaultUnit}
              <button type="button" onClick={handleRemoveUnit} className="hover:text-red-500">
                <XIcon size={10} />
              </button>
            </span>
          ) : addingUnit ? (
            <div className="flex gap-1">
              <input
                autoFocus
                type="text"
                value={unitInput}
                onChange={e => setUnitInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSetUnit(); if (e.key === 'Escape') setAddingUnit(false) }}
                placeholder="예: kg"
                className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-primary"
              />
              <button onClick={handleSetUnit} className="px-2 py-1 bg-primary text-white text-xs rounded-md">
                <CheckIcon size={11} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingUnit(true)}
              className="text-xs text-primary hover:underline"
            >
              + 단위 추가
            </button>
          )}
        </div>

        {/* Default tags */}
        <div>
          <div className="text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">기본 태그</div>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {defaults.defaultTags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                  <XIcon size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="태그 입력 후 Enter"
              className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-primary"
            />
            <button onClick={handleAddTag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md hover:bg-slate-200">
              +
            </button>
          </div>
        </div>

        {/* Auto-apply toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={handleToggleAutoApply}
            className={[
              'w-8 h-4 rounded-full transition-colors flex items-center px-0.5',
              defaults.autoApply ? 'bg-primary' : 'bg-slate-300',
            ].join(' ')}
          >
            <div className={[
              'w-3 h-3 bg-white rounded-full shadow transition-transform',
              defaults.autoApply ? 'translate-x-4' : 'translate-x-0',
            ].join(' ')} />
          </div>
          <span className="text-xs text-slate-600">폼에 자동 적용</span>
        </label>
      </div>
    </div>,
    document.body
  )
}

// ── ContextMenu ──────────────────────────────────────────────────────────────

function ContextMenu({ x, y, node, onClose, onRename, onAddChild, onDelete, onOpenMovePopup, onOpenDefaultSettings }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[160px] animate-fade-in"
      style={{ top: y, left: x }}
    >
      <button
        onClick={() => { onRename(node.id); onClose() }}
        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
      >
        <PencilIcon size={13} className="text-slate-400" /> Rename
      </button>
      <button
        onClick={() => { onAddChild(node.id); onClose() }}
        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
      >
        <PlusIcon size={13} className="text-slate-400" /> Add Child
      </button>
      <button
        onClick={() => { onOpenMovePopup(); onClose() }}
        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
      >
        <FolderIcon size={13} className="text-slate-400" /> Move to…
      </button>
      <button
        onClick={() => { onOpenDefaultSettings(node.id); onClose() }}
        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
      >
        <SettingsIcon size={13} className="text-slate-400" /> Default settings
      </button>
      <hr className="my-1 border-slate-100" />
      <button
        onClick={() => { onDelete(node.id); onClose() }}
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <TrashIcon size={13} className="text-red-400" /> Delete
      </button>
    </div>,
    document.body
  )
}

// ── TreeNode ─────────────────────────────────────────────────────────────────

function TreeNode({
  node,
  depth,
  selectedId,
  activePath,
  favorites,
  onSelect,
  onRename,
  onAddChild,
  onDelete,
  onReparent,
  onToggleFavorite,
  renamingId,
  onRenameSubmit,
  setRenamingId,
}) {
  const [expanded, setExpanded] = useState(() => activePath.has(node.id))
  const [contextMenu, setContextMenu] = useState(null)
  const [movePopup, setMovePopup] = useState(null)
  const [defaultSettingsOpen, setDefaultSettingsOpen] = useState(null) // { x, y } | null
  const [renameValue, setRenameValue] = useState(node.name)
  const dotsButtonRef = useRef(null)
  const renameRef = useRef(null)

  const hasChildren = node.children && node.children.length > 0
  const isSelected = node.id === selectedId
  const isRenaming = node.id === renamingId
  const isFav = favorites.includes(node.id)

  // Auto-expand when node enters the active path
  useEffect(() => {
    if (activePath.has(node.id)) setExpanded(true)
  }, [activePath, node.id])

  useEffect(() => {
    if (isRenaming && renameRef.current) {
      renameRef.current.focus()
      renameRef.current.select()
      setRenameValue(node.name)
    }
  }, [isRenaming, node.name])

  const openContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const x = Math.min(e.clientX, window.innerWidth - 170)
    const y = Math.min(e.clientY, window.innerHeight - 220)
    setContextMenu({ x, y })
  }

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      onRenameSubmit(node.id, renameValue)
      setRenamingId(null)
    } else if (e.key === 'Escape') {
      setRenamingId(null)
    }
  }

  const handleOpenMovePopup = () => {
    if (!contextMenu) return
    const px = Math.min(contextMenu.x + 168, window.innerWidth - 232)
    const py = contextMenu.y
    setMovePopup({ x: px, y: py })
  }

  const handleMoveTo = (newParentId) => {
    onReparent(node.id, newParentId)
    setMovePopup(null)
  }

  const handleOpenDefaultSettings = () => {
    if (dotsButtonRef.current) {
      const rect = dotsButtonRef.current.getBoundingClientRect()
      setDefaultSettingsOpen({ x: rect.right + 4, y: rect.top })
    } else {
      setDefaultSettingsOpen({ x: 200, y: 100 })
    }
  }

  return (
    <div>
      {/* Row */}
      <div
        className={[
          'group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer select-none transition-colors',
          isSelected
            ? 'bg-primary/10 border-l-2 border-primary text-primary font-medium'
            : 'hover:bg-slate-100 text-slate-700',
        ].join(' ')}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(node.id)}
        onContextMenu={openContextMenu}
      >
        {/* Expand / collapse */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
          className={`w-4 h-4 flex items-center justify-center text-slate-400 flex-shrink-0 transition-transform ${
            expanded ? '' : '-rotate-90'
          } ${hasChildren ? 'visible' : 'invisible'}`}
        >
          ▾
        </button>

        {/* Name / rename input */}
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={() => { onRenameSubmit(node.id, renameValue); setRenamingId(null) }}
            onClick={e => e.stopPropagation()}
            className="flex-1 text-sm bg-white border border-primary rounded px-1 py-0 outline-none focus:ring-1 focus:ring-primary"
          />
        ) : (
          <span className="flex-1 text-sm truncate">{node.name}</span>
        )}

        {/* Hover action buttons */}
        {!isRenaming && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(node.id) }}
              className={[
                'w-5 h-5 flex items-center justify-center rounded flex-shrink-0 transition-opacity',
                isFav ? 'opacity-100 text-amber-400' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-amber-400',
              ].join(' ')}
              aria-label={isFav ? '즐겨찾기 제거' : '즐겨찾기 추가'}
            >
              {isFav ? <StarFilledIcon size={12} /> : <StarIcon size={12} />}
            </button>
            <button
              ref={dotsButtonRef}
              onClick={(e) => { e.stopPropagation(); openContextMenu(e) }}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded flex-shrink-0"
            >
              <DotsIcon size={13} />
            </button>
          </>
        )}
      </div>

      {/* Context menu portal */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={node}
          onClose={() => setContextMenu(null)}
          onRename={(id) => { setRenamingId(id); setExpanded(true) }}
          onAddChild={(id) => { onAddChild(id); setExpanded(true) }}
          onDelete={onDelete}
          onOpenMovePopup={handleOpenMovePopup}
          onOpenDefaultSettings={handleOpenDefaultSettings}
        />
      )}

      {/* Move-to popup portal */}
      {movePopup && (
        <MoveToPopup
          nodeId={node.id}
          x={movePopup.x}
          y={movePopup.y}
          onClose={() => setMovePopup(null)}
          onSelect={handleMoveTo}
        />
      )}

      {/* Default settings panel portal */}
      {defaultSettingsOpen && (
        <DefaultSettingsPanel
          categoryId={node.id}
          categoryName={node.name}
          x={defaultSettingsOpen.x}
          y={defaultSettingsOpen.y}
          onClose={() => setDefaultSettingsOpen(null)}
        />
      )}

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              activePath={activePath}
              favorites={favorites}
              onSelect={onSelect}
              onRename={onRename}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onReparent={onReparent}
              onToggleFavorite={onToggleFavorite}
              renamingId={renamingId}
              onRenameSubmit={onRenameSubmit}
              setRenamingId={setRenamingId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── CategoryTree (root export) ────────────────────────────────────────────────

export default function CategoryTree({ selectedId, onSelect, searchQuery = '', favorites = [], onToggleFavorite }) {
  const { categories, addCategory, renameCategory, deleteCategory, reparentCategory } = useApp()
  const [renamingId, setRenamingId] = useState(null)
  const { confirmDialog, confirm } = useConfirm()

  const filtered = searchQuery
    ? categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : categories

  const tree = buildTree(filtered)

  // Compute the set of IDs from root to the selected category (for auto-expand)
  const activePath = useMemo(() => {
    if (!selectedId) return new Set()
    return new Set(getCategoryPath(selectedId, categories).map(c => c.id))
  }, [selectedId, categories])

  const handleAddChild = useCallback((parentId) => {
    const cat = addCategory({ name: 'New Category', parentId })
    setRenamingId(cat.id)
  }, [addCategory])

  const handleRenameSubmit = useCallback((id, name) => {
    if (name.trim()) renameCategory(id, name.trim())
  }, [renameCategory])

  const handleDelete = useCallback(async (id) => {
    const confirmed = await confirm(
      '카테고리 삭제',
      '이 카테고리와 모든 하위 항목을 삭제할까요?\n기록은 보존됩니다.'
    )
    if (!confirmed) return
    deleteCategory(id)
  }, [deleteCategory, confirm])

  const handleReparent = useCallback((id, newParentId) => {
    reparentCategory(id, newParentId)
  }, [reparentCategory])

  return (
    <div className="space-y-0.5">
      {tree.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          activePath={activePath}
          favorites={favorites}
          onSelect={onSelect}
          onRename={setRenamingId}
          onAddChild={handleAddChild}
          onDelete={handleDelete}
          onReparent={handleReparent}
          onToggleFavorite={onToggleFavorite ?? (() => {})}
          renamingId={renamingId}
          onRenameSubmit={handleRenameSubmit}
          setRenamingId={setRenamingId}
        />
      ))}
      {tree.length === 0 && (
        <div className="text-xs text-slate-400 px-3 py-2">No categories found</div>
      )}
      {confirmDialog}
    </div>
  )
}
