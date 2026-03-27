import React, { useState } from 'react'
import { useApp } from '@/context/AppContext.jsx'
import { useToast } from '@/context/ToastContext.jsx'
import { todayStr } from '@/utils/formatters.js'
import { getCategoryPath, getDirectChildren, isLeafCategory } from '@/utils/categoryTree.js'

export default function RecordEditor({ selectedCategoryId }) {
  const { categories, saveRecord } = useApp()
  const { addToasts } = useToast()

  const [targetCategoryId, setTargetCategoryId] = useState(selectedCategoryId)
  const [date, setDate] = useState(todayStr())
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('')
  const [memo, setMemo] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // When selectedCategoryId changes externally, reset target
  React.useEffect(() => {
    setTargetCategoryId(selectedCategoryId)
  }, [selectedCategoryId])

  const isLeaf = isLeafCategory(selectedCategoryId, categories)
  const children = getDirectChildren(selectedCategoryId, categories)

  const effectiveCategoryId = isLeaf ? selectedCategoryId : (targetCategoryId || null)

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
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl shadow-card p-5 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Log a Record</h3>

      {/* Category display */}
      {!isLeaf && children.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
            Save to subcategory
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
            Date <span className="text-red-400">*</span>
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
            Value
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
            Unit
          </label>
          <input
            type="text"
            value={unit}
            onChange={e => setUnit(e.target.value)}
            placeholder="km, kg, min…"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Memo */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
          Memo
        </label>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          rows={2}
          placeholder="Notes about this session…"
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      {/* Photo URL */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
          Photo URL
        </label>
        <input
          type="url"
          value={photoUrl}
          onChange={e => setPhotoUrl(e.target.value)}
          placeholder="https://…"
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
        />
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
          {saving ? 'Saving…' : 'Save Record'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium animate-fade-in">✓ Saved!</span>
        )}
        {!effectiveCategoryId && !isLeaf && (
          <span className="text-xs text-slate-400">Select a subcategory first</span>
        )}
      </div>
    </form>
  )
}
