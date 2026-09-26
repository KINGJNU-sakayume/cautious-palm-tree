import { describe, it, expect } from 'vitest'
import { evaluateAchievements, conditionError, normalizeTag } from './achievementEvaluator.js'
import { describeCondition, progressLabel } from './achievementText.js'
import { canConvert, convertValue, parseValueInput } from './units.js'
import { currentStreak, longestStreak, nextPeriodKey, periodKey } from './dates.js'

const categories = [
  { id: 'fit', name: '피트니스', parentId: null },
  { id: 'run', name: '러닝', parentId: 'fit' },
  { id: 'str', name: '근력', parentId: 'fit' },
  { id: 'bench', name: '벤치', parentId: 'str' },
  { id: 'squat', name: '스쿼트', parentId: 'str' },
  { id: 'read', name: '독서', parentId: null },
]

let seq = 0
function rec(categoryId, date, value = null, extra = {}) {
  seq += 1
  return { id: `r${seq}`, categoryId, date, value, unit: null, tags: [], ...extra }
}

function ach(id, categoryId, condition, extra = {}) {
  return { id, title: id, categoryId, tier: 'bronze', condition, isHidden: false, ...extra }
}

function evaluate(achievements, records) {
  return evaluateAchievements(achievements, records, categories)
}

describe('record-based conditions', () => {
  it('action unlocks on the first record in scope, dated by that record', () => {
    const r = evaluate([ach('a', 'run', { type: 'action' })], [
      rec('read', '2026-01-01'),
      rec('run', '2026-01-05'),
      rec('run', '2026-01-03'),
    ]).get('a')
    expect(r).toMatchObject({ earned: true, earnedAt: '2026-01-03', progress: 1, target: 1 })
  })

  it('count uses the date of the N-th record in time order, not insertion order', () => {
    const records = [rec('run', '2026-01-09'), rec('run', '2026-01-01'), rec('run', '2026-01-05')]
    const r = evaluate([ach('a', 'run', { type: 'count', target: 2 })], records).get('a')
    expect(r).toMatchObject({ earned: true, earnedAt: '2026-01-05', progress: 3, target: 2 })
  })

  it('counts records of subcategories toward a parent category', () => {
    const records = [rec('run', '2026-01-01'), rec('bench', '2026-01-02'), rec('squat', '2026-01-03')]
    const results = evaluate([
      ach('fit', 'fit', { type: 'count', target: 3 }),
      ach('str', 'str', { type: 'count', target: 3 }),
    ], records)
    expect(results.get('fit')).toMatchObject({ earned: true, earnedAt: '2026-01-03' })
    expect(results.get('str')).toMatchObject({ earned: false, progress: 2 })
  })

  it('an achievement without a category counts every record', () => {
    const records = [rec('run', '2026-01-01'), rec(null, '2026-01-02'), rec('read', '2026-01-04')]
    const r = evaluate([ach('all', null, { type: 'count', target: 3 })], records).get('all')
    expect(r).toMatchObject({ earned: true, earnedAt: '2026-01-04' })
  })

  it('cumulative converts compatible units and skips incompatible ones', () => {
    const records = [
      rec('run', '2026-01-01', 5, { unit: 'km' }),
      rec('run', '2026-01-02', 3000, { unit: 'm' }),
      rec('run', '2026-01-03', 45, { unit: '분' }),
      rec('run', '2026-01-04', 2), // no unit → assumed km
    ]
    const r = evaluate([ach('a', 'run', { type: 'cumulative', target: 10, unit: 'km' })], records).get('a')
    expect(r).toMatchObject({ earned: true, earnedAt: '2026-01-04', progress: 10 })
  })

  it('cumulative is not fooled by floating point sums', () => {
    const records = [0.1, 0.2, 0.3, 0.4].map((v, i) => rec('run', `2026-01-0${i + 1}`, v, { unit: 'km' }))
    const r = evaluate([ach('a', 'run', { type: 'cumulative', target: 1, unit: 'km' })], records).get('a')
    expect(r).toMatchObject({ earned: true, earnedAt: '2026-01-04', progress: 1 })
  })

  it('single looks at every record, so older records count for new achievements', () => {
    const records = [rec('run', '2026-02-01', 22, { unit: 'km' }), rec('run', '2026-03-01', 5, { unit: 'km' })]
    const r = evaluate([ach('a', 'run', { type: 'single', target: 21.1, unit: 'km' })], records).get('a')
    expect(r).toMatchObject({ earned: true, earnedAt: '2026-02-01', progress: 22 })
  })

  it('daily_cumulative adds up the records of one day', () => {
    const records = [
      rec('read', '2026-01-01', 500, { unit: 'ml' }),
      rec('read', '2026-01-02', 1, { unit: 'L' }),
      rec('read', '2026-01-02', 600, { unit: 'ml' }),
      rec('read', '2026-01-02', 500, { unit: 'ml' }),
    ]
    const r = evaluate([ach('a', 'read', { type: 'daily_cumulative', target: 2, unit: 'L' })], records).get('a')
    expect(r).toMatchObject({ earned: true, earnedAt: '2026-01-02', progress: 2.1 })
  })

  it('streak uses the longest run ever and dates it by the day the run reached the goal', () => {
    const records = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-10', '2026-01-11']
      .map(d => rec('run', d))
    const results = evaluate([
      ach('three', 'run', { type: 'streak', target: 3 }),
      ach('four', 'run', { type: 'streak', target: 4 }),
    ], records)
    expect(results.get('three')).toMatchObject({ earned: true, earnedAt: '2026-01-03', progress: 3 })
    expect(results.get('four')).toMatchObject({ earned: false, progress: 3 })
  })

  it('streak works across month ends and ignores duplicate days', () => {
    const records = ['2026-02-27', '2026-02-28', '2026-02-28', '2026-03-01'].map(d => rec('run', d))
    const r = evaluate([ach('a', 'run', { type: 'streak', target: 3 })], records).get('a')
    expect(r).toMatchObject({ earned: true, earnedAt: '2026-03-01', progress: 3 })
  })

  it('tags match regardless of #, spacing and case', () => {
    const records = [
      rec('run', '2026-01-01', null, { tags: ['#야외'] }),
      rec('run', '2026-01-02', null, { tags: ['PR'] }),
      rec('run', '2026-01-03', null, { tags: ['야 외'] }),
    ]
    const results = evaluate([
      ach('match', 'run', { type: 'tag_match', tag: 'pr' }),
      ach('count', 'run', { type: 'tag_count', tag: '야외', target: 2 }),
    ], records)
    expect(results.get('match')).toMatchObject({ earned: true, earnedAt: '2026-01-02' })
    expect(results.get('count')).toMatchObject({ earned: true, earnedAt: '2026-01-03', progress: 2 })
  })

  it('tag_set_complete tracks the first date of each tag', () => {
    const condition = { type: 'tag_set_complete', tags: ['마포대교', '한강대교', '성수대교'] }
    const records = [
      rec('read', '2026-01-05', null, { tags: ['한강대교'] }),
      rec('read', '2026-01-01', null, { tags: ['마포대교', '한강대교'] }),
    ]
    const partial = evaluate([ach('a', 'read', condition)], records).get('a')
    expect(partial).toMatchObject({ earned: false, progress: 2, target: 3 })
    expect(partial.completedDates).toEqual({ 마포대교: '2026-01-01', 한강대교: '2026-01-01' })

    records.push(rec('read', '2026-01-07', null, { tags: ['성수 대교'] }))
    expect(evaluate([ach('a', 'read', condition)], records).get('a'))
      .toMatchObject({ earned: true, earnedAt: '2026-01-07', progress: 3 })
  })

  it('cross_category_cumulative sums the best lift of each category over time', () => {
    const condition = {
      type: 'cross_category_cumulative',
      unit: 'kg',
      target: 200,
      sources: [
        { categoryId: 'bench', aggregation: 'max' },
        { categoryId: 'squat', aggregation: 'max' },
      ],
    }
    const records = [
      rec('bench', '2026-01-01', 80, { unit: 'kg' }),
      rec('squat', '2026-01-02', 100, { unit: 'kg' }),
      rec('bench', '2026-01-03', 70, { unit: 'kg' }),
      rec('squat', '2026-01-04', 125, { unit: 'kg' }),
    ]
    const r = evaluate([ach('a', 'str', condition)], records).get('a')
    expect(r).toMatchObject({ earned: true, earnedAt: '2026-01-04', progress: 205 })
  })

  it('composite AND is dated by the last part to finish, OR by the first', () => {
    const records = [
      rec('run', '2026-01-01', 10, { unit: 'km' }),
      rec('run', '2026-01-02', 10, { unit: 'km' }),
      rec('run', '2026-01-03', 10, { unit: 'km' }),
    ]
    const parts = [{ type: 'streak', target: 2 }, { type: 'cumulative', target: 30, unit: 'km' }]
    const results = evaluate([
      ach('and', 'run', { type: 'composite', operator: 'AND', conditions: parts }),
      ach('or', 'run', { type: 'composite', operator: 'OR', conditions: parts }),
    ], records)
    expect(results.get('and')).toMatchObject({ earned: true, earnedAt: '2026-01-03', progress: 100 })
    expect(results.get('or')).toMatchObject({ earned: true, earnedAt: '2026-01-02' })
  })

  it('composite progress follows the least finished part', () => {
    const records = [rec('run', '2026-01-01', 10, { unit: 'km' })]
    const condition = {
      type: 'composite',
      operator: 'AND',
      conditions: [{ type: 'count', target: 2 }, { type: 'cumulative', target: 40, unit: 'km' }],
    }
    expect(evaluate([ach('a', 'run', condition)], records).get('a')).toMatchObject({ earned: false, progress: 25 })
  })

  it('manual achievements are earned on the date the user picked', () => {
    const results = evaluate([
      ach('m1', null, { type: 'manual' }, { manualEarnedAt: '2026-04-01' }),
      ach('m2', null, { type: 'manual' }, { manualEarnedAt: null }),
    ], [])
    expect(results.get('m1')).toMatchObject({ earned: true, earnedAt: '2026-04-01' })
    expect(results.get('m2')).toMatchObject({ earned: false })
  })

  it('invalid conditions never unlock and report why', () => {
    const r = evaluate([ach('a', 'run', { type: 'count', target: 0 })], [rec('run', '2026-01-01')]).get('a')
    expect(r.earned).toBe(false)
    expect(r.error).toBeTruthy()
  })

  it('negative values never count toward a goal', () => {
    const records = [
      rec('run', '2026-01-01', 8, { unit: 'km' }),
      rec('run', '2026-01-02', -5, { unit: 'km' }),
      rec('run', '2026-01-03', 2, { unit: 'km' }),
    ]
    const results = evaluate([
      ach('sum', 'run', { type: 'cumulative', target: 10, unit: 'km' }),
      ach('day', 'run', { type: 'daily_cumulative', target: 8, unit: 'km' }),
    ], records)
    expect(results.get('sum')).toMatchObject({ earned: true, earnedAt: '2026-01-03', progress: 10 })
    expect(results.get('day')).toMatchObject({ earned: true, earnedAt: '2026-01-01' })
  })

  it('count can require a minimum value per record', () => {
    const records = [
      rec('bench', '2026-01-01', 55, { unit: 'kg' }),
      rec('bench', '2026-01-02', 60, { unit: 'kg' }),
      rec('bench', '2026-01-03', 132, { unit: 'lb' }), // ≈ 59.9kg
      rec('bench', '2026-01-04', 62.5, { unit: 'kg' }),
    ]
    const r = evaluate([ach('a', 'bench', { type: 'count', target: 2, minValue: 60, unit: 'kg' })], records).get('a')
    expect(r).toMatchObject({ earned: true, earnedAt: '2026-01-04', progress: 2 })
  })
})

describe('day and period conditions', () => {
  it('days counts distinct days, not records', () => {
    const records = ['2026-01-01', '2026-01-01', '2026-01-03', '2026-01-09'].map(d => rec('run', d))
    const results = evaluate([
      ach('three', 'run', { type: 'days', target: 3 }),
      ach('four', 'run', { type: 'days', target: 4 }),
    ], records)
    expect(results.get('three')).toMatchObject({ earned: true, earnedAt: '2026-01-09', progress: 3 })
    expect(results.get('four')).toMatchObject({ earned: false, progress: 3 })
  })

  it('days and streak with a minimum add up each day', () => {
    const records = [
      rec('read', '2026-01-01', 1.5, { unit: 'L' }),
      rec('read', '2026-01-01', 500, { unit: 'ml' }), // day 1: 2L
      rec('read', '2026-01-02', 2, { unit: 'L' }), // day 2: 2L
      rec('read', '2026-01-03', 1, { unit: 'L' }), // day 3: 1L — breaks the run
      rec('read', '2026-01-04', 2.5, { unit: 'L' }),
    ]
    const results = evaluate([
      ach('days', 'read', { type: 'days', target: 3, minValue: 2, unit: 'L' }),
      ach('streak', 'read', { type: 'streak', target: 3, minValue: 2, unit: 'L' }),
      ach('plain', 'read', { type: 'streak', target: 4 }),
    ], records)
    expect(results.get('days')).toMatchObject({ earned: true, earnedAt: '2026-01-04', progress: 3 })
    expect(results.get('streak')).toMatchObject({ earned: false, progress: 2 })
    expect(results.get('plain')).toMatchObject({ earned: true, earnedAt: '2026-01-04' })
  })

  it('period_cumulative sums within calendar weeks (Monday–Sunday)', () => {
    const records = [
      rec('run', '2026-01-04', 30, { unit: 'km' }), // Sunday — previous week
      rec('run', '2026-01-05', 10, { unit: 'km' }), // Monday
      rec('run', '2026-01-07', 15, { unit: 'km' }),
      rec('run', '2026-01-11', 20, { unit: 'km' }), // Sunday — same week: 45km
      rec('run', '2026-01-12', 40, { unit: 'km' }),
    ]
    const results = evaluate([
      ach('week', 'run', { type: 'period_cumulative', period: 'week', target: 45, unit: 'km' }),
      ach('month', 'run', { type: 'period_cumulative', period: 'month', target: 100, unit: 'km' }),
      ach('year', 'run', { type: 'period_cumulative', period: 'year', target: 116, unit: 'km' }),
    ], records)
    expect(results.get('week')).toMatchObject({ earned: true, earnedAt: '2026-01-11', progress: 45 })
    expect(results.get('month')).toMatchObject({ earned: true, earnedAt: '2026-01-12', progress: 115 })
    expect(results.get('year')).toMatchObject({ earned: false, progress: 115 })
  })

  it('period_streak needs enough record days in consecutive weeks', () => {
    const days = [
      '2026-01-05', '2026-01-06', '2026-01-08', // week 1: 3 days
      '2026-01-12', '2026-01-12', '2026-01-14', '2026-01-18', // week 2: 3 days (one twice)
      '2026-01-19', '2026-01-20', // week 3: 2 days — too few
      '2026-01-26', '2026-01-27', '2026-01-28', // week 4: 3 days
    ]
    const records = days.map(d => rec('run', d))
    const results = evaluate([
      ach('two', 'run', { type: 'period_streak', period: 'week', target: 2, minDays: 3 }),
      ach('three', 'run', { type: 'period_streak', period: 'week', target: 3, minDays: 3 }),
      ach('weekly', 'run', { type: 'period_streak', period: 'week', target: 4 }),
    ], records)
    expect(results.get('two')).toMatchObject({ earned: true, earnedAt: '2026-01-18', progress: 2 })
    expect(results.get('three')).toMatchObject({ earned: false, progress: 2 })
    expect(results.get('weekly')).toMatchObject({ earned: true, earnedAt: '2026-01-26', progress: 4 })
  })

  it('period_streak by month crosses the year boundary', () => {
    const records = ['2025-11-30', '2025-12-01', '2026-01-31', '2026-03-01'].map(d => rec('run', d))
    const r = evaluate([ach('a', 'run', { type: 'period_streak', period: 'month', target: 3 })], records).get('a')
    expect(r).toMatchObject({ earned: true, earnedAt: '2026-01-31', progress: 3 })
  })

  it('category_count counts subcategories inside a category and every category outside', () => {
    const records = [
      rec('fit', '2026-01-01'), // filed directly under the scope — not a subcategory
      rec('run', '2026-01-02'),
      rec('bench', '2026-01-03'),
      rec('run', '2026-01-04'),
      rec('read', '2026-01-05'),
      rec(null, '2026-01-06'),
    ]
    const results = evaluate([
      ach('fit', 'fit', { type: 'category_count', target: 2 }),
      ach('all', null, { type: 'category_count', target: 4 }),
    ], records)
    expect(results.get('fit')).toMatchObject({ earned: true, earnedAt: '2026-01-03', progress: 2 })
    expect(results.get('all')).toMatchObject({ earned: true, earnedAt: '2026-01-05', progress: 4 })
  })
})

describe('meta conditions', () => {
  const base = [
    ach('r1', 'run', { type: 'action' }),
    ach('r2', 'run', { type: 'count', target: 2 }),
    ach('b1', 'bench', { type: 'action' }),
  ]
  const records = [rec('run', '2026-01-01'), rec('bench', '2026-01-02'), rec('run', '2026-01-05')]

  it('meta_list is dated by the last required achievement', () => {
    const r = evaluate([...base, ach('m', 'fit', { type: 'meta_list', achievementIds: ['r1', 'r2', 'b1'] })], records).get('m')
    expect(r).toMatchObject({ earned: true, earnedAt: '2026-01-05', progress: 3, target: 3 })
  })

  it('meta_list ignores deleted achievements but never unlocks when all are gone', () => {
    const results = evaluate([
      ...base,
      ach('m1', 'fit', { type: 'meta_list', achievementIds: ['r1', 'gone'] }),
      ach('m2', 'fit', { type: 'meta_list', achievementIds: ['gone'] }),
    ], records)
    expect(results.get('m1')).toMatchObject({ earned: true, target: 1 })
    expect(results.get('m2').earned).toBe(false)
  })

  it('meta_count and meta_clear use the achievement category subtree', () => {
    const results = evaluate([
      ...base,
      ach('count', 'fit', { type: 'meta_count', target: 2 }),
      ach('clear-run', 'run', { type: 'meta_clear' }),
      ach('clear-str', 'str', { type: 'meta_clear' }),
    ], [rec('run', '2026-01-01'), rec('bench', '2026-01-02')])
    expect(results.get('count')).toMatchObject({ earned: true, earnedAt: '2026-01-02' })
    expect(results.get('clear-run')).toMatchObject({ earned: false, progress: 1, target: 2 })
    expect(results.get('clear-str')).toMatchObject({ earned: true, earnedAt: '2026-01-02' })
  })

  it('meta achievements can depend on other meta achievements', () => {
    const results = evaluate([
      ...base,
      ach('outer', null, { type: 'meta_list', achievementIds: ['inner'] }),
      ach('inner', 'fit', { type: 'meta_list', achievementIds: ['r1', 'b1'] }),
    ], records)
    expect(results.get('inner')).toMatchObject({ earned: true, earnedAt: '2026-01-02' })
    expect(results.get('outer')).toMatchObject({ earned: true, earnedAt: '2026-01-02' })
  })

  it('meta_count can count only achievements of a tier or higher', () => {
    const results = evaluate([
      ach('b', 'run', { type: 'action' }),
      ach('g', 'run', { type: 'count', target: 2 }, { tier: 'gold' }),
      ach('d', 'bench', { type: 'action' }, { tier: 'diamond' }),
      ach('gold+', null, { type: 'meta_count', target: 2, minTier: 'gold' }),
      ach('diamond', null, { type: 'meta_count', target: 2, minTier: 'diamond' }),
    ], records)
    expect(results.get('gold+')).toMatchObject({ earned: true, earnedAt: '2026-01-05', progress: 2 })
    expect(results.get('diamond')).toMatchObject({ earned: false, progress: 1 })
  })

  it('a cycle of meta achievements settles without unlocking', () => {
    const results = evaluate([
      ach('x', null, { type: 'meta_list', achievementIds: ['y'] }),
      ach('y', null, { type: 'meta_list', achievementIds: ['x'] }),
    ], [])
    expect(results.get('x').earned).toBe(false)
    expect(results.get('y').earned).toBe(false)
  })
})

describe('helpers', () => {
  it('conditionError validates targets and composites', () => {
    expect(conditionError({ type: 'count', target: 3 })).toBeNull()
    expect(conditionError({ type: 'count', target: 1.5 })).toBeTruthy()
    expect(conditionError({ type: 'tag_match', tag: ' ' })).toBeTruthy()
    expect(conditionError({ type: 'composite', operator: 'AND', conditions: [{ type: 'manual' }] })).toBeTruthy()
    expect(conditionError({ type: 'composite', operator: 'AND', conditions: [{ type: 'action' }] })).toBeNull()
  })

  it('conditionError validates the newer condition types', () => {
    expect(conditionError({ type: 'days', target: 10 })).toBeNull()
    expect(conditionError({ type: 'streak', target: 7, minValue: 2, unit: 'L' })).toBeNull()
    expect(conditionError({ type: 'streak', target: 7, minValue: '', unit: 'L' })).toBeTruthy()
    expect(conditionError({ type: 'count', target: 3, minValue: 0 })).toBeTruthy()
    expect(conditionError({ type: 'period_cumulative', period: 'month', target: 100, unit: 'km' })).toBeNull()
    expect(conditionError({ type: 'period_cumulative', period: 'day', target: 100 })).toBeTruthy()
    expect(conditionError({ type: 'period_streak', period: 'week', target: 4, minDays: 3 })).toBeNull()
    expect(conditionError({ type: 'period_streak', period: 'week', target: 4, minDays: 8 })).toBeTruthy()
    expect(conditionError({ type: 'period_streak', period: 'year', target: 2 })).toBeTruthy()
    expect(conditionError({ type: 'category_count', target: 0 })).toBeTruthy()
    expect(conditionError({ type: 'meta_count', target: 3, minTier: 'gold' })).toBeNull()
    expect(conditionError({ type: 'meta_count', target: 3, minTier: 'mythic' })).toBeTruthy()
  })

  it('describes the newer condition types', () => {
    const text = (condition, achievement = null) => describeCondition(condition, { achievement })
    expect(text({ type: 'days', target: 30, minValue: 10000, unit: '걸음' })).toBe('하루 10,000걸음 이상인 날 30일')
    expect(text({ type: 'streak', target: 7, minValue: 2, unit: 'L' })).toBe('하루 2L 이상 7일 연속')
    expect(text({ type: 'count', target: 10, minValue: 60, unit: 'kg' })).toBe('60kg 이상 기록 10회')
    expect(text({ type: 'period_cumulative', period: 'month', target: 100, unit: 'km' })).toBe('한 달 합계 100km 이상')
    expect(text({ type: 'period_streak', period: 'week', target: 12, minDays: 3 })).toBe('주 3일 이상 기록 12주 연속')
    expect(text({ type: 'period_streak', period: 'week', target: 1, minDays: 7 })).toBe('한 주에 7일 모두 기록')
    expect(text({ type: 'period_streak', period: 'month', target: 12, minDays: 1 })).toBe('매달 기록 12개월 연속')
    expect(text({ type: 'category_count', target: 5 })).toBe('카테고리 5곳에 기록')
    expect(text({ type: 'category_count', target: 5 }, { categoryId: 'fit' })).toBe('하위 카테고리 5곳에 기록')
    expect(text({ type: 'meta_count', target: 3, minTier: 'gold' })).toBe('골드 이상 업적 3개 달성')
    expect(progressLabel({ condition: { type: 'period_streak', period: 'month', target: 12 }, progress: 3, target: 12 }))
      .toBe('최장 3 / 12개월')
    expect(progressLabel({ condition: { type: 'period_cumulative', period: 'week', unit: 'km' }, progress: 32, target: 50 }))
      .toBe('한 주 최고 32 / 50km')
  })

  it('normalizeTag strips #, spaces and case', () => {
    expect(normalizeTag('#Morning Run')).toBe('morningrun')
  })

  it('convertValue handles units', () => {
    expect(convertValue(1500, 'm', 'km')).toBe(1.5)
    expect(convertValue(90, '분', '시간')).toBe(1.5)
    expect(convertValue(3, '만원', '원')).toBe(30000)
    expect(convertValue(5, 'kg', 'km')).toBeNull()
    expect(convertValue(5, '', 'km')).toBe(5)
    expect(convertValue(120, '쪽', '페이지')).toBe(120)
    expect(convertValue(8000, '보', '걸음')).toBe(8000)
    expect(convertValue(50, '개', '회')).toBe(50)
    expect(convertValue(2, '억', '만원')).toBe(20000)
    expect(convertValue(1, 'mile', 'km')).toBeCloseTo(1.609344)
    expect(canConvert('ml', 'L')).toBe(true)
    expect(canConvert('분', 'km')).toBe(false)
  })

  it('parseValueInput reads numbers, separators and a trailing unit', () => {
    expect(parseValueInput('')).toEqual({ value: null, unit: null })
    expect(parseValueInput('5.2')).toEqual({ value: 5.2, unit: null })
    expect(parseValueInput('1,000')).toEqual({ value: 1000, unit: null })
    expect(parseValueInput('5km')).toEqual({ value: 5, unit: 'km' })
    expect(parseValueInput('3 만원')).toEqual({ value: 3, unit: '만원' })
    expect(parseValueInput('-3')).toEqual({ value: -3, unit: null })
    expect(parseValueInput('다섯').error).toBe(true)
    expect(parseValueInput('1시간 30분').error).toBe(true)
  })

  it('period keys', () => {
    expect(periodKey('2026-01-11', 'week')).toBe('2026-01-05')
    expect(periodKey('2026-01-12', 'week')).toBe('2026-01-12')
    expect(periodKey('2026-01-12', 'month')).toBe('2026-01')
    expect(nextPeriodKey('2025-12', 'month')).toBe('2026-01')
    expect(nextPeriodKey('2025-12-29', 'week')).toBe('2026-01-05')
  })

  it('streak helpers', () => {
    const dates = ['2026-01-01', '2026-01-02', '2026-01-04', '2026-01-05', '2026-01-06']
    expect(longestStreak(dates)).toBe(3)
    expect(currentStreak(dates, '2026-01-06')).toBe(3)
    expect(currentStreak(dates, '2026-01-07')).toBe(3)
    expect(currentStreak(dates, '2026-01-08')).toBe(0)
  })
})
