// Shorthands for writing the built-in catalog. They build the same plain
// objects the achievement editor saves; see utils/achievementEvaluator.js for
// what each condition means.

export const define = (id, categoryId, tier, title, description, condition, extra = {}) => ({
  id, title, description, categoryId, tier, condition, isHidden: false, ...extra,
})

/** Secret until earned; write the description as a congratulation. */
export const HIDDEN = { isHidden: true }

/** Optional threshold for count / days / streak: at([10000, '걸음']). */
const threshold = min => (min ? { minValue: min[0], unit: min[1] } : {})

export const action = () => ({ type: 'action' })
export const count = (target, min) => ({ type: 'count', target, ...threshold(min) })
export const days = (target, min) => ({ type: 'days', target, ...threshold(min) })
export const streak = (target, min) => ({ type: 'streak', target, ...threshold(min) })
export const weeks = (target, minDays = 1) => ({ type: 'period_streak', period: 'week', target, minDays })
export const months = (target, minDays = 1) => ({ type: 'period_streak', period: 'month', target, minDays })

export const total = (target, unit) => ({ type: 'cumulative', target, unit })
export const single = (target, unit) => ({ type: 'single', target, unit })
export const daily = (target, unit) => ({ type: 'daily_cumulative', target, unit })
export const weekly = (target, unit) => ({ type: 'period_cumulative', period: 'week', target, unit })
export const monthly = (target, unit) => ({ type: 'period_cumulative', period: 'month', target, unit })
export const yearly = (target, unit) => ({ type: 'period_cumulative', period: 'year', target, unit })

export const tag = (name) => ({ type: 'tag_match', tag: name })
export const tagCount = (name, target) => ({ type: 'tag_count', tag: name, target })
export const tagSet = (tags) => ({ type: 'tag_set_complete', tags })
export const spread = (target) => ({ type: 'category_count', target })
export const sumOf = (sources, target, unit) => ({ type: 'cross_category_cumulative', sources, target, unit })

export const all = (...conditions) => ({ type: 'composite', operator: 'AND', conditions })
export const any = (...conditions) => ({ type: 'composite', operator: 'OR', conditions })

export const metaCount = (target, minTier) => ({ type: 'meta_count', target, ...(minTier ? { minTier } : {}) })
export const metaList = (...achievementIds) => ({ type: 'meta_list', achievementIds })
export const metaClear = () => ({ type: 'meta_clear' })
