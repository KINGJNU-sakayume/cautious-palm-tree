# cautious-palm-tree 코드·UI/UX·내부 설계 검토 및 정적 데이터 전환 보고서

- 대상 저장소: `KINGJNU-sakayume/cautious-palm-tree`
- 기준 브랜치: `main` (`c745da69355d5068b5da7852a435ae26a9c9bca2`)
- 검토일: 2026-09-26
- 구현 브랜치: `refactor/static-content-20260926`

## 1. Executive summary

이 저장소는 React 18 + React Router + Tailwind + Vite PWA 기반의 개인 업적 라이브러리입니다. 기존 구조는 `AppContext → db.js → Supabase`를 통해 카테고리·기록·업적을 읽고 쓰며, `src/data/*.js`는 DB 초기 시드 및 장애 시 fallback 역할을 했습니다.

이번 검토에서 가장 중요한 결론은 다음과 같습니다.

1. **Supabase를 제거하고 GitHub의 정적 데이터 파일을 source of truth로 두는 전환은 합리적입니다.** 현재 데이터는 개인용 단일 사용자 앱에 가까운데 비해 DB 계층이 코드 복잡도와 장애면을 크게 늘리고 있습니다.
2. **기존 25개 기록은 운영 DB 최신 덤프라고 증명할 수 없고, 주석과 내용상 seed/demo 성격이 강합니다.** 따라서 삭제 요구를 반영하되 복구 가능성을 위해 `records.archive.js`로 원문을 보존하고 활성 `records.js`는 비웠습니다.
3. **기존 39개 업적은 그대로 보존할 가치가 있으나, 일부 이름/조건/평가 로직이 불일치합니다.** 특히 `ach-meta-001`, repeatable 업적 모델, 일부 운동 업적 이름과 threshold 의미가 개선 대상입니다.
4. **보안상 즉시 조치가 필요합니다.** 공개 저장소에 `.env.local`이 커밋되어 있었고, README의 예시 RLS 정책은 익명 클라이언트에 모든 CRUD를 허용합니다. 키 값 자체는 보고서에 재기재하지 않습니다. DB를 폐기하더라도 Supabase 프로젝트의 기존 키/정책은 별도로 회수·점검해야 합니다.
5. **UI는 기능은 풍부하지만 정적 데이터 모델과 관리 UI가 충돌합니다.** 장기적으로 앱은 읽기/탐색/쇼케이스에 집중하고, 영구 수정은 GitHub PR 또는 데이터 파일 직접 수정으로 제한하는 것이 가장 일관됩니다.

---

## 2. 현재 코드베이스 요약

### 2.1 기술 구성

- React 18
- React Router 6
- Tailwind CSS 3
- Vite 6
- vite-plugin-pwa
- 기존 DB: Supabase/PostgreSQL
- 상태관리: React Context + `useReducer`
- 업적 평가: `src/utils/achievementEvaluator.js`

### 2.2 주요 파일 규모와 책임

| 파일 | 대략적 규모 | 주요 책임 | 문제점 |
|---|---:|---|---|
| `src/pages/AchievementManagement.jsx` | 27 KB | 업적 CRUD, 필터, 편집폼, 조건편집 | 페이지가 도메인 편집기 전체를 소유 |
| `src/components/CategoryTree.jsx` | 22 KB | 트리 렌더, 이동, 즐겨찾기, 삭제 | 트리 로직과 UI 이벤트가 강결합 |
| `src/pages/AchievementShowcase.jsx` | 20 KB | 통계, 핀, 카테고리 요약, 모달 | 프레젠테이션과 집계가 혼합 |
| `src/components/ConditionBuilder.jsx` | 16 KB | 조건 타입별 편집기 | 조건 스키마가 UI에 암묵적으로 분산 |
| `src/components/RecordEditor.jsx` | 16 KB | 기록 폼, 사진, 기본값, 저장/삭제 | 정적 데이터 모드와 기능 철학 충돌 |
| 기존 `src/context/AppContext.jsx` | 15 KB | DB bootstrap, CRUD, 평가, 상태 | 데이터 소스·도메인·UI 상태의 허브화 |

현재 구조는 “작동하는 프로토타입”으로는 충분하지만, 기능을 추가할수록 `AppContext`와 대형 페이지가 변경 충돌의 중심이 되는 형태입니다.

---

## 3. 이번에 실제 반영한 변경

구현 브랜치 `refactor/static-content-20260926`에 다음 변경을 반영했습니다.

### 3.1 Supabase 제거

삭제:

- `.env.local`
- `src/lib/supabase.js`
- `src/lib/db.js`
- `src/lib/seed.js`
- `sql.md`

정리:

- `package.json`에서 `@supabase/supabase-js` 제거
- `package-lock.json`의 Supabase 패키지 엔트리 제거
- `vite.config.js`의 `vendor-supabase` manual chunk 제거
- README를 정적 데이터 구조에 맞게 갱신

### 3.2 GitHub 정적 데이터가 source of truth

`AppContext`는 더 이상 네트워크 bootstrap을 하지 않고 다음 파일을 직접 초기 상태로 사용합니다.

- `src/data/categories.js`
- `src/data/achievements.js`
- `src/data/records.js`

DB 오류 상태 및 fallback 이중 경로를 제거하여 초기화 경로가 한 가지가 되었습니다.

### 3.3 기존 기록 처리

기존 `records.js`에는 25개의 기록이 존재했습니다. 이것들은 다음과 같은 특징 때문에 실제 최신 개인 데이터라고 확정할 수 없습니다.

- 파일 첫 줄부터 “25 records spread over the past ~3 months”라는 seed성 주석 존재
- 날짜가 2026-01~03에 집중
- 여러 카테고리를 고르게 채운 예시형 분포
- 업적 테스트를 위한 태그와 unlock ID가 인위적으로 배치

따라서 다음 방식으로 처리했습니다.

- 기존 25개 레코드: `src/data/records.archive.js`에 **원문 그대로 보존**
- 앱 활성 레코드: `src/data/records.js`를 빈 배열로 변경

즉, “기록은 지우기”를 앱 동작에는 반영하면서 Git 히스토리 외에도 명시적 복구 파일을 남겼습니다.

> 주의: GitHub 저장소만으로 Supabase 운영 DB의 현재 행 데이터를 읽을 수 없었으므로, 아카이브가 실제 DB 최신 데이터의 완전한 덤프라고 보장할 수 없습니다.

---

## 4. 보안 검토

### P0. 공개 `.env.local` 커밋

공개 저장소에 Supabase URL과 anon key가 커밋되어 있었습니다. Supabase anon key는 브라우저 앱에서 사용되는 공개 가능한 키라는 성격이 있지만, **RLS가 안전하게 제한되어 있다는 전제**가 필요합니다.

그런데 기존 README의 예시 정책은 categories / records / achievements 세 테이블에 사실상 전면 CRUD를 허용했습니다. `USING (true) WITH CHECK (true)` 형태이므로, 저장소의 endpoint/key를 아는 임의 클라이언트가 데이터를 수정할 수 있는 설계였습니다.

브랜치에서는 `.env.local`과 Supabase 코드 자체를 제거했습니다. 추가로 저장소 외부에서 다음 조치를 권장합니다.

1. 더 이상 사용하지 않는 Supabase 프로젝트라면 비활성화 또는 삭제
2. 계속 유지한다면 기존 anon key 회수/rotation 가능 여부 검토
3. 기존 allow-all RLS policy 삭제
4. 민감 데이터가 있었다면 access log와 변경 이력 점검

**중요:** Git에서 파일을 삭제해도 과거 커밋에는 값이 남습니다. DB를 계속 사용한다면 단순 파일 삭제만으로는 충분하지 않습니다.

---

## 5. 업적 데이터 검토

현재 업적은 총 **39개**입니다.

- 획득 상태: 21개
- 숨김: 3개
- 티어: bronze 10 / silver 9 / gold 9 / platinum 6 / diamond 4 / legendary 1

### 5.1 유지 권장

- 러닝의 count / cumulative / streak 단계형 업적
- 태그 기반 `tag_count`, `tag_match`
- 한강 다리와 같은 `tag_set_complete`
- 특정 업적 조합을 요구하는 `meta_list`
- 카테고리별 최초 행동 `action`

조건 DSL을 데이터 객체로 표현한 것은 좋은 방향입니다.

### 5.2 수정 권장

| ID | 현재 문제 | 권장 수정 |
|---|---|---|
| `ach-run-004` | 제목 “속도의 악마”인데 조건은 속도가 아니라 단일 거리 21km | 제목을 “하프 마라토너” 계열로 변경하거나 pace 조건 타입 추가 |
| `ach-bench-003` | “1.5배 클럽”이 고정 120kg 기준 | “120kg 클럽”으로 이름 변경 또는 bodyweight ratio 조건 신설 |
| `ach-squat-002` | “더블 플레이트”와 140kg의 의미 연결이 모호 | 명시적 “140kg 스쿼트”로 변경하거나 plate 정의를 데이터로 명시 |
| `ach-run-007` | 숨김 1000km 업적인데 진행도 67이 정적 수동값 | records를 제거한 정적 모드에서는 progress를 수동 상태로 명확히 정의 |
| `ach-meta-001` | `cat-fitness`의 직접 업적만 세는 evaluator와 “피트니스 카테고리 5개” 의미가 충돌 | descendant category까지 포함하는 `scope: 'subtree'` 지원 |
| `ach-meta-003` | “모든 업적” 정의가 repeatable까지 포함되는지 불명확 | meta_clear의 포함 정책을 schema에 명시 |
| `ach-travel-003` | `target: 21`과 `tags.length`가 중복 truth | `target` 삭제, 배열 길이를 단일 truth로 사용 |

### 5.3 repeatable 타입

현재 repeatable 업적은 `isEarned: boolean`, `earnedAt: date` 한 쌍만 가집니다.

- `ach-bench-005`
- `ach-med-004`
- `ach-hydration-001`

이 모델에서는 반복 달성 횟수와 히스토리를 표현할 수 없습니다.

권장 선택지:

1. repeatable을 제거하고 one-time milestone로 단순화
2. `completionCount`, `lastCompletedAt`, `completionHistory[]` 추가

개인 정적 업적 라이브러리 목적에는 1번이 더 단순합니다.

### 5.4 rarity 필드

대부분의 업적에 소수점 `rarity`가 설정되어 있으나 모집단이나 통계 데이터 소스가 없습니다.

권장:

- 실제 집단 통계가 없다면 `rarity` 삭제
- “희귀” 배지는 tier/난이도 기반으로 명칭 변경
- 또는 `difficultyWeight`로 재정의

### 5.5 추가 권장 업적

현재 카테고리는 33개인데 업적이 없는 leaf/category가 존재합니다.

- 활동형 leaf: 첫 기록 + 누적 10회
- 수치형 운동: 첫 기록 + 의미 있는 threshold 2~3단계
- 언어/학습: 누적 시간/세션/완료 milestone 중심
- 여행/프로젝트: tag-set/checklist 중심
- meta: 동일 루트에서 3/5/10개 획득

특히 `cat-deadlift`, 일부 학습/영양 하위 카테고리는 최소 업적 세트가 필요합니다.

---

## 6. 업적 평가 엔진 검토

### 6.1 잘된 점

- 조건 타입이 명시적 switch로 분리되어 추적이 쉬움
- `tag_set_complete`에서 Set 사용
- 일반 업적과 meta 업적 평가 분리
- `computeProgressFull`로 평가와 표시용 progress를 어느 정도 분리

### 6.2 P1. meta subtree 버그

`meta_count`는 현재 `a.categoryId === cond.categoryId`로 정확히 같은 category만 셉니다.

따라서 `cat-fitness` 아래의 러닝/벤치/스쿼트 업적을 피트니스 업적으로 묶고 싶어도 evaluator는 자식 카테고리를 포함하지 않습니다. `ach-meta-001`은 데이터상 이미 획득(progress 5)인데 evaluator 규칙으로 같은 결과를 재생산하지 못할 수 있습니다.

권장 스키마:

```js
{
  type: 'meta_count',
  categoryId: 'cat-fitness',
  scope: 'subtree',
  target: 5
}
```

### 6.3 P1. update/delete 시 업적 재계산 부재

기존 흐름은 `saveRecord`에서만 업적 unlock 및 progress 갱신을 수행합니다.

기록 수정/삭제/카테고리 이동에서는 도메인 상태가 역으로 재계산되지 않습니다.

권장:

- 모든 변경 후 `deriveAchievementState(records, definitions)`로 전체 파생 상태 재계산
- `isEarned/progress/earnedAt`를 가능한 한 records에서 파생
- 수동 업적만 별도 `manualState`

### 6.4 streak의 기준 시점

streak는 “오늘부터 역산”하므로 과거 기록 세트를 나중에 불러오면 당시의 연속 기록과 현재 계산값이 다를 수 있습니다.

권장:

- `asOfDate`를 evaluator에 전달
- historical streak achievement는 획득 이후 immutable
- 또는 progress와 earnedAt의 의미를 명확히 분리

### 6.5 schema validation 부재

정적 GitHub 데이터 체계에서는 validator가 DB constraint를 대체해야 합니다.

CI에서 다음을 검사해야 합니다.

- ID 중복
- 존재하지 않는 categoryId 참조
- 잘못된 tier/type/condition type
- target 음수/0
- meta_list의 없는 achievement ID
- earned인데 earnedAt null
- progress와 target의 비정상 관계

---

## 7. 코드 구조 개선안

### 7.1 권장 목표 구조

```text
src/
  app/
    App.jsx
    routes.jsx
    providers/
  domain/
    achievements/
      schema.js
      evaluator.js
      selectors.js
      tier.js
    records/
      schema.js
    categories/
      tree.js
  data/
    categories.js
    achievements.js
    records.js
    records.archive.js
  features/
    achievement-catalog/
    achievement-showcase/
    category-navigation/
    record-history/
  components/
    ui/
```

핵심은 **data / domain / feature / generic UI** 분리입니다.

### 7.2 AppContext 축소

- 정적 원본은 plain import
- 파생 통계는 selector 함수
- UI 전용 상태만 Context/local state
- pinned/favorites는 localStorage hook

### 7.3 대형 컴포넌트 분해

`AchievementManagement.jsx`:

- AchievementFilters
- AchievementList
- AchievementForm
- AchievementConditionEditor
- AchievementPreview

`CategoryTree.jsx`:

- tree model hook
- node renderer
- context menu/dialog
- DnD/reparent logic

### 7.4 타입 시스템

condition DSL이 복잡하므로 TypeScript 전환 효과가 큽니다. 최소한 Category / Record / Achievement / AchievementCondition / Tier / AchievementType을 discriminated union으로 정의하는 것을 권장합니다.

---

## 8. UI/UX 검토

### 8.1 정보 구조

정적 원본 앱에서는 “업적 관리”와 “기록 작성”이 영구 저장되지 않는다는 문제가 생깁니다.

권장 IA:

1. 대시보드
2. 업적 카탈로그
3. 쇼케이스
4. 기록 - 필요 시 읽기 전용

관리 기능은 앱에서 제거하고 GitHub 수정 워크플로로 이동하는 것이 좋습니다.

### 8.2 정적 모드의 편집 UX

현재 브랜치의 호환성 레이어에서는 기존 편집이 세션 메모리에서만 동작하고 새로고침 시 원복됩니다. 이는 임시 호환 상태이며 최종 UX로는 부적절합니다.

권장:

- 추가/수정/삭제 버튼 제거
- “GitHub에서 편집” 가이드 제공
- 개발자 모드에서만 편집 UI 노출

### 8.3 색 대비

`--color-text-secondary: #94a3b8`는 흰 배경에서 대비비가 약 **2.56:1**입니다. 일반 작은 텍스트의 WCAG AA 4.5:1에 미달합니다.

- 일반 secondary text: 최소 `#64748b` 수준(약 4.76:1)
- `#94a3b8`는 비활성 장식/아이콘 등에 제한

### 8.4 시각 시스템 중복

티어 정의가 Tailwind, CSS, 페이지 상수, formatter에 분산되어 있습니다.

```js
export const TIER_CONFIG = {
  bronze: { label: '브론즈', order: 0, ... },
  ...
}
```

형태로 단일화해야 합니다.

### 8.5 접근성

- reduced-motion 대응을 shimmer/gold/diamond glow까지 확대
- icon button의 aria-label 점검
- dialog focus trap/ESC 정책을 공통 primitive로 통합

### 8.6 시각 정제

- 기본 카드는 border 중심, shadow 최소화
- tier 색상은 배지/좌측 accent 정도로 제한
- glow는 상위 tier 획득 상태에서만
- 통계 카드는 수치 + 설명 1줄로 단순화
- 공통 section pattern 사용

---

## 9. 테스트·품질 체계

P1 필수:

1. evaluator unit test
2. content validation test
3. known record set → expected achievement state regression fixture
4. CI에서 `npm ci`, `npm run build`

P2:

- React Testing Library
- Playwright smoke test
- axe 접근성 검사

---

## 10. 우선순위별 실행 로드맵

### P0 - 즉시

- [x] `.env.local` 저장소에서 제거
- [x] Supabase runtime 제거
- [x] DB 관련 파일 제거
- [x] 기존 기록 아카이브 후 활성 기록 비우기
- [ ] Supabase 프로젝트/키/RLS 외부 회수 조치
- [ ] GitHub history의 credential 영향 평가

### P1 - 다음 구현

- [ ] 정적 content validator + CI
- [ ] `ach-meta-001` subtree semantics 수정
- [ ] repeatable 모델 제거 또는 정식 구현
- [ ] 기록 update/delete 후 achievement 재계산 정책 결정
- [ ] 정적 모드에서 편집 UI 제거/비활성화
- [ ] `rarity` 의미 재정의 또는 제거
- [ ] secondary text 대비 수정

### P2 - 구조 리팩터링

- [ ] domain/features/components 계층 분리
- [ ] 대형 컴포넌트 분해
- [ ] tier config 단일화
- [ ] TypeScript 또는 강한 런타임 schema 도입
- [ ] evaluator/selector 테스트 확충

### P3 - UX 정제

- [ ] 화면 수 축소 및 읽기 중심 IA
- [ ] 상위 tier 효과 절제
- [ ] empty state 개선
- [ ] keyboard/focus/reduced-motion 접근성 통합

---

## 11. 최종 판단

권장 목표는 **“GitHub가 canonical data source인 읽기 중심 개인 업적 라이브러리”**입니다.

- 업적: `src/data/achievements.js`
- 카테고리: `src/data/categories.js`
- 기록: 검증된 데이터만 `records.js`
- 과거 seed/demo 기록: `records.archive.js`
- 앱: 탐색/필터/쇼케이스/통계 중심
- 편집: Git commit/PR
- CI: content validator + build test

이 구조가 데이터 재현성, 변경 이력, 보안, 유지보수성 측면에서 현재 프로젝트 목적에 가장 잘 맞습니다.

---

## Appendix A. 이번 브랜치 변경 파일

- removed: `.env.local`
- modified: `README.md`
- modified: `package.json`
- modified: `package-lock.json`
- removed: `sql.md`
- modified: `src/context/AppContext.jsx`
- modified: `src/data/records.js`
- added: `src/data/records.archive.js`
- removed: `src/lib/db.js`
- removed: `src/lib/seed.js`
- removed: `src/lib/supabase.js`
- modified: `vite.config.js`

## Appendix B. 검증 한계

- GitHub connector를 통해 저장소 파일과 이력을 검토했습니다.
- Supabase 운영 DB에 직접 질의하지 못했습니다.
- 따라서 GitHub seed/archive 데이터와 실제 DB 최신 행이 동일하다고 검증하지 못했습니다.
- 로컬 네트워크 환경에서 GitHub clone 및 `npm ci` 실행이 불가능했으므로, 브랜치의 실제 빌드는 CI에서 추가 확인이 필요합니다.
