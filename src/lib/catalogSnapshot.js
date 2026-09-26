// Snapshot and digest of the built-in catalog this app ships, in the form that
// data/catalogHistory.js stores for earlier versions.

import { createDefaultState } from './appState.js'
import { digest, fingerprintAchievement } from './fingerprint.js'

/** { achievements: { id: fingerprint }, categories: [{ id, name, parentId }] } */
export function currentCatalogSnapshot() {
  const { achievements, categories } = createDefaultState()
  return {
    achievements: Object.fromEntries(achievements.map(a => [a.id, fingerprintAchievement(a)])),
    categories: categories.map(({ id, name, parentId }) => ({ id, name, parentId })),
  }
}

export function snapshotDigest(snapshot) {
  return digest(snapshot)
}

/** The snapshot as source code for CATALOG_SNAPSHOTS. */
export function formatSnapshot(version, snapshot) {
  const quote = value => (value == null ? 'null' : `'${String(value).replace(/'/g, "\\'")}'`)
  return [
    `  ${version}: {`,
    '    achievements: {',
    ...Object.entries(snapshot.achievements).map(([id, fp]) => `      ${quote(id)}: ${quote(fp)},`),
    '    },',
    '    categories: [',
    ...snapshot.categories.map(c => `      { id: ${quote(c.id)}, name: ${quote(c.name)}, parentId: ${quote(c.parentId)} },`),
    '    ],',
    '  },',
  ].join('\n')
}
