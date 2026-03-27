// Flat array — tree is derived at runtime via buildTree()
export const categories = [
  // Fitness
  { id: 'cat-fitness', name: 'Fitness', parentId: null },
  { id: 'cat-running', name: 'Running', parentId: 'cat-fitness' },
  { id: 'cat-strength', name: 'Strength', parentId: 'cat-fitness' },
  { id: 'cat-bench-press', name: 'Bench Press', parentId: 'cat-strength' },
  { id: 'cat-squat', name: 'Squat', parentId: 'cat-strength' },
  { id: 'cat-deadlift', name: 'Deadlift', parentId: 'cat-strength' },
  { id: 'cat-cycling', name: 'Cycling', parentId: 'cat-fitness' },

  // Learning
  { id: 'cat-learning', name: 'Learning', parentId: null },
  { id: 'cat-books', name: 'Books', parentId: 'cat-learning' },
  { id: 'cat-courses', name: 'Courses', parentId: 'cat-learning' },
  { id: 'cat-languages', name: 'Languages', parentId: 'cat-learning' },
  { id: 'cat-japanese', name: 'Japanese', parentId: 'cat-languages' },
  { id: 'cat-spanish', name: 'Spanish', parentId: 'cat-languages' },

  // Nutrition
  { id: 'cat-nutrition', name: 'Nutrition', parentId: null },
  { id: 'cat-meal-prep', name: 'Meal Prep', parentId: 'cat-nutrition' },
  { id: 'cat-hydration', name: 'Hydration', parentId: 'cat-nutrition' },

  // Mindfulness
  { id: 'cat-mindfulness', name: 'Mindfulness', parentId: null },
  { id: 'cat-meditation', name: 'Meditation', parentId: 'cat-mindfulness' },
  { id: 'cat-journaling', name: 'Journaling', parentId: 'cat-mindfulness' },

  // Travel
  { id: 'cat-travel', name: 'Travel', parentId: null },
  { id: 'cat-domestic', name: 'Domestic', parentId: 'cat-travel' },
  { id: 'cat-international', name: 'International', parentId: 'cat-travel' },

  // Creative
  { id: 'cat-creative', name: 'Creative', parentId: null },
  { id: 'cat-writing', name: 'Writing', parentId: 'cat-creative' },
  { id: 'cat-music', name: 'Music', parentId: 'cat-creative' },

  // Career
  { id: 'cat-career', name: 'Career', parentId: null },

  // Finance
  { id: 'cat-finance', name: 'Finance', parentId: null },
  { id: 'cat-investing', name: 'Investing', parentId: 'cat-finance' },
  { id: 'cat-saving', name: 'Saving', parentId: 'cat-finance' },

  // Tech & Social
  { id: 'cat-tech', name: 'Tech', parentId: null },
  { id: 'cat-coding', name: 'Coding', parentId: 'cat-tech' },
  { id: 'cat-social', name: 'Social', parentId: null },
  { id: 'cat-volunteering', name: 'Volunteering', parentId: 'cat-social' },
];
