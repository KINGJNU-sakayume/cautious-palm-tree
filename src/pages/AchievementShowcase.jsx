import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '@/components/EmptyState.jsx'
import Medal, { TierLabel } from '@/components/Medal.jsx'
import Modal from '@/components/Modal.jsx'
import ProgressBar from '@/components/ProgressBar.jsx'
import { useApp } from '@/context/AppContext.jsx'
import { useUI } from '@/context/UIContext.jsx'
import { TIERS, getTier } from '@/constants/tiers.js'
import { getCategoryPathLabel, getSubtreeIds } from '@/utils/categoryTree.js'
import { longestStreak, uniqueSortedDates } from '@/utils/dates.js'
import { formatDate, formatDateShort, formatNumber } from '@/utils/formatters.js'
import { CheckIcon, ChevronRightIcon, PlusIcon, TrophyIcon, XIcon } from '@/components/Icons.jsx'

function byPrestige(a, b) {
  return getTier(b.tier).rank - getTier(a.tier).rank || (a.earnedAt < b.earnedAt ? 1 : -1)
}

function PinPicker({ slot, pinnedId, earned, categories, onPick, onClear, onClose }) {
  const sorted = [...earned].sort(byPrestige)
  return (
    <Modal
      title={`대표 업적 ${slot + 1}번 칸`}
      onClose={onClose}
      bodyClassName="p-2"
      footer={pinnedId ? (
        <button type="button" className="btn btn-ghost text-danger hover:text-danger px-3" onClick={onClear}>
          <XIcon size={16} /> 이 칸 비우기
        </button>
      ) : null}
    >
      <ul>
        {sorted.map(a => {
          const current = a.id === pinnedId
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onPick(a.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${current ? 'bg-accent-soft' : 'hover:bg-sunken'}`}
              >
                <Medal tier={a.tier} earned size={36} />
                <span className="flex-1 min-w-0">
                  <span className="block text-base font-semibold text-ink truncate">{a.title}</span>
                  <span className="block text-sm text-ink-3 truncate">
                    {a.categoryId ? getCategoryPathLabel(a.categoryId, categories) : '모든 기록'} · {formatDateShort(a.earnedAt)}
                  </span>
                </span>
                {current && <CheckIcon size={18} className="text-accent-ink flex-shrink-0" />}
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}

export default function AchievementShowcase() {
  const { achievements, records, categories, prefs, setPinned } = useApp()
  const { openAchievement } = useUI()
  const navigate = useNavigate()
  const [tierFilter, setTierFilter] = useState(null)
  const [openSlot, setOpenSlot] = useState(null)

  const earned = useMemo(() => achievements.filter(a => a.isEarned), [achievements])
  const earnedById = useMemo(() => new Map(earned.map(a => [a.id, a])), [earned])
  const collection = useMemo(
    () => earned.filter(a => !tierFilter || a.tier === tierFilter).sort((a, b) => (a.earnedAt < b.earnedAt ? 1 : -1)),
    [earned, tierFilter],
  )

  const tierCounts = useMemo(() => TIERS.map(t => ({
    tier: t,
    earned: earned.filter(a => a.tier === t.id).length,
    total: achievements.filter(a => a.tier === t.id).length,
  })), [earned, achievements])

  const categoryProgress = useMemo(() => categories
    .filter(c => !c.parentId)
    .map(root => {
      const scope = getSubtreeIds(root.id, categories)
      const list = achievements.filter(a => scope.has(a.categoryId))
      return { root, total: list.length, earned: list.filter(a => a.isEarned).length }
    })
    .filter(x => x.total > 0), [categories, achievements])

  const recordStats = useMemo(() => {
    const dates = uniqueSortedDates(records)
    return { days: dates.length, streak: longestStreak(dates), first: dates[0] ?? null }
  }, [records])

  const pct = achievements.length > 0 ? Math.round((earned.length / achievements.length) * 100) : 0
  const pins = prefs.pinned.map(id => (id ? earnedById.get(id) ?? null : null))
  const pinnedCount = pins.filter(Boolean).length
  const firstEmptySlot = pins.findIndex(a => !a)

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 pt-5 md:pt-8 pb-12 space-y-8">
      <h1 className="text-2xl font-bold text-ink">진열장</h1>

      {/* Summary */}
      <section className="card p-5 md:p-6" aria-label="달성 현황">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p className="text-sm text-ink-2">달성한 업적</p>
            <p className="mt-1 text-3xl font-bold text-ink tabular tracking-tight">
              {earned.length}
              <span className="text-xl font-semibold text-ink-3"> / {achievements.length}</span>
            </p>
          </div>
          <p className="text-sm text-ink-2">
            {earned.length === 0 ? '첫 업적을 기다리고 있어요' : `전체의 ${pct}%를 모았어요`}
          </p>
        </div>
        <ProgressBar value={achievements.length ? earned.length / achievements.length : 0} height={8} className="mt-4" label="전체 달성률" />
        <ul className="mt-5 grid grid-cols-5 gap-2">
          {tierCounts.map(({ tier, earned: e, total }) => (
            <li key={tier.id} className="flex flex-col items-center gap-1.5 text-center">
              <Medal tier={tier.id} earned={e > 0} size={32} />
              <TierLabel tier={tier.id} />
              <span className="text-sm text-ink-2 tabular">{e}<span className="text-ink-3">/{total}</span></span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pinned — shown once there is something to pin */}
      {earned.length > 0 && (
        <section aria-labelledby="showcase-pins">
          <div className="flex items-baseline justify-between mb-3">
            <h2 id="showcase-pins" className="section-title">대표 업적</h2>
            {pinnedCount > 0 && <span className="text-sm text-ink-3">눌러서 바꾸거나 뺄 수 있어요</span>}
          </div>
          {pinnedCount === 0 ? (
            <div className="card p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="flex -space-x-2.5">
                {[...earned].sort(byPrestige).slice(0, 3).map(a => (
                  <Medal key={a.id} tier={a.tier} earned size={40} className="ring-2 ring-surface" />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-ink">자랑하고 싶은 업적을 골라 걸어 보세요</p>
                <p className="mt-0.5 text-sm text-ink-2">최대 5개까지 진열장 맨 위에 보여요.</p>
              </div>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => setOpenSlot(0)}>
                업적 고르기
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {pins.map((a, slot) => a && (
                <li key={slot}>
                  <button
                    type="button"
                    onClick={() => setOpenSlot(slot)}
                    className="w-full h-full min-h-[148px] card p-4 flex flex-col items-center justify-center gap-2 text-center transition-colors hover:border-line-strong"
                    aria-label={`대표 업적 ${slot + 1}: ${a.title} (바꾸기)`}
                  >
                    <Medal tier={a.tier} earned size={56} />
                    <span className="text-base font-semibold text-ink line-clamp-2">{a.title}</span>
                    <span className="text-xs text-ink-3">{formatDateShort(a.earnedAt)}</span>
                  </button>
                </li>
              ))}
              {firstEmptySlot >= 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => setOpenSlot(firstEmptySlot)}
                    className="w-full h-full min-h-[148px] rounded-2xl border border-dashed border-line-strong p-4 flex flex-col items-center justify-center gap-2 text-ink-3 transition-colors hover:text-ink-2 hover:bg-surface"
                  >
                    <PlusIcon size={22} />
                    <span className="text-sm font-medium">업적 더 걸기</span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </section>
      )}

      {/* Collection */}
      <section aria-labelledby="showcase-collection">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 id="showcase-collection" className="section-title">모은 업적</h2>
          {earned.length > 0 && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="등급별 보기">
              <button type="button" onClick={() => setTierFilter(null)} aria-pressed={!tierFilter} className={`chip h-7 ${!tierFilter ? 'chip-active' : ''}`}>
                전체
              </button>
              {tierCounts.filter(x => x.earned > 0).map(({ tier, earned: e }) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setTierFilter(v => (v === tier.id ? null : tier.id))}
                  aria-pressed={tierFilter === tier.id}
                  className={`chip h-7 ${tierFilter === tier.id ? 'chip-active' : ''}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: tier.color }} />
                  {tier.label} {e}
                </button>
              ))}
            </div>
          )}
        </div>
        {collection.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<TrophyIcon size={22} />}
              title="아직 모은 업적이 없어요"
              body="기록을 남기면 조건을 채운 업적이 이곳에 하나씩 쌓여요."
              action={<button type="button" className="btn btn-sm btn-secondary" onClick={() => navigate('/achievements')}>어떤 업적이 있는지 보기</button>}
            />
          </div>
        ) : (
          <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {collection.map(a => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => openAchievement(a.id)}
                  className="w-full h-full rounded-2xl px-2 py-4 flex flex-col items-center gap-2 text-center transition-colors hover:bg-surface"
                >
                  <Medal tier={a.tier} earned size={52} />
                  <span className="text-sm font-semibold text-ink line-clamp-2">{a.title}</span>
                  <span className="text-xs text-ink-3">{formatDateShort(a.earnedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-8 md:grid-cols-2 md:gap-6 items-start">
        {/* Category progress */}
        <section aria-labelledby="showcase-categories">
          <h2 id="showcase-categories" className="section-title mb-3">카테고리별 진행</h2>
          <ul className="card divide-y divide-line overflow-hidden">
            {categoryProgress.map(({ root, total, earned: e }) => (
              <li key={root.id}>
                <button
                  type="button"
                  onClick={() => navigate('/', { state: { categoryId: root.id } })}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-sunken/50"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-base font-medium text-ink">{root.name}</span>
                    <span className="flex items-center gap-1 text-sm text-ink-2 tabular">
                      {e} / {total}
                      <ChevronRightIcon size={16} className="text-ink-3" />
                    </span>
                  </span>
                  <ProgressBar value={e / total} height={4} className="mt-2" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Record stats */}
        <section aria-labelledby="showcase-stats">
          <h2 id="showcase-stats" className="section-title mb-3">기록 통계</h2>
          <dl className="card divide-y divide-line">
            {[
              ['총 기록', `${formatNumber(records.length)}개`],
              ['기록한 날', `${formatNumber(recordStats.days)}일`],
              ['가장 길게 이어진 기록', `${formatNumber(recordStats.streak)}일`],
              ['첫 기록', recordStats.first ? formatDate(recordStats.first) : '아직 없어요'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-base text-ink-2">{label}</dt>
                <dd className="text-base font-semibold text-ink tabular">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {openSlot !== null && (
        <PinPicker
          slot={openSlot}
          pinnedId={prefs.pinned[openSlot]}
          earned={earned}
          categories={categories}
          onPick={(id) => { setPinned(openSlot, id); setOpenSlot(null) }}
          onClear={() => { setPinned(openSlot, null); setOpenSlot(null) }}
          onClose={() => setOpenSlot(null)}
        />
      )}
    </div>
  )
}
