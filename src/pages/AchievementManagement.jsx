import React, { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import TrophyTierBadge from '@/components/TrophyTierBadge.jsx'
import CategoryTreeSelector from '@/components/CategoryTreeSelector.jsx'
import ConditionBuilder from '@/components/ConditionBuilder.jsx'
import { getCategoryPath } from '@/utils/categoryTree.js'
import { conditionSummaryText, typeLabel, tierLabel, generateId } from '@/utils/formatters.js'

const TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'red_diamond']
const TYPES = ['one-time', 'repeatable', 'meta']

function blankAchievement() {
  return {
    id: null,
    title: '',
    description: '',
    categoryId: null,
    tier: 'bronze',
    type: 'one-time',
    isHidden: false,
    condition: { type: 'action' },
    rarity: 50,
    isEarned: false,
    earnedAt: null,
    progress: 0,
  }
}

export default function AchievementManagement() {
  const { categories, achievements, addAchievement, updateAchievement, deleteAchievement } = useApp()
  const [selectedId, setSelectedId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterEarned, setFilterEarned] = useState('')

  const filteredAchievements = useMemo(() => {
    return achievements.filter(a => {
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterTier && a.tier !== filterTier) return false
      if (filterType && a.type !== filterType) return false
      if (filterEarned === 'earned' && !a.isEarned) return false
      if (filterEarned === 'locked' && a.isEarned) return false
      return true
    })
  }, [achievements, search, filterTier, filterType, filterEarned])

  const openEdit = (achievement) => {
    setSelectedId(achievement.id)
    setEditForm({ ...achievement })
  }

  const openNew = () => {
    setSelectedId('__new__')
    setEditForm(blankAchievement())
  }

  const handleSave = () => {
    if (!editForm.title.trim()) return
    if (selectedId === '__new__') {
      addAchievement({ ...editForm, id: generateId('ach') })
      setSelectedId(null)
      setEditForm(null)
    } else {
      updateAchievement(editForm)
    }
  }

  const handleDelete = () => {
    if (!selectedId || selectedId === '__new__') return
    if (window.confirm('이 업적을 삭제할까요?')) {
      deleteAchievement(selectedId)
      setSelectedId(null)
      setEditForm(null)
    }
  }

  const getCategoryPathLabel = (catId) => {
    if (!catId) return '—'
    return getCategoryPath(catId, categories).map(c => c.name).join(' › ')
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Left: Achievement table (60%) */}
      <div className="flex-[3] min-w-0 h-full overflow-hidden flex flex-col border-r border-slate-200">
        {/* Table header + filters */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-slate-900">업적</h1>
            <button
              onClick={openNew}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              + 새 업적
            </button>
          </div>

          {/* Search + filters */}
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="제목으로 검색…"
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary flex-1 min-w-32"
            />
            <select
              value={filterTier}
              onChange={e => setFilterTier(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              <option value="">모든 티어</option>
              {TIERS.map(t => <option key={t} value={t}>{tierLabel(t)}</option>)}
            </select>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              <option value="">모든 유형</option>
              {TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
            </select>
            <select
              value={filterEarned}
              onChange={e => setFilterEarned(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              <option value="">모든 상태</option>
              <option value="earned">획득</option>
              <option value="locked">잠김</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <table className="w-full text-sm table-fixed">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 w-24">티어</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">제목</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 w-24">유형</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden xl:table-cell w-36">카테고리</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden xl:table-cell">조건</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 w-20">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAchievements.map(a => (
                <tr
                  key={a.id}
                  onClick={() => openEdit(a)}
                  className={[
                    'cursor-pointer transition-colors',
                    selectedId === a.id
                      ? 'bg-primary/5 border-l-2 border-primary'
                      : 'hover:bg-slate-50',
                  ].join(' ')}
                >
                  <td className="px-4 py-2.5">
                    <TrophyTierBadge tier={a.tier} size="xs" />
                  </td>
                  <td className="px-4 py-2.5 min-w-0">
                    {/* FIX: removed hard-coded max-w-xs; truncate now clips only when td itself is too narrow */}
                    <span className="font-medium text-slate-800 truncate block w-full">
                      {a.isHidden && !a.isEarned ? '??? (숨김)' : a.title}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wide">
                      {typeLabel(a.type)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 hidden xl:table-cell min-w-0">
                    {/* FIX: removed hard-coded max-w-[140px]; truncate defers to column width */}
                    <span className="text-xs text-slate-400 truncate block w-full">
                      {getCategoryPathLabel(a.categoryId)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 hidden xl:table-cell min-w-0">
                    {/* FIX: removed hard-coded max-w-[160px]; truncate defers to column width */}
                    <span className="text-xs text-slate-400 truncate block w-full">
                      {conditionSummaryText(a.condition)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {a.isEarned
                      ? <span className="text-green-500 font-semibold text-xs">✓ 획득</span>
                      : <span className="text-slate-400 text-xs">잠김</span>
                    }
                  </td>
                </tr>
              ))}
              {filteredAchievements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    업적이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: Edit panel (40%) */}
      <div className="flex-[2] min-w-0 h-full overflow-y-auto bg-white scrollbar-thin">
        {editForm ? (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {selectedId === '__new__' ? '새 업적' : '업적 편집'}
              </h2>
              <button
                onClick={() => { setSelectedId(null); setEditForm(null) }}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">제목</label>
              <input
                type="text"
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="업적 제목…"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">설명</label>
              <textarea
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
                placeholder="이 업적의 의미는 무엇인가요?"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">카테고리</label>
              <CategoryTreeSelector
                value={editForm.categoryId}
                onChange={id => setEditForm({ ...editForm, categoryId: id })}
              />
            </div>

            {/* Tier + Type row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">티어</label>
                <select
                  value={editForm.tier}
                  onChange={e => setEditForm({ ...editForm, tier: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                >
                  {TIERS.map(t => <option key={t} value={t}>{tierLabel(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">유형</label>
                <select
                  value={editForm.type}
                  onChange={e => setEditForm({ ...editForm, type: e.target.value, condition: { type: 'action' } })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                >
                  {TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
                </select>
              </div>
            </div>

            {/* Rarity + Hidden */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">희귀도 (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={editForm.rarity}
                  onChange={e => setEditForm({ ...editForm, rarity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col justify-center">
                <label className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">숨김</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setEditForm({ ...editForm, isHidden: !editForm.isHidden })}
                    className={[
                      'relative w-10 h-5 rounded-full transition-colors cursor-pointer',
                      editForm.isHidden ? 'bg-primary' : 'bg-slate-200',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                        editForm.isHidden ? 'translate-x-5' : 'translate-x-0.5',
                      ].join(' ')}
                    />
                  </div>
                  <span className="text-sm text-slate-600">{editForm.isHidden ? '숨김' : '공개'}</span>
                </label>
              </div>
            </div>

            {/* Condition builder */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">조건</label>
              <ConditionBuilder
                type={editForm.type}
                value={editForm.condition}
                onChange={cond => setEditForm({ ...editForm, condition: cond })}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                저장
              </button>
              {selectedId !== '__new__' && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2.5 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
            <span className="text-5xl mb-4">🏆</span>
            <p className="text-base font-semibold text-center">편집할 업적을 선택하세요</p>
            <p className="text-sm mt-1 text-center">또는 "새 업적"을 클릭하여 생성하세요</p>
          </div>
        )}
      </div>
    </div>
  )
}
