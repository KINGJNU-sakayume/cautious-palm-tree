import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import CategoryNav from '@/components/CategoryNav.jsx'
import AchievementCard from '@/components/AchievementCard.jsx'
import RecordCard from '@/components/RecordCard.jsx'
import RecordFab from '@/components/RecordFab.jsx'
import EmptyState from '@/components/EmptyState.jsx'
import Modal from '@/components/Modal.jsx'
import ProgressBar from '@/components/ProgressBar.jsx'
import { useApp } from '@/context/AppContext.jsx'
import { useUI } from '@/context/UIContext.jsx'
import { getCategoryPath, getDirectChildren, getSubtreeIds } from '@/utils/categoryTree.js'
import { currentStreak, uniqueSortedDates } from '@/utils/dates.js'
import { relativeDay, formatNumber } from '@/utils/formatters.js'
import { progressRatio } from '@/utils/achievementText.js'
import { getTier } from '@/constants/tiers.js'
import {
  ChevronDownIcon, ChevronRightIcon, FlameIcon, FolderIcon, LogoMark, MedalIcon, NotebookIcon, PlusIcon,
} from '@/components/Icons.jsx'

const PREVIEW_COUNT = 3

function byNewest(a, b) {
  return a.date === b.date ? 0 : a.date < b.date ? 1 : -1
}

function AchievementGroup({ title, items, empty }) {
  const [expanded, setExpanded] = useState(false)
  if (items.length === 0) {
    return empty ? <p className="text-sm text-ink-3 py-2">{empty}</p> : null
  }
  const shown = expanded ? items : items.slice(0, PREVIEW_COUNT)
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-2 mb-2">
        {title} <span className="font-normal text-ink-3">{items.length}</span>
      </h3>
      <div className="space-y-2">
        {shown.map(a => <AchievementCard key={a.id} achievement={a} />)}
      </div>
      {items.length > PREVIEW_COUNT && (
        <button type="button" onClick={() => setExpanded(v => !v)} className="mt-2 w-full btn btn-sm btn-ghost">
          {expanded ? '접기' : `${items.length - PREVIEW_COUNT}개 더 보기`}
        </button>
      )}
    </div>
  )
}

function Stat({ label, value, icon = null }) {
  return (
    <div className="bg-surface px-4 py-3.5 min-w-0">
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 text-xl font-bold text-ink tabular truncate">
        {icon}
        {value}
      </dd>
    </div>
  )
}

export default function Dashboard() {
  const { categories, records, achievements, prefs, setPrefs } = useApp()
  const { openRecordEditor } = useUI()
  const location = useLocation()
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)

  const exists = (id) => !!id && categories.some(c => c.id === id)
  const firstRootId = categories.find(c => c.parentId === null)?.id ?? null
  const [chosenId, setChosenId] = useState(() => {
    const requested = location.state?.categoryId
    if (exists(requested)) return requested
    return exists(prefs.homeCategoryId) ? prefs.homeCategoryId : firstRootId
  })
  const selectedId = exists(chosenId) ? chosenId : firstRootId
  const selected = categories.find(c => c.id === selectedId) ?? null

  const select = (id) => {
    setChosenId(id)
    setPrefs({ homeCategoryId: id })
    setSheetOpen(false)
  }

  // Links such as "카테고리별 진행" on the showcase pass the category in router state.
  useEffect(() => {
    const requested = location.state?.categoryId
    if (!requested) return
    if (exists(requested)) select(requested)
    navigate('.', { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  const scope = useMemo(() => (selectedId ? getSubtreeIds(selectedId, categories) : new Set()), [selectedId, categories])
  const scopedRecords = useMemo(() => records.filter(r => scope.has(r.categoryId)).sort(byNewest), [records, scope])
  const scopedAchievements = useMemo(() => achievements.filter(a => scope.has(a.categoryId)), [achievements, scope])

  const inProgress = useMemo(() => scopedAchievements
    .filter(a => !a.isEarned)
    .sort((a, b) => {
      const secret = Number(a.isHidden) - Number(b.isHidden)
      if (secret !== 0) return secret
      return progressRatio(b) - progressRatio(a) || getTier(a.tier).rank - getTier(b.tier).rank
    }), [scopedAchievements])
  const earned = useMemo(() => scopedAchievements
    .filter(a => a.isEarned)
    .sort((a, b) => (a.earnedAt < b.earnedAt ? 1 : -1)), [scopedAchievements])

  const streak = useMemo(() => currentStreak(uniqueSortedDates(scopedRecords)), [scopedRecords])
  const children = useMemo(() => (selectedId ? getDirectChildren(selectedId, categories) : []), [selectedId, categories])
  const ancestors = selectedId ? getCategoryPath(selectedId, categories).slice(0, -1) : []

  const childStats = useMemo(() => children.map(child => {
    const ids = getSubtreeIds(child.id, categories)
    const childAchievements = achievements.filter(a => ids.has(a.categoryId))
    return {
      child,
      recordCount: records.filter(r => ids.has(r.categoryId)).length,
      earned: childAchievements.filter(a => a.isEarned).length,
      total: childAchievements.length,
    }
  }), [children, categories, achievements, records])

  const showIntro = records.length === 0 && !prefs.introDismissed

  return (
    <div className="flex-1 flex">
      <aside className="hidden md:block w-72 flex-shrink-0 border-r border-line bg-surface/50">
        <div className="sticky top-14 h-[calc(100dvh-3.5rem)]">
          <CategoryNav selectedId={selectedId} onSelect={select} />
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-4 md:pt-8 pb-28 md:pb-12">
          {!selected ? (
            <EmptyState
              icon={<FolderIcon size={22} />}
              title="카테고리가 없어요"
              body="달리기, 독서처럼 기록할 분야를 카테고리로 만들어 보세요."
              action={
                <button type="button" className="md:hidden btn btn-sm btn-primary" onClick={() => setSheetOpen(true)}>
                  카테고리 만들기
                </button>
              }
            />
          ) : (
            <>
              <header className="flex items-end justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {ancestors.length > 0 && (
                    <nav className="hidden md:flex items-center gap-1 text-sm text-ink-3 mb-1" aria-label="상위 카테고리">
                      {ancestors.map(c => (
                        <React.Fragment key={c.id}>
                          <button type="button" onClick={() => select(c.id)} className="hover:text-ink hover:underline underline-offset-2">
                            {c.name}
                          </button>
                          <ChevronRightIcon size={14} />
                        </React.Fragment>
                      ))}
                    </nav>
                  )}
                  {ancestors.length > 0 && (
                    <p className="md:hidden text-sm text-ink-3 mb-0.5 truncate">{ancestors.map(c => c.name).join(' › ')}</p>
                  )}
                  <h1 className="hidden md:block text-2xl font-bold text-ink truncate">{selected.name}</h1>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className="md:hidden -ml-1 px-1 inline-flex items-center gap-1.5 rounded-lg text-2xl font-bold text-ink max-w-full"
                    aria-label={`${selected.name}, 카테고리 바꾸기`}
                  >
                    <span className="truncate">{selected.name}</span>
                    <ChevronDownIcon size={22} className="flex-shrink-0 text-ink-3" />
                  </button>
                </div>
                <button type="button" className="hidden md:inline-flex btn btn-primary" onClick={() => openRecordEditor({ categoryId: selected.id })}>
                  <PlusIcon size={18} strokeWidth={2.2} /> 기록하기
                </button>
              </header>

              {showIntro && (
                <div className="mt-5 card border-accent/25 bg-accent-soft/50 p-5 flex gap-4">
                  <LogoMark size={40} className="flex-shrink-0 hidden sm:block" />
                  <div className="min-w-0">
                    <p className="text-md font-semibold text-ink">기록하면 업적이 저절로 쌓여요</p>
                    <p className="mt-1 text-sm text-ink-2">
                      달리기, 독서, 저축처럼 꾸준히 하고 싶은 일을 기록해 보세요. 조건을 채운 업적은 바로 달성되고 진열장에 모여요.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => openRecordEditor({ categoryId: selected.id })}>
                        첫 기록 남기기
                      </button>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPrefs({ introDismissed: true })}>
                        닫기
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-2xl overflow-hidden">
                <Stat label="기록" value={`${formatNumber(scopedRecords.length)}개`} />
                <Stat label="달성한 업적" value={`${earned.length} / ${scopedAchievements.length}`} />
                <Stat
                  label="연속 기록"
                  value={`${streak}일`}
                  icon={streak > 0 ? <FlameIcon size={18} className="text-warn" /> : null}
                />
                <Stat label="마지막 기록" value={scopedRecords[0] ? relativeDay(scopedRecords[0].date) : '없음'} />
              </dl>

              <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-6 items-start">
                <section aria-labelledby="home-records">
                  <div className="flex items-center justify-between mb-3">
                    <h2 id="home-records" className="section-title">최근 기록</h2>
                    {scopedRecords.length > 0 && (
                      <Link to="/records" state={{ categoryId: selected.id }} className="text-sm font-medium text-accent-ink hover:underline underline-offset-2">
                        모두 보기
                      </Link>
                    )}
                  </div>
                  {scopedRecords.length > 0 ? (
                    <div className="space-y-2">
                      {scopedRecords.slice(0, 5).map(r => (
                        <RecordCard key={r.id} record={r} showDate relativeTo={selected.id} />
                      ))}
                    </div>
                  ) : (
                    <div className="card">
                      <EmptyState
                        icon={<NotebookIcon size={22} />}
                        title="아직 기록이 없어요"
                        body={`${selected.name}에서 한 일을 가볍게 남겨 보세요.`}
                        action={
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => openRecordEditor({ categoryId: selected.id })}>
                            기록하기
                          </button>
                        }
                      />
                    </div>
                  )}
                </section>

                <section aria-labelledby="home-achievements" className="space-y-5">
                  <div className="flex items-center justify-between -mb-2">
                    <h2 id="home-achievements" className="section-title">업적</h2>
                    <Link to="/achievements" state={{ categoryId: selected.id }} className="text-sm font-medium text-accent-ink hover:underline underline-offset-2">
                      관리
                    </Link>
                  </div>
                  {scopedAchievements.length === 0 ? (
                    <div className="card">
                      <EmptyState
                        icon={<MedalIcon size={22} />}
                        title="아직 업적이 없어요"
                        body="이 카테고리에서 이루고 싶은 목표를 업적으로 만들어 보세요."
                        action={
                          <Link to="/achievements" state={{ create: true, categoryId: selected.id }} className="btn btn-sm btn-secondary">
                            업적 만들기
                          </Link>
                        }
                      />
                    </div>
                  ) : (
                    <>
                      <AchievementGroup title="다음 목표" items={inProgress} empty="이 카테고리의 업적을 모두 달성했어요." />
                      <AchievementGroup title="달성한 업적" items={earned} />
                    </>
                  )}
                </section>
              </div>

              {childStats.length > 0 && (
                <section className="mt-10" aria-labelledby="home-children">
                  <h2 id="home-children" className="section-title mb-3">하위 카테고리</h2>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {childStats.map(({ child, recordCount, earned: e, total }) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => select(child.id)}
                        className="card px-4 py-3.5 text-left transition-colors hover:border-line-strong hover:bg-sunken/40"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-base font-semibold text-ink truncate">{child.name}</span>
                          <ChevronRightIcon size={16} className="text-ink-3 flex-shrink-0" />
                        </span>
                        <span className="block mt-0.5 text-sm text-ink-2">
                          기록 {formatNumber(recordCount)}개 · 업적 {e}/{total}
                        </span>
                        {total > 0 && <ProgressBar value={e / total} height={4} className="mt-2.5" />}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      <RecordFab categoryId={selected?.id ?? null} />

      <Modal open={sheetOpen} title="카테고리" onClose={() => setSheetOpen(false)} bodyClassName="p-0">
        <div className="h-[65dvh]">
          <CategoryNav selectedId={selectedId} onSelect={select} showTitle={false} />
        </div>
      </Modal>
    </div>
  )
}
