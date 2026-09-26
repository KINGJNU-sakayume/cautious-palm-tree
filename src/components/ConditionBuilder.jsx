import React, { useEffect, useMemo, useState } from 'react'
import CategoryPicker from './CategoryPicker.jsx'
import Medal from './Medal.jsx'
import TagInput from './TagInput.jsx'
import { useApp } from '@/context/AppContext.jsx'
import { COMPOSABLE_CONDITION_TYPES, isMetaCondition } from '@/utils/achievementEvaluator.js'
import { getCategoryPathLabel } from '@/utils/categoryTree.js'
import { CheckIcon, PlusIcon, SearchIcon, XIcon } from './Icons.jsx'

const RECORD_TYPES = [
  { value: 'action', label: '첫 기록 남기기' },
  { value: 'count', label: '기록 횟수 채우기' },
  { value: 'cumulative', label: '값을 모두 더해 목표 채우기' },
  { value: 'single', label: '한 번에 목표 넘기기' },
  { value: 'daily_cumulative', label: '하루 합계로 목표 넘기기' },
  { value: 'streak', label: '며칠 연속 기록하기' },
  { value: 'tag_match', label: '특정 태그로 기록하기' },
  { value: 'tag_count', label: '특정 태그로 여러 번 기록하기' },
  { value: 'tag_set_complete', label: '태그 목록 모두 모으기' },
  { value: 'cross_category_cumulative', label: '여러 카테고리 합산하기' },
  { value: 'composite', label: '여러 조건 함께 채우기' },
]
const META_TYPES = [
  { value: 'meta_count', label: '업적 개수 채우기' },
  { value: 'meta_list', label: '고른 업적 모두 달성하기' },
  { value: 'meta_clear', label: '카테고리 업적 모두 달성하기' },
]
const OTHER_TYPES = [{ value: 'manual', label: '직접 체크하기' }]

const LABEL_BY_TYPE = Object.fromEntries([...RECORD_TYPES, ...META_TYPES, ...OTHER_TYPES].map(t => [t.value, t.label]))

const AGGREGATIONS = [
  { value: 'max', label: '최고 기록' },
  { value: 'sum', label: '모두 더한 값' },
  { value: 'last', label: '가장 최근 기록' },
]

const UNIT_TYPES = ['cumulative', 'single', 'daily_cumulative', 'cross_category_cumulative']

/** A fresh condition of `type`, keeping the unit when it still makes sense. */
export function defaultCondition(type, previous = null) {
  const unit = UNIT_TYPES.includes(type) && previous?.unit ? previous.unit : ''
  switch (type) {
    case 'count': return { type, target: 10 }
    case 'cumulative': return { type, target: 100, unit }
    case 'single': return { type, target: 10, unit }
    case 'daily_cumulative': return { type, target: 2, unit }
    case 'streak': return { type, target: 7 }
    case 'tag_match': return { type, tag: '' }
    case 'tag_count': return { type, tag: '', target: 5 }
    case 'tag_set_complete': return { type, tags: [] }
    case 'cross_category_cumulative':
      return { type, sources: [{ categoryId: null, aggregation: 'max' }, { categoryId: null, aggregation: 'max' }], target: 100, unit }
    case 'composite':
      return { type, operator: 'AND', conditions: [{ type: 'count', target: 10 }, { type: 'streak', target: 7 }] }
    case 'meta_count': return { type, target: 5 }
    case 'meta_list': return { type, achievementIds: [] }
    default: return { type }
  }
}

/** Text box for numbers that keeps what's typed ("1.") while passing numbers up. */
function NumberField({ value, onChange, integer = false, className = 'w-28', ...rest }) {
  const [text, setText] = useState(value === '' || value == null ? '' : String(value))
  useEffect(() => {
    if (Number(text) !== value && !(text === '' && value === '')) setText(value === '' || value == null ? '' : String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <input
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      value={text}
      onChange={e => {
        const raw = e.target.value.replace(/,/g, '')
        setText(raw)
        const n = Number(raw)
        onChange(raw.trim() === '' || !Number.isFinite(n) ? raw : n)
      }}
      className={`input tabular ${className}`}
      autoComplete="off"
      {...rest}
    />
  )
}

function Row({ children }) {
  return <div className="flex flex-wrap items-center gap-2 text-base text-ink">{children}</div>
}

function Hint({ children }) {
  return <p className="field-hint">{children}</p>
}

// ── Record-based fields ──────────────────────────────────────────────────────

function RecordConditionFields({ condition: c, onChange }) {
  const set = (patch) => onChange({ ...c, ...patch })
  const unitInput = (
    <input
      type="text"
      value={c.unit ?? ''}
      onChange={e => set({ unit: e.target.value })}
      placeholder="단위"
      aria-label="단위"
      className="input w-24"
      autoComplete="off"
    />
  )

  switch (c.type) {
    case 'action':
      return <Hint>이 카테고리에 기록을 하나라도 남기면 달성해요.</Hint>

    case 'count':
      return (
        <Row>
          기록 <NumberField integer value={c.target} onChange={target => set({ target })} aria-label="목표 횟수" /> 회
        </Row>
      )

    case 'cumulative':
      return (
        <>
          <Row>
            모두 더해서 <NumberField value={c.target} onChange={target => set({ target })} aria-label="목표 값" /> {unitInput}
          </Row>
          <Hint>단위를 적으면 같은 단위의 기록만 더해요. m→km, 분→시간처럼 바꿀 수 있는 단위는 알아서 환산해요.</Hint>
        </>
      )

    case 'single':
      return (
        <>
          <Row>
            한 번에 <NumberField value={c.target} onChange={target => set({ target })} aria-label="목표 값" /> {unitInput} 이상
          </Row>
          <Hint>기록 하나의 값이 목표를 넘으면 달성해요.</Hint>
        </>
      )

    case 'daily_cumulative':
      return (
        <>
          <Row>
            하루에 <NumberField value={c.target} onChange={target => set({ target })} aria-label="목표 값" /> {unitInput} 이상
          </Row>
          <Hint>같은 날 남긴 기록의 값을 더해서 비교해요.</Hint>
        </>
      )

    case 'streak':
      return (
        <>
          <Row>
            <NumberField integer value={c.target} onChange={target => set({ target })} aria-label="연속 일수" /> 일 연속
          </Row>
          <Hint>지나간 날짜로 남긴 기록도 포함해서, 가장 길게 이어진 기간을 봐요.</Hint>
        </>
      )

    case 'tag_match':
      return (
        <Row>
          <input type="text" value={c.tag ?? ''} onChange={e => set({ tag: e.target.value })} placeholder="예: 야외" className="input w-40" aria-label="태그" />
          태그를 붙인 기록 남기기
        </Row>
      )

    case 'tag_count':
      return (
        <Row>
          <input type="text" value={c.tag ?? ''} onChange={e => set({ tag: e.target.value })} placeholder="예: 야외" className="input w-36" aria-label="태그" />
          태그를 붙인 기록
          <NumberField integer value={c.target} onChange={target => set({ target })} className="w-20" aria-label="목표 횟수" /> 회
        </Row>
      )

    case 'tag_set_complete':
      return (
        <>
          <TagInput value={c.tags || []} onChange={tags => set({ tags })} placeholder="태그를 입력하고 Enter (쉼표로 여러 개 붙여넣기)" ariaLabel="모을 태그" />
          <Hint>{(c.tags || []).length}개 태그가 모두 한 번 이상 기록되면 달성해요. 기록할 때 추천 태그로 보여 줘요.</Hint>
        </>
      )

    case 'cross_category_cumulative':
      return <CrossCategoryFields condition={c} onChange={onChange} unitInput={unitInput} />

    default:
      return null
  }
}

function CrossCategoryFields({ condition: c, onChange, unitInput }) {
  const sources = c.sources || []
  const setSource = (i, patch) => onChange({ ...c, sources: sources.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) })
  return (
    <div className="space-y-3">
      {sources.map((source, i) => (
        <div key={i} className="rounded-xl border border-line p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-2">카테고리 {i + 1}</span>
            {sources.length > 1 && (
              <button
                type="button"
                className="icon-btn w-8 h-8"
                onClick={() => onChange({ ...c, sources: sources.filter((_, idx) => idx !== i) })}
                aria-label={`카테고리 ${i + 1} 빼기`}
              >
                <XIcon size={16} />
              </button>
            )}
          </div>
          <CategoryPicker value={source.categoryId} onChange={categoryId => setSource(i, { categoryId })} />
          <select className="input" value={source.aggregation || 'max'} onChange={e => setSource(i, { aggregation: e.target.value })} aria-label="계산 방법">
            {AGGREGATIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-sm btn-secondary w-full"
        onClick={() => onChange({ ...c, sources: [...sources, { categoryId: null, aggregation: 'max' }] })}
      >
        <PlusIcon size={16} /> 카테고리 추가
      </button>
      <Row>
        합계 <NumberField value={c.target} onChange={target => onChange({ ...c, target })} aria-label="목표 값" /> {unitInput} 이상
      </Row>
      <Hint>예: 벤치 프레스·스쿼트·데드리프트의 최고 기록을 더한 '3대 중량'.</Hint>
    </div>
  )
}

function CompositeFields({ condition: c, onChange }) {
  const parts = c.conditions || []
  const setPart = (i, part) => onChange({ ...c, conditions: parts.map((p, idx) => (idx === i ? part : p)) })
  const partTypes = RECORD_TYPES.filter(t => COMPOSABLE_CONDITION_TYPES.includes(t.value))

  return (
    <div className="space-y-3">
      <div className="flex items-center rounded-full bg-sunken p-0.5 w-fit" role="radiogroup" aria-label="묶는 방법">
        {[['AND', '모두 채우기'], ['OR', '하나만 채워도 됨']].map(([op, label]) => (
          <button
            key={op}
            type="button"
            role="radio"
            aria-checked={(c.operator || 'AND') === op}
            onClick={() => onChange({ ...c, operator: op })}
            className={`h-8 px-3.5 rounded-full text-sm font-medium transition-colors ${(c.operator || 'AND') === op ? 'bg-surface text-ink shadow-card' : 'text-ink-2'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {parts.map((part, i) => (
        <div key={i} className="rounded-xl border border-line p-3 space-y-3">
          <div className="flex items-center gap-2">
            <select
              className="input flex-1"
              value={part.type}
              onChange={e => setPart(i, defaultCondition(e.target.value, part))}
              aria-label={`조건 ${i + 1} 종류`}
            >
              {partTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {parts.length > 1 && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => onChange({ ...c, conditions: parts.filter((_, idx) => idx !== i) })}
                aria-label={`조건 ${i + 1} 빼기`}
              >
                <XIcon size={16} />
              </button>
            )}
          </div>
          <RecordConditionFields condition={part} onChange={p => setPart(i, p)} />
        </div>
      ))}
      <button
        type="button"
        className="btn btn-sm btn-secondary w-full"
        onClick={() => onChange({ ...c, conditions: [...parts, defaultCondition('count')] })}
      >
        <PlusIcon size={16} /> 조건 추가
      </button>
    </div>
  )
}

// ── Achievement-based fields ─────────────────────────────────────────────────

function AchievementChecklist({ condition: c, onChange, selfId }) {
  const { achievements, categories } = useApp()
  const [query, setQuery] = useState('')
  const selected = c.achievementIds || []
  const options = useMemo(() => {
    const q = query.trim().toLowerCase()
    return achievements
      .filter(a => a.id !== selfId)
      .filter(a => !q || a.title.toLowerCase().includes(q) || (a.categoryId && getCategoryPathLabel(a.categoryId, categories).toLowerCase().includes(q)))
  }, [achievements, categories, query, selfId])

  const toggle = (id) => onChange({ ...c, achievementIds: selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id] })

  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-2">{selected.length}개 고름 · 모두 달성하면 이 업적도 달성해요.</p>
      <div className="rounded-xl border border-line overflow-hidden">
        <div className="relative border-b border-line">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="업적 이름이나 카테고리로 찾기"
            className="w-full h-10 pl-9 pr-3 bg-transparent text-base outline-none placeholder:text-ink-3"
            aria-label="업적 찾기"
          />
        </div>
        <ul className="max-h-60 overflow-y-auto overscroll-contain scrollbar-thin p-1">
          {options.map(a => {
            const isOn = selected.includes(a.id)
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => toggle(a.id)}
                  aria-pressed={isOn}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left ${isOn ? 'bg-accent-soft' : 'hover:bg-sunken'}`}
                >
                  <span className={`w-5 h-5 flex-shrink-0 rounded-md border flex items-center justify-center ${isOn ? 'bg-accent border-accent text-accent-on' : 'border-line-strong'}`}>
                    {isOn && <CheckIcon size={13} strokeWidth={2.6} />}
                  </span>
                  <Medal tier={a.tier} size={22} earned={a.isEarned} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink truncate">{a.title}</span>
                    <span className="block text-xs text-ink-3 truncate">
                      {a.categoryId ? getCategoryPathLabel(a.categoryId, categories) : '모든 기록'}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
          {options.length === 0 && <li className="px-3 py-4 text-center text-sm text-ink-3">맞는 업적이 없어요.</li>}
        </ul>
      </div>
    </div>
  )
}

function MetaConditionFields({ condition: c, onChange, selfId, categoryId }) {
  const { categories } = useApp()
  const scope = categoryId ? `'${getCategoryPathLabel(categoryId, categories)}'` : '전체'
  switch (c.type) {
    case 'meta_count':
      return (
        <>
          <Row>
            업적 <NumberField integer value={c.target} onChange={target => onChange({ ...c, target })} className="w-20" aria-label="목표 개수" /> 개 달성
          </Row>
          <Hint>{scope} 업적 중에서 세요(다른 업적으로 달성하는 업적은 빼고). 범위는 위에서 고른 카테고리를 따라요.</Hint>
        </>
      )
    case 'meta_clear':
      return <Hint>{scope} 업적을 모두 달성하면 달성해요. 나중에 추가한 업적도 포함되고, 다른 업적으로 달성하는 업적은 세지 않아요.</Hint>
    case 'meta_list':
      return <AchievementChecklist condition={c} onChange={onChange} selfId={selfId} />
    default:
      return null
  }
}

// ── Builder ──────────────────────────────────────────────────────────────────

export default function ConditionBuilder({ value, onChange, achievementId = null, categoryId = null, error = null }) {
  const condition = value?.type ? value : { type: 'action' }
  const changeType = (type) => {
    if (type !== condition.type) onChange(defaultCondition(type, condition))
  }

  return (
    <div className="space-y-3">
      <select
        className="input"
        value={condition.type}
        onChange={e => changeType(e.target.value)}
        aria-label="달성 방법"
      >
        <optgroup label="기록으로 달성">
          {RECORD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </optgroup>
        <optgroup label="다른 업적으로 달성">
          {META_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </optgroup>
        <optgroup label="기타">
          {OTHER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </optgroup>
        {!LABEL_BY_TYPE[condition.type] && <option value={condition.type}>알 수 없는 조건</option>}
      </select>

      <div className="rounded-xl bg-sunken/60 p-3.5">
        {condition.type === 'composite' ? (
          <CompositeFields condition={condition} onChange={onChange} />
        ) : isMetaCondition(condition) ? (
          <MetaConditionFields condition={condition} onChange={onChange} selfId={achievementId} categoryId={categoryId} />
        ) : condition.type === 'manual' ? (
          <Hint>기록과 상관없이, 업적을 눌러 '달성했어요'로 직접 체크해요. 버킷리스트처럼 한 번뿐인 일에 좋아요.</Hint>
        ) : (
          <RecordConditionFields condition={condition} onChange={onChange} />
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
