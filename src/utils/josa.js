// Korean particles that depend on whether the last syllable has a final consonant.

function finalConsonant(word) {
  const text = word.trim()
  const code = text.charCodeAt(text.length - 1)
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return null // not a Hangul syllable
  return (code - 0xac00) % 28 // 0 = none, 8 = ㄹ
}

/**
 * The particle alone: josa('러닝', '으로/로') → '으로', josa('피트니스', '을/를') → '를'.
 * Non-Hangul endings get the combined form: josa('PR', '을/를') → '을(를)'.
 */
export function josa(word, pair) {
  const [withBatchim, withoutBatchim] = pair.split('/')
  const jong = finalConsonant(word)
  if (jong == null) return `${withBatchim}(${withoutBatchim})`
  if (pair === '으로/로') return jong === 0 || jong === 8 ? '로' : '으로'
  return jong === 0 ? withoutBatchim : withBatchim
}

/** withJosa('러닝', '으로/로') → '러닝으로' */
export function withJosa(word, pair) {
  return `${word}${josa(word, pair)}`
}
