import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AchievementEditor, { blankAchievement } from '@/components/AchievementEditor.jsx'
import EmptyState from '@/components/EmptyState.jsx'
import Medal, { TierLabel } from '@/components/Medal.jsx'
import Modal from '@/components/Modal.jsx'
import ProgressBar from '@/components/ProgressBar.jsx'
import { CategoryList } from '@/components/CategoryPicker.jsx'
import { useApp } from '@/context/AppContext.jsx'
import { TIERS } from '@/constants/tiers.js'
import { describeCondition, hasMeasurableProgress, progressLabel, progressRatio } from '@/utils/achievementText.js'
import { getCategoryPath, getSubtreeIds } from '@/utils/categoryTree.js'
import { formatDateShort } from '@/utils/formatters.js'
import { AlertIcon, ChevronDownIcon, EyeOffIcon, FolderIcon, MedalIcon, PlusIcon, SearchIcon, XIcon } from '@/components/Icons.jsx'

// Without a search or category filter, long groups (피트니스 has 200+) show
// this many rows until expanded.
const GROUP_PREVIEW = 20

const STATUS_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'progress', label: '진행 중' },
  { id: 'earned', label: '달성' },
]

function Status({ achievement: a }) {
  if (a.error) {
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-danger"><AlertIcon size={14} /> 조건 확인 필요</span>
  }
  if (a.isEarned) {
    return <span className="text-xs font-medium text-accent-ink">{formatDateShort(a.earnedAt)} 달성</span>
  }
  if (hasMeasurableProgress(a.condition)) {
    return (
      <span className="flex items-center gap-2 w-full">
        <ProgressBar value={progressRatio(a)} height={4} className="flex-1 min-w-[48px]" />
        <span className="text-xs font-medium text-ink-2 tabular whitespace-nowrap">{progressLabel(a)}</span>
      </span>
    )
  }
  return <span className="text-xs text-ink-3">아직</span>
}

function AchievementRow({ achievement: a, categories, rootId, onOpen }) {
  const path = a.categoryId ? getCategoryPath(a.categoryId, categories) : []
  const subPath = path.filter(c => c.id !== rootId).map(c => c.name).join(' › ')
  const rule = describeCondition(a.condition, { categories, achievement: a })

  return (
    <li>
      <button type="button" onClick={() => onOpen(a)} className="w-full flex items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-sunken/50">
        <Medal tier={a.tier} earned={a.isEarned} size={36} />
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-base font-semibold text-ink">{a.title}</span>
            <TierLabel tier={a.tier} className="flex-shrink-0" />
            {a.isHidden && (
              <span className="tag h-5 gap-1 flex-shrink-0" title="달성 전까지 숨겨지는 업적"><EyeOffIcon size={12} /> 숨김</span>
            )}
          </span>
          <span className="block mt-0.5 text-sm text-ink-2 truncate">
            {subPath && <>{subPath} · </>}{rule}
          </span>
          <span className="sm:hidden mt-1.5 flex"><Status achievement={a} /></span>
        </span>
        <span className="hidden sm:flex w-44 flex-shrink-0 justify-end">
          <Status achievement={a} />
        </span>
      </button>
    </li>
  )
}

export default function AchievementManagement() {
  const { achievements, categories } = useApp()
  const location = useLocation()
  const navigate = useNavigate()

  const [editing, setEditing] = useState(null)
  const [status, setStatus] = useState('all')
  const [tier, setTier] = useState('')
  const [categoryId, setCategoryId] = useState(null)
  const [search, setSearch] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [expanded, setExpanded] = useState(() => new Set())

  // Links from other screens: { editId }, { create, categoryId } or { categoryId }.
  useEffect(() => {
    const state = location.state
    if (!state) return
    if (state.editId) {
      const target = achievements.find(a => a.id === state.editId)
      if (target) setEditing(target)
    } else if (state.create) {
      setEditing(blankAchievement(state.categoryId ?? null))
    } else if (state.categoryId) {
      setCategoryId(state.categoryId)
    }
    navigate('.', { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  const activeCategory = categoryId && categories.some(c => c.id === categoryId) ? categoryId : null
  const query = search.trim().toLowerCase()

  const filtered = useMemo(() => {
    const scope = activeCategory ? getSubtreeIds(activeCategory, categories) : null
    return achievements.filter(a => {
      if (scope && !scope.has(a.categoryId)) return false
      if (tier && a.tier !== tier) return false
      if (status === 'earned' && !a.isEarned) return false
      if (status === 'progress' && a.isEarned) return false
      if (query) {
        const path = a.categoryId ? getCategoryPath(a.categoryId, categories).map(c => c.name).join(' ') : '모든 기록'
        if (!`${a.title} ${a.description} ${path}`.toLowerCase().includes(query)) return false
      }
      return true
    })
  }, [achievements, categories, activeCategory, tier, status, query])

  const groups = useMemo(() => {
    const roots = categories.filter(c => !c.parentId)
    const buckets = new Map([[null, []], ...roots.map(r => [r.id, []])])
    for (const a of filtered) {
      const rootId = a.categoryId ? getCategoryPath(a.categoryId, categories)[0]?.id ?? null : null
      buckets.get(rootId)?.push(a)
    }
    return [...buckets.entries()]
      .filter(([, list]) => list.length > 0)
      .map(([id, list]) => ({ id, name: id ? categories.find(c => c.id === id)?.name : '모든 기록', list }))
  }, [filtered, categories])

  const capped = !query && !activeCategory
  const earnedCount = achievements.filter(a => a.isEarned).length
  const filtersActive = status !== 'all' || !!tier || !!activeCategory || !!query
  const clearFilters = () => { setStatus('all'); setTier(''); setCategoryId(null); setSearch('') }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 pt-5 md:pt-8 pb-12">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">업적</h1>
          <p className="mt-1 text-sm text-ink-2">
            {achievements.length}개 중 <strong className="font-semibold text-ink">{earnedCount}개</strong> 달성
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing(blankAchievement(activeCategory))}>
          <PlusIcon size={18} strokeWidth={2.2} /> 새 업적
        </button>
      </header>

      <div className="mt-5 space-y-2.5">
        <div className="relative">
          <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="이름, 설명, 카테고리로 찾기"
            aria-label="업적 검색"
            className="input h-11 pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-full bg-sunken p-0.5" role="group" aria-label="상태">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatus(f.id)}
                aria-pressed={status === f.id}
                className={`h-7 px-3 rounded-full text-sm font-medium transition-colors ${status === f.id ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setPickerOpen(true)} className={`chip ${activeCategory ? 'chip-active' : ''}`}>
            <FolderIcon size={15} />
            <span className="max-w-[160px] truncate">{activeCategory ? categories.find(c => c.id === activeCategory)?.name : '모든 카테고리'}</span>
            <ChevronDownIcon size={14} />
          </button>
          <select
            value={tier}
            onChange={e => setTier(e.target.value)}
            aria-label="등급"
            className={`chip pr-8 appearance-none bg-no-repeat ${tier ? 'chip-active' : ''}`}
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238A857C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
              backgroundPosition: 'right 10px center',
            }}
          >
            <option value="">모든 등급</option>
            {TIERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          {filtersActive && (
            <button type="button" onClick={clearFilters} className="text-sm font-medium text-ink-2 hover:text-ink px-1">
              필터 지우기
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {groups.length === 0 ? (
          <div className="card">
            {achievements.length === 0 ? (
              <EmptyState
                icon={<MedalIcon size={22} />}
                title="아직 업적이 없어요"
                body="이루고 싶은 목표를 업적으로 만들어 보세요. 기록이 쌓이면 자동으로 달성돼요."
                action={<button type="button" className="btn btn-sm btn-primary" onClick={() => setEditing(blankAchievement())}>업적 만들기</button>}
              />
            ) : (
              <EmptyState
                icon={<SearchIcon size={22} />}
                title="조건에 맞는 업적이 없어요"
                body="검색어나 필터를 바꿔 보세요."
                action={<button type="button" className="btn btn-sm btn-secondary" onClick={clearFilters}><XIcon size={16} /> 필터 지우기</button>}
              />
            )}
          </div>
        ) : groups.map(group => (
          <section key={group.id ?? 'all'} aria-labelledby={`group-${group.id ?? 'all'}`}>
            <h2 id={`group-${group.id ?? 'all'}`} className="flex items-baseline gap-2 mb-2 px-1">
              <span className="section-title">{group.name}</span>
              <span className="text-sm text-ink-3 tabular">
                {group.list.filter(a => a.isEarned).length} / {group.list.length}
              </span>
            </h2>
            <ul className="card divide-y divide-line overflow-hidden">
              {(capped && !expanded.has(group.id) ? group.list.slice(0, GROUP_PREVIEW) : group.list).map(a => (
                <AchievementRow key={a.id} achievement={a} categories={categories} rootId={group.id} onOpen={setEditing} />
              ))}
            </ul>
            {capped && group.list.length > GROUP_PREVIEW && (
              <button
                type="button"
                className="mt-2 w-full btn btn-sm btn-ghost"
                onClick={() => setExpanded(prev => {
                  const next = new Set(prev)
                  if (next.has(group.id)) next.delete(group.id)
                  else next.add(group.id)
                  return next
                })}
                aria-expanded={expanded.has(group.id)}
              >
                {expanded.has(group.id) ? '접기' : `${group.list.length - GROUP_PREVIEW}개 더 보기`}
              </button>
            )}
          </section>
        ))}
      </div>

      {editing && (
        <AchievementEditor key={editing.id ?? 'new'} achievement={editing} onClose={() => setEditing(null)} />
      )}

      <Modal open={pickerOpen} title="카테고리로 보기" size="sm" onClose={() => setPickerOpen(false)} bodyClassName="p-0">
        <CategoryList
          value={activeCategory}
          onChange={(id) => { setCategoryId(id); setPickerOpen(false) }}
          allowNone
          noneLabel="모든 카테고리"
          maxHeight={420}
        />
      </Modal>
    </div>
  )
}
