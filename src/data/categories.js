// Default category tree, as a flat array — the tree is derived at runtime via buildTree().
// Siblings show up in this order. Existing users get new categories through
// the catalog upgrade (lib/appState.js), appended after their own.
export const categories = [
  // 피트니스
  { id: 'cat-fitness', name: '피트니스', parentId: null },
  { id: 'cat-running', name: '러닝', parentId: 'cat-fitness' },
  { id: 'cat-walking', name: '걷기', parentId: 'cat-fitness' },
  { id: 'cat-hiking', name: '등산', parentId: 'cat-fitness' },
  { id: 'cat-cycling', name: '사이클링', parentId: 'cat-fitness' },
  { id: 'cat-swimming', name: '수영', parentId: 'cat-fitness' },
  { id: 'cat-strength', name: '근력 운동', parentId: 'cat-fitness' },
  { id: 'cat-bench-press', name: '벤치 프레스', parentId: 'cat-strength' },
  { id: 'cat-squat', name: '스쿼트', parentId: 'cat-strength' },
  { id: 'cat-deadlift', name: '데드리프트', parentId: 'cat-strength' },
  { id: 'cat-calisthenics', name: '맨몸 운동', parentId: 'cat-fitness' },
  { id: 'cat-pushup', name: '푸시업', parentId: 'cat-calisthenics' },
  { id: 'cat-pullup', name: '턱걸이', parentId: 'cat-calisthenics' },
  { id: 'cat-plank', name: '플랭크', parentId: 'cat-calisthenics' },
  { id: 'cat-yoga', name: '요가·필라테스', parentId: 'cat-fitness' },

  // 건강
  { id: 'cat-health', name: '건강', parentId: null },
  { id: 'cat-sleep', name: '수면', parentId: 'cat-health' },
  { id: 'cat-no-alcohol', name: '금주', parentId: 'cat-health' },
  { id: 'cat-no-smoking', name: '금연', parentId: 'cat-health' },

  // 영양
  { id: 'cat-nutrition', name: '영양', parentId: null },
  { id: 'cat-meal-prep', name: '요리', parentId: 'cat-nutrition' },
  { id: 'cat-hydration', name: '수분 섭취', parentId: 'cat-nutrition' },
  { id: 'cat-diet', name: '식단 관리', parentId: 'cat-nutrition' },

  // 학습
  { id: 'cat-learning', name: '학습', parentId: null },
  { id: 'cat-books', name: '독서', parentId: 'cat-learning' },
  { id: 'cat-courses', name: '강의', parentId: 'cat-learning' },
  { id: 'cat-study', name: '공부', parentId: 'cat-learning' },
  { id: 'cat-languages', name: '언어', parentId: 'cat-learning' },
  { id: 'cat-english', name: '영어', parentId: 'cat-languages' },
  { id: 'cat-japanese', name: '일본어', parentId: 'cat-languages' },
  { id: 'cat-chinese', name: '중국어', parentId: 'cat-languages' },
  { id: 'cat-spanish', name: '스페인어', parentId: 'cat-languages' },

  // 마음 챙김
  { id: 'cat-mindfulness', name: '마음 챙김', parentId: null },
  { id: 'cat-meditation', name: '명상', parentId: 'cat-mindfulness' },
  { id: 'cat-journaling', name: '일기', parentId: 'cat-mindfulness' },
  { id: 'cat-gratitude', name: '감사 일기', parentId: 'cat-mindfulness' },
  { id: 'cat-digital-detox', name: '디지털 디톡스', parentId: 'cat-mindfulness' },

  // 여행
  { id: 'cat-travel', name: '여행', parentId: null },
  { id: 'cat-domestic', name: '국내', parentId: 'cat-travel' },
  { id: 'cat-international', name: '해외', parentId: 'cat-travel' },
  { id: 'cat-camping', name: '캠핑', parentId: 'cat-travel' },

  // 문화생활
  { id: 'cat-culture', name: '문화생활', parentId: null },
  { id: 'cat-movies', name: '영화', parentId: 'cat-culture' },
  { id: 'cat-performances', name: '공연', parentId: 'cat-culture' },
  { id: 'cat-exhibitions', name: '전시', parentId: 'cat-culture' },

  // 창작
  { id: 'cat-creative', name: '창작', parentId: null },
  { id: 'cat-writing', name: '글쓰기', parentId: 'cat-creative' },
  { id: 'cat-music', name: '음악', parentId: 'cat-creative' },
  { id: 'cat-drawing', name: '그림', parentId: 'cat-creative' },
  { id: 'cat-photography', name: '사진', parentId: 'cat-creative' },

  // 커리어
  { id: 'cat-career', name: '커리어', parentId: null },
  { id: 'cat-work', name: '업무', parentId: 'cat-career' },
  { id: 'cat-certificates', name: '자격증', parentId: 'cat-career' },
  { id: 'cat-networking', name: '네트워킹', parentId: 'cat-career' },

  // 재정
  { id: 'cat-finance', name: '재정', parentId: null },
  { id: 'cat-investing', name: '투자', parentId: 'cat-finance' },
  { id: 'cat-saving', name: '저축', parentId: 'cat-finance' },
  { id: 'cat-budgeting', name: '가계부', parentId: 'cat-finance' },

  // 기술
  { id: 'cat-tech', name: '기술', parentId: null },
  { id: 'cat-coding', name: '코딩', parentId: 'cat-tech' },
  { id: 'cat-algorithms', name: '알고리즘', parentId: 'cat-tech' },

  // 사회활동
  { id: 'cat-social', name: '사회활동', parentId: null },
  { id: 'cat-volunteering', name: '봉사활동', parentId: 'cat-social' },
  { id: 'cat-donation', name: '기부', parentId: 'cat-social' },
  { id: 'cat-blood-donation', name: '헌혈', parentId: 'cat-social' },

  // 관계
  { id: 'cat-relationships', name: '관계', parentId: null },
  { id: 'cat-family', name: '가족', parentId: 'cat-relationships' },
  { id: 'cat-friends', name: '친구', parentId: 'cat-relationships' },

  // 생활
  { id: 'cat-home', name: '생활', parentId: null },
  { id: 'cat-cleaning', name: '청소·정리', parentId: 'cat-home' },
  { id: 'cat-pets', name: '반려동물', parentId: 'cat-home' },

  // 인생 챕터
  { id: 'cat-life-milestones', name: '인생 챕터', parentId: null },
  { id: 'cat-age-milestones', name: '나이·생일', parentId: 'cat-life-milestones' },
  { id: 'cat-education-milestones', name: '학업·졸업', parentId: 'cat-life-milestones' },
  { id: 'cat-military-milestones', name: '군복무', parentId: 'cat-life-milestones' },
  { id: 'cat-career-milestones', name: '취업·직장 이정표', parentId: 'cat-life-milestones' },
  { id: 'cat-home-milestones', name: '독립·주거', parentId: 'cat-life-milestones' },
  { id: 'cat-relationship-milestones', name: '연애·결혼', parentId: 'cat-life-milestones' },
  { id: 'cat-family-milestones', name: '가족·세대', parentId: 'cat-life-milestones' },
  { id: 'cat-money-milestones', name: '돈·재정 이정표', parentId: 'cat-life-milestones' },

  // 경험치
  { id: 'cat-experience-points', name: '경험치', parentId: null },
  { id: 'cat-food-experiences', name: '음식·미식', parentId: 'cat-experience-points' },
  { id: 'cat-travel-experiences', name: '여행·모험', parentId: 'cat-experience-points' },
  { id: 'cat-culture-experiences', name: '문화·관람', parentId: 'cat-experience-points' },
  { id: 'cat-hobby-experiences', name: '취미·덕질', parentId: 'cat-experience-points' },
  { id: 'cat-social-experiences', name: '인간관계·모임', parentId: 'cat-experience-points' },
  { id: 'cat-digital-experiences', name: '디지털 생활', parentId: 'cat-experience-points' },
  { id: 'cat-civic-experiences', name: '사회생활·행정', parentId: 'cat-experience-points' },
  { id: 'cat-mobility-experiences', name: '운전·교통', parentId: 'cat-experience-points' },

  // 사건사고
  { id: 'cat-chaos-events', name: '사건사고', parentId: null },
  { id: 'cat-luck-events', name: '운빨', parentId: 'cat-chaos-events' },
  { id: 'cat-mishap-events', name: '흑역사·실수', parentId: 'cat-chaos-events' },
  { id: 'cat-survival-events', name: '위기탈출', parentId: 'cat-chaos-events' },
  { id: 'cat-weird-events', name: '뜻밖의 경험', parentId: 'cat-chaos-events' },

  // 전설 난이도
  { id: 'cat-legendary-life', name: '전설 난이도', parentId: null },
  { id: 'cat-power-fame', name: '권력·유명세', parentId: 'cat-legendary-life' },
  { id: 'cat-business-wealth', name: '사업·부', parentId: 'cat-legendary-life' },
  { id: 'cat-world-feats', name: '세계급 기록·수상', parentId: 'cat-legendary-life' },
  { id: 'cat-space-impossible', name: '우주·거의 불가능', parentId: 'cat-legendary-life' },

]
