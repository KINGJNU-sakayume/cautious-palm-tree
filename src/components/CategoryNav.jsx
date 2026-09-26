import React, { useEffect, useMemo, useRef, useState } from 'react'
import ActionMenu from './ActionMenu.jsx'
import CategoryPicker from './CategoryPicker.jsx'
import Modal from './Modal.jsx'
import Switch from './Switch.jsx'
import TagInput from './TagInput.jsx'
import { useApp } from '@/context/AppContext.jsx'
import { useToast } from '@/context/ToastContext.jsx'
import { useConfirm } from '@/hooks/useConfirm.jsx'
import { buildTree, getCategoryPath, getSubtreeIds, visibleIdsForQuery } from '@/utils/categoryTree.js'
import { josa } from '@/utils/josa.js'
import {
  ChevronDownIcon, ChevronRightIcon, DotsIcon, FolderIcon, PencilIcon, PlusIcon,
  SearchIcon, SettingsIcon, StarFilledIcon, StarIcon, TrashIcon,
} from './Icons.jsx'

// ── Dialogs ──────────────────────────────────────────────────────────────────

function MoveCategoryModal({ category, onClose }) {
  const { categories, moveCategory } = useApp()
  const toast = useToast()
  const [parentId, setParentId] = useState(category.parentId)
  const blocked = useMemo(() => getSubtreeIds(category.id, categories), [category.id, categories])

  const save = () => {
    moveCategory(category.id, parentId)
    toast.success(`'${category.name}' 위치를 옮겼어요.`)
    onClose()
  }

  return (
    <Modal
      title="위치 옮기기"
      size="sm"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
          <button type="button" className="btn btn-primary" onClick={save}>옮기기</button>
        </div>
      }
    >
      <p className="text-sm text-ink-2 mb-3">'{category.name}' 카테고리를 어디 아래에 둘까요?</p>
      <CategoryPicker value={parentId} onChange={setParentId} allowNone noneLabel="맨 위 (상위 카테고리 없음)" disabledIds={blocked} />
    </Modal>
  )
}

function CategoryDefaultsModal({ category, onClose }) {
  const { prefs, setCategoryDefaults } = useApp()
  const toast = useToast()
  const current = prefs.categoryDefaults[category.id] ?? { defaultUnit: '', defaultTags: [], autoApply: true }
  const [unit, setUnit] = useState(current.defaultUnit)
  const [tags, setTags] = useState(current.defaultTags)
  const [autoApply, setAutoApply] = useState(current.autoApply)

  const save = () => {
    setCategoryDefaults(category.id, { defaultUnit: unit.trim(), defaultTags: tags, autoApply })
    toast.success('기본값을 저장했어요.')
    onClose()
  }

  return (
    <Modal
      title={`${category.name} 기본값`}
      size="sm"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
          <button type="button" className="btn btn-primary" onClick={save}>저장</button>
        </div>
      }
    >
      <p className="text-sm text-ink-2 mb-4">이 카테고리에 새 기록을 남길 때 미리 채워 둘 값이에요.</p>
      <div className="space-y-4">
        <div>
          <label className="field-label" htmlFor="defaults-unit">기본 단위</label>
          <input id="defaults-unit" className="input" value={unit} onChange={e => setUnit(e.target.value)} placeholder="예: km" />
        </div>
        <div>
          <label className="field-label" htmlFor="defaults-tags">기본 태그</label>
          <TagInput id="defaults-tags" value={tags} onChange={setTags} />
        </div>
        <Switch id="defaults-auto" checked={autoApply} onChange={setAutoApply} label="새 기록에 자동으로 채우기" />
      </div>
    </Modal>
  )
}

// ── Tree ─────────────────────────────────────────────────────────────────────

function TreeRow({ node, depth, ctx }) {
  const { selectedId, onSelect, expanded, toggle, visible, favorites, toggleFavorite, renamingId, finishRename, openMenu } = ctx
  const [draft, setDraft] = useState(node.name)
  const inputRef = useRef(null)
  const isRenaming = renamingId === node.id
  const hasChildren = node.children.length > 0
  const isOpen = visible ? true : expanded.has(node.id)
  const isSelected = node.id === selectedId
  const isFavorite = favorites.includes(node.id)

  useEffect(() => {
    if (!isRenaming) return
    setDraft(node.name)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [isRenaming, node.name])

  if (visible && !visible.has(node.id)) return null

  return (
    <li>
      <div
        className={[
          'group flex items-center gap-0.5 h-9 pr-1 rounded-lg transition-colors',
          isSelected ? 'bg-accent-soft' : 'hover:bg-sunken',
        ].join(' ')}
        style={{ paddingLeft: depth * 14 }}
        onContextMenu={(e) => { e.preventDefault(); openMenu(node, { left: e.clientX, right: e.clientX, top: e.clientY, bottom: e.clientY }) }}
      >
        <button
          type="button"
          onClick={() => toggle(node.id)}
          className={`w-7 h-7 flex-shrink-0 inline-flex items-center justify-center rounded-md text-ink-3 hover:text-ink ${hasChildren ? '' : 'invisible'}`}
          aria-label={isOpen ? `${node.name} 접기` : `${node.name} 펼치기`}
          tabIndex={hasChildren ? 0 : -1}
        >
          {isOpen ? <ChevronDownIcon size={15} /> : <ChevronRightIcon size={15} />}
        </button>

        {isRenaming ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.nativeEvent.isComposing) return
              if (e.key === 'Enter') finishRename(node.id, draft)
              if (e.key === 'Escape') finishRename(node.id, null)
            }}
            onBlur={() => finishRename(node.id, draft)}
            className="flex-1 min-w-0 h-7 px-2 rounded-md bg-surface border border-accent text-base text-ink outline-none"
            aria-label="카테고리 이름"
          />
        ) : (
          <button
            type="button"
            onClick={() => onSelect(node.id)}
            onDoubleClick={() => ctx.startRename(node.id)}
            className={`flex-1 min-w-0 h-9 text-left truncate text-base ${isSelected ? 'font-semibold text-accent-ink' : 'text-ink'}`}
            aria-current={isSelected ? 'page' : undefined}
          >
            {node.name}
          </button>
        )}

        {!isRenaming && (
          <>
            <button
              type="button"
              onClick={() => toggleFavorite(node.id)}
              className={`w-7 h-7 flex-shrink-0 inline-flex items-center justify-center rounded-md ${isFavorite ? 'text-warn' : 'reveal-on-hover text-ink-3 hover:text-warn'}`}
              aria-label={isFavorite ? `${node.name} 즐겨찾기 해제` : `${node.name} 즐겨찾기`}
              aria-pressed={isFavorite}
            >
              {isFavorite ? <StarFilledIcon size={15} /> : <StarIcon size={15} />}
            </button>
            <button
              type="button"
              onClick={(e) => openMenu(node, e.currentTarget.getBoundingClientRect())}
              className="reveal-on-hover w-7 h-7 flex-shrink-0 inline-flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-surface"
              aria-label={`${node.name} 메뉴`}
              aria-haspopup="menu"
            >
              <DotsIcon size={16} />
            </button>
          </>
        )}
      </div>
      {hasChildren && isOpen && (
        <ul>{node.children.map(child => <TreeRow key={child.id} node={child} depth={depth + 1} ctx={ctx} />)}</ul>
      )}
    </li>
  )
}

/**
 * Category navigation: search, favourites and the editable tree.
 * Used as the Home sidebar and inside the category sheet on phones.
 */
export default function CategoryNav({ selectedId, onSelect, showTitle = true }) {
  const {
    categories, records, achievements, prefs,
    addCategory, renameCategory, deleteCategory, toggleFavorite,
  } = useApp()
  const toast = useToast()
  const { confirm, confirmDialog } = useConfirm()
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(() => new Set(getCategoryPath(selectedId, categories).map(c => c.id)))
  const [renamingId, setRenamingId] = useState(null)
  const [menu, setMenu] = useState(null)
  const [moving, setMoving] = useState(null)
  const [editingDefaults, setEditingDefaults] = useState(null)

  useEffect(() => {
    if (!selectedId) return
    setExpanded(prev => {
      const path = getCategoryPath(selectedId, categories).slice(0, -1).map(c => c.id)
      if (path.every(id => prev.has(id))) return prev
      return new Set([...prev, ...path])
    })
  }, [selectedId, categories])

  const tree = useMemo(() => buildTree(categories), [categories])
  const visible = useMemo(() => visibleIdsForQuery(query, categories), [query, categories])
  const favorites = prefs.favorites.map(id => categories.find(c => c.id === id)).filter(Boolean)

  const toggle = (id) => setExpanded(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const addChild = (parentId) => {
    const category = addCategory({ name: '새 카테고리', parentId })
    if (parentId) setExpanded(prev => new Set([...prev, parentId]))
    setQuery('')
    setRenamingId(category.id)
  }

  const finishRename = (id, name) => {
    setRenamingId(null)
    if (name != null) renameCategory(id, name)
  }

  const remove = async (category) => {
    const subtree = getSubtreeIds(category.id, categories)
    const childCount = subtree.size - 1
    const achievementCount = achievements.filter(a => subtree.has(a.categoryId)).length
    const recordCount = records.filter(r => subtree.has(r.categoryId)).length
    const parent = categories.find(c => c.id === category.parentId)
    const lines = []
    if (childCount > 0) lines.push(`하위 카테고리 ${childCount}개도 함께 지워져요.`)
    if (achievementCount > 0) lines.push(`이 카테고리의 업적 ${achievementCount}개도 함께 지워져요.`)
    if (recordCount > 0) {
      lines.push(parent
        ? `기록 ${recordCount}개는 지워지지 않고 '${parent.name}'${josa(parent.name, '으로/로')} 옮겨져요.`
        : `기록 ${recordCount}개는 지워지지 않고 '미분류'로 남아요.`)
    }
    const ok = await confirm(`'${category.name}' 카테고리를 삭제할까요?`, lines.join('\n') || '이 카테고리는 비어 있어요.', { confirmLabel: '삭제' })
    if (!ok) return
    deleteCategory(category.id)
    toast.success(`'${category.name}' 카테고리를 삭제했어요.`)
    if (subtree.has(selectedId)) onSelect(category.parentId ?? null)
  }

  const openMenu = (node, rect) => setMenu({ node, rect })

  const ctx = {
    selectedId, onSelect, expanded, toggle, visible,
    favorites: prefs.favorites, toggleFavorite,
    renamingId, finishRename, startRename: setRenamingId, openMenu,
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {showTitle && (
        <h2 className="px-4 pt-4 pb-2 text-sm font-semibold text-ink-2">카테고리</h2>
      )}
      <div className={`flex items-center gap-1.5 px-3 pb-2 ${showTitle ? '' : 'pt-3'}`}>
        <div className="relative flex-1">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="카테고리 찾기"
            className="input h-9 pl-9 bg-sunken border-transparent focus:bg-surface"
            aria-label="카테고리 찾기"
          />
        </div>
        <button type="button" onClick={() => addChild(null)} className="icon-btn flex-shrink-0" aria-label="카테고리 추가" title="카테고리 추가">
          <PlusIcon size={18} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin px-2 pb-4">
        {favorites.length > 0 && !query && (
          <div className="mb-2">
            <p className="px-2 pt-1 pb-1 text-xs font-semibold text-ink-3">즐겨찾기</p>
            <ul>
              {favorites.map(cat => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(cat.id)}
                    className={[
                      'w-full flex items-center gap-2 h-9 px-2 rounded-lg text-left text-base transition-colors',
                      cat.id === selectedId ? 'bg-accent-soft text-accent-ink font-semibold' : 'text-ink hover:bg-sunken',
                    ].join(' ')}
                  >
                    <StarFilledIcon size={14} className="text-warn flex-shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mx-2 mt-2 border-t border-line" />
          </div>
        )}

        <ul>{tree.map(node => <TreeRow key={node.id} node={node} depth={0} ctx={ctx} />)}</ul>

        {visible && visible.size === 0 && (
          <p className="px-3 py-6 text-center text-sm text-ink-3">'{query}' 검색 결과가 없어요.</p>
        )}
        {categories.length === 0 && (
          <div className="px-3 py-6 text-center">
            <p className="text-sm text-ink-2">카테고리가 없어요.</p>
            <button type="button" className="mt-3 btn btn-sm btn-secondary" onClick={() => addChild(null)}>
              <PlusIcon size={16} /> 첫 카테고리 만들기
            </button>
          </div>
        )}
      </div>

      {menu && (
        <ActionMenu
          anchor={menu.rect}
          label={`${menu.node.name} 메뉴`}
          onClose={() => setMenu(null)}
          items={[
            { label: '이름 바꾸기', icon: <PencilIcon size={17} />, onSelect: () => setRenamingId(menu.node.id) },
            { label: '하위 카테고리 추가', icon: <PlusIcon size={17} />, onSelect: () => addChild(menu.node.id) },
            { label: '위치 옮기기', icon: <FolderIcon size={17} />, onSelect: () => setMoving(menu.node) },
            { label: '기본값 설정', icon: <SettingsIcon size={17} />, onSelect: () => setEditingDefaults(menu.node) },
            { divider: true },
            { label: '삭제', icon: <TrashIcon size={17} />, tone: 'danger', onSelect: () => remove(menu.node) },
          ]}
        />
      )}
      {moving && <MoveCategoryModal category={moving} onClose={() => setMoving(null)} />}
      {editingDefaults && <CategoryDefaultsModal category={editingDefaults} onClose={() => setEditingDefaults(null)} />}
      {confirmDialog}
    </div>
  )
}
