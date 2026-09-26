import React, { useId, useMemo, useRef, useState } from 'react'
import Modal from './Modal.jsx'
import CategoryPicker from './CategoryPicker.jsx'
import { useApp } from '@/context/AppContext.jsx'
import { useToast } from '@/context/ToastContext.jsx'
import { useConfirm } from '@/hooks/useConfirm.jsx'
import { addDays, isValidDateStr, todayStr } from '@/utils/dates.js'
import { getDirectChildren } from '@/utils/categoryTree.js'
import { imageFileToDataUrl } from '@/utils/image.js'
import { achievementUnits, recentUnits, suggestTags } from '@/utils/suggestions.js'
import { normalizeTag } from '@/utils/achievementEvaluator.js'
import TagInput from './TagInput.jsx'
import { ImageIcon, PlusIcon, TrashIcon, XIcon } from './Icons.jsx'

const SUGGESTION_PREVIEW = 8

function initialForm(record, categoryId, prefs) {
  if (record) {
    return {
      categoryId: record.categoryId,
      date: record.date,
      value: record.value != null ? String(record.value) : '',
      unit: record.unit ?? '',
      memo: record.memo ?? '',
      photoUrl: record.photoUrl ?? '',
      tags: [...(record.tags || [])],
    }
  }
  const startCategory = categoryId ?? prefs.lastCategoryId ?? null
  const defaults = startCategory ? prefs.categoryDefaults[startCategory] : null
  const apply = defaults?.autoApply !== false
  return {
    categoryId: startCategory,
    date: todayStr(),
    value: '',
    unit: apply ? defaults?.defaultUnit ?? '' : '',
    memo: '',
    photoUrl: '',
    tags: apply ? [...(defaults?.defaultTags ?? [])] : [],
  }
}

/**
 * Add a record (`record` null) or edit one. `categoryId` preselects a category.
 */
export default function RecordEditorModal({ record = null, categoryId = null, onClose }) {
  const {
    categories, records, achievements, prefs,
    addRecord, updateRecord, deleteRecord, setCategoryDefaults,
  } = useApp()
  const toast = useToast()
  const { confirm, confirmDialog } = useConfirm()
  const uid = useId()
  const isEditing = record != null

  const [form, setForm] = useState(() => initialForm(record, categoryId, prefs))
  const [touched, setTouched] = useState({ unit: false, tags: false })
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)
  const [photoMode, setPhotoMode] = useState(() => (/^https?:/.test(record?.photoUrl ?? '') ? 'url' : 'file'))
  const [photoBusy, setPhotoBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState({})
  const fileInputRef = useRef(null)

  const set = (patch) => setForm(f => ({ ...f, ...patch }))

  const changeCategory = (nextId) => {
    const patch = { categoryId: nextId }
    // Fill in that category's defaults unless the user already typed something.
    const defaults = nextId ? prefs.categoryDefaults[nextId] : null
    if (!isEditing && defaults?.autoApply !== false) {
      if (!touched.unit) patch.unit = defaults?.defaultUnit ?? ''
      if (!touched.tags) patch.tags = [...(defaults?.defaultTags ?? [])]
    }
    set(patch)
    setErrors(e => ({ ...e, categoryId: null }))
    setShowAllSuggestions(false)
  }

  const subcategories = form.categoryId ? getDirectChildren(form.categoryId, categories) : []

  const tagSuggestions = useMemo(
    () => (form.categoryId ? suggestTags({ categoryId: form.categoryId, achievements, categories, records, exclude: form.tags }) : []),
    [form.categoryId, form.tags, achievements, categories, records],
  )
  const units = useMemo(
    () => (form.categoryId ? achievementUnits(form.categoryId, achievements, categories) : []),
    [form.categoryId, achievements, categories],
  )
  const unitOptions = useMemo(
    () => [...new Set([...units, ...(form.categoryId ? recentUnits(form.categoryId, records) : [])])],
    [units, form.categoryId, records],
  )

  // ── Tags ──
  const setTags = (tags) => {
    setTouched(t => ({ ...t, tags: true }))
    set({ tags })
  }
  const addSuggestedTag = (tag) => {
    if (!form.tags.some(t => normalizeTag(t) === normalizeTag(tag))) setTags([...form.tags, tag])
  }

  // ── Photo ──
  const acceptFile = async (file) => {
    if (!file) return
    setPhotoBusy(true)
    try {
      set({ photoUrl: await imageFileToDataUrl(file) })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setPhotoBusy(false)
    }
  }

  // ── Save / delete ──
  const validate = () => {
    const next = {}
    if (!form.categoryId) next.categoryId = '카테고리를 골라 주세요.'
    if (!isValidDateStr(form.date)) next.date = '날짜를 확인해 주세요.'
    else if (form.date > todayStr()) next.date = '미래 날짜는 기록할 수 없어요.'
    if (form.value.trim() !== '' && !Number.isFinite(Number(form.value))) next.value = '숫자로 입력해 주세요.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const data = form

    if (isEditing) {
      updateRecord({ ...record, ...data })
      toast.success('기록을 수정했어요.')
    } else {
      addRecord(data)
      // Remember the unit the first time one is used in a category.
      const defaults = prefs.categoryDefaults[data.categoryId]
      if (data.unit.trim() && !defaults?.defaultUnit) setCategoryDefaults(data.categoryId, { defaultUnit: data.unit.trim() })
      toast.success('기록을 저장했어요.')
    }
    onClose()
  }

  const handleDelete = async () => {
    const ok = await confirm('이 기록을 삭제할까요?', '삭제한 직후에는 알림에서 되돌릴 수 있어요.', { confirmLabel: '삭제' })
    if (!ok) return
    deleteRecord(record.id)
    onClose()
  }

  const visibleSuggestions = showAllSuggestions ? tagSuggestions : tagSuggestions.slice(0, SUGGESTION_PREVIEW)
  const today = todayStr()

  return (
    <Modal
      title={isEditing ? '기록 수정' : '기록하기'}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          {isEditing && (
            <button type="button" onClick={handleDelete} className="btn btn-ghost text-danger hover:text-danger px-3" aria-label="기록 삭제">
              <TrashIcon size={18} />
              <span className="hidden sm:inline">삭제</span>
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="btn btn-secondary">취소</button>
          <button type="submit" form={`${uid}-form`} className="btn btn-primary" disabled={photoBusy}>
            {isEditing ? '수정 완료' : '저장'}
          </button>
        </div>
      }
    >
      <form id={`${uid}-form`} onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Category */}
        <div>
          <label className="field-label" htmlFor={`${uid}-category`}>카테고리</label>
          <CategoryPicker id={`${uid}-category`} value={form.categoryId} onChange={changeCategory} placeholder="어디에 기록할까요?" />
          {subcategories.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-ink-3 mr-0.5">더 자세히</span>
              {subcategories.map(child => (
                <button key={child.id} type="button" className="chip h-7 px-2.5" onClick={() => changeCategory(child.id)}>
                  {child.name}
                </button>
              ))}
            </div>
          )}
          {errors.categoryId && <p className="field-error">{errors.categoryId}</p>}
        </div>

        {/* Date */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="field-label mb-0" htmlFor={`${uid}-date`}>날짜</label>
            <div className="flex gap-1">
              {[['오늘', today], ['어제', addDays(today, -1)]].map(([label, date]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => set({ date })}
                  className={`chip h-7 px-2.5 ${form.date === date ? 'chip-active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <input
            id={`${uid}-date`}
            type="date"
            className="input"
            value={form.date}
            max={today}
            onChange={e => set({ date: e.target.value })}
          />
          {errors.date && <p className="field-error">{errors.date}</p>}
        </div>

        {/* Value + unit */}
        <div>
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <div>
              <label className="field-label" htmlFor={`${uid}-value`}>값 <span className="font-normal text-ink-3">(선택)</span></label>
              <input
                id={`${uid}-value`}
                type="text"
                inputMode="decimal"
                className="input tabular"
                value={form.value}
                onChange={e => set({ value: e.target.value })}
                placeholder="예: 5.2"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="field-label" htmlFor={`${uid}-unit`}>단위</label>
              <input
                id={`${uid}-unit`}
                type="text"
                className="input"
                value={form.unit}
                onChange={e => { set({ unit: e.target.value }); setTouched(t => ({ ...t, unit: true })) }}
                placeholder="km, 분…"
                list={`${uid}-units`}
                autoComplete="off"
              />
              <datalist id={`${uid}-units`}>
                {unitOptions.map(u => <option key={u} value={u} />)}
              </datalist>
            </div>
          </div>
          {errors.value && <p className="field-error">{errors.value}</p>}
          {units.length > 0 && (
            <p className="field-hint">
              이 카테고리 업적은 <strong className="font-semibold text-ink-2">{units.join(', ')}</strong> 기준으로 계산돼요.
              다른 단위도 환산할 수 있으면 자동으로 바꿔서 더해요.
            </p>
          )}
        </div>

        {/* Memo */}
        <div>
          <label className="field-label" htmlFor={`${uid}-memo`}>메모</label>
          <textarea
            id={`${uid}-memo`}
            className="input"
            rows={3}
            value={form.memo}
            onChange={e => set({ memo: e.target.value })}
            placeholder="오늘은 어땠나요?"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="field-label" htmlFor={`${uid}-tag`}>태그</label>
          <TagInput id={`${uid}-tag`} value={form.tags} onChange={setTags} />
          {visibleSuggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-ink-3 mr-0.5">추천</span>
              {visibleSuggestions.map(({ tag, fromAchievement }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addSuggestedTag(tag)}
                  className={`chip h-7 px-2.5 ${fromAchievement ? 'border-dashed' : ''}`}
                  title={fromAchievement ? '업적과 관련된 태그예요' : '전에 쓴 태그예요'}
                >
                  <PlusIcon size={12} />
                  {tag}
                </button>
              ))}
              {!showAllSuggestions && tagSuggestions.length > SUGGESTION_PREVIEW && (
                <button type="button" className="text-sm font-medium text-accent-ink hover:underline px-1" onClick={() => setShowAllSuggestions(true)}>
                  {tagSuggestions.length - SUGGESTION_PREVIEW}개 더
                </button>
              )}
            </div>
          )}
        </div>

        {/* Photo */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="field-label mb-0">사진</span>
            {!(photoMode === 'file' && form.photoUrl) && (
              <button
                type="button"
                className="text-sm font-medium text-ink-2 hover:text-ink"
                onClick={() => { setPhotoMode(m => (m === 'file' ? 'url' : 'file')); set({ photoUrl: '' }) }}
              >
                {photoMode === 'file' ? '링크로 넣기' : '파일로 넣기'}
              </button>
            )}
          </div>
          {photoMode === 'file' && form.photoUrl ? (
            <div className="relative">
              <img src={form.photoUrl} alt="기록에 첨부한 사진" className="w-full max-h-56 object-cover rounded-xl border border-line" />
              <button
                type="button"
                onClick={() => set({ photoUrl: '' })}
                className="absolute top-2 right-2 btn btn-sm btn-secondary shadow-card"
              >
                <XIcon size={14} /> 빼기
              </button>
            </div>
          ) : photoMode === 'file' ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); acceptFile(e.dataTransfer.files?.[0]) }}
              className={`rounded-xl border border-dashed transition-colors ${dragOver ? 'border-accent bg-accent-soft' : 'border-line-strong'}`}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-5 text-sm font-medium text-ink-2 hover:text-ink"
                disabled={photoBusy}
              >
                <ImageIcon size={18} />
                {photoBusy ? '사진 줄이는 중…' : '사진 고르기 또는 여기로 끌어오기'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                onChange={e => { acceptFile(e.target.files?.[0]); e.target.value = '' }}
              />
            </div>
          ) : (
            <>
              <input
                type="url"
                className="input"
                value={form.photoUrl}
                onChange={e => set({ photoUrl: e.target.value })}
                placeholder="https://…"
              />
              {/^https?:\/\/\S+/.test(form.photoUrl) && (
                <img src={form.photoUrl} alt="링크 사진 미리보기" className="mt-2 w-full max-h-56 object-cover rounded-xl border border-line" />
              )}
            </>
          )}
        </div>
      </form>
      {confirmDialog}
    </Modal>
  )
}
