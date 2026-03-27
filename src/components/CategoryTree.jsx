import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { buildTree } from '@/utils/categoryTree.js'
import { useApp } from '@/context/AppContext.jsx'

function ContextMenu({ x, y, node, onClose, onRename, onAddChild, onDelete }) {
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

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
  onRename,
  onAddChild,
  onDelete,
  renamingId,
  onRenameSubmit,
  setRenamingId,
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const [contextMenu, setContextMenu] = useState(null)
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

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const x = Math.min(e.clientX, window.innerWidth - 170)
    const y = Math.min(e.clientY, window.innerHeight - 120)
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

  return (
    <div>
      <div
        className={[
          'group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer select-none transition-colors',
          isSelected
            ? 'bg-primary/10 border-l-2 border-primary text-primary font-semibold'
            : 'hover:bg-slate-100 text-slate-700',
        ].join(' ')}
        style={{ paddingLeft: `${(depth * 12) + 8}px` }}
        onClick={() => onSelect(node.id)}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
          className={`w-4 h-4 flex items-center justify-center text-slate-400 flex-shrink-0 transition-transform ${
            expanded ? '' : '-rotate-90'
          } ${hasChildren ? 'visible' : 'invisible'}`}
        >
          ▾
        </button>

        {/* Node name or rename input */}
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

        {/* Inline actions (shown on hover) */}
        {!isRenaming && (
          <button
            onClick={(e) => { e.stopPropagation(); handleContextMenu(e) }}
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

export default function CategoryTree({ selectedId, onSelect, searchQuery = '' }) {
  const { categories, addCategory, renameCategory, deleteCategory } = useApp()
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
