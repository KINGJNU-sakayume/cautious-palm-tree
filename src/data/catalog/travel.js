// 여행: 국내 · 해외 · 캠핑
//
// 여행 한 번을 기록 하나로 남기고, 값에는 묵은 밤 수를 '박' 단위로 적어요
// (3박 4일 → 3박). 가 본 곳은 태그로 남기면 목록 업적이 하나씩 채워져요.

import {
  HIDDEN, action, count, define, metaCount, metaList, months, single, tag, tagCount, tagSet, total,
} from './helpers.js'

const HAN_RIVER_BRIDGES = [
  '행주대교', '방화대교', '가양대교', '월드컵대교', '성산대교', '양화대교',
  '서강대교', '마포대교', '원효대교', '한강대교', '동작대교', '반포대교',
  '한남대교', '동호대교', '성수대교', '영동대교', '청담대교', '잠실대교',
  '올림픽대교', '천호대교', '광진교', '구리암사대교', '강동대교',
]

const PROVINCES = ['경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

// 특별시·광역시·특별자치시
const METROPOLITAN_CITIES = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종']

const PALACES = ['경복궁', '창덕궁', '창경궁', '덕수궁', '경희궁']

const CONTINENTS = ['아시아', '유럽', '북미', '남미', '아프리카', '오세아니아']

const G7 = ['미국', '캐나다', '영국', '프랑스', '독일', '이탈리아', '일본']

const EAST_ASIA = ['일본', '중국', '대만', '몽골']

// 2007년 발표된 신(新) 세계 7대 불가사의
const NEW_SEVEN_WONDERS = ['만리장성', '페트라', '콜로세움', '치첸이트사', '마추픽추', '타지마할', '예수상']

export default [
  // ── 여행 전체 ─────────────────────────────────────────────────────────────
  define('ach-travel-006', 'cat-travel', 'gold', '방랑벽', '국내와 해외를 합쳐 여행을 10번 기록해 보세요.',
    count(10)),
  define('ach-travel-007', 'cat-travel', 'platinum', '프로 여행러', '국내와 해외를 합쳐 여행을 30번 기록해 보세요.',
    count(30)),
  define('ach-travel-008', 'cat-travel', 'diamond', '인생은 여행', '여행을 50번이나 기록했어요. 어디서든 집처럼 지내는 사람이에요.',
    count(50), HIDDEN),
  define('ach-travel-009', 'cat-travel', 'gold', '한 달치 여행', "여행에서 보낸 밤을 합쳐 30박을 채워 보세요. 값에 '박' 단위로 적으면 돼요.",
    total(30, '박')),
  define('ach-travel-010', 'cat-travel', 'platinum', '100박의 여행', '여행에서 보낸 밤을 합쳐 100박을 채워 보세요.',
    total(100, '박')),
  define('ach-travel-011', 'cat-travel', 'platinum', '매달 떠나기', '12개월 연속으로 매달 여행을 떠나 보세요.',
    months(12)),
  define('ach-travel-012', 'cat-travel', 'silver', '나 홀로 여행', "혼자 떠난 여행에 '혼자' 태그를 붙여 보세요.",
    tag('혼자')),
  define('ach-travel-013', 'cat-travel', 'silver', '가족 여행', "가족과 함께 떠난 여행에 '가족여행' 태그를 붙여 보세요.",
    tag('가족여행')),
  define('ach-travel-014', 'cat-travel', 'silver', '당일치기 달인', "하루 만에 다녀온 여행에 '당일치기' 태그를 붙여 5번 기록해 보세요.",
    tagCount('당일치기', 5)),
  define('ach-travel-015', 'cat-travel', 'gold', '여행 수집가', '여행 업적 10개를 달성해 보세요.',
    metaCount(10)),

  // ── 국내 ──────────────────────────────────────────────────────────────────
  define('ach-domestic-001', 'cat-domestic', 'bronze', '첫 국내 여행', '국내 여행을 처음 기록해 보세요.',
    action()),
  define('ach-domestic-002', 'cat-domestic', 'silver', '주말엔 여행', '국내 여행을 10번 기록해 보세요.',
    count(10)),
  define('ach-domestic-003', 'cat-domestic', 'gold', '국내파 여행가', '국내 여행을 30번 기록해 보세요.',
    count(30)),
  define('ach-domestic-010', 'cat-domestic', 'gold', '국내 30박', '국내 여행에서 보낸 밤을 합쳐 30박을 채워 보세요.',
    total(30, '박')),
  define('ach-travel-005', 'cat-domestic', 'gold', '전국 일주', "9개 도를 모두 여행해 보세요. 기록할 때 '강원', '제주'처럼 도 이름을 태그로 남기면 돼요.",
    tagSet(PROVINCES)),
  define('ach-domestic-004', 'cat-domestic', 'gold', '특별·광역시 일주', "서울·부산·대구·인천·광주·대전·울산·세종, 여덟 도시를 모두 여행하고 도시 이름을 태그로 남겨 보세요.",
    tagSet(METROPOLITAN_CITIES)),
  define('ach-domestic-005', 'cat-domestic', 'platinum', '17개 시·도 완주', '9개 도와 8개 특별시·광역시·특별자치시, 전국 17개 시·도를 모두 여행해 보세요.',
    metaList('ach-travel-005', 'ach-domestic-004')),
  define('ach-domestic-006', 'cat-domestic', 'silver', '다섯 궁궐', '조선의 다섯 궁궐(경복궁·창덕궁·창경궁·덕수궁·경희궁)을 모두 둘러보고 궁 이름을 태그로 남겨 보세요.',
    tagSet(PALACES)),
  define('ach-travel-003', 'cat-domestic', 'platinum', '한강의 기적', '서울의 한강 다리 23곳을 모두 건너 보세요. 다리 이름을 태그로 남기면 하나씩 체크돼요.',
    tagSet(HAN_RIVER_BRIDGES)),
  define('ach-domestic-007', 'cat-domestic', 'silver', '섬마을 여행자', "섬으로 떠난 여행에 '섬' 태그를 붙여 5번 기록해 보세요.",
    tagCount('섬', 5)),
  define('ach-domestic-008', 'cat-domestic', 'platinum', '우리 땅 독도', "독도에 가 보고 '독도' 태그를 붙여 보세요.",
    tag('독도')),
  define('ach-domestic-009', 'cat-domestic', 'bronze', '기차 여행', "기차를 타고 떠난 여행에 '기차' 태그를 붙여 보세요.",
    tag('기차')),
  define('ach-domestic-012', 'cat-domestic', 'silver', '템플스테이', "산사에서 템플스테이를 하고 '템플스테이' 태그를 붙여 보세요.",
    tag('템플스테이')),
  define('ach-domestic-013', 'cat-domestic', 'silver', '한옥에서 하룻밤', "한옥에서 묵고 '한옥' 태그를 붙여 보세요.",
    tag('한옥')),

  // ── 해외 ──────────────────────────────────────────────────────────────────
  define('ach-travel-001', 'cat-international', 'silver', '여권 도장', '첫 해외여행을 기록해 보세요.',
    action()),
  define('ach-travel-002', 'cat-international', 'gold', '세계 여행자', '해외여행을 5번 기록해 보세요.',
    count(5)),
  define('ach-intl-001', 'cat-international', 'platinum', '지구촌 여행자', '해외여행을 10번 기록해 보세요.',
    count(10)),
  define('ach-intl-008', 'cat-international', 'silver', '일주일 여행', '한 번의 해외여행에서 7박 이상 머물러 보세요.',
    single(7, '박')),
  define('ach-intl-007', 'cat-international', 'platinum', '한 달 살기', '한 번의 해외여행에서 30박 이상 머물러 보세요.',
    single(30, '박')),
  define('ach-intl-006', 'cat-international', 'gold', '해외 30박', '해외에서 보낸 밤을 합쳐 30박을 채워 보세요.',
    total(30, '박')),
  define('ach-intl-004', 'cat-international', 'silver', '동아시아 한 바퀴', '일본·중국·대만·몽골을 모두 여행하고 이름을 태그로 남겨 보세요.',
    tagSet(EAST_ASIA)),
  define('ach-intl-003', 'cat-international', 'platinum', 'G7 순방', 'G7 일곱 나라(미국·캐나다·영국·프랑스·독일·이탈리아·일본)를 모두 여행하고 나라 이름을 태그로 남겨 보세요.',
    tagSet(G7)),
  define('ach-travel-004', 'cat-international', 'diamond', '여섯 대륙', '여섯 대륙을 모두 여행해 보세요. 기록할 때 대륙 이름을 태그로 남기면 돼요.',
    tagSet(CONTINENTS)),
  define('ach-intl-005', 'cat-international', 'diamond', '신 7대 불가사의', '만리장성·페트라·콜로세움·치첸이트사·마추픽추·타지마할·리우 예수상을 모두 가 보고 이름을 태그로 남겨 보세요.',
    tagSet(NEW_SEVEN_WONDERS)),
  define('ach-intl-009', 'cat-international', 'silver', '배낭여행자', "배낭 하나로 떠난 여행에 '배낭여행' 태그를 붙여 보세요.",
    tag('배낭여행')),
  define('ach-intl-010', 'cat-international', 'platinum', '오로라 헌터', "오로라를 보고 '오로라' 태그를 붙여 보세요.",
    tag('오로라')),
  define('ach-intl-011', 'cat-international', 'diamond', '남극 대륙', '남극에 발을 디뎠어요. 여섯 대륙 너머, 마지막 대륙이에요.',
    tag('남극'), HIDDEN),

  // ── 캠핑 (박) ──────────────────────────────────────────────────────────────
  define('ach-camping-001', 'cat-camping', 'bronze', '첫 캠핑', '첫 캠핑을 기록해 보세요.',
    action()),
  define('ach-camping-002', 'cat-camping', 'silver', '캠핑 초보 탈출', '캠핑을 5번 기록해 보세요.',
    count(5)),
  define('ach-camping-003', 'cat-camping', 'gold', '캠핑 고수', '캠핑을 20번 기록해 보세요.',
    count(20)),
  define('ach-camping-004', 'cat-camping', 'platinum', '캠핑이 곧 집', '캠핑을 50번 기록해 보세요.',
    count(50)),
  define('ach-camping-005', 'cat-camping', 'gold', '텐트에서 30박', '캠핑에서 보낸 밤을 합쳐 30박을 채워 보세요.',
    total(30, '박')),
  define('ach-camping-010', 'cat-camping', 'platinum', '사계절 캠퍼', '12개월 연속으로 매달 캠핑을 떠나 보세요. 사계절을 모두 텐트에서 보내게 돼요.',
    months(12)),
  define('ach-camping-006', 'cat-camping', 'silver', '첫 백패킹', "짐을 메고 걸어서 가는 백패킹을 하고 '백패킹' 태그를 붙여 보세요.",
    tag('백패킹')),
  define('ach-camping-007', 'cat-camping', 'gold', '겨울 캠핑', "겨울에 캠핑하고 '동계캠핑' 태그를 붙여 보세요.",
    tag('동계캠핑')),
  define('ach-camping-008', 'cat-camping', 'silver', '솔로 캠핑', "혼자 떠난 캠핑에 '솔캠' 태그를 붙여 보세요.",
    tag('솔캠')),
  define('ach-camping-009', 'cat-camping', 'silver', '차박 여행자', "차에서 잔 캠핑에 '차박' 태그를 붙여 5번 기록해 보세요.",
    tagCount('차박', 5)),
  define('ach-camping-011', 'cat-camping', 'silver', '불멍 전문가', "모닥불을 바라보며 쉰 캠핑에 '불멍' 태그를 붙여 5번 기록해 보세요.",
    tagCount('불멍', 5)),
]
