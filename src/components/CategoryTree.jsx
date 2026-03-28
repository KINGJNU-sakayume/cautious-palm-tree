import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { buildTree, getDescendantIds } from '@/utils/categoryTree.js'
import { useApp } from '@/context/AppContext.jsx'

// ── MoveToPopup ─────────────────────────────────────────────────────────────
// Recursive tree node rendered inside the move-to picker popup.

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
        title={isInvalid ? 'Cannot move a node into itself or its descendants' : undefined}
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

/**
 * Full-tree popup for selecting a new parent.
 * nodeId — the category being moved (it and its descendants are disabled).
 * onSelect(newParentId) — called with null for "make root", or a valid category id.
 */
function MoveToPopup({ nodeId, x, y, onClose, onSelect }) {
  const { categories } = useApp()
  const popupRef = useRef(null)

  // Delay attaching the outside-click handler by one tick to avoid
  // the same click that opened the popup from immediately closing it.
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  // The node itself and all its descendants are invalid drop targets.
  const invalidIds = new Set([nodeId, ...getDescendantIds(nodeId, categories)])
  const tree = buildTree(categories)

  // Keep popup on screen.
  const clampedX = Math.min(x, window.innerWidth - 232)
  const clampedY = Math.min(y, window.innerHeight - 340)

  return ReactDOM.createPortal(
    <div
      ref={popupRef}
      className="fixed z-[60] bg-white border border-slate-200 rounded-xl shadow-xl w-56 overflow-hidden"
      style={{ top: clampedY, left: clampedX }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Move to…</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm leading-none">✕</button>
      </div>

      {/* Make Root shortcut */}
      <button
        onClick={() => onSelect(null)}
        className="w-full text-left px-3 py-2.5 text-sm text-primary font-semibold hover:bg-primary/5 flex items-center gap-2 border-b border-slate-100"
      >
        <span className="text-base leading-none">↑</span>
        <span>Make Root (no parent)</span>
      </button>

      {/* Category tree */}
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

// ── ContextMenu ──────────────────────────────────────────────────────────────

function ContextMenu({ x, y, node, onClose, onRename, onAddChild, onDelete, onOpenMovePopup }) {
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
        <span>✏️</span> Rename
      </button>
      <button
        onClick={() => { onAddChild(node.id); onClose() }}
        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
      >
        <span>➕</span> Add Child
      </button>
      <button
        onClick={() => { onOpenMovePopup(); onClose() }}
        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
      >
        <span>📂</span> Move to…
      </button>
      <hr className="my-1 border-slate-100" />
      <button
        onClick={() => { onDelete(node.id); onClose() }}
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <span>🗑️</span> Delete
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
  onSelect,
  onRename,
  onAddChild,
  onDelete,
  onReparent,
  renamingId,
  onRenameSubmit,
  setRenamingId,
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const [contextMenu, setContextMenu] = useState(null)   // { x, y } | null
  const [movePopup, setMovePopup] = useState(null)       // { x, y } | null
  const [renameValue, setRenameValue] = useState(node.name)
  const renameRef = useRef(null)

  const hasChildren = node.children && node.children.length > 0
  const isSelected = node.id === selectedId
  const isRenaming = node.id === renamingId

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
    const y = Math.min(e.clientY, window.innerHeight - 180)
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

  // Open the MoveToPopup to the right of where the context menu was.
  const handleOpenMovePopup = () => {
    if (!contextMenu) return
    const px = Math.min(contextMenu.x + 168, window.innerWidth - 232)
    const py = contextMenu.y
    setMovePopup({ x: px, y: py })
  }

  // Called when the user picks a target in the MoveToPopup.
  const handleMoveTo = (newParentId) => {
    onReparent(node.id, newParentId)
    setMovePopup(null)
  }

  return (
    <div>
      {/* Row */}
      <div
        className={[
          'group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer select-none transition-colors',
          isSelected
            ? 'bg-primary/10 border-l-2 border-primary text-primary font-semibold'
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

        {/* Hover action button */}
        {!isRenaming && (
          <button
            onClick={(e) => { e.stopPropagation(); openContextMenu(e) }}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded flex-shrink-0"
          >
            ⋯
          </button>
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

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onRename={onRename}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onReparent={onReparent}
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

export default function CategoryTree({ selectedId, onSelect, searchQuery = '' }) {
  const { categories, addCategory, renameCategory, deleteCategory, reparentCategory } = useApp()
  const [renamingId, setRenamingId] = useState(null)

  const filtered = searchQuery
    ? categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : categories

  const tree = buildTree(filtered)

  const handleAddChild = useCallback((parentId) => {
    const cat = addCategory({ name: 'New Category', parentId })
    setRenamingId(cat.id)
  }, [addCategory])

  const handleRenameSubmit = useCallback((id, name) => {
    if (name.trim()) renameCategory(id, name.trim())
  }, [renameCategory])

  const handleDelete = useCallback((id) => {
    if (window.confirm('Delete this category and all its subcategories? Records will be preserved.')) {
      deleteCategory(id)
    }
  }, [deleteCategory])

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
          onSelect={onSelect}
          onRename={setRenamingId}
          onAddChild={handleAddChild}
          onDelete={handleDelete}
          onReparent={handleReparent}
          renamingId={renamingId}
          onRenameSubmit={handleRenameSubmit}
          setRenamingId={setRenamingId}
        />
      ))}
      {tree.length === 0 && (
        <div className="text-xs text-slate-400 px-3 py-2">No categories found</div>
      )}
    </div>
  )
}
