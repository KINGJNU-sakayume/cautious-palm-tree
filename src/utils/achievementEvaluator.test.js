import { describe, it, expect } from 'vitest'
import { evaluateAchievements, conditionError, normalizeTag } from './achievementEvaluator.js'
import { convertValue } from './units.js'
import { currentStreak, longestStreak } from './dates.js'

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

  it('normalizeTag strips #, spaces and case', () => {
    expect(normalizeTag('#Morning Run')).toBe('morningrun')
  })

  it('convertValue handles units', () => {
    expect(convertValue(1500, 'm', 'km')).toBe(1.5)
    expect(convertValue(90, '분', '시간')).toBe(1.5)
    expect(convertValue(3, '만원', '원')).toBe(30000)
    expect(convertValue(5, 'kg', 'km')).toBeNull()
    expect(convertValue(5, '', 'km')).toBe(5)
  })

  it('streak helpers', () => {
    const dates = ['2026-01-01', '2026-01-02', '2026-01-04', '2026-01-05', '2026-01-06']
    expect(longestStreak(dates)).toBe(3)
    expect(currentStreak(dates, '2026-01-06')).toBe(3)
    expect(currentStreak(dates, '2026-01-07')).toBe(3)
    expect(currentStreak(dates, '2026-01-08')).toBe(0)
  })
})
