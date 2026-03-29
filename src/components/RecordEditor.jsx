import React, { useState } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import { useToast } from '@/context/ToastContext.jsx'
import { useCategoryDefaults } from '@/hooks/useCategoryDefaults.js'
import { todayStr } from '@/utils/formatters.js'
import { getCategoryPath, getDirectChildren, isLeafCategory } from '@/utils/categoryTree.js'
import { XIcon, FolderOpenIcon } from '@/components/Icons.jsx'
import { useConfirm } from '@/hooks/useConfirm.jsx'
import { RECORD_SUBMIT_DELAY_MS, SAVED_INDICATOR_MS } from '@/constants/timing.js'

export default function RecordEditor({ selectedCategoryId, initialRecord = null, onClose, onDelete }) {
  const { categories, saveRecord, updateRecord } = useApp()
  const { addToasts } = useToast()
  const { getDefaults, setDefaultUnit } = useCategoryDefaults()
  const { confirmDialog, confirm } = useConfirm()

  const isEditing = initialRecord != null

  const [targetCategoryId, setTargetCategoryId] = useState(selectedCategoryId)
  const [date, setDate] = useState(() => initialRecord?.date ?? todayStr())
  const [value, setValue] = useState(() => initialRecord?.value != null ? String(initialRecord.value) : '')
  const [unit, setUnit] = useState(() => {
    if (initialRecord?.unit != null) return initialRecord.unit
    if (!isEditing && selectedCategoryId) {
      const d = getDefaults(selectedCategoryId)
      if (d.autoApply && d.defaultUnit) return d.defaultUnit
    }
    return ''
  })
  const [memo, setMemo] = useState(() => initialRecord?.memo ?? '')
  const [photoUrl, setPhotoUrl] = useState(() => initialRecord?.photoUrl ?? '')
  const [tags, setTags] = useState(() => {
    if (initialRecord?.tags != null) return initialRecord.tags
    if (!isEditing && selectedCategoryId) {
      const d = getDefaults(selectedCategoryId)
      if (d.autoApply && d.defaultTags?.length > 0) return [...d.defaultTags]
    }
    return []
  })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  // Track if user changed the unit away from the default (to show "Save as default?" prompt)
  const [unitChangedFromDefault, setUnitChangedFromDefault] = useState(false)
  const [defaultSaved, setDefaultSaved] = useState(false)

  // When selectedCategoryId changes externally, reset target and apply new defaults
  React.useEffect(() => {
    setTargetCategoryId(selectedCategoryId)
    if (!isEditing && selectedCategoryId) {
      const d = getDefaults(selectedCategoryId)
      if (d.autoApply) {
        if (d.defaultUnit) setUnit(d.defaultUnit)
        if (d.defaultTags?.length > 0) setTags([...d.defaultTags])
      }
    }
    setUnitChangedFromDefault(false)
    setDefaultSaved(false)
  }, [selectedCategoryId])

  // When initialRecord changes, sync all form state
  React.useEffect(() => {
    setDate(initialRecord?.date ?? todayStr())
    setValue(initialRecord?.value != null ? String(initialRecord.value) : '')
    setUnit(initialRecord?.unit ?? '')
    setMemo(initialRecord?.memo ?? '')
    setPhotoUrl(initialRecord?.photoUrl ?? '')
    setTags(initialRecord?.tags ?? [])
    setTagInput('')
    setUnitChangedFromDefault(false)
    setDefaultSaved(false)
  }, [initialRecord])

  const isLeaf = isLeafCategory(selectedCategoryId, categories)
  const children = getDirectChildren(selectedCategoryId, categories)

  const effectiveCategoryId = isLeaf ? selectedCategoryId : (targetCategoryId || null)

  // Show "save as default?" prompt when unit differs from stored default
  const activeDefaults = selectedCategoryId ? getDefaults(selectedCategoryId) : null
  const showSaveDefaultPrompt =
    !isEditing &&
    unitChangedFromDefault &&
    !defaultSaved &&
    unit.trim() !== '' &&
    activeDefaults &&
    unit !== activeDefaults.defaultUnit

  const commitTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed])
    }
    setTagInput('')
  }

  const handleRemoveTag = (tag) => {
    setTags(prev => prev.filter(t => t !== tag))
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitTag()
    } else if (e.key === ',') {
      e.preventDefault()
      commitTag()
    }
  }

  const handleTagBlur = () => {
    if (tagInput.trim()) commitTag()
  }

  const handleUnitChange = (e) => {
    setUnit(e.target.value)
    if (!unitChangedFromDefault) setUnitChangedFromDefault(true)
  }

  const handleSaveAsDefault = () => {
    if (selectedCategoryId) {
      setDefaultUnit(selectedCategoryId, unit)
      setDefaultSaved(true)
      setUnitChangedFromDefault(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!effectiveCategoryId) return

    setSaving(true)
    await new Promise(r => setTimeout(r, RECORD_SUBMIT_DELAY_MS))

    if (isEditing) {
      await updateRecord({
        ...initialRecord,
        categoryId: effectiveCategoryId,
        date,
        value: value !== '' ? Number(value) : null,
        unit: unit || null,
        memo: memo || null,
        photoUrl: photoUrl || null,
        tags,
      })
      setSaving(false)
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        onClose?.()
      }, 800)
    } else {
      saveRecord(
        {
          categoryId: effectiveCategoryId,
          date,
          value: value !== '' ? Number(value) : null,
          unit: unit || null,
          memo: memo || null,
          photoUrl: photoUrl || null,
          tags,
        },
        (unlockedAchievements) => {
          if (unlockedAchievements.length > 0) {
            addToasts(unlockedAchievements)
          }
        }
      )

      // Reset form, re-apply defaults
      const d = selectedCategoryId ? getDefaults(selectedCategoryId) : null
      setValue('')
      setUnit(d?.autoApply && d?.defaultUnit ? d.defaultUnit : '')
      setMemo('')
      setPhotoUrl('')
      setDate(todayStr())
      setTags(d?.autoApply && d?.defaultTags?.length > 0 ? [...d.defaultTags] : [])
      setTagInput('')
      setSaving(false)
      setSaved(true)
      setUnitChangedFromDefault(false)
      setDefaultSaved(false)
      setTimeout(() => setSaved(false), SAVED_INDICATOR_MS)
    }
  }

  const handleDelete = async () => {
    if (!initialRecord?.id) return
    const confirmed = await confirm('기록 삭제', '이 기록을 삭제할까요?')
    if (!confirmed) return
    await onDelete(initialRecord.id)
  }

  return (
    <>
    <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl shadow-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          {isEditing ? '기록 수정 / 삭제' : '기록 추가'}
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="닫기"
          >
            <XIcon size={16} />
          </button>
        )}
      </div>

      {/* Category display */}
      {!isLeaf && children.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
            하위 카테고리에 저장
          </label>
          <div className="flex flex-wrap gap-2">
            {children.map(child => (
              <button
                key={child.id}
                type="button"
                onClick={() => setTargetCategoryId(child.id)}
                className={[
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  targetCategoryId === child.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-primary hover:text-primary',
                ].join(' ')}
              >
                {child.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLeaf && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <FolderOpenIcon size={13} className="flex-shrink-0" />
          <span className="font-medium">
            {getCategoryPath(selectedCategoryId, categories).map(c => c.name).join(' › ')}
          </span>
        </div>
      )}

      {/* Date / Value / Unit */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
            날짜 <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
            값
          </label>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="0"
            step="any"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
            단위
          </label>
          <input
            type="text"
            value={unit}
            onChange={handleUnitChange}
            placeholder="km, kg, 분…"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          />
          {showSaveDefaultPrompt && (
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span>"{unit}"을(를) 기본 단위로?</span>
              <button
                type="button"
                onClick={handleSaveAsDefault}
                className="text-primary font-medium hover:underline"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setUnitChangedFromDefault(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                나중에
              </button>
            </div>
          )}
          {defaultSaved && (
            <p className="mt-1 text-xs text-green-600">기본 단위로 저장됨</p>
          )}
        </div>
      </div>

      {/* Memo */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
          메모
        </label>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          rows={2}
          placeholder="이번 세션에 대한 메모…"
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      {/* Photo URL */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
          사진 URL
        </label>
        <input
          type="url"
          value={photoUrl}
          onChange={e => setPhotoUrl(e.target.value)}
          placeholder="https://…"
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Tags — inline chips + input, no separate Add button */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
          태그
        </label>
        <div className="flex flex-wrap items-center gap-1.5 border border-slate-300 rounded-lg px-2 py-1.5 focus-within:border-primary transition-colors min-h-[38px]">
          {tags.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-red-500 leading-none flex items-center"
                aria-label={`태그 "${tag}" 제거`}
              >
                <XIcon size={10} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={handleTagBlur}
            placeholder={tags.length === 0 ? '태그 입력…' : ''}
            className="flex-1 min-w-[80px] text-sm outline-none bg-transparent py-0.5"
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">Enter로 추가 · ×를 눌러 제거</p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !effectiveCategoryId}
          className={[
            'px-6 py-2.5 rounded-lg font-semibold text-sm transition-all',
            saving || !effectiveCategoryId
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-dark active:scale-95',
          ].join(' ')}
        >
          {saving ? '저장 중…' : isEditing ? '수정 저장' : '기록 저장'}
        </button>
        {isEditing && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2.5 rounded-lg font-semibold text-sm border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 transition-colors active:scale-95"
          >
            삭제
          </button>
        )}
        {saved && (
          <span className="text-sm text-green-600 font-medium animate-fade-in">✓ 저장됨!</span>
        )}
        {!effectiveCategoryId && !isLeaf && (
          <span className="text-xs text-slate-400">먼저 하위 카테고리를 선택하세요</span>
        )}
      </div>
    </form>
    {confirmDialog}
    </>
  )
}
