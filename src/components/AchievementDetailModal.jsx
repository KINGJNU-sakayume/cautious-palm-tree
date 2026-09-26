import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal.jsx'
import Medal, { TierLabel } from './Medal.jsx'
import ProgressBar from './ProgressBar.jsx'
import { useApp } from '@/context/AppContext.jsx'
import { useToast } from '@/context/ToastContext.jsx'
import { describeCondition, hasMeasurableProgress, progressLabel, progressRatio } from '@/utils/achievementText.js'
import { getCategoryPathLabel } from '@/utils/categoryTree.js'
import { formatDate, formatDateShort } from '@/utils/formatters.js'
import { todayStr } from '@/utils/dates.js'
import { AlertIcon, CheckIcon, PencilIcon, PinIcon } from './Icons.jsx'

function TagChecklist({ achievement }) {
  const tags = achievement.condition.tags || []
  const done = achievement.completedDates || {}
  const sorted = [...tags].sort((a, b) => (done[a] ? 0 : 1) - (done[b] ? 0 : 1))
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
      {sorted.map(tag => (
        <li
          key={tag}
          className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${done[tag] ? 'bg-accent-soft' : 'bg-sunken'}`}
        >
          <span
            className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center ${done[tag] ? 'bg-accent text-accent-on' : 'border border-line-strong'}`}
          >
            {done[tag] && <CheckIcon size={12} strokeWidth={2.6} />}
          </span>
          <span className="min-w-0">
            <span className={`block truncate text-sm ${done[tag] ? 'font-semibold text-accent-ink' : 'text-ink-2'}`}>{tag}</span>
            {done[tag] && <span className="block text-xs text-accent-ink/80">{formatDateShort(done[tag])}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

function RequiredAchievements({ ids, byId, onOpen }) {
  return (
    <ul className="divide-y divide-line rounded-xl border border-line">
      {ids.map(id => byId.get(id)).filter(Boolean).map(req => (
        <li key={req.id}>
          <button type="button" onClick={() => onOpen(req.id)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-sunken/60">
            <Medal tier={req.tier} earned={req.isEarned} hidden={req.isHidden} size={28} />
            <span className="flex-1 min-w-0 truncate text-sm font-medium text-ink">
              {req.isHidden && !req.isEarned ? '숨겨진 업적' : req.title}
            </span>
            <span className={`text-xs font-medium ${req.isEarned ? 'text-accent-ink' : 'text-ink-3'}`}>
              {req.isEarned ? '달성' : '아직'}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function AchievementDetailModal({ id, onClose }) {
  const { achievements, categories, prefs, pinAchievement, unpinAchievement, setManualEarned } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const [currentId, setCurrentId] = useState(id)
  const [manualDate, setManualDate] = useState(todayStr())

  const byId = new Map(achievements.map(a => [a.id, a]))
  const a = byId.get(currentId)
  if (!a) return null

  const secret = a.isHidden && !a.isEarned
  const isPinned = prefs.pinned.includes(a.id)
  const isManual = a.condition.type === 'manual'
  const scopeLabel = a.categoryId ? getCategoryPathLabel(a.categoryId, categories) : '모든 기록'

  const togglePin = () => {
    if (isPinned) {
      unpinAchievement(a.id)
      toast.success('대표 업적에서 뺐어요.')
    } else if (pinAchievement(a.id)) {
      toast.success('진열장의 대표 업적으로 걸었어요.')
    } else {
      toast.info('대표 업적은 5개까지 걸 수 있어요. 진열장에서 하나를 빼 주세요.')
    }
  }

  const edit = () => {
    onClose()
    navigate('/achievements', { state: { editId: a.id } })
  }

  return (
    <Modal
      title={secret ? '숨겨진 업적' : a.title}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-ghost px-3" onClick={edit}>
            <PencilIcon size={16} /> 편집
          </button>
          <div className="flex-1" />
          {a.isEarned && (
            <button type="button" className={`btn ${isPinned ? 'btn-secondary' : 'btn-primary'}`} onClick={togglePin}>
              <PinIcon size={16} /> {isPinned ? '대표에서 빼기' : '대표 업적으로'}
            </button>
          )}
          {!a.isEarned && <button type="button" className="btn btn-secondary" onClick={onClose}>닫기</button>}
        </div>
      }
    >
      <div className="flex items-center gap-4">
        <Medal tier={a.tier} earned={a.isEarned} hidden={a.isHidden} size={64} />
        <div className="min-w-0">
          <TierLabel tier={a.tier} className="text-sm" />
          <p className="text-sm text-ink-2 truncate">{scopeLabel}</p>
          {a.isEarned && (
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-accent-ink">
              <CheckIcon size={16} strokeWidth={2.4} /> {formatDate(a.earnedAt)} 달성
            </p>
          )}
        </div>
      </div>

      {secret ? (
        <p className="mt-5 text-base text-ink-2">
          조건을 채우면 이름과 내용이 공개돼요. 어떤 업적인지 미리 보고 싶다면 편집 화면에서 확인할 수 있어요.
        </p>
      ) : (
        <>
          {a.description && <p className="mt-5 text-base text-ink">{a.description}</p>}

          <section className="mt-6">
            <h3 className="text-sm font-semibold text-ink-2 mb-2">달성 조건</h3>
            <p className="text-base text-ink">{describeCondition(a.condition, { categories, achievement: a })}</p>

            {a.error && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-danger">
                <AlertIcon size={16} /> {a.error}
              </p>
            )}

            {!a.isEarned && !a.error && hasMeasurableProgress(a.condition) && a.condition.type !== 'tag_set_complete' && (
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={progressRatio(a)} height={8} className="flex-1" label="진행도" />
                <span className="text-sm font-medium text-ink-2 tabular">{progressLabel(a)}</span>
              </div>
            )}
          </section>

          {a.condition.type === 'tag_set_complete' && (
            <section className="mt-6">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-sm font-semibold text-ink-2">모은 태그</h3>
                <span className="text-sm font-medium text-ink-2 tabular">{progressLabel(a)}</span>
              </div>
              <TagChecklist achievement={a} />
            </section>
          )}

          {a.condition.type === 'meta_list' && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-ink-2 mb-2">필요한 업적</h3>
              <RequiredAchievements ids={a.condition.achievementIds} byId={byId} onOpen={setCurrentId} />
            </section>
          )}

          {isManual && (
            <section className="mt-6 rounded-xl bg-sunken p-4">
              {a.isEarned ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-ink-2">직접 체크한 업적이에요.</p>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setManualEarned(a.id, null)}>
                    달성 취소
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-ink-2 mb-3">이 업적은 직접 체크해요. 이뤄 낸 날짜를 골라 주세요.</p>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      className="input flex-1"
                      value={manualDate}
                      max={todayStr()}
                      onChange={e => setManualDate(e.target.value)}
                      aria-label="달성한 날짜"
                    />
                    <button type="button" className="btn btn-primary" onClick={() => setManualEarned(a.id, manualDate || todayStr())}>
                      달성했어요
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}
    </Modal>
  )
}
