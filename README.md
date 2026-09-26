# 업적 라이브러리 (Achievement Library)

개인 업적을 GitHub 저장소의 정적 데이터로 관리하는 React PWA입니다.

## Tech Stack

- React 18
- React Router 6
- Tailwind CSS
- Vite 6 + vite-plugin-pwa
- 데이터 원본: GitHub 저장소의 `src/data/*.js`

## 데이터 관리 원칙

- `src/data/categories.js`: 카테고리 정의
- `src/data/achievements.js`: 업적 정의 및 현재 획득 상태
- `src/data/records.js`: 앱에서 사용하는 활성 기록
- `src/data/records.archive.js`: 2026-09-26 전환 시 보존한 기존 25개 기록의 비활성 아카이브

현재 활성 기록은 비워 두었습니다. 기존 기록은 감사/복구 목적의 아카이브에 그대로 보존되어 있으며 앱에서는 import하지 않습니다.

## 실행

```bash
npm install
npm run dev
```

## 정적 데이터 모드의 동작

앱은 시작할 때 `src/data`의 값을 직접 로드합니다. Supabase나 외부 DB는 사용하지 않습니다.

기존 관리 UI의 추가/수정/삭제 동작은 호환성을 위해 현재 세션 메모리에서는 동작하지만, 새로고침하면 저장소의 정적 데이터로 되돌아갑니다. 영구 변경은 `src/data` 파일을 수정하고 Git으로 커밋해야 합니다.

## Architecture

```
src/
├── context/AppContext.jsx
├── data/
│   ├── categories.js
│   ├── achievements.js
│   ├── records.js
│   └── records.archive.js
├── utils/
│   └── achievementEvaluator.js
├── pages/
└── components/
```

상세 구조·UI/UX·내부 설계 검토와 후속 개선안은 `docs/architecture-ui-ux-review-2026-09-26.md`를 참조하십시오.
