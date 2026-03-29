# 업적 시스템 논리 구조 검토

> 기준 날짜: 2026-03-29
> 대상 코드베이스: `/home/user/cautious-palm-tree`

---

## 1. 개요

업적 라이브러리는 개인 활동 기록에 기반하여 업적을 자동으로 평가·해제하는 시스템입니다.
핵심 파일 구조는 다음과 같습니다.

| 파일 | 역할 |
|------|------|
| `src/utils/achievementEvaluator.js` | 조건 평가 엔진 (잠금 해제 로직) |
| `src/utils/formatters.js` | 진행 상태 표시 텍스트 생성 |
| `src/data/achievements.js` | 업적 정의 데이터 (40개+) |
| `src/data/records.js` | 활동 기록 샘플 데이터 |
| `src/components/AchievementCard.jsx` | 카드 UI (태그 세트 체크리스트 포함) |
| `src/components/AchievementListItem.jsx` | 목록 아이템 UI |
| `src/components/ProgressBar.jsx` | 진행 막대 컴포넌트 |

---

## 2. 조건 유형 및 평가 로직

모든 조건은 `evaluateCondition(condition, records, newRecord)` 함수(`achievementEvaluator.js` 13번째 줄)에서 처리됩니다.
`records`는 방금 저장된 기록을 포함하며, 먼저 해당 카테고리의 기록만 필터링합니다.

### 2-1. 기본 조건 유형

| 조건 타입 | 평가 기준 | 진행 값 계산 |
|-----------|-----------|--------------|
| `action` | 카테고리 내 기록 ≥ 1개 | 1 (달성) 또는 0 |
| `count` | 카테고리 기록 수 ≥ `target` | `categoryRecords.length` |
| `cumulative` | 기록 값의 합계 ≥ `target` | 누적 합계 |
| `single` | 신규 기록의 값 ≥ `target` | 카테고리 내 최댓값 |
| `streak` | 오늘부터 역산하여 연속된 날짜 수 ≥ `target` | 연속 일수 |
| `tag_match` | 카테고리 기록 중 하나라도 지정 태그를 포함 | 1 또는 0 |
| `tag_count` | 지정 태그가 포함된 기록 수 ≥ `target` | 태그 포함 기록 수 |
| **`tag_set_complete`** | **지정 태그 목록 전체가 기록에 등장** | **일치한 태그 수** |
| `composite` | 하위 조건들을 `AND` 또는 `OR`로 결합 | 첫 번째 하위 조건의 target 기준 |

### 2-2. 메타 조건 유형

메타 업적은 다른 업적의 달성 여부에 의해 해제됩니다.
`evaluateMetaAchievements(allAchievements)` 함수(`achievementEvaluator.js` 120번째 줄)에서 처리됩니다.

| 조건 타입 | 평가 기준 |
|-----------|-----------|
| `meta_count` | 특정 카테고리의 비-메타 업적 달성 수 ≥ `target` |
| `meta_list` | 지정된 업적 ID 목록 전체가 달성 상태 |
| `meta_clear` | 특정 카테고리의 모든 비-메타 업적 달성 |

---

## 3. 태그 세트 완성 조건 (`tag_set_complete`) 상세 분석

### 3-1. 평가 방식

```js
// achievementEvaluator.js, 79번째 줄
case 'tag_set_complete': {
  const seen = new Set(categoryRecords.flatMap(r => r.tags || []))
  const matched = condition.tags.filter(t => seen.has(t)).length
  return matched >= condition.tags.length
}
```

1. 해당 카테고리의 모든 기록에서 사용된 태그를 `Set`으로 수집합니다.
2. 조건의 `tags` 배열 중 `Set`에 존재하는 태그 수를 셉니다.
3. 일치 수 = 전체 태그 수이면 달성으로 판정합니다.

> **중요**: 기록 하나에 여러 태그가 있어도 상관없습니다. 각 태그가 **어느 기록에서든 최소 1번** 등장하면 충족됩니다.

### 3-2. 진행 값 계산

```js
// achievementEvaluator.js, 196번째 줄
case 'tag_set_complete': {
  const seen = new Set(categoryRecords.flatMap(r => r.tags || []))
  return condition.tags.filter(t => seen.has(t)).length
}
```

진행 값 = 지금까지 등장한 태그 수 (0 ~ `condition.tags.length`)

### 3-3. 현재 적용 업적: `ach-travel-003` "한강의 기적"

```js
{
  id: 'ach-travel-003',
  title: '한강의 기적',
  description: '한강의 21개 다리를 모두 도보로 건넜습니다.',
  categoryId: 'cat-domestic',
  tier: 'platinum',
  condition: {
    type: 'tag_set_complete',
    tags: [
      '일산대교', '마곡대교', '가양대교', '성산대교', '양화대교',
      '당산철교', '서강대교', '마포대교', '원효대교', '한강대교',
      '동작대교', '반포대교', '한남대교', '동호대교', '성수대교',
      '청담대교', '잠실대교', '올림픽대교', '천호대교', '광진교', '암사대교',
    ],
    target: 21,
  },
  rarity: 1.2,
  progress: 0,
}
```

- 'cat-domestic' 카테고리에 기록할 때마다 태그를 평가합니다.
- 21개 다리 이름 태그를 모두 기록에 사용하면 달성됩니다.
- 현재 진행 상황: 0 / 21

---

## 4. 진행 표시기 구현

### 4-1. 진행 막대 (`ProgressBar` 컴포넌트)

**파일**: `src/components/ProgressBar.jsx`

- `current / target` 비율로 너비를 계산합니다.
- 티어별 색상을 사용합니다 (브론즈 → 레전더리).
- `AchievementCard` 및 `AchievementListItem`에서 모두 사용됩니다.

### 4-2. 진행 텍스트 (`conditionSummaryText`)

**파일**: `src/utils/formatters.js`, 57번째 줄

각 조건 타입별로 사람이 읽을 수 있는 텍스트를 반환합니다:

| 조건 타입 | 출력 예시 |
|-----------|-----------|
| `action` | `기록 1개 이상 달성` |
| `count` | `기록 10회 달성` |
| `cumulative` | `100 km 누적 달성` |
| `single` | `단일 기록 ≥ 21 km` |
| `streak` | `7일 연속 달성` |
| `tag_match` | `태그 "야외" 기록 1개 이상` |
| `tag_count` | `태그 "논픽션" 기록 3회 달성` |
| `tag_set_complete` | `0 / 21 완료` |
| `meta_count` | `카테고리 내 업적 5개 획득` |
| `meta_list` | `특정 업적 3개 획득` |
| `meta_clear` | `카테고리 내 모든 업적 달성` |

### 4-3. 목표값 추출 (`getConditionTarget`)

**파일**: `src/utils/formatters.js`, 131번째 줄

```js
export function getConditionTarget(condition) {
  if (!condition) return 1
  if (condition.target) return condition.target
  if (condition.conditions?.[0]?.target) return condition.conditions[0].target
  if (condition.type === 'action') return 1
  return 1
}
```

### 4-4. `AchievementCard`에서의 태그 세트 진행 표시

**파일**: `src/components/AchievementCard.jsx`

태그 세트 업적은 두 가지 상태로 표시됩니다:

**접힌 상태** (checklistOpen = false):
- 진행 텍스트: `conditionSummaryText` 또는 `progressFormat` 템플릿
- 진행 막대: `current / total` 비율

**펼친 상태** (checklistOpen = true, 카드 클릭 시 토글):
- 헤더: `{total}개 항목 달성 현황`
- 진행 막대 (티어 색상 적용)
- 진행 텍스트: `{current}개 완료 · {total - current}개 남음`
- 3열 체크리스트 그리드:
  - 완료 항목: 녹색 체크 배경 + 완료 날짜 (소형)
  - 미완료 항목: 빈 테두리 박스
- 9개 초과 시 "더 보기" 버튼 표시

---

## 5. 업적 평가 흐름

```
새 기록 저장
    │
    ▼
evaluateAchievements(newRecord, allRecords, allAchievements)
    │  - 동일 카테고리, 미달성, 비-메타 업적 필터링
    │  - 각 업적의 condition을 evaluateCondition()으로 평가
    │
    ▼
신규 달성 업적 ID 목록 반환
    │
    ▼
evaluateMetaAchievements(allAchievements)
    │  - 미달성 메타 업적 필터링
    │  - meta_count / meta_list / meta_clear 평가
    │
    ▼
신규 달성 메타 업적 ID 목록 반환
    │
    ▼
Toast 알림 표시 (티어별 메시지)
```

---

## 6. 업적 티어 시스템

| 티어 | 한국어 | 색상 | 특수 효과 |
|------|--------|------|-----------|
| `bronze` | 브론즈 | `#cd7f32` | 없음 |
| `silver` | 실버 | `#9ca3af` | 없음 |
| `gold` | 골드 | `#f59e0b` | 발광 애니메이션 |
| `platinum` | 플래티넘 | `#6366f1` | 시머 그라데이션 |
| `diamond` | 다이아몬드 | `#06b6d4` | 발광 애니메이션 |
| `legendary` | 레전더리 | `#7F77DD` | 강한 발광 그림자 |

희귀도(rarity) < 5%인 달성 업적에는 "희귀" 배지가 표시됩니다.

---

## 7. 번역이 필요한 영문 항목 목록

검토 결과 발견된 영문 항목들입니다.

### 7-1. UI 컴포넌트

| 파일 | 위치 | 영문 | 한국어 |
|------|------|------|--------|
| `src/components/AchievementCard.jsx` | 85번째 줄 | `Rare` | `희귀` |
| `src/components/AchievementListItem.jsx` | 46번째 줄 | `Rare` | `희귀` |
| `src/components/AchievementListItem.jsx` | 81번째 줄 | `Earned {date}` | `획득: {date}` |
| `src/components/CategoryTree.jsx` | 29번째 줄 | `Cannot move a node into itself or its descendants` | `자기 자신 또는 하위 항목으로 이동할 수 없습니다` |

### 7-2. 포맷터

| 파일 | 위치 | 영문 | 한국어 |
|------|------|------|--------|
| `src/utils/formatters.js` | 85번째 줄 | `다리 완주` (특정 업적 전용) | `완료` (범용) |

### 7-3. 업적 데이터 (`src/data/achievements.js`)

| 업적 ID | 필드 | 영문 | 한국어 |
|---------|------|------|--------|
| `ach-run-008` | `condition.tag` | `'outdoor'` | `'야외'` |
| `ach-bench-005` | `condition.tag` | `'PR'` | `'개인신기록'` |
| `ach-books-002` | `condition.unit` | `'pages'` | `'페이지'` |
| `ach-books-003` | `condition.tag` | `'non-fiction'` | `'논픽션'` |
| `ach-med-004` | `condition.tag` | `'deep'` | `'깊은'` |
| `ach-journal-002` | `condition.tag` | `'reflection'` | `'성찰'` |
| `ach-write-002` | `condition.unit` | `'words'` | `'단어'` |

### 7-4. 기록 데이터 (`src/data/records.js`)

**태그** (업적 조건 태그와 일치 필요):

| 영문 태그 | 한국어 태그 | 해당 기록 |
|-----------|-------------|-----------|
| `outdoor` | `야외` | rec-001,002,003,004,005,006,007,024 |
| `PR` | `개인신기록` | rec-003,008,012 |
| `non-fiction` | `논픽션` | rec-018,019 |
| `deep` | `깊은` | rec-016 |
| `reflection` | `성찰` | rec-022,023 |
| `morning` | `아침` | rec-001,005,014,015,016 |
| `easy` | `가벼운` | rec-002 |
| `long-run` | `장거리` | rec-003,006 |
| `heavy` | `고중량` | rec-008,009,010,012,013 |
| `warmup` | `워밍업` | rec-011 |
| `fiction` | `소설` | rec-017 |
| `fantasy` | `판타지` | rec-017 |
| `weekly-review` | `주간리뷰` | rec-022 |
| `guided` | `가이드` | rec-014 |
| `road` | `도로` | rec-024 |
| `asia` | `아시아` | rec-025 |
| `solo` | `혼자` | rec-025 |
| `grammar` | `문법` | rec-020 |

> ※ `anki`는 앱 고유명사로 번역하지 않습니다.

**단위:**

| 영문 | 한국어 | 해당 기록 |
|------|--------|-----------|
| `pages` | `페이지` | rec-017,018,019 |

**메모 (영문 → 한국어):**

| 기록 ID | 영문 | 한국어 |
|---------|------|--------|
| rec-001 | `Morning run in the park. Felt great.` | `공원에서 아침 달리기. 기분이 좋았다.` |
| rec-002 | `Easy recovery run.` | `가벼운 회복 달리기.` |
| rec-003 | `Long run Sunday. New monthly best!` | `일요일 장거리 달리기. 이번 달 최고 기록!` |
| rec-005 | `Foggy morning. Loved it.` | `안개 낀 아침. 좋았다.` |
| rec-006 | `Valentine's day run. Solo achievement.` | `발렌타인데이 달리기. 혼자 해낸 것.` |
| rec-008 | `Finally hit the century mark!` | `드디어 100kg 돌파!` |
| rec-009 | `So close to 100.` | `100에 거의 다 왔다.` |
| rec-011 | `Solid session.` | `탄탄한 세션이었다.` |
| rec-012 | `Depth was good today.` | `오늘은 깊이가 좋았다.` |
| rec-014 | `Morning session before work.` | `출근 전 아침 세션.` |
| rec-016 | `Extended session. Very calm.` | `연장 세션. 매우 고요했다.` |
| rec-017 | `Started "The Name of the Wind".` | `「바람의 이름」을 시작했다.` |
| rec-020 | `Anki reviews + grammar.` | `Anki 복습 + 문법.` |
| rec-022 | `Weekly review — good progress on goals.` | `주간 리뷰 — 목표 진행 상황이 좋다.` |
| rec-025 | `Trip to Tokyo — incredible experience.` | `도쿄 여행 — 믿을 수 없는 경험.` |

### 7-5. 상단 탭 아이콘

| 탭 | 기존 (이모지) | 교체 (SVG 컴포넌트) |
|----|--------------|---------------------|
| 대시보드 | `🗂️` | `LayoutIcon` (신규 추가) |
| 기록 허브 | `📋` | `ClipboardIcon` |
| 업적 | `⚙️` | `SettingsIcon` |
| 쇼케이스 | `🏆` | `TrophyIcon` |
| 로고 | `🏆` | `TrophyIcon` |

---

## 8. 논리 구조 평가 의견

### 잘 설계된 부분

- **조건 평가 엔진**: `evaluateCondition` 함수가 모든 조건 타입을 단일 `switch`문으로 처리하며 확장성이 뛰어납니다.
- **메타 업적 분리**: 일반 업적과 메타 업적을 별도 평가 함수로 분리하여 순환 참조를 방지합니다.
- **`tag_set_complete` 구현**: `Set`을 활용해 O(n) 시간복잡도로 효율적으로 처리합니다.
- **진행 표시기**: `computeProgress`가 각 조건 타입에 맞게 의미 있는 진행 값을 계산합니다.

### 개선 고려 사항

1. **`tag_set_complete`의 `target` 필드 중복**: `condition.target`이 `condition.tags.length`와 항상 동일해야 하는데, 별도로 정의되어 있어 불일치 위험이 있습니다. 평가 로직은 `condition.tags.length`만 사용하므로 `target` 필드는 불필요합니다.

2. **`conditionSummaryText`의 `tag_set_complete` 텍스트**: 원래 "다리 완주"로 하드코딩되어 있어 다른 태그 세트 업적에 사용할 수 없습니다. "완료"로 범용화가 필요합니다.

3. **`streak` 조건의 날짜 기준**: 항상 "오늘"부터 역산하므로, 기록 저장 직후가 아닌 나중에 평가하면 연속 일수가 달라질 수 있습니다. 기록 생성 시점에 즉시 평가하는 현재 구조가 적절합니다.

4. **영문 태그와 한국어 UI의 불일치**: 조건 태그(`outdoor`, `PR` 등)가 영문으로 되어 있어 `conditionSummaryText`에서 그대로 출력되면 한국어 UI와 어색하게 혼용됩니다. 태그를 한국어로 통일해야 합니다.
