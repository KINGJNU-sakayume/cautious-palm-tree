// Flat array — tree is derived at runtime via buildTree()
export const categories = [
  // Fitness
  { id: 'cat-fitness', name: '피트니스', parentId: null },
  { id: 'cat-running', name: '러닝', parentId: 'cat-fitness' },
  { id: 'cat-strength', name: '근력 운동', parentId: 'cat-fitness' },
  { id: 'cat-bench-press', name: '벤치 프레스', parentId: 'cat-strength' },
  { id: 'cat-squat', name: '스쿼트', parentId: 'cat-strength' },
  { id: 'cat-deadlift', name: '데드리프트', parentId: 'cat-strength' },
  { id: 'cat-cycling', name: '사이클링', parentId: 'cat-fitness' },

  // Learning
  { id: 'cat-learning', name: '학습', parentId: null },
  { id: 'cat-books', name: '독서', parentId: 'cat-learning' },
  { id: 'cat-courses', name: '강의', parentId: 'cat-learning' },
  { id: 'cat-languages', name: '언어', parentId: 'cat-learning' },
  { id: 'cat-japanese', name: '일본어', parentId: 'cat-languages' },
  { id: 'cat-spanish', name: '스페인어', parentId: 'cat-languages' },

  // Nutrition
  { id: 'cat-nutrition', name: '영양', parentId: null },
  { id: 'cat-meal-prep', name: '식사 준비', parentId: 'cat-nutrition' },
  { id: 'cat-hydration', name: '수분 섭취', parentId: 'cat-nutrition' },

  // Mindfulness
  { id: 'cat-mindfulness', name: '마음 챙김', parentId: null },
  { id: 'cat-meditation', name: '명상', parentId: 'cat-mindfulness' },
  { id: 'cat-journaling', name: '일기', parentId: 'cat-mindfulness' },

  // Travel
  { id: 'cat-travel', name: '여행', parentId: null },
  { id: 'cat-domestic', name: '국내', parentId: 'cat-travel' },
  { id: 'cat-international', name: '해외', parentId: 'cat-travel' },

  // Creative
  { id: 'cat-creative', name: '창작', parentId: null },
  { id: 'cat-writing', name: '글쓰기', parentId: 'cat-creative' },
  { id: 'cat-music', name: '음악', parentId: 'cat-creative' },

  // Career
  { id: 'cat-career', name: '커리어', parentId: null },

  // Finance
  { id: 'cat-finance', name: '재정', parentId: null },
  { id: 'cat-investing', name: '투자', parentId: 'cat-finance' },
  { id: 'cat-saving', name: '저축', parentId: 'cat-finance' },

  // Tech & Social
  { id: 'cat-tech', name: '기술', parentId: null },
  { id: 'cat-coding', name: '코딩', parentId: 'cat-tech' },
  { id: 'cat-social', name: '사회활동', parentId: null },
  { id: 'cat-volunteering', name: '봉사활동', parentId: 'cat-social' },
];
