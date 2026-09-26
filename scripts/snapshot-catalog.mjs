// Prints the snapshot and digest of the built-in catalog in this checkout.
// When and how to use them: see src/data/catalogHistory.js.
//
//   npm run catalog:snapshot

import { CATALOG_VERSION } from '../src/data/catalogHistory.js'
import { currentCatalogSnapshot, formatSnapshot, snapshotDigest } from '../src/lib/catalogSnapshot.js'

const snapshot = currentCatalogSnapshot()
console.log(`// Catalog ${CATALOG_VERSION}: ${Object.keys(snapshot.achievements).length} achievements, ${snapshot.categories.length} categories`)
console.log(formatSnapshot(CATALOG_VERSION, snapshot))
console.log(`\n// CATALOG_DIGEST = '${snapshotDigest(snapshot)}'`)
