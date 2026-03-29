import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import TrophyTierBadge from '@/components/TrophyTierBadge.jsx'
import CategoryTreeSelector from '@/components/CategoryTreeSelector.jsx'
import ConditionBuilder from '@/components/ConditionBuilder.jsx'
import { getCategoryPath } from '@/utils/categoryTree.js'
import {
  conditionSummaryText, typeLabel, tierLabel, generateId,
  truncateCategoryPathLeft, getConditionTarget, renderTemplate,
} from '@/utils/formatters.js'

const TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legendary']
const TYPES = ['one-time', 'repeatable', 'meta']

// Condition types that support enumerable progress templates
const ENUMERABLE_TYPES = [
  'tag_set_complete', 'meta_list', 'count', 'cumulative',
  'tag_count', 'daily_cumulative', 'cross_category_cumulative',
]

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
    progressFormat: '',
    expandTitle: '',
    completedStyle: 'bold',
    incompleteStyle: 'muted',
  }
}

// SVG check icon
function CheckIcon({ className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-4 h-4 ${className}`}>
      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
    </svg>
  )
}

// SVG lock icon
function LockIcon({ className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-4 h-4 ${className}`}>
      <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v4A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
    </svg>
  )
}

export default function AchievementManagement() {
  const { categories, achievements, addAchievement, updateAchievement, deleteAchievement } = useApp()
  const [selectedId, setSelectedId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [filterEarned, setFilterEarned] = useState('')

  // Refs for template token insertion
  const cardSummaryRef = useRef(null)
  const expandTitleRef = useRef(null)
  const lastFocusedInput = useRef('progressFormat')

  const filteredAchievements = useMemo(() => {
    return achievements.filter(a => {
      if (search && !(
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.description?.toLowerCase().includes(search.toLowerCase())
      )) return false
      if (filterTier && a.tier !== filterTier) return false
      if (filterEarned === 'earned' && !a.isEarned) return false
      if (filterEarned === 'locked' && a.isEarned) return false
      return true
    })
  }, [achievements, search, filterTier, filterEarned])

  const openEdit = (achievement) => {
    setSelectedId(achievement.id)
    setEditForm({
      progressFormat: '',
      expandTitle: '',
      completedStyle: 'bold',
      incompleteStyle: 'muted',
      ...achievement,
    })
    setSlideOverOpen(true)
  }

  const openNew = () => {
    setSelectedId('__new__')
    setEditForm(blankAchievement())
    setSlideOverOpen(true)
  }

  const closeSlideOver = () => {
    setSlideOverOpen(false)
    setSelectedId(null)
    setEditForm(null)
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeSlideOver() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSave = () => {
    if (!editForm.title.trim()) return
    if (selectedId === '__new__') {
      addAchievement({ ...editForm, id: generateId('ach') })
      closeSlideOver()
    } else {
      updateAchievement(editForm)
    }
  }

  const handleDelete = () => {
    if (!selectedId || selectedId === '__new__') return
    if (window.confirm('이 업적을 삭제할까요?')) {
      deleteAchievement(selectedId)
      closeSlideOver()
    }
  }

  const getCategoryPathLabel = (catId) => {
    if (!catId) return '—'
    return getCategoryPath(catId, categories).map(c => c.name).join(' › ')
  }

  const resetFilters = () => {
    setSearch('')
    setFilterTier('')
    setFilterEarned('')
  }

  const hasActiveFilters = search || filterTier || filterEarned

  // Token insertion into progress format inputs
  function insertToken(token) {
    const field = lastFocusedInput.current
    const ref = field === 'expandTitle' ? expandTitleRef : cardSummaryRef
    const input = ref.current
    if (!input) {
      setEditForm(f => ({ ...f, [field]: (f[field] || '') + token }))
      return
    }
    const start = input.selectionStart
    const end = input.selectionEnd
    const current = editForm[field] || ''
    const newVal = current.slice(0, start) + token + current.slice(end)
    setEditForm(f => ({ ...f, [field]: newVal }))
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + token.length, start + token.length)
    }, 0)
  }

  const isEnumerable = editForm
    ? ENUMERABLE_TYPES.includes(editForm.condition?.type)
    : false
  const isTagSet = editForm?.condition?.type === 'tag_set_complete'

  const previewValues = editForm ? {
    current: editForm.progress || 0,
    total: getConditionTarget(editForm.condition),
    lastDate: null,
  } : {}

  return (
    <div className="relative flex flex-col h-full min-h-0">
      {/* Achievement list — always full width */}
      <div
        className="flex flex-col h-full min-h-0 transition-opacity duration-200"
        style={slideOverOpen ? { opacity: 0.4, pointerEvents: 'none' } : {}}
      >
        {/* Table header + filters */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-slate-900">업적</h1>
            <button
              onClick={openNew}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              + 새 업적
            </button>
          </div>

          {/* Search — full width */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="제목으로 검색..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
          />

          {/* Tier + Status dropdowns + reset */}
          <div className="flex items-center gap-2">
            <select
              value={filterTier}
              onChange={e => setFilterTier(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              <option value="">티어</option>
              {TIERS.map(t => <option key={t} value={t}>{tierLabel(t)}</option>)}
            </select>
            <select
              value={filterEarned}
              onChange={e => setFilterEarned(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              <option value="">상태</option>
              <option value="earned">획득</option>
              <option value="locked">잠김</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-slate-500 hover:text-slate-800 ml-auto transition-colors"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <table className="w-full text-sm table-fixed">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 w-32">티어</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">제목</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden xl:table-cell w-48">카테고리</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden xl:table-cell">조건</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 w-16">상태</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAchievements.map(a => (
                <tr
                  key={a.id}
                  onClick={() => openEdit(a)}
                  className="cursor-pointer transition-colors hover:bg-slate-50 group"
                >
                  <td className="px-4 py-2.5">
                    <TrophyTierBadge tier={a.tier} size="xs" />
                  </td>
                  <td className="px-4 py-2.5 min-w-0">
                    <span className="font-medium text-slate-800 truncate block w-full">
                      {a.isHidden && !a.isEarned ? '??? (숨김)' : a.title}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 hidden xl:table-cell min-w-0">
                    <span className="text-xs text-slate-400 block w-full overflow-hidden whitespace-nowrap" title={getCategoryPathLabel(a.categoryId)}>
                      {truncateCategoryPathLeft(getCategoryPathLabel(a.categoryId))}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 hidden xl:table-cell min-w-0">
                    <span className="text-xs text-slate-400 truncate block w-full">
                      {conditionSummaryText(a.condition)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {a.isEarned
                      ? <CheckIcon className="text-green-500" />
                      : <LockIcon className="text-slate-300" />
                    }
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      편집 ›
                    </span>
                  </td>
                </tr>
              ))}
              {filteredAchievements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    {search
                      ? `'${search}'에 해당하는 업적이 없습니다.`
                      : '업적이 없습니다'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backdrop */}
      {slideOverOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeSlideOver}
        />
      )}

      {/* Slide-over panel */}
      <div
        className={[
          'fixed z-50 bg-white shadow-2xl overflow-y-auto scrollbar-thin',
          // Desktop: right side panel, 480px wide
          'md:top-0 md:right-0 md:bottom-0 md:w-[480px] md:translate-y-0',
          // Mobile: bottom sheet, full width
          'bottom-0 left-0 right-0 md:left-auto max-h-[90vh] md:max-h-none rounded-t-2xl md:rounded-none',
          'transition-transform duration-300 ease-in-out',
          slideOverOpen
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full',
        ].join(' ')}
      >
        {editForm && (
          <>
            {/* Slide-over header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3.5 z-10 flex items-center justify-between">
              <button
                onClick={closeSlideOver}
                className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center gap-1 transition-colors"
              >
                ← 목록
              </button>
              <h2 className="text-sm font-bold text-slate-900">
                {selectedId === '__new__' ? '새 업적' : '업적 편집'}
              </h2>
              <button
                onClick={closeSlideOver}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none transition-colors w-6 text-center"
              >
                ×
              </button>
            </div>

            {/* Live preview card */}
            <div className="mx-5 mt-4 mb-1 p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrophyTierBadge tier={editForm.tier} size="sm" />
                  </div>
                  <div className="font-bold text-sm text-slate-800 truncate">
                    {editForm.title || <span className="text-slate-400 font-normal">업적 제목 미리보기</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                    {editForm.description || '설명이 여기에 표시됩니다.'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {editForm.isEarned
                    ? <CheckIcon className="text-green-500" />
                    : <LockIcon className="text-slate-300" />
                  }
                </div>
              </div>
              {editForm.progressFormat && (
                <div className="mt-2 text-xs text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full inline-block">
                  {renderTemplate(editForm.progressFormat, previewValues)}
                </div>
              )}
            </div>

            {/* Form fields */}
            <div className="px-5 py-4 space-y-5 pb-8">
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

              {/* 획득률 + Hidden */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1 mb-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">획득률</label>
                    <span className="text-[10px] text-slate-400">전체 사용자 기준</span>
                    <div className="relative group/tooltip">
                      <span className="text-slate-400 cursor-help text-xs select-none">ⓘ</span>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-52 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-20 text-center shadow-lg">
                        이 업적을 획득한 사용자의 비율입니다. 낮을수록 희귀한 업적입니다.
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={editForm.rarity}
                      onChange={e => setEditForm({ ...editForm, rarity: Number(e.target.value) })}
                      className="w-full px-3 py-2 pr-7 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">%</span>
                  </div>
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

              {/* Progress display format — only for enumerable condition types */}
              {isEnumerable && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    진행 표시 형식
                  </label>

                  {/* Token buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {['{current}', '{total}', '{remaining}', '{pct}', '{last_date}'].map(token => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => insertToken(token)}
                        className="text-xs px-2 py-0.5 bg-white hover:bg-slate-100 rounded border border-slate-200 font-mono text-slate-700 transition-colors"
                      >
                        {token}
                      </button>
                    ))}
                  </div>

                  {/* 카드 요약 */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">카드 요약</label>
                    <input
                      ref={cardSummaryRef}
                      type="text"
                      value={editForm.progressFormat}
                      onChange={e => setEditForm({ ...editForm, progressFormat: e.target.value })}
                      onFocus={() => { lastFocusedInput.current = 'progressFormat' }}
                      placeholder="{current}/{total}"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
                    />
                  </div>

                  {/* 확장 제목 — tag_set only */}
                  {isTagSet && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">확장 제목</label>
                      <input
                        ref={expandTitleRef}
                        type="text"
                        value={editForm.expandTitle}
                        onChange={e => setEditForm({ ...editForm, expandTitle: e.target.value })}
                        onFocus={() => { lastFocusedInput.current = 'expandTitle' }}
                        placeholder="{total}개 항목 달성 현황"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
                      />
                    </div>
                  )}

                  {/* Style dropdowns — tag_set only */}
                  {isTagSet && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">완료 항목 스타일</label>
                        <select
                          value={editForm.completedStyle}
                          onChange={e => setEditForm({ ...editForm, completedStyle: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-primary bg-white"
                        >
                          <option value="bold">진하게</option>
                          <option value="strikethrough">취소선</option>
                          <option value="check-only">체크만</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">미완료 항목 스타일</label>
                        <select
                          value={editForm.incompleteStyle}
                          onChange={e => setEditForm({ ...editForm, incompleteStyle: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-primary bg-white"
                        >
                          <option value="muted">연하게</option>
                          <option value="gray">회색</option>
                          <option value="hidden">숨김</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Live preview pill */}
                  <div className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg">
                    <span className="text-slate-400">미리보기: </span>
                    <span className="font-semibold">
                      {renderTemplate(editForm.progressFormat || '{current}/{total}', previewValues)}
                    </span>
                  </div>
                </div>
              )}

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
          </>
        )}
      </div>
    </div>
  )
}
