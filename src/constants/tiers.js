// Achievement tiers, easiest first. A tier says how hard an achievement is,
// so the hint is shown when someone picks a tier in the editor.
//
// `hex` is used for tints computed in JS; `color`/`ink` are CSS variables so the
// medal fill and tier text can change with the colour scheme (see index.css).
export const TIERS = [
  { id: 'bronze', label: '브론즈', hint: '처음 해 보는 일', hex: '#B7773F' },
  { id: 'silver', label: '실버', hint: '조금씩 쌓이는 습관', hex: '#8E99A5' },
  { id: 'gold', label: '골드', hint: '꾸준함이 필요한 목표', hex: '#C9982A' },
  { id: 'platinum', label: '플래티넘', hint: '몇 달은 걸리는 큰 목표', hex: '#6F86A8' },
  { id: 'diamond', label: '다이아몬드', hint: '손에 꼽을 만한 기록', hex: '#2C9DBD' },
].map((tier, rank) => ({
  ...tier,
  rank,
  color: `var(--tier-${tier.id})`,
  ink: `var(--tier-${tier.id}-ink)`,
}))

export const TIER_IDS = TIERS.map(t => t.id)

const TIER_BY_ID = Object.fromEntries(TIERS.map(t => [t.id, t]))

export function getTier(id) {
  return TIER_BY_ID[id] || TIER_BY_ID.bronze
}

export function tierLabel(id) {
  return getTier(id).label
}

/** '#RRGGBB' + alpha → 'rgba(...)' */
export function tint(hex, alpha) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
