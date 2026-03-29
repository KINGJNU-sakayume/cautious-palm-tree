import React, { useState } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import { useFavorites } from '@/hooks/useFavorites.js'
import CategoryTree from './CategoryTree.jsx'
import { SearchIcon, TrophyIcon, StarFilledIcon } from '@/components/Icons.jsx'

export default function Sidebar({ selectedCategoryId, onSelectCategory }) {
  const { addCategory, categories } = useApp()
  const { favorites, toggleFavorite } = useFavorites()
  const [search, setSearch] = useState('')

  const handleAddRoot = () => {
    addCategory({ name: '새 카테고리', parentId: null })
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* App title */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <TrophyIcon size={18} className="text-primary flex-shrink-0" />
          <div>
            <div className="text-type-section font-medium text-slate-900 leading-none">업적</div>
            <div className="text-type-section font-medium text-primary leading-none">라이브러리</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
            <SearchIcon size={13} />
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="카테고리 검색…"
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Favorites section */}
      {favorites.length > 0 && (
        <div className="px-2 pb-1">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-400 px-2 py-1">즐겨찾기</div>
          {favorites.map(id => {
            const cat = categories.find(c => c.id === id)
            if (!cat) return null
            return (
              <button
                key={id}
                onClick={() => onSelectCategory(id)}
                className={[
                  'w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors',
                  selectedCategoryId === id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-slate-700 hover:bg-slate-100',
                ].join(' ')}
              >
                <StarFilledIcon size={12} className="text-amber-400 flex-shrink-0" />
                <span className="truncate">{cat.name}</span>
              </button>
            )
          })}
          <hr className="my-1 border-slate-100" />
        </div>
      )}

      {/* Category tree */}
      <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin">
        <CategoryTree
          selectedId={selectedCategoryId}
          onSelect={onSelectCategory}
          searchQuery={search}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      </div>

      {/* Add root category */}
      <div className="px-3 py-3 border-t border-slate-100">
        <button
          onClick={handleAddRoot}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-primary hover:text-primary transition-colors"
        >
          <span>+</span> 카테고리 추가
        </button>
      </div>
    </div>
  )
}
