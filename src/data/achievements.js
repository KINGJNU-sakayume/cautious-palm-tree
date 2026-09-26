// Built-in achievement catalog.
//
// Only definitions live here. Whether an achievement is earned, when, and how
// far along it is are derived from records at runtime (utils/achievementEvaluator.js).
// A category-less achievement counts every record; otherwise the category and
// all of its subcategories count. See docs/achievement-system.md for the rules.
//
// The catalog is split by top-level category under ./catalog/. Ids are stable:
// the catalog upgrade (lib/appState.js) matches stored achievements by id, so
// never reuse an id for a different achievement.

import general from './catalog/general.js'
import fitness from './catalog/fitness.js'
import health from './catalog/health.js'
import learning from './catalog/learning.js'
import mindfulness from './catalog/mindfulness.js'
import travel from './catalog/travel.js'
import culture from './catalog/culture.js'
import creative from './catalog/creative.js'
import career from './catalog/career.js'
import finance from './catalog/finance.js'
import tech from './catalog/tech.js'
import community from './catalog/community.js'

export const achievements = [
  ...general,
  ...fitness,
  ...health,
  ...learning,
  ...mindfulness,
  ...travel,
  ...culture,
  ...creative,
  ...career,
  ...finance,
  ...tech,
  ...community,
]
