/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string|null} parentId
 *
 * @typedef {Category & { children: TreeNode[] }} TreeNode
 */

/**
 * Build a nested tree from a flat category array.
 * Categories whose parent isn't in the list become roots.
 * @param {Category[]} flatCategories
 * @returns {TreeNode[]}
 */
export function buildTree(flatCategories) {
  const map = new Map(flatCategories.map(cat => [cat.id, { ...cat, children: [] }]))
  const roots = []
  for (const cat of flatCategories) {
    const node = map.get(cat.id)
    const parent = cat.parentId ? map.get(cat.parentId) : null
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

/**
 * Categories from the root down to the given one (inclusive).
 * @returns {Category[]}
 */
export function getCategoryPath(categoryId, flatCategories) {
  const map = new Map(flatCategories.map(c => [c.id, c]))
  const path = []
  const seen = new Set()
  let current = map.get(categoryId)
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    path.unshift(current)
    current = current.parentId ? map.get(current.parentId) : null
  }
  return path
}

/** '피트니스 › 근력 운동 › 벤치 프레스' */
export function getCategoryPathLabel(categoryId, flatCategories, separator = ' › ') {
  return getCategoryPath(categoryId, flatCategories).map(c => c.name).join(separator)
}

/**
 * All descendant ids (not including the category itself), breadth first.
 * @returns {string[]}
 */
export function getDescendantIds(categoryId, flatCategories) {
  const childrenMap = new Map()
  for (const cat of flatCategories) {
    if (!cat.parentId) continue
    if (!childrenMap.has(cat.parentId)) childrenMap.set(cat.parentId, [])
    childrenMap.get(cat.parentId).push(cat.id)
  }
  const result = []
  const queue = [categoryId]
  while (queue.length > 0) {
    for (const childId of childrenMap.get(queue.shift()) || []) {
      if (result.includes(childId)) continue
      result.push(childId)
      queue.push(childId)
    }
  }
  return result
}

/** The category and all of its descendants. */
export function getSubtreeIds(categoryId, flatCategories) {
  return new Set([categoryId, ...getDescendantIds(categoryId, flatCategories)])
}

/** Direct children, in list order. */
export function getDirectChildren(parentId, flatCategories) {
  return flatCategories.filter(c => c.parentId === parentId)
}

export function isLeafCategory(categoryId, flatCategories) {
  return !flatCategories.some(c => c.parentId === categoryId)
}

/**
 * Ids to show when filtering the tree by name: every match plus its ancestors,
 * so a match deep in the tree stays reachable.
 * @returns {Set<string>|null} null when there is no query
 */
export function visibleIdsForQuery(query, flatCategories) {
  const q = query.trim().toLowerCase()
  if (!q) return null
  const visible = new Set()
  for (const cat of flatCategories) {
    if (!cat.name.toLowerCase().includes(q)) continue
    for (const c of getCategoryPath(cat.id, flatCategories)) visible.add(c.id)
  }
  return visible
}
