import React, { useState } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import CategoryTree from './CategoryTree.jsx'

export default function Sidebar({ selectedCategoryId, onSelectCategory }) {
  const { addCategory } = useApp()
  const [search, setSearch] = useState('')

  const handleAddRoot = () => {
    addCategory({ name: '새 카테고리', parentId: null })
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* App title */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🏆</span>
          <div>
            <div className="text-base font-black text-slate-900 leading-none">업적</div>
            <div className="text-base font-black text-primary leading-none">라이브러리</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="카테고리 검색…"
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Category tree */}
      <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin">
        <CategoryTree
          selectedId={selectedCategoryId}
          onSelect={onSelectCategory}
          searchQuery={search}
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
