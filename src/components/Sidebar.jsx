import React, { useState, useMemo, useEffect } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import { useFavorites } from '@/hooks/useFavorites.js'
import { SearchIcon, TrophyIcon, PlusIcon } from '@/components/Icons.jsx'
import { getCategoryPath, getDirectChildren, getDescendantIds } from '@/utils/categoryTree.js'

// ── Desktop Two-Panel Sidebar ─────────────────────────────────────────────────

export default function Sidebar({ selectedCategoryId, onSelectCategory }) {
  const { addCategory, categories, records } = useApp()
  const { favorites } = useFavorites()
  const [search, setSearch] = useState('')

  const l1Categories = categories.filter(c => c.parentId === null)

  // Determine which L1 the current selection belongs to
  const derivedL1Id = useMemo(() => {
    if (!selectedCategoryId) return l1Categories[0]?.id ?? null
    const path = getCategoryPath(selectedCategoryId, categories)
    return path[0]?.id ?? l1Categories[0]?.id ?? null
  }, [selectedCategoryId, categories, l1Categories])

  const [localL1Id, setLocalL1Id] = useState(derivedL1Id)

  // Keep local L1 in sync when external navigation changes it
  useEffect(() => {
    if (derivedL1Id) setLocalL1Id(derivedL1Id)
  }, [derivedL1Id])

  const activeL1 = categories.find(c => c.id === localL1Id)
  const l2Categories = getDirectChildren(localL1Id, categories)

  const descendantIds = useMemo(
    () => (localL1Id ? getDescendantIds(localL1Id, categories) : []),
    [localL1Id, categories]
  )

  const getL2RecordCount = (l2Id) => {
    const l2Desc = getDescendantIds(l2Id, categories)
    return records.filter(r => r.categoryId === l2Id || l2Desc.includes(r.categoryId)).length
  }

  const recentRecords = useMemo(() => {
    const ids = new Set([localL1Id, ...descendantIds])
    return [...records]
      .filter(r => ids.has(r.categoryId))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
  }, [records, localL1Id, descendantIds])

  const l1FavoriteIds = favorites.filter(id => {
    const path = getCategoryPath(id, categories)
    return path.some(c => c.id === localL1Id)
  })

  const filteredL2 = l2Categories.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full bg-white border-r border-slate-200">
      {/* ── Left Rail (56px) ── */}
      <div className="w-14 flex-shrink-0 flex flex-col items-center pt-3 pb-2 gap-0.5 border-r border-slate-100 overflow-y-auto scrollbar-thin">
        {/* App icon */}
        <div className="flex items-center justify-center w-full py-2 mb-1">
          <TrophyIcon size={18} className="text-primary" />
        </div>

        {l1Categories.map(cat => {
          const isActive = cat.id === localL1Id
          // Split name for wrapping if > 4 chars
          const name = cat.name
          const mid = Math.ceil(name.length / 2)
          const displayName = name.length > 4
            ? <>{name.slice(0, mid)}<br />{name.slice(mid)}</>
            : name

          return (
            <button
              key={cat.id}
              onClick={() => setLocalL1Id(cat.id)}
              className={[
                'relative w-full flex flex-col items-center justify-center px-1 py-2 rounded-lg text-center transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50',
              ].join(' ')}
            >
              <span className="text-[11px] font-medium leading-tight">
                {displayName}
              </span>
              {isActive && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          )
        })}

        <button
          onClick={() => addCategory({ name: '새 카테고리', parentId: null })}
          className="mt-auto flex items-center justify-center w-full py-2.5 text-slate-400 hover:text-primary transition-colors"
          title="루트 카테고리 추가"
        >
          <PlusIcon size={14} />
        </button>
      </div>

      {/* ── Right Context Panel ── */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Panel header */}
        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="text-type-section font-medium text-slate-900 truncate">
            {activeL1?.name ?? ''}
          </div>
        </div>

        {/* Scoped search */}
        <div className="px-3 pt-2 pb-1 flex-shrink-0">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
              <SearchIcon size={12} />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`${activeL1?.name ?? ''} 내 검색…`}
              className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-type-body focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-thin">
          {/* L2 category list */}
          {filteredL2.length > 0 && (
            <div className="space-y-0.5">
              {filteredL2.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={[
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors',
                    selectedCategoryId === cat.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-slate-50 text-slate-700',
                  ].join(' ')}
                >
                  <span className="text-type-body font-medium truncate">{cat.name}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span className="text-type-secondary text-slate-400">
                      {getL2RecordCount(cat.id)}
                    </span>
                    <span className="text-slate-300 text-sm">›</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {filteredL2.length > 0 && (l1FavoriteIds.length > 0 || recentRecords.length > 0) && (
            <hr className="border-slate-100" />
          )}

          {/* Favorites (pill chips) */}
          {l1FavoriteIds.length > 0 && (
            <div>
              <div className="text-type-secondary font-medium text-slate-400 uppercase tracking-wide px-1 mb-1.5">
                즐겨찾기
              </div>
              <div className="flex flex-wrap gap-1">
                {l1FavoriteIds.map(id => {
                  const cat = categories.find(c => c.id === id)
                  if (!cat) return null
                  return (
                    <button
                      key={id}
                      onClick={() => onSelectCategory(id)}
                      className={[
                        'px-2.5 py-1 rounded-full border text-type-secondary transition-colors',
                        selectedCategoryId === id
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary',
                      ].join(' ')}
                    >
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent records */}
          {recentRecords.length > 0 && (
            <div>
              <div className="text-type-secondary font-medium text-slate-400 uppercase tracking-wide px-1 mb-1.5">
                최근 기록
              </div>
              <div className="space-y-0.5">
                {recentRecords.map(r => {
                  const cat = categories.find(c => c.id === r.categoryId)
                  return (
                    <button
                      key={r.id}
                      onClick={() => onSelectCategory(r.categoryId)}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="text-type-body text-slate-700 truncate">{cat?.name}</div>
                      <div className="text-type-secondary text-slate-400">{r.date}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Mobile Navigation (chip bar + bottom sheet) ───────────────────────────────

export function MobileNav({ selectedCategoryId, onSelectCategory }) {
  const { categories } = useApp()
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)

  const l1Categories = categories.filter(c => c.parentId === null)

  const derivedL1Id = useMemo(() => {
    if (!selectedCategoryId) return l1Categories[0]?.id ?? null
    const path = getCategoryPath(selectedCategoryId, categories)
    return path[0]?.id ?? l1Categories[0]?.id ?? null
  }, [selectedCategoryId, categories, l1Categories])

  const [localL1Id, setLocalL1Id] = useState(derivedL1Id)
  useEffect(() => {
    if (derivedL1Id) setLocalL1Id(derivedL1Id)
  }, [derivedL1Id])

  const activeL1 = categories.find(c => c.id === localL1Id)
  const l2Categories = getDirectChildren(localL1Id, categories)

  return (
    <>
      {/* L1 chip bar */}
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 bg-white border-b border-slate-100 scrollbar-thin flex-shrink-0">
        {l1Categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setLocalL1Id(cat.id)
              onSelectCategory(cat.id)
            }}
            className={[
              'flex-shrink-0 px-3 py-1 rounded-full text-type-badge font-medium transition-colors',
              localL1Id === cat.id
                ? 'bg-primary text-white'
                : 'border border-slate-300 text-slate-600 hover:border-primary hover:text-primary',
            ].join(' ')}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Bottom sheet backdrop */}
      {bottomSheetOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setBottomSheetOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={[
          'fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-xl transition-transform duration-300',
          bottomSheetOpen ? 'translate-y-0' : 'translate-y-[calc(100%-32px)]',
        ].join(' ')}
      >
        {/* Drag handle */}
        <button
          onClick={() => setBottomSheetOpen(v => !v)}
          className="w-full flex items-center justify-center py-2.5"
          aria-label={bottomSheetOpen ? '접기' : '펼치기'}
        >
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </button>

        <div className="px-4 pb-8 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <div className="text-type-section font-medium text-slate-900 mb-3">
            {activeL1?.name}
          </div>
          <div className="space-y-0.5">
            {l2Categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id)
                  setBottomSheetOpen(false)
                }}
                className={[
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
                  selectedCategoryId === cat.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-slate-50 text-slate-700',
                ].join(' ')}
              >
                <span className="text-type-body">{cat.name}</span>
                <span className="text-slate-300">›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
