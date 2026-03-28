import React, { useState } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import { useToast } from '@/context/ToastContext.jsx'
import { todayStr } from '@/utils/formatters.js'
import { getCategoryPath, getDirectChildren, isLeafCategory } from '@/utils/categoryTree.js'

export default function RecordEditor({ selectedCategoryId, initialRecord = null }) {
  const { categories, saveRecord } = useApp()
  const { addToasts } = useToast()

  const [targetCategoryId, setTargetCategoryId] = useState(selectedCategoryId)
  const [date, setDate] = useState(() => initialRecord?.date ?? todayStr())
  const [value, setValue] = useState(() => initialRecord?.value != null ? String(initialRecord.value) : '')
  const [unit, setUnit] = useState(() => initialRecord?.unit ?? '')
  const [memo, setMemo] = useState(() => initialRecord?.memo ?? '')
  const [photoUrl, setPhotoUrl] = useState(() => initialRecord?.photoUrl ?? '')
  const [tags, setTags] = useState(() => initialRecord?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // When selectedCategoryId changes externally, reset target
  React.useEffect(() => {
    setTargetCategoryId(selectedCategoryId)
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
  }, [initialRecord])

  const isLeaf = isLeafCategory(selectedCategoryId, categories)
  const children = getDirectChildren(selectedCategoryId, categories)

  const effectiveCategoryId = isLeaf ? selectedCategoryId : (targetCategoryId || null)

  const handleAddTag = () => {
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
      handleAddTag()
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!effectiveCategoryId) return

    setSaving(true)
    // Simulate brief loading
    await new Promise(r => setTimeout(r, 200))

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

    // Reset form
    setValue('')
    setUnit('')
    setMemo('')
    setPhotoUrl('')
    setDate(todayStr())
    setTags([])
    setTagInput('')
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl shadow-card p-5 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">기록 추가</h3>

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
          <span>📁</span>
          <span className="font-medium">
            {getCategoryPath(selectedCategoryId, categories).map(c => c.name).join(' › ')}
          </span>
        </div>
      )}

      {/* Date */}
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
            onChange={e => setUnit(e.target.value)}
            placeholder="km, kg, 분…"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          />
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

      {/* Tags */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
          태그
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="태그 입력 후 추가…"
            className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            추가
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-500 leading-none"
                  aria-label={`태그 "${tag}" 제거`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Save button */}
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
          {saving ? '저장 중…' : '기록 저장'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium animate-fade-in">✓ 저장됨!</span>
        )}
        {!effectiveCategoryId && !isLeaf && (
          <span className="text-xs text-slate-400">먼저 하위 카테고리를 선택하세요</span>
        )}
      </div>
    </form>
  )
}
