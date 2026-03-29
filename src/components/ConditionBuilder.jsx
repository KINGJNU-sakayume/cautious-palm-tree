import React, { useState } from 'react'
import CategoryTreeSelector from './CategoryTreeSelector.jsx'
import { useApp } from '@/context/AppContext.jsx'

const CONDITION_TYPES = [
  { value: 'action', label: '행동 (기록 1회)' },
  { value: 'count', label: '횟수' },
  { value: 'cumulative', label: '누적' },
  { value: 'daily_cumulative', label: '일별 누적' },
  { value: 'single', label: '단일 값' },
  { value: 'streak', label: '연속' },
  { value: 'tag_match', label: '태그 일치' },
  { value: 'tag_count', label: '태그 횟수' },
  { value: 'tag_set_complete', label: '태그 세트 완성' },
  { value: 'cross_category_cumulative', label: '교차 카테고리 누적' },
]

const META_TYPES = [
  { value: 'meta_count', label: '카테고리 내 업적 수' },
  { value: 'meta_list', label: '특정 업적 목록' },
  { value: 'meta_clear', label: '카테고리 전체 달성' },
]

const AGGREGATION_OPTIONS = [
  { value: 'max', label: '최댓값 (개인 최고)' },
  { value: 'last', label: '최근값' },
  { value: 'sum', label: '합계' },
]

function CrossCategorySources({ condition, update }) {
  const sources = condition.sources || []

  const updateSource = (i, field, val) => {
    const next = sources.map((s, idx) => idx === i ? { ...s, [field]: val } : s)
    update('sources', next)
  }

  const addSource = () => {
    update('sources', [...sources, { categoryId: null, aggregation: 'max' }])
  }

  const removeSource = (i) => {
    update('sources', sources.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">업적의 카테고리 필드는 비워두세요 — 이 조건은 여러 카테고리를 집계합니다.</p>

      {sources.map((src, i) => (
        <div key={i} className="flex items-start gap-2 bg-white border border-slate-200 rounded-lg p-2">
          <div className="flex-1 space-y-1.5">
            <CategoryTreeSelector
              value={src.categoryId || null}
              onChange={id => updateSource(i, 'categoryId', id)}
            />
            <select
              value={src.aggregation || 'max'}
              onChange={e => updateSource(i, 'aggregation', e.target.value)}
              className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:border-primary"
            >
              {AGGREGATION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => removeSource(i)}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 rounded transition-colors flex-shrink-0 mt-0.5"
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addSource}
        className="w-full px-2 py-1.5 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:border-primary hover:text-primary transition-colors"
      >
        + 소스 카테고리 추가
      </button>

      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500 w-16 flex-shrink-0">합계 목표</label>
        <input
          type="number"
          min={0}
          step="any"
          value={condition.target || ''}
          onChange={e => update('target', Number(e.target.value))}
          placeholder="500"
          className="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  )
}

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
        <p className="text-xs text-slate-500">이 카테고리에 기록이 1개 이상 있어야 합니다</p>
      )}

      {condition.type === 'count' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 w-16 flex-shrink-0">목표</label>
          <input
            type="number"
            min={1}
            value={condition.target || ''}
            onChange={e => update('target', Number(e.target.value))}
            placeholder="10"
            className="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary"
          />
          <span className="text-xs text-slate-400">회</span>
        </div>
      )}

      {(condition.type === 'cumulative' || condition.type === 'single' || condition.type === 'daily_cumulative') && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-16 flex-shrink-0">목표</label>
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
          {condition.type === 'daily_cumulative' && (
            <p className="text-xs text-slate-400">하루 내 여러 기록의 값을 합산하여 목표에 도달하면 획득</p>
          )}
        </div>
      )}

      {condition.type === 'streak' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 w-16 flex-shrink-0">목표</label>
          <input
            type="number"
            min={1}
            value={condition.target || ''}
            onChange={e => update('target', Number(e.target.value))}
            placeholder="7"
            className="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary"
          />
          <span className="text-xs text-slate-400">연속일</span>
        </div>
      )}

      {condition.type === 'tag_match' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 w-16 flex-shrink-0">태그</label>
          <input
            type="text"
            value={condition.tag || ''}
            onChange={e => update('tag', e.target.value)}
            placeholder="예: 야외, 아침"
            className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary"
          />
        </div>
      )}

      {condition.type === 'tag_count' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 w-16 flex-shrink-0">태그</label>
          <input
            type="text"
            value={condition.tag || ''}
            onChange={e => update('tag', e.target.value)}
            placeholder="예: 야외, 아침"
            className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary"
          />
          <input
            type="number"
            min={1}
            value={condition.target || ''}
            onChange={e => update('target', Number(e.target.value))}
            placeholder="5"
            className="w-16 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary"
          />
          <span className="text-xs text-slate-400">회</span>
        </div>
      )}

      {condition.type === 'tag_set_complete' && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <label className="text-xs text-slate-500 w-16 flex-shrink-0 pt-1">태그 목록</label>
            <textarea
              rows={3}
              value={(condition.tags || []).join(', ')}
              onChange={e => {
                const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                update('tags', tags)
                update('target', tags.length)
              }}
              placeholder="태그를 쉼표로 구분하여 입력"
              className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <p className="text-xs text-slate-400 pl-[72px]">
            {(condition.tags || []).length}개 태그 — 모두 달성해야 획득
          </p>
        </div>
      )}

      {condition.type === 'cross_category_cumulative' && (
        <CrossCategorySources condition={condition} update={update} />
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
          <label className="text-xs text-slate-500 font-medium">카테고리</label>
          <CategoryTreeSelector
            value={condition.categoryId || null}
            onChange={id => update('categoryId', id)}
          />
          {condition.type === 'meta_count' && (
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-slate-500 w-16">목표</label>
              <input
                type="number"
                min={1}
                value={condition.target || ''}
                onChange={e => update('target', Number(e.target.value))}
                placeholder="5"
                className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-slate-400">업적 획득</span>
            </div>
          )}
        </div>
      )}

      {condition.type === 'meta_list' && (
        <div className="space-y-2">
          <label className="text-xs text-slate-500 font-medium">필요 업적</label>
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
            placeholder="업적 검색…"
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
                className="px-3 py-1 text-xs font-medium rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
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
        + 조건 추가
      </button>
    </div>
  )
}
