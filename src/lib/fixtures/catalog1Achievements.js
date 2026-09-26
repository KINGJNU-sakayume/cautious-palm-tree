// Test fixture: the built-in achievements of catalog 1, exactly as the app
// shipped them (git 4d5fb59). Frozen — used to test the catalog upgrade.

const define = (id, categoryId, tier, title, description, condition, extra = {}) => ({
  id, title, description, categoryId, tier, condition, isHidden: false, ...extra,
})

const HAN_RIVER_BRIDGES = [
  '행주대교', '방화대교', '가양대교', '월드컵대교', '성산대교', '양화대교',
  '서강대교', '마포대교', '원효대교', '한강대교', '동작대교', '반포대교',
  '한남대교', '동호대교', '성수대교', '영동대교', '청담대교', '잠실대교',
  '올림픽대교', '천호대교', '광진교', '구리암사대교', '강동대교',
]

const PROVINCES = ['경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

const CONTINENTS = ['아시아', '유럽', '북미', '남미', '아프리카', '오세아니아']

const BIG_THREE = ['cat-bench-press', 'cat-squat', 'cat-deadlift'].map(categoryId => ({ categoryId, aggregation: 'max' }))

export const achievements = [
  // ── 모든 기록 ────────────────────────────────────────────────────────────────
  define('ach-all-001', null, 'bronze', '첫 기록', '어떤 카테고리든 첫 기록을 남겨 보세요.',
    { type: 'action' }),
  define('ach-all-002', null, 'gold', '차곡차곡', '카테고리에 상관없이 기록 100개를 쌓아 보세요.',
    { type: 'count', target: 100 }),
  define('ach-all-003', null, 'gold', '한 달 개근', '30일 동안 하루도 빠짐없이 무엇이든 기록해 보세요.',
    { type: 'streak', target: 30 }),
  define('ach-all-004', null, 'diamond', '1년 개근', '365일 동안 하루도 빠짐없이 기록했어요. 정말 대단해요.',
    { type: 'streak', target: 365 }, { isHidden: true }),
  define('ach-meta-010', null, 'silver', '업적 수집가', '업적 10개를 달성해 보세요.',
    { type: 'meta_count', target: 10 }),
  define('ach-meta-011', null, 'gold', '업적 사냥꾼', '업적 30개를 달성해 보세요.',
    { type: 'meta_count', target: 30 }),

  // ── 피트니스 ────────────────────────────────────────────────────────────────
  define('ach-fitness-001', 'cat-fitness', 'silver', '일주일 오운완', '종목에 상관없이 7일 연속으로 운동을 기록해 보세요.',
    { type: 'streak', target: 7 }),
  define('ach-fitness-002', 'cat-fitness', 'platinum', '운동이 일상', '종목에 상관없이 운동을 100번 기록해 보세요.',
    { type: 'count', target: 100 }),
  define('ach-meta-001', 'cat-fitness', 'silver', '올라운더', '러닝, 벤치 프레스, 스쿼트, 데드리프트, 사이클링을 한 번씩 모두 해 보세요.',
    { type: 'meta_list', achievementIds: ['ach-run-001', 'ach-bench-001', 'ach-squat-001', 'ach-deadlift-001', 'ach-cycling-001'] }),

  // 러닝
  define('ach-run-001', 'cat-running', 'bronze', '첫 걸음', '첫 러닝을 기록해 보세요.',
    { type: 'action' }),
  define('ach-run-010', 'cat-running', 'bronze', '첫 5km', '한 번에 5km를 달려 보세요.',
    { type: 'single', target: 5, unit: 'km' }),
  define('ach-run-002', 'cat-running', 'silver', '꾸준한 러너', '러닝을 10번 기록해 보세요.',
    { type: 'count', target: 10 }),
  define('ach-run-005', 'cat-running', 'silver', '작심삼일 극복', '7일 연속으로 달려 보세요.',
    { type: 'streak', target: 7 }),
  define('ach-run-011', 'cat-running', 'silver', '10km 완주', '한 번에 10km를 달려 보세요.',
    { type: 'single', target: 10, unit: 'km' }),
  define('ach-run-008', 'cat-running', 'silver', '야외 러너', "'야외' 태그를 붙인 러닝을 5번 기록해 보세요.",
    { type: 'tag_count', tag: '야외', target: 5 }),
  define('ach-run-003', 'cat-running', 'gold', '100km 러너', '지금까지 달린 거리를 합쳐 100km를 채워 보세요.',
    { type: 'cumulative', target: 100, unit: 'km' }),
  define('ach-meta-002', 'cat-running', 'gold', '러닝 삼관왕', '러닝 횟수, 누적 거리, 연속 기록 업적을 모두 달성해 보세요.',
    { type: 'meta_list', achievementIds: ['ach-run-002', 'ach-run-003', 'ach-run-005'] }),
  define('ach-run-004', 'cat-running', 'platinum', '하프 마라톤', '한 번에 21.1km를 달려 보세요.',
    { type: 'single', target: 21.1, unit: 'km' }),
  define('ach-run-012', 'cat-running', 'diamond', '풀코스 마라톤', '한 번에 42.195km를 달려 보세요.',
    { type: 'single', target: 42.195, unit: 'km' }),
  define('ach-run-006', 'cat-running', 'diamond', '철각', '30일 연속으로 달리면서 누적 200km를 채웠어요. 강철 같은 다리예요.',
    {
      type: 'composite',
      operator: 'AND',
      conditions: [{ type: 'streak', target: 30 }, { type: 'cumulative', target: 200, unit: 'km' }],
    },
    { isHidden: true }),
  define('ach-run-007', 'cat-running', 'diamond', '1,000km 클럽', '달린 거리를 합쳐 1,000km를 넘었어요. 서울에서 부산까지 두 번 넘게 달린 셈이에요.',
    { type: 'cumulative', target: 1000, unit: 'km' }, { isHidden: true }),

  // 근력 운동
  define('ach-strength-002', 'cat-strength', 'silver', '첫 PR', "근력 운동 기록에 'PR' 태그를 붙여 개인 최고 기록을 남겨 보세요.",
    { type: 'tag_match', tag: 'PR' }),
  define('ach-strength-001', 'cat-strength', 'gold', '헬스장 단골', '벤치 프레스, 스쿼트, 데드리프트를 합쳐 근력 운동을 30번 기록해 보세요.',
    { type: 'count', target: 30 }),
  define('ach-strength-003', 'cat-strength', 'gold', '3대 300', '벤치 프레스, 스쿼트, 데드리프트 최고 기록의 합으로 300kg을 넘겨 보세요.',
    { type: 'cross_category_cumulative', sources: BIG_THREE, target: 300, unit: 'kg' }),
  define('ach-strength-004', 'cat-strength', 'diamond', '3대 500', '3대 운동 최고 기록의 합으로 500kg을 넘겨 보세요. 헬스인의 오랜 꿈이에요.',
    { type: 'cross_category_cumulative', sources: BIG_THREE, target: 500, unit: 'kg' }),

  // 벤치 프레스
  define('ach-bench-001', 'cat-bench-press', 'bronze', '벤치 프레스 입문', '첫 벤치 프레스를 기록해 보세요.',
    { type: 'action' }),
  define('ach-bench-006', 'cat-bench-press', 'silver', '벤치 1판', '벤치 프레스 60kg(원판 한 장씩)을 들어 보세요.',
    { type: 'single', target: 60, unit: 'kg' }),
  define('ach-bench-002', 'cat-bench-press', 'gold', '벤치 2판', '벤치 프레스 100kg(원판 두 장씩)을 들어 보세요.',
    { type: 'single', target: 100, unit: 'kg' }),
  define('ach-bench-003', 'cat-bench-press', 'diamond', '벤치 3판', '벤치 프레스 140kg(원판 세 장씩)을 들어 보세요.',
    { type: 'single', target: 140, unit: 'kg' }),

  // 스쿼트
  define('ach-squat-001', 'cat-squat', 'bronze', '스쿼트 입문', '첫 스쿼트를 기록해 보세요.',
    { type: 'action' }),
  define('ach-squat-003', 'cat-squat', 'silver', '스쿼트 2판', '스쿼트 100kg(원판 두 장씩)을 들어 보세요.',
    { type: 'single', target: 100, unit: 'kg' }),
  define('ach-squat-002', 'cat-squat', 'gold', '스쿼트 3판', '스쿼트 140kg(원판 세 장씩)을 들어 보세요.',
    { type: 'single', target: 140, unit: 'kg' }),

  // 데드리프트
  define('ach-deadlift-001', 'cat-deadlift', 'bronze', '데드리프트 입문', '첫 데드리프트를 기록해 보세요.',
    { type: 'action' }),
  define('ach-deadlift-002', 'cat-deadlift', 'silver', '데드 3판', '데드리프트 140kg(원판 세 장씩)을 들어 보세요.',
    { type: 'single', target: 140, unit: 'kg' }),
  define('ach-deadlift-003', 'cat-deadlift', 'gold', '데드 4판', '데드리프트 180kg(원판 네 장씩)을 들어 보세요.',
    { type: 'single', target: 180, unit: 'kg' }),

  // 사이클링
  define('ach-cycling-001', 'cat-cycling', 'bronze', '첫 페달', '첫 라이딩을 기록해 보세요.',
    { type: 'action' }),
  define('ach-cycling-003', 'cat-cycling', 'gold', '500km 라이더', '라이딩 거리를 합쳐 500km를 채워 보세요.',
    { type: 'cumulative', target: 500, unit: 'km' }),
  define('ach-cycling-002', 'cat-cycling', 'platinum', '100km 라이드', '한 번에 100km를 달려 보세요.',
    { type: 'single', target: 100, unit: 'km' }),

  // ── 학습 ────────────────────────────────────────────────────────────────────
  // 독서
  define('ach-books-001', 'cat-books', 'bronze', '첫 페이지', '첫 독서를 기록해 보세요.',
    { type: 'action' }),
  define('ach-books-004', 'cat-books', 'silver', '첫 완독', "책을 다 읽은 날 '완독' 태그를 붙여 기록해 보세요.",
    { type: 'tag_match', tag: '완독' }),
  define('ach-books-002', 'cat-books', 'silver', '천 페이지', '읽은 페이지를 합쳐 1,000페이지를 채워 보세요.',
    { type: 'cumulative', target: 1000, unit: '페이지' }),
  define('ach-books-003', 'cat-books', 'silver', '논픽션 마니아', "'논픽션' 태그를 붙인 독서를 3번 기록해 보세요.",
    { type: 'tag_count', tag: '논픽션', target: 3 }),
  define('ach-books-005', 'cat-books', 'gold', '열 권의 책', "'완독' 태그로 책 10권을 기록해 보세요.",
    { type: 'tag_count', tag: '완독', target: 10 }),
  define('ach-books-006', 'cat-books', 'platinum', '만 페이지', '읽은 페이지를 합쳐 10,000페이지를 채워 보세요.',
    { type: 'cumulative', target: 10000, unit: '페이지' }),

  // 강의
  define('ach-course-001', 'cat-courses', 'bronze', '첫 수강', '첫 강의 수강을 기록해 보세요.',
    { type: 'action' }),
  define('ach-course-002', 'cat-courses', 'silver', '수료증', "강의를 끝까지 들은 날 '수료' 태그를 붙여 기록해 보세요.",
    { type: 'tag_match', tag: '수료' }),

  // 언어
  define('ach-lang-001', 'cat-languages', 'platinum', '외국어 100일', '언어에 상관없이 100일 연속으로 외국어를 공부해 보세요.',
    { type: 'streak', target: 100 }),
  define('ach-jp-001', 'cat-japanese', 'bronze', '하지메마시테', '첫 일본어 공부를 기록해 보세요.',
    { type: 'action' }),
  define('ach-jp-002', 'cat-japanese', 'gold', '30일 몰입', '30일 연속으로 일본어를 공부해 보세요.',
    { type: 'streak', target: 30 }),
  define('ach-jp-003', 'cat-japanese', 'gold', '일본어 50회', '일본어 공부를 50번 기록해 보세요.',
    { type: 'count', target: 50 }),
  define('ach-es-001', 'cat-spanish', 'bronze', '¡Hola!', '첫 스페인어 공부를 기록해 보세요.',
    { type: 'action' }),

  // ── 영양 ────────────────────────────────────────────────────────────────────
  define('ach-meal-001', 'cat-meal-prep', 'bronze', '첫 도시락', '직접 준비한 첫 식사를 기록해 보세요.',
    { type: 'action' }),
  define('ach-meal-002', 'cat-meal-prep', 'silver', '밀프렙 습관', '식사 준비를 10번 기록해 보세요.',
    { type: 'count', target: 10 }),
  define('ach-hydration-001', 'cat-hydration', 'bronze', '하루 2리터', '하루 동안 마신 물을 합쳐 2L를 채워 보세요. 500ml씩 나눠 기록해도 돼요.',
    { type: 'daily_cumulative', target: 2, unit: 'L' }),
  define('ach-hydration-002', 'cat-hydration', 'silver', '수분 충전 7일', '7일 연속으로 물 마신 기록을 남겨 보세요.',
    { type: 'streak', target: 7 }),

  // ── 마음 챙김 ───────────────────────────────────────────────────────────────
  // 명상
  define('ach-med-001', 'cat-meditation', 'bronze', '고요한 마음', '첫 명상을 기록해 보세요.',
    { type: 'action' }),
  define('ach-med-004', 'cat-meditation', 'silver', '깊은 몰입', "유난히 깊이 들어간 명상에 '깊은명상' 태그를 붙여 보세요.",
    { type: 'tag_match', tag: '깊은명상' }),
  define('ach-med-002', 'cat-meditation', 'gold', '21일의 법칙', '21일 연속으로 명상하면 습관이 된다고 해요. 직접 확인해 보세요.',
    { type: 'streak', target: 21 }),
  define('ach-med-005', 'cat-meditation', 'gold', '명상 1,000분', '명상한 시간을 합쳐 1,000분을 채워 보세요.',
    { type: 'cumulative', target: 1000, unit: '분' }),
  define('ach-med-003', 'cat-meditation', 'platinum', '100일의 고요', '100일 연속으로 명상했어요. 흔들리지 않는 마음이에요.',
    { type: 'streak', target: 100 }, { isHidden: true }),
  define('ach-meta-003', 'cat-meditation', 'diamond', '명상 마스터', '명상 업적을 모두 달성해 보세요.',
    { type: 'meta_clear' }),

  // 일기
  define('ach-journal-001', 'cat-journaling', 'bronze', '오늘의 일기', '첫 일기를 기록해 보세요.',
    { type: 'action' }),
  define('ach-journal-002', 'cat-journaling', 'silver', '성찰 습관', "'성찰' 태그를 붙인 일기를 10번 기록해 보세요.",
    { type: 'tag_count', tag: '성찰', target: 10 }),
  define('ach-journal-003', 'cat-journaling', 'gold', '한 달의 일기', '30일 연속으로 일기를 써 보세요.',
    { type: 'streak', target: 30 }),

  // ── 여행 ────────────────────────────────────────────────────────────────────
  define('ach-travel-006', 'cat-travel', 'gold', '방랑벽', '국내와 해외를 합쳐 여행을 10번 기록해 보세요.',
    { type: 'count', target: 10 }),
  define('ach-travel-005', 'cat-domestic', 'gold', '전국 일주', "9개 도를 모두 여행해 보세요. 기록할 때 '강원', '제주'처럼 도 이름을 태그로 남기면 돼요.",
    { type: 'tag_set_complete', tags: PROVINCES }),
  define('ach-travel-003', 'cat-domestic', 'platinum', '한강의 기적', '서울의 한강 다리 23곳을 모두 건너 보세요. 다리 이름을 태그로 남기면 하나씩 체크돼요.',
    { type: 'tag_set_complete', tags: HAN_RIVER_BRIDGES }),
  define('ach-travel-001', 'cat-international', 'silver', '여권 도장', '첫 해외여행을 기록해 보세요.',
    { type: 'action' }),
  define('ach-travel-002', 'cat-international', 'gold', '세계 여행자', '해외여행을 5번 기록해 보세요.',
    { type: 'count', target: 5 }),
  define('ach-travel-004', 'cat-international', 'diamond', '여섯 대륙', '여섯 대륙을 모두 여행해 보세요. 기록할 때 대륙 이름을 태그로 남기면 돼요.',
    { type: 'tag_set_complete', tags: CONTINENTS }),

  // ── 창작 ────────────────────────────────────────────────────────────────────
  define('ach-write-001', 'cat-writing', 'bronze', '첫 문장', '첫 글쓰기를 기록해 보세요.',
    { type: 'action' }),
  define('ach-write-003', 'cat-writing', 'gold', '매일 쓰는 사람', '30일 연속으로 글을 써 보세요.',
    { type: 'streak', target: 30 }),
  define('ach-write-002', 'cat-writing', 'platinum', '십만 자', '쓴 글자 수를 합쳐 10만 자를 채워 보세요. 장편소설 절반쯤 되는 분량이에요.',
    { type: 'cumulative', target: 100000, unit: '자' }),
  define('ach-music-001', 'cat-music', 'bronze', '첫 연주', '악기 연습이나 작곡 같은 첫 음악 활동을 기록해 보세요.',
    { type: 'action' }),
  define('ach-music-002', 'cat-music', 'gold', '100시간 연습', '연습한 시간을 합쳐 100시간을 채워 보세요. 분 단위로 기록해도 알아서 합쳐요.',
    { type: 'cumulative', target: 100, unit: '시간' }),

  // ── 커리어 ──────────────────────────────────────────────────────────────────
  define('ach-career-001', 'cat-career', 'silver', '레벨 업', '승진, 이직, 수상처럼 커리어의 의미 있는 순간을 기록해 보세요.',
    { type: 'action' }),
  define('ach-career-002', 'cat-career', 'gold', '자격증 취득', "자격증을 딴 날 '자격증' 태그를 붙여 기록해 보세요.",
    { type: 'tag_match', tag: '자격증' }),

  // ── 재정 ────────────────────────────────────────────────────────────────────
  define('ach-invest-001', 'cat-investing', 'bronze', '첫 투자', '첫 투자를 기록해 보세요.',
    { type: 'action' }),
  define('ach-invest-002', 'cat-investing', 'silver', '꾸준한 적립', '투자를 12번 기록해 보세요. 한 달에 한 번이면 1년이에요.',
    { type: 'count', target: 12 }),
  define('ach-saving-001', 'cat-saving', 'bronze', '첫 저축', '첫 저축을 기록해 보세요.',
    { type: 'action' }),
  define('ach-saving-002', 'cat-saving', 'platinum', '종잣돈 천만 원', '저축한 금액을 합쳐 1,000만 원을 모아 보세요. 만 원 단위로 기록해도 돼요.',
    { type: 'cumulative', target: 10000000, unit: '원' }),

  // ── 기술 ────────────────────────────────────────────────────────────────────
  define('ach-coding-001', 'cat-coding', 'bronze', 'Hello, World!', '첫 코딩을 기록해 보세요.',
    { type: 'action' }),
  define('ach-coding-002', 'cat-coding', 'gold', '1일 1커밋', '30일 연속으로 코딩을 기록해 보세요.',
    { type: 'streak', target: 30 }),
  define('ach-coding-003', 'cat-coding', 'gold', '첫 출시', "만든 것을 세상에 내놓은 날 '출시' 태그를 붙여 기록해 보세요.",
    { type: 'tag_match', tag: '출시' }),

  // ── 사회활동 ────────────────────────────────────────────────────────────────
  define('ach-volunteer-001', 'cat-volunteering', 'bronze', '첫 봉사', '첫 봉사활동을 기록해 보세요.',
    { type: 'action' }),
  define('ach-volunteer-002', 'cat-volunteering', 'gold', '따뜻한 50시간', '봉사한 시간을 합쳐 50시간을 채워 보세요.',
    { type: 'cumulative', target: 50, unit: '시간' }),
]
