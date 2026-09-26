import React, { useId, useMemo, useState } from 'react'
import Modal from './Modal.jsx'
import CategoryPicker from './CategoryPicker.jsx'
import ConditionBuilder from './ConditionBuilder.jsx'
import AchievementCard from './AchievementCard.jsx'
import Switch from './Switch.jsx'
import { useApp } from '@/context/AppContext.jsx'
import { useToast } from '@/context/ToastContext.jsx'
import { useConfirm } from '@/hooks/useConfirm.jsx'
import { TIERS, getTier, tint } from '@/constants/tiers.js'
import { conditionError, evaluateAchievements } from '@/utils/achievementEvaluator.js'
import { TrashIcon } from './Icons.jsx'

const DRAFT_ID = '__draft__'

export function blankAchievement(categoryId = null) {
  return { id: null, title: '', description: '', categoryId, tier: 'bronze', condition: { type: 'action' }, isHidden: false }
}

function toForm(a) {
  return {
    id: a.id,
    title: a.title,
    description: a.description ?? '',
    categoryId: a.categoryId ?? null,
    tier: a.tier,
    condition: JSON.parse(JSON.stringify(a.condition)),
    isHidden: !!a.isHidden,
    ...(a.manualEarnedAt !== undefined ? { manualEarnedAt: a.manualEarnedAt } : {}),
  }
}

function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div>
      {htmlFor ? <label className="field-label" htmlFor={htmlFor}>{label}</label> : <span className="field-label">{label}</span>}
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  )
}

/** Create (`achievement` without id) or edit an achievement in a side sheet. */
export default function AchievementEditor({ achievement, onClose }) {
  const { achievements, records, categories, saveAchievement, deleteAchievement } = useApp()
  const toast = useToast()
  const { confirm, confirmDialog } = useConfirm()
  const uid = useId()
  const isNew = !achievement.id

  const [initial] = useState(() => toForm(achievement))
  const [form, setForm] = useState(initial)
  const [showErrors, setShowErrors] = useState(false)
  const set = (patch) => setForm(f => ({ ...f, ...patch }))

  const titleError = !form.title.trim() ? '이름을 입력해 주세요.' : null
  const condError = conditionError(form.condition)
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  // Live preview against the records that exist right now.
  const preview = useMemo(() => {
    const draft = { ...form, id: form.id ?? DRAFT_ID, isHidden: false }
    const defs = [...achievements.filter(a => a.id !== draft.id), draft]
    const r = evaluateAchievements(defs, records, categories).get(draft.id)
    return {
      ...draft,
      title: draft.title.trim() || '이름 없는 업적',
      description: draft.description.trim() || '설명을 적으면 여기에 보여요.',
      isEarned: r.earned,
      earnedAt: r.earnedAt,
      progress: r.progress,
      target: r.target,
      completedTags: r.completedTags,
      error: r.error ?? null,
    }
  }, [form, achievements, records, categories])

  const requestClose = async () => {
    if (dirty && !(await confirm('저장하지 않고 닫을까요?', '바꾼 내용이 사라져요.', { confirmLabel: '닫기' }))) return
    onClose()
  }

  const save = () => {
    if (titleError || condError) {
      setShowErrors(true)
      return
    }
    saveAchievement(form)
    toast.success(isNew ? '업적을 만들었어요.' : '업적을 저장했어요.')
    onClose()
  }

  const remove = async () => {
    const usedBy = achievements.filter(a => a.condition.type === 'meta_list' && a.condition.achievementIds.includes(form.id))
    const body = usedBy.length > 0
      ? `이 업적을 조건으로 쓰는 업적 ${usedBy.length}개에서도 빠져요. 기록은 그대로 남아요.`
      : '기록은 그대로 남아요.'
    if (!(await confirm(`'${initial.title}' 업적을 삭제할까요?`, body, { confirmLabel: '삭제' }))) return
    deleteAchievement(form.id)
    toast.success('업적을 삭제했어요.')
    onClose()
  }

  const selectedTier = getTier(form.tier)

  return (
    <Modal
      variant="drawer"
      title={isNew ? '새 업적' : '업적 편집'}
      onClose={requestClose}
      footer={
        <div className="flex items-center gap-2">
          {!isNew && (
            <button type="button" className="btn btn-ghost text-danger hover:text-danger px-3" onClick={remove}>
              <TrashIcon size={18} /> <span className="hidden sm:inline">삭제</span>
            </button>
          )}
          <div className="flex-1" />
          <button type="button" className="btn btn-secondary" onClick={requestClose}>취소</button>
          <button type="button" className="btn btn-primary" onClick={save}>{isNew ? '만들기' : '저장'}</button>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-ink-3 mb-2">미리보기 · 지금까지의 기록 기준</p>
          <AchievementCard achievement={preview} showCategory isStatic />
          {form.isHidden && <p className="field-hint">숨김 업적이라 달성 전에는 이름과 내용이 '숨겨진 업적'으로 보여요.</p>}
        </div>

        <Field label="이름" htmlFor={`${uid}-title`} error={showErrors ? titleError : null}>
          <input
            id={`${uid}-title`}
            className="input"
            value={form.title}
            onChange={e => set({ title: e.target.value })}
            placeholder="예: 첫 10km 완주"
            maxLength={40}
            data-autofocus={isNew ? '' : undefined}
          />
        </Field>

        <Field label="설명" htmlFor={`${uid}-desc`} hint="어떤 업적인지, 어떻게 달성하는지 적어 두면 나중에 보기 좋아요.">
          <textarea
            id={`${uid}-desc`}
            className="input"
            rows={2}
            value={form.description}
            onChange={e => set({ description: e.target.value })}
            placeholder="예: 한 번에 10km를 쉬지 않고 달려 보세요."
          />
        </Field>

        <Field
          label="카테고리"
          htmlFor={`${uid}-cat`}
          hint={form.categoryId ? '이 카테고리와 하위 카테고리의 기록을 모두 세요.' : '카테고리가 없으면 모든 기록을 세요.'}
        >
          <CategoryPicker
            id={`${uid}-cat`}
            value={form.categoryId}
            onChange={categoryId => set({ categoryId })}
            allowNone
            noneLabel="카테고리 없음 (모든 기록)"
          />
        </Field>

        <Field label="등급">
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="등급">
            {TIERS.map(t => {
              const active = form.tier === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => set({ tier: t.id })}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 text-xs font-semibold transition-colors ${active ? 'border-transparent' : 'border-line hover:border-line-strong text-ink-2'}`}
                  style={active ? { background: tint(t.hex, 0.14), boxShadow: `inset 0 0 0 1.5px ${t.hex}`, color: t.ink } : undefined}
                >
                  <span className="w-4 h-4 rounded-full" style={{ background: t.color }} />
                  {t.label}
                </button>
              )
            })}
          </div>
          <p className="field-hint">{selectedTier.label}: {selectedTier.hint}</p>
        </Field>

        <Field label="달성 조건">
          <ConditionBuilder
            value={form.condition}
            onChange={condition => set({ condition })}
            achievementId={form.id}
            categoryId={form.categoryId}
            error={showErrors ? condError : null}
          />
        </Field>

        <Switch
          id={`${uid}-hidden`}
          checked={form.isHidden}
          onChange={isHidden => set({ isHidden })}
          label="달성하기 전까지 숨기기"
          description="이름과 설명이 가려져서, 달성했을 때 깜짝 선물처럼 공개돼요."
        />
      </div>
      {confirmDialog}
    </Modal>
  )
}
