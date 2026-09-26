// 재정: 투자(원) · 저축(원) · 가계부
//
// 가계부는 쓰는 습관을 칭찬할 뿐, 쓴 돈의 크기로 업적을 주지는 않아요.

import {
  action, count, define, metaCount, metaList, months, single, streak, sumOf, tag, tagCount, total, weeks,
} from './helpers.js'

const SAVINGS_AND_INVESTMENTS = ['cat-saving', 'cat-investing'].map(categoryId => ({ categoryId, aggregation: 'sum' }))

export default [
  // ── 재정 전체 ─────────────────────────────────────────────────────────────
  define('ach-finance-001', 'cat-finance', 'silver', '재테크 입문', '투자, 저축, 가계부를 한 번씩 모두 기록해 보세요.',
    metaList('ach-invest-001', 'ach-saving-001', 'ach-budget-001')),
  define('ach-finance-002', 'cat-finance', 'gold', '매달 돈 관리', '12개월 연속으로 매달 재정 기록을 남겨 보세요.',
    months(12)),
  define('ach-finance-004', 'cat-finance', 'platinum', '모은 돈 5천만 원', '저축과 투자로 모은 금액을 합쳐 5,000만 원을 채워 보세요.',
    sumOf(SAVINGS_AND_INVESTMENTS, 50000000, '원')),
  define('ach-finance-005', 'cat-finance', 'diamond', '모은 돈 1억 원', '저축과 투자로 모은 금액을 합쳐 1억 원을 채워 보세요.',
    sumOf(SAVINGS_AND_INVESTMENTS, 100000000, '원')),
  define('ach-finance-003', 'cat-finance', 'gold', '돈 관리 고수', '재정 업적 10개를 달성해 보세요.',
    metaCount(10)),

  // ── 투자 (원) ──────────────────────────────────────────────────────────────
  define('ach-invest-001', 'cat-investing', 'bronze', '첫 투자', '첫 투자를 기록해 보세요.',
    action()),
  define('ach-invest-010', 'cat-investing', 'bronze', '첫 ETF', "ETF에 투자하고 'ETF' 태그를 붙여 보세요.",
    tag('ETF')),
  define('ach-invest-002', 'cat-investing', 'silver', '꾸준한 적립', '투자를 12번 기록해 보세요. 한 달에 한 번이면 1년이에요.',
    count(12)),
  define('ach-invest-003', 'cat-investing', 'gold', '적립식 1년', '12개월 연속으로 매달 투자해 보세요.',
    months(12)),
  define('ach-invest-004', 'cat-investing', 'platinum', '적립식 3년', '36개월 연속으로 매달 투자해 보세요.',
    months(36)),
  define('ach-invest-005', 'cat-investing', 'silver', '투자금 100만 원', '투자한 금액을 합쳐 100만 원을 채워 보세요. 만 원 단위로 기록해도 돼요.',
    total(1000000, '원')),
  define('ach-invest-006', 'cat-investing', 'gold', '투자금 천만 원', '투자한 금액을 합쳐 1,000만 원을 채워 보세요.',
    total(10000000, '원')),
  define('ach-invest-007', 'cat-investing', 'diamond', '투자금 1억 원', '투자한 금액을 합쳐 1억 원을 채워 보세요.',
    total(100000000, '원')),
  define('ach-invest-008', 'cat-investing', 'silver', '첫 배당금', "배당금을 받은 날 '배당' 태그를 붙여 기록해 보세요.",
    tag('배당')),
  define('ach-invest-009', 'cat-investing', 'gold', '배당 월급', "'배당' 태그를 붙인 기록을 12번 남겨 보세요.",
    tagCount('배당', 12)),
  define('ach-invest-011', 'cat-investing', 'silver', '노후 준비', "연금저축이나 IRP에 넣은 돈에 '연금' 태그를 붙여 기록해 보세요.",
    tag('연금')),

  // ── 저축 (원) ──────────────────────────────────────────────────────────────
  define('ach-saving-001', 'cat-saving', 'bronze', '첫 저축', '첫 저축을 기록해 보세요.',
    action()),
  define('ach-saving-003', 'cat-saving', 'silver', '저축 100만 원', '저축한 금액을 합쳐 100만 원을 모아 보세요.',
    total(1000000, '원')),
  define('ach-saving-004', 'cat-saving', 'gold', '저축 500만 원', '저축한 금액을 합쳐 500만 원을 모아 보세요.',
    total(5000000, '원')),
  define('ach-saving-002', 'cat-saving', 'platinum', '종잣돈 천만 원', '저축한 금액을 합쳐 1,000만 원을 모아 보세요. 만 원 단위로 기록해도 돼요.',
    total(10000000, '원')),
  define('ach-saving-005', 'cat-saving', 'diamond', '저축 5천만 원', '저축한 금액을 합쳐 5,000만 원을 모아 보세요.',
    total(50000000, '원')),
  define('ach-saving-011', 'cat-saving', 'gold', '한 번에 100만 원', '한 번에 100만 원 이상 저축해 보세요.',
    single(1000000, '원')),
  define('ach-saving-006', 'cat-saving', 'gold', '12개월 적금', '12개월 연속으로 매달 저축해 보세요.',
    months(12)),
  define('ach-saving-007', 'cat-saving', 'platinum', '3년 적금', '36개월 연속으로 매달 저축해 보세요.',
    months(36)),
  define('ach-saving-008', 'cat-saving', 'platinum', '52주 적금', '52주 연속으로 매주 저축해 보세요.',
    weeks(52)),
  define('ach-saving-009', 'cat-saving', 'silver', '비상금 통장', "비상금을 따로 모으고 '비상금' 태그를 붙여 보세요.",
    tag('비상금')),
  define('ach-saving-010', 'cat-saving', 'silver', '짠테크', "아껴서 모은 돈에 '짠테크' 태그를 붙여 10번 기록해 보세요.",
    tagCount('짠테크', 10)),

  // ── 가계부 ────────────────────────────────────────────────────────────────
  define('ach-budget-001', 'cat-budgeting', 'bronze', '가계부 첫 줄', '첫 지출을 가계부에 기록해 보세요.',
    action()),
  define('ach-budget-002', 'cat-budgeting', 'silver', '가계부 일주일', '7일 연속으로 가계부를 써 보세요.',
    streak(7)),
  define('ach-budget-003', 'cat-budgeting', 'gold', '가계부 한 달', '30일 연속으로 가계부를 써 보세요.',
    streak(30)),
  define('ach-budget-004', 'cat-budgeting', 'platinum', '가계부 100일', '100일 연속으로 가계부를 써 보세요.',
    streak(100)),
  define('ach-budget-005', 'cat-budgeting', 'platinum', '가계부 1년', '12개월 연속으로 매달 20일 이상 가계부를 써 보세요.',
    months(12, 20)),
  define('ach-budget-006', 'cat-budgeting', 'bronze', '무지출 데이', "돈을 한 푼도 쓰지 않은 날 '무지출' 태그를 붙여 기록해 보세요.",
    tag('무지출')),
  define('ach-budget-007', 'cat-budgeting', 'silver', '무지출 10일', "'무지출' 태그를 붙인 날을 10번 기록해 보세요.",
    tagCount('무지출', 10)),
  define('ach-budget-008', 'cat-budgeting', 'gold', '무지출 50일', "'무지출' 태그를 붙인 날을 50번 기록해 보세요.",
    tagCount('무지출', 50)),
  define('ach-budget-010', 'cat-budgeting', 'gold', '월말 결산', "한 달 지출을 정리하고 '결산' 태그를 붙여 12번 기록해 보세요.",
    tagCount('결산', 12)),
  define('ach-budget-009', 'cat-budgeting', 'gold', '예산 지키기', "한 달 예산을 지킨 달에 '예산성공' 태그를 붙여 3번 기록해 보세요.",
    tagCount('예산성공', 3)),
]
