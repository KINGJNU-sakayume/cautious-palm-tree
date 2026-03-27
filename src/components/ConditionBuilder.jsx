import React, { useState } from 'react'
import CategoryTreeSelector from './CategoryTreeSelector.jsx'
import { useApp } from '@/context/AppContext.jsx'

const CONDITION_TYPES = [
  { value: 'action', label: 'Action (1 record)' },
  { value: 'count', label: 'Count' },
  { value: 'cumulative', label: 'Cumulative' },
  { value: 'single', label: 'Single Value' },
  { value: 'streak', label: 'Streak' },
]

const META_TYPES = [
  { value: 'meta_count', label: 'Achievement Count in Category' },
  { value: 'meta_list', label: 'Specific Achievement List' },
  { value: 'meta_clear', label: 'Clear All in Category' },
]

function ConditionBlock({ condition, onChange, onRemove, showRemove }) {
  const update = (field, val) => onChange({ ...condition, [field]: val })

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <select
          value={condition.type}
          onChange={e => onChange({ type: e.target.value })}
          className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
        >
          {CONDITION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 rounded transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {condition.type === 'action' && (
        <p className="text-xs text-slate-500">At least 1 record exists in this category</p>
      )}

      {condition.type === 'count' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 w-16 flex-shrink-0">Target</label>
          <input
            type="number"
            min={1}
            value={condition.target || ''}
            onChange={e => update('target', Number(e.target.value))}
            placeholder="10"
            className="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary"
          />
          <span className="text-xs text-slate-400">records</span>
        </div>
      )}

      {(condition.type === 'cumulative' || condition.type === 'single') && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 w-16 flex-shrink-0">Target</label>
          <input
            type="number"
            min={0}
            step="any"
            value={condition.target || ''}
            onChange={e => update('target', Number(e.target.value))}
            placeholder="100"
            className="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary"
          />
          <input
            type="text"
            value={condition.unit || ''}
            onChange={e => update('unit', e.target.value)}
            placeholder="km, kg…"
            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary"
          />
        </div>
      )}

      {condition.type === 'streak' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 w-16 flex-shrink-0">Target</label>
          <input
            type="number"
            min={1}
            value={condition.target || ''}
            onChange={e => update('target', Number(e.target.value))}
            placeholder="7"
            className="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary"
          />
          <span className="text-xs text-slate-400">consecutive days</span>
        </div>
      )}
    </div>
  )
}

function MetaConditionBuilder({ condition, onChange }) {
  const { achievements } = useApp()
  const [achSearch, setAchSearch] = useState('')

  const update = (field, val) => onChange({ ...condition, [field]: val })

  const filteredAchievements = achievements.filter(
    a => a.title.toLowerCase().includes(achSearch.toLowerCase())
  )

  const toggleAchievement = (id) => {
    const ids = condition.achievementIds || []
    const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    update('achievementIds', next)
  }

  return (
    <div className="space-y-3">
      <select
        value={condition.type}
        onChange={e => onChange({ type: e.target.value })}
        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
      >
        {META_TYPES.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {(condition.type === 'meta_count' || condition.type === 'meta_clear') && (
        <div className="space-y-2">
          <label className="text-xs text-slate-500 font-medium">Category</label>
          <CategoryTreeSelector
            value={condition.categoryId || null}
            onChange={id => update('categoryId', id)}
          />
          {condition.type === 'meta_count' && (
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-slate-500 w-16">Target</label>
              <input
                type="number"
                min={1}
                value={condition.target || ''}
                onChange={e => update('target', Number(e.target.value))}
                placeholder="5"
                className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-slate-400">achievements earned</span>
            </div>
          )}
        </div>
      )}

      {condition.type === 'meta_list' && (
        <div className="space-y-2">
          <label className="text-xs text-slate-500 font-medium">Required Achievements</label>
          {/* Tag chips for selected */}
          {(condition.achievementIds || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(condition.achievementIds || []).map(id => {
                const a = achievements.find(x => x.id === id)
                return a ? (
                  <span
                    key={id}
                    className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                  >
                    {a.title}
                    <button
                      type="button"
                      onClick={() => toggleAchievement(id)}
                      className="hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ) : null
              })}
            </div>
          )}
          <input
            type="text"
            value={achSearch}
            onChange={e => setAchSearch(e.target.value)}
            placeholder="Search achievements…"
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
            {filteredAchievements.slice(0, 20).map(a => (
              <label key={a.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(condition.achievementIds || []).includes(a.id)}
                  onChange={() => toggleAchievement(a.id)}
                  className="rounded border-slate-300 text-primary"
                />
                <span className="text-sm text-slate-700 truncate">{a.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ConditionBuilder({ type, value, onChange }) {
  // value is the condition object or composite

  const isMeta = type === 'meta'

  if (isMeta) {
    const metaCondition = value && ['meta_count', 'meta_list', 'meta_clear'].includes(value.type)
      ? value
      : { type: 'meta_count' }

    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <MetaConditionBuilder condition={metaCondition} onChange={onChange} />
      </div>
    )
  }

  // For one-time / repeatable: list of condition blocks
  // Normalize: always work with an array of blocks + optional operator
  let blocks = []
  let operator = 'AND'

  if (!value || value.type === undefined) {
    blocks = [{ type: 'action' }]
  } else if (value.type === 'composite') {
    blocks = value.conditions || [{ type: 'action' }]
    operator = value.operator || 'AND'
  } else {
    blocks = [value]
  }

  const emitChange = (newBlocks, newOperator) => {
    if (newBlocks.length === 1) {
      onChange(newBlocks[0])
    } else {
      onChange({ type: 'composite', operator: newOperator, conditions: newBlocks })
    }
  }

  const addBlock = () => {
    emitChange([...blocks, { type: 'action' }], operator)
  }

  const updateBlock = (i, block) => {
    const next = blocks.map((b, idx) => idx === i ? block : b)
    emitChange(next, operator)
  }

  const removeBlock = (i) => {
    const next = blocks.filter((_, idx) => idx !== i)
    emitChange(next, operator)
  }

  const toggleOperator = () => {
    const next = operator === 'AND' ? 'OR' : 'AND'
    emitChange(blocks, next)
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <React.Fragment key={i}>
          <ConditionBlock
            condition={block}
            onChange={b => updateBlock(i, b)}
            onRemove={() => removeBlock(i)}
            showRemove={blocks.length > 1}
          />
          {i < blocks.length - 1 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-slate-200" />
              <button
                type="button"
                onClick={toggleOperator}
                className="px-3 py-1 text-xs font-bold rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
              >
                {operator}
              </button>
              <div className="flex-1 border-t border-slate-200" />
            </div>
          )}
        </React.Fragment>
      ))}

      <button
        type="button"
        onClick={addBlock}
        className="w-full px-3 py-2 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-primary hover:text-primary transition-colors"
      >
        + Add Condition
      </button>
    </div>
  )
}
