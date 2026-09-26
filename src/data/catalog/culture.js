// 문화생활: 영화 · 공연 · 전시
//
// 본 작품 하나를 기록 하나로 남겨요. 장르나 작품 이름은 태그로 남기면
// 목록 업적이 하나씩 채워져요.

import { HIDDEN, action, count, define, metaList, months, tag, tagCount, tagSet } from './helpers.js'

const MOVIE_GENRES = ['액션', '코미디', '드라마', '공포', 'SF', '애니메이션', '다큐멘터리', '로맨스']

// 봉준호 감독의 장편 영화 (2000–2025)
const BONG_JOON_HO = ['플란다스의 개', '살인의 추억', '괴물', '마더', '설국열차', '옥자', '기생충', '미키 17']

const VENGEANCE_TRILOGY = ['복수는 나의 것', '올드보이', '친절한 금자씨']

const STAGE_GENRES = ['뮤지컬', '연극', '콘서트', '클래식', '오페라', '발레', '국악']

// 국립중앙박물관과 소속 지역 국립박물관 13곳
const NATIONAL_MUSEUMS = [
  '국립중앙박물관', '국립경주박물관', '국립광주박물관', '국립전주박물관', '국립대구박물관',
  '국립부여박물관', '국립공주박물관', '국립진주박물관', '국립청주박물관', '국립김해박물관',
  '국립제주박물관', '국립춘천박물관', '국립나주박물관', '국립익산박물관',
]

// 국립현대미술관(MMCA)의 네 관
const MMCA = ['서울관', '과천관', '덕수궁관', '청주관']

export default [
  // ── 문화생활 전체 ─────────────────────────────────────────────────────────
  define('ach-culture-004', 'cat-culture', 'silver', '영화·공연·전시', '영화, 공연, 전시를 한 번씩 모두 즐겨 보세요.',
    metaList('ach-movie-001', 'ach-show-001', 'ach-exhibit-001')),
  define('ach-culture-001', 'cat-culture', 'silver', '문화생활 입문', '영화, 공연, 전시를 합쳐 10번 기록해 보세요.',
    count(10)),
  define('ach-culture-002', 'cat-culture', 'gold', '문화 애호가', '영화, 공연, 전시를 합쳐 50번 기록해 보세요.',
    count(50)),
  define('ach-culture-003', 'cat-culture', 'platinum', '예술을 사랑하는 사람', '영화, 공연, 전시를 합쳐 100번 기록해 보세요.',
    count(100)),
  define('ach-culture-005', 'cat-culture', 'gold', '매달 문화생활', '12개월 연속으로 매달 영화, 공연, 전시 중 하나를 즐겨 보세요.',
    months(12)),

  // ── 영화 ──────────────────────────────────────────────────────────────────
  define('ach-movie-001', 'cat-movies', 'bronze', '첫 영화', '본 영화를 처음 기록해 보세요.',
    action()),
  define('ach-movie-002', 'cat-movies', 'silver', '영화 좋아하는 사람', '본 영화를 10편 기록해 보세요.',
    count(10)),
  define('ach-movie-003', 'cat-movies', 'gold', '시네필', '본 영화를 50편 기록해 보세요.',
    count(50)),
  define('ach-movie-004', 'cat-movies', 'platinum', '영화광', '본 영화를 100편 기록해 보세요.',
    count(100)),
  define('ach-movie-005', 'cat-movies', 'diamond', '걸어 다니는 영화 사전', '본 영화가 365편이 됐어요. 1년 내내 하루 한 편씩 본 셈이에요.',
    count(365), HIDDEN),
  define('ach-movie-013', 'cat-movies', 'gold', '매달 영화 한 편', '12개월 연속으로 매달 영화를 봐 보세요.',
    months(12)),
  define('ach-movie-006', 'cat-movies', 'silver', '극장 단골', "영화관에서 본 영화에 '영화관' 태그를 붙여 10번 기록해 보세요.",
    tagCount('영화관', 10)),
  define('ach-movie-011', 'cat-movies', 'silver', 'N차 관람', "같은 영화를 다시 보고 '재관람' 태그를 붙여 보세요.",
    tag('재관람')),
  define('ach-movie-012', 'cat-movies', 'silver', '영화제 나들이', "영화제에 가서 '영화제' 태그를 붙여 보세요.",
    tag('영화제')),
  define('ach-movie-010', 'cat-movies', 'gold', '천만 관객의 선택', "관객 천만 명을 넘긴 영화를 보고 '천만영화' 태그를 붙여 10편 기록해 보세요.",
    tagCount('천만영화', 10)),
  define('ach-movie-007', 'cat-movies', 'gold', '장르 편식 없음', '액션·코미디·드라마·공포·SF·애니메이션·다큐멘터리·로맨스, 여덟 장르를 모두 보고 장르를 태그로 남겨 보세요.',
    tagSet(MOVIE_GENRES)),
  define('ach-movie-009', 'cat-movies', 'gold', '복수 3부작', '박찬욱 감독의 복수 3부작(복수는 나의 것·올드보이·친절한 금자씨)을 모두 보고 제목을 태그로 남겨 보세요.',
    tagSet(VENGEANCE_TRILOGY)),
  define('ach-movie-008', 'cat-movies', 'platinum', '봉준호의 세계', '봉준호 감독의 장편 영화 여덟 편(플란다스의 개부터 미키 17까지)을 모두 보고 제목을 태그로 남겨 보세요.',
    tagSet(BONG_JOON_HO)),

  // ── 공연 ──────────────────────────────────────────────────────────────────
  define('ach-show-001', 'cat-performances', 'bronze', '첫 공연', '본 공연을 처음 기록해 보세요.',
    action()),
  define('ach-show-002', 'cat-performances', 'silver', '객석의 단골', '본 공연을 10번 기록해 보세요.',
    count(10)),
  define('ach-show-003', 'cat-performances', 'gold', '공연 애호가', '본 공연을 30번 기록해 보세요.',
    count(30)),
  define('ach-show-004', 'cat-performances', 'platinum', '무대를 사랑하는 사람', '본 공연을 100번 기록해 보세요.',
    count(100)),
  define('ach-show-006', 'cat-performances', 'gold', '뮤지컬 마니아', "'뮤지컬' 태그를 붙인 공연을 10번 기록해 보세요.",
    tagCount('뮤지컬', 10)),
  define('ach-show-009', 'cat-performances', 'silver', '대학로 산책', "'연극' 태그를 붙인 공연을 5번 기록해 보세요.",
    tagCount('연극', 5)),
  define('ach-show-007', 'cat-performances', 'silver', '떼창 전문가', "'콘서트' 태그를 붙인 공연을 5번 기록해 보세요.",
    tagCount('콘서트', 5)),
  define('ach-show-008', 'cat-performances', 'silver', '페스티벌 입성', "음악 페스티벌에 가서 '페스티벌' 태그를 붙여 보세요.",
    tag('페스티벌')),
  define('ach-show-010', 'cat-performances', 'silver', '회전문 관객', "같은 공연을 다시 보고 '회전문' 태그를 붙여 보세요.",
    tag('회전문')),
  define('ach-show-005', 'cat-performances', 'platinum', '무대 탐험가', '뮤지컬·연극·콘서트·클래식·오페라·발레·국악, 일곱 가지 무대를 모두 보고 장르를 태그로 남겨 보세요.',
    tagSet(STAGE_GENRES)),

  // ── 전시 ──────────────────────────────────────────────────────────────────
  define('ach-exhibit-001', 'cat-exhibitions', 'bronze', '첫 전시', '관람한 전시를 처음 기록해 보세요.',
    action()),
  define('ach-exhibit-002', 'cat-exhibitions', 'silver', '전시장 산책자', '관람한 전시를 10번 기록해 보세요.',
    count(10)),
  define('ach-exhibit-003', 'cat-exhibitions', 'gold', '미술관 단골', '관람한 전시를 30번 기록해 보세요.',
    count(30)),
  define('ach-exhibit-004', 'cat-exhibitions', 'platinum', '큐레이터의 눈', '관람한 전시를 100번 기록해 보세요.',
    count(100)),
  define('ach-exhibit-010', 'cat-exhibitions', 'gold', '매달 전시', '6개월 연속으로 매달 전시를 관람해 보세요.',
    months(6)),
  define('ach-exhibit-008', 'cat-exhibitions', 'bronze', '도슨트와 함께', "도슨트 해설을 듣고 '도슨트' 태그를 붙여 보세요.",
    tag('도슨트')),
  define('ach-exhibit-007', 'cat-exhibitions', 'silver', '박물관 탐험가', "'박물관' 태그를 붙인 관람을 10번 기록해 보세요.",
    tagCount('박물관', 10)),
  define('ach-exhibit-006', 'cat-exhibitions', 'gold', 'MMCA 네 곳', '국립현대미술관 서울관·과천관·덕수궁관·청주관을 모두 관람하고 관 이름을 태그로 남겨 보세요.',
    tagSet(MMCA)),
  define('ach-exhibit-009', 'cat-exhibitions', 'platinum', '세계의 박물관', '루브르 박물관, 대영박물관, 바티칸 박물관, 메트로폴리탄 미술관을 모두 관람하고 이름을 태그로 남겨 보세요.',
    tagSet(['루브르', '대영박물관', '바티칸', '메트로폴리탄'])),
  define('ach-exhibit-005', 'cat-exhibitions', 'diamond', '국립박물관 14곳', '국립중앙박물관과 지역 국립박물관 13곳을 모두 관람하고 박물관 이름을 태그로 남겨 보세요.',
    tagSet(NATIONAL_MUSEUMS)),
]
