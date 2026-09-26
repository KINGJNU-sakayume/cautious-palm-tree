# 업적 라이브러리

꾸준히 하고 싶은 일을 기록하면, 조건을 채운 업적이 저절로 쌓이는 개인 기록장입니다.
달리기·독서·저축처럼 카테고리별로 기록을 남기고, 진열장에서 모은 업적을 둘러볼 수 있습니다.

- **홈** — 카테고리별 기록, 연속 기록, 다음 목표
- **기록** — 날짜별 기록과 업적 달성 기록, 달력, 검색
- **업적** — 업적 목록과 편집 (조건 빌더, 실시간 미리보기)
- **진열장** — 모은 업적, 대표 업적, 카테고리별 진행률

설치형 웹앱(PWA)이라 휴대폰 홈 화면에 추가해 쓸 수 있고, 시스템 설정에 따라 다크 모드로 바뀝니다.

## 시작하기

Node.js 18 이상이 필요합니다.

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173/cautious-palm-tree/)
npm test         # 업적 엔진·저장 형식 테스트 (Vitest)
npm run build    # 배포용 빌드 → dist/
```

`main` 브랜치에 푸시하면 GitHub Actions가 테스트와 빌드를 거쳐 GitHub Pages에 배포합니다
(`.github/workflows/deploy.yml`).

## 데이터는 어디에 저장되나요?

모든 데이터는 **이 브라우저의 localStorage에만** 저장됩니다. 서버나 계정은 없습니다.

- 브라우저 데이터를 지우거나 다른 기기에서 열면 기록이 보이지 않습니다.
  오른쪽 위 **설정 → 백업 파일 받기**로 JSON 백업을 받아 두고, 같은 화면에서 불러올 수 있습니다.
- 사진은 저장 전에 자동으로 줄여서(긴 변 1280px, JPEG) 저장 공간을 아낍니다.
  브라우저 저장 공간(보통 5MB 안팎)이 가득 차면 화면 위에 안내가 뜹니다.
- 여러 탭을 열어 두어도 변경 내용이 서로 맞춰집니다.
- 이전 버전(저장 형식 v1)의 데이터는 처음 열 때 자동으로 옮겨집니다. 자세한 내용은 아래 문서를 참고하세요.

## 업적은 어떻게 달성되나요?

업적의 달성 여부와 진행도는 저장하지 않고, 기록 전체를 바탕으로 매번 다시 계산합니다.
그래서 지난 날짜로 기록을 남기거나, 기록을 고치거나 지워도, 업적을 나중에 만들어도 결과가 항상 맞습니다.

- 업적의 카테고리에는 **하위 카테고리 기록까지** 포함됩니다. 카테고리가 없는 업적은 모든 기록을 셉니다.
- 조건 종류: 첫 기록, 횟수, 누적 합계, 한 번에 넘기기, 하루 합계, 연속 기록, 태그, 태그 모으기,
  여러 카테고리 합산(예: 3대 중량), 조건 묶기, 다른 업적 기반(메타), 직접 체크.
- 단위가 다른 기록은 환산할 수 있으면 자동으로 바꿔 더합니다(m→km, ml→L, 분→시간, 만원→원).
- 등급은 브론즈 · 실버 · 골드 · 플래티넘 · 다이아몬드 다섯 단계입니다.

규칙 전체와 기본 업적 목록의 변경 내역은 [docs/achievement-system.md](docs/achievement-system.md)에 정리되어 있습니다.

## 구조

```
src/
├── App.jsx                      # 상단 바, 모바일 탭 바, 라우트
├── context/
│   ├── AppContext.jsx           # 앱 상태(reducer), 저장, 업적 계산 결과, 달성 알림
│   ├── UIContext.jsx            # 어디서나 여는 시트: 기록하기, 업적 상세, 설정
│   └── ToastContext.jsx         # 알림(되돌리기 버튼 포함)
├── lib/
│   ├── appState.js              # 저장 형식 v2, 정규화, v1 → v2 마이그레이션, 백업 파일
│   └── localStore.js            # localStorage 읽기/쓰기
├── utils/
│   ├── achievementEvaluator.js  # 업적 계산 엔진
│   ├── achievementText.js       # 조건·진행도 문구
│   ├── units.js / dates.js      # 단위 환산, 날짜·연속 기록
│   └── suggestions.js           # 기록할 때 보여 줄 추천 태그·단위
├── data/                        # 기본 카테고리, 기본 업적 목록
├── pages/                       # 홈(Dashboard), 기록(RecordHub), 업적(AchievementManagement), 진열장(AchievementShowcase)
└── components/                  # 화면 조각 (Modal, Medal, AchievementCard, RecordEditorModal …)
```

화면 스타일은 Tailwind CSS와 `src/index.css`의 색상 토큰(라이트/다크)으로 관리합니다.
글꼴은 [Pretendard](https://github.com/orioncactus/pretendard)(SIL OFL 1.1)를 CDN으로 불러오고, 오프라인에서는 서비스 워커 캐시를 씁니다.
