/**
 * Build a nested tree from a flat category array.
 * Returns an array of root nodes, each with a `children` array.
 */
export function buildTree(flatCategories) {
  const map = new Map()
  flatCategories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] })
  })

  const roots = []
  flatCategories.forEach(cat => {
    const node = map.get(cat.id)
    if (cat.parentId === null) {
      roots.push(node)
    } else {
      const parent = map.get(cat.parentId)
      if (parent) {
        parent.children.push(node)
      }
    }
  })
  return roots
}

/**
 * Returns an array of category objects from root to the given node (inclusive).
 * e.g. [Fitness, Strength, Bench Press]
 */
export function getCategoryPath(categoryId, flatCategories) {
  const map = new Map(flatCategories.map(c => [c.id, c]))
  const path = []
  let current = map.get(categoryId)
  while (current) {
    path.unshift(current)
    current = current.parentId ? map.get(current.parentId) : null
  }
  return path
}

/**
 * Returns all descendant IDs (not including the node itself) via BFS.
 */
export function getDescendantIds(categoryId, flatCategories) {
  const childrenMap = new Map()
  flatCategories.forEach(cat => {
    if (cat.parentId) {
      if (!childrenMap.has(cat.parentId)) childrenMap.set(cat.parentId, [])
      childrenMap.get(cat.parentId).push(cat.id)
    }
  })

  const result = []
  const queue = [categoryId]
  while (queue.length > 0) {
    const id = queue.shift()
    const children = childrenMap.get(id) || []
    children.forEach(childId => {
      result.push(childId)
      queue.push(childId)
    })
  }
  return result
}

/**
 * Find a category by ID.
 */
export function getCategoryById(categoryId, flatCategories) {
  return flatCategories.find(c => c.id === categoryId) || null
}

/**
 * Returns all category IDs that are direct children of the given parentId.
 */
export function getDirectChildren(parentId, flatCategories) {
  return flatCategories.filter(c => c.parentId === parentId)
}

/**
 * Returns true if the category is a leaf (no children).
 */
export function isLeafCategory(categoryId, flatCategories) {
  return !flatCategories.some(c => c.parentId === categoryId)
}
