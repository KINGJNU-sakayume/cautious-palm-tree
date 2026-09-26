import React, { useEffect, useMemo, useState } from 'react'
import CategoryPicker from './CategoryPicker.jsx'
import Medal from './Medal.jsx'
import TagInput from './TagInput.jsx'
import { useApp } from '@/context/AppContext.jsx'
import { TIERS } from '@/constants/tiers.js'
import { COMPOSABLE_CONDITION_TYPES, hasMinimum, isMetaCondition } from '@/utils/achievementEvaluator.js'
import { getCategoryPathLabel } from '@/utils/categoryTree.js'
import { CheckIcon, PlusIcon, SearchIcon, XIcon } from './Icons.jsx'

const RECORD_TYPES = [
  { value: 'action', label: '첫 기록 남기기' },
  { value: 'count', label: '기록 횟수 채우기' },
  { value: 'days', label: '기록한 날 수 채우기' },
  { value: 'streak', label: '며칠 연속 기록하기' },
  { value: 'period_streak', label: '매주·매달 꾸준히 기록하기' },
  { value: 'cumulative', label: '값을 모두 더해 목표 채우기' },
  { value: 'single', label: '한 번에 목표 넘기기' },
  { value: 'daily_cumulative', label: '하루 합계로 목표 넘기기' },
  { value: 'period_cumulative', label: '한 주·한 달·한 해 합계로 목표 넘기기' },
  { value: 'tag_match', label: '특정 태그로 기록하기' },
  { value: 'tag_count', label: '특정 태그로 여러 번 기록하기' },
  { value: 'tag_set_complete', label: '태그 목록 모두 모으기' },
  { value: 'category_count', label: '여러 카테고리에 기록하기' },
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

const SUM_PERIODS = [
  { value: 'week', label: '한 주' },
  { value: 'month', label: '한 달' },
  { value: 'year', label: '한 해' },
]

const STREAK_PERIODS = [
  { value: 'week', label: '매주', unit: '주' },
  { value: 'month', label: '매달', unit: '개월' },
]

// The achievement checklist renders this many rows; search narrows the rest.
const CHECKLIST_LIMIT = 60

const UNIT_TYPES = ['cumulative', 'single', 'daily_cumulative', 'period_cumulative', 'cross_category_cumulative']

/** A fresh condition of `type`, keeping the unit when it still makes sense. */
export function defaultCondition(type, previous = null) {
  const unit = UNIT_TYPES.includes(type) && previous?.unit ? previous.unit : ''
  switch (type) {
    case 'count': return { type, target: 10 }
    case 'days': return { type, target: 30 }
    case 'cumulative': return { type, target: 100, unit }
    case 'single': return { type, target: 10, unit }
    case 'daily_cumulative': return { type, target: 2, unit }
    case 'period_cumulative': return { type, period: 'month', target: 100, unit }
    case 'streak': return { type, target: 7 }
    case 'period_streak': return { type, period: 'week', target: 4, minDays: 3 }
    case 'tag_match': return { type, tag: '' }
    case 'tag_count': return { type, tag: '', target: 5 }
    case 'tag_set_complete': return { type, tags: [] }
    case 'category_count': return { type, target: 3 }
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

function UnitInput({ value, onChange, label = '단위' }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder="단위"
      aria-label={label}
      className="input w-24"
      autoComplete="off"
    />
  )
}

/**
 * Optional threshold for count / days / streak. `daily`: compare each day's
 * total (days, streak) instead of each record (count).
 */
function MinimumFields({ condition: c, onChange, daily }) {
  const on = hasMinimum(c)
  const toggle = () => {
    if (on) {
      const { minValue: _minValue, unit: _unit, ...rest } = c
      onChange(rest)
    } else {
      onChange({ ...c, minValue: '', unit: c.unit ?? '' })
    }
  }
  return (
    <div className="mt-3 space-y-2">
      <label className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer select-none w-fit">
        <input type="checkbox" checked={on} onChange={toggle} className="w-4 h-4 accent-accent" />
        {daily ? '하루 합계가 기준 이상인 날만 세기' : '값이 기준 이상인 기록만 세기'}
      </label>
      {on && (
        <Row>
          {daily ? '하루에' : '기록 하나가'}
          <NumberField value={c.minValue} onChange={minValue => onChange({ ...c, minValue })} aria-label="기준 값" />
          <UnitInput value={c.unit} onChange={unit => onChange({ ...c, unit })} label="기준 값 단위" />
          이상
        </Row>
      )}
    </div>
  )
}

function RecordConditionFields({ condition: c, onChange }) {
  const set = (patch) => onChange({ ...c, ...patch })
  const unitInput = <UnitInput value={c.unit} onChange={unit => set({ unit })} />

  switch (c.type) {
    case 'action':
      return <Hint>이 카테고리에 기록을 하나라도 남기면 달성해요.</Hint>

    case 'count':
      return (
        <>
          <Row>
            기록 <NumberField integer value={c.target} onChange={target => set({ target })} aria-label="목표 횟수" /> 회
          </Row>
          <MinimumFields condition={c} onChange={onChange} />
        </>
      )

    case 'days':
      return (
        <>
          <Row>
            기록한 날 <NumberField integer value={c.target} onChange={target => set({ target })} aria-label="목표 일수" /> 일
          </Row>
          <Hint>하루에 여러 번 기록해도 하루로 세요. 연속이 아니어도 돼요.</Hint>
          <MinimumFields condition={c} onChange={onChange} daily />
        </>
      )

    case 'period_streak': {
      const period = STREAK_PERIODS.find(p => p.value === c.period) ?? STREAK_PERIODS[0]
      return (
        <>
          <Row>
            <select className="input w-24" value={period.value} onChange={e => set({ period: e.target.value })} aria-label="기간">
              {STREAK_PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <NumberField integer value={c.minDays ?? 1} onChange={minDays => set({ minDays })} className="w-20" aria-label="기간마다 기록할 날 수" />
            일 이상 기록하기를
            <NumberField integer value={c.target} onChange={target => set({ target })} className="w-20" aria-label="연속 기간" />
            {period.unit} 연속
          </Row>
          <Hint>
            {period.value === 'week' ? '한 주는 월요일부터 일요일까지예요. ' : ''}
            예: {period.value === 'week' ? '주 3일 이상 운동하기를 12주 연속' : '매달 1일 이상 투자하기를 12개월 연속'}.
          </Hint>
        </>
      )
    }

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

    case 'period_cumulative':
      return (
        <>
          <Row>
            <select className="input w-24" value={c.period ?? 'month'} onChange={e => set({ period: e.target.value })} aria-label="기간">
              {SUM_PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            동안 모두 더해서 <NumberField value={c.target} onChange={target => set({ target })} aria-label="목표 값" /> {unitInput} 이상
          </Row>
          <Hint>달력의 한 주(월~일), 한 달, 한 해 안에서 더한 값을 비교해요. 예: 한 달에 100km 달리기.</Hint>
        </>
      )

    case 'streak':
      return (
        <>
          <Row>
            <NumberField integer value={c.target} onChange={target => set({ target })} aria-label="연속 일수" /> 일 연속
          </Row>
          <Hint>지나간 날짜로 남긴 기록도 포함해서, 가장 길게 이어진 기간을 봐요.</Hint>
          <MinimumFields condition={c} onChange={onChange} daily />
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

    case 'category_count':
      return (
        <>
          <Row>
            서로 다른 카테고리 <NumberField integer value={c.target} onChange={target => set({ target })} className="w-20" aria-label="카테고리 수" /> 곳에 기록
          </Row>
          <Hint>업적에 카테고리가 있으면 그 하위 카테고리를 세고, 없으면 모든 카테고리를 세요. 나중에 만든 카테고리도 포함돼요.</Hint>
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
  // A long list shows its start, plus anything already chosen further down.
  const shown = useMemo(
    () => [...options.slice(0, CHECKLIST_LIMIT), ...options.slice(CHECKLIST_LIMIT).filter(a => selected.includes(a.id))],
    [options, selected],
  )

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
          {shown.map(a => {
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
          {options.length > shown.length && (
            <li className="px-3 py-3 text-center text-sm text-ink-3">
              {options.length - shown.length}개 더 있어요. 이름이나 카테고리로 찾아 보세요.
            </li>
          )}
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
            <select
              className="input w-36"
              value={c.minTier ?? ''}
              onChange={e => {
                const { minTier: _minTier, ...rest } = c
                onChange(e.target.value ? { ...rest, minTier: e.target.value } : rest)
              }}
              aria-label="셀 업적 등급"
            >
              <option value="">모든 등급</option>
              {TIERS.slice(1).map(t => (
                <option key={t.id} value={t.id}>{t.id === 'diamond' ? t.label : `${t.label} 이상`}</option>
              ))}
            </select>
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
