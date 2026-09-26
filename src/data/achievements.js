// Canonical achievement catalog.
//
// Definitions are versioned in GitHub. Runtime earned/progress state starts clean
// because the record baseline is intentionally empty.
export const achievements = [
  {
    "id": "ach-run-001",
    "title": "첫 걸음",
    "description": "첫 번째 러닝 세션을 기록하세요.",
    "categoryId": "cat-running",
    "tier": "bronze",
    "type": "one-time",
    "condition": {
      "type": "action"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-run-002",
    "title": "도로의 전사",
    "description": "총 10회 달리기를 완료하세요.",
    "categoryId": "cat-running",
    "tier": "silver",
    "type": "one-time",
    "condition": {
      "type": "count",
      "target": 10
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-run-003",
    "title": "마라톤 도전자",
    "description": "러닝 누적 거리 100km를 달성하세요.",
    "categoryId": "cat-running",
    "tier": "gold",
    "type": "one-time",
    "condition": {
      "type": "cumulative",
      "target": 100,
      "unit": "km"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-run-004",
    "title": "하프마라톤 거리",
    "description": "단일 러닝 세션에서 하프마라톤 거리(21.1km) 이상을 기록하세요.",
    "categoryId": "cat-running",
    "tier": "platinum",
    "type": "one-time",
    "condition": {
      "type": "single",
      "target": 21.1,
      "unit": "km"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-run-005",
    "title": "연속 달리기",
    "description": "7일 연속으로 달리기를 완료하세요.",
    "categoryId": "cat-running",
    "tier": "silver",
    "type": "one-time",
    "condition": {
      "type": "streak",
      "target": 7
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-run-006",
    "title": "철의 다리",
    "description": "30일 연속 달리기와 누적 200km를 동시에 달성하세요.",
    "categoryId": "cat-running",
    "tier": "diamond",
    "type": "one-time",
    "condition": {
      "type": "composite",
      "operator": "AND",
      "conditions": [
        {
          "type": "streak",
          "target": 30
        },
        {
          "type": "cumulative",
          "target": 200,
          "unit": "km"
        }
      ]
    },
    "rarity": null,
    "isHidden": true,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-run-007",
    "title": "미지의 거리",
    "description": "가장 헌신적인 러너들을 위한 비밀 업적.",
    "categoryId": "cat-running",
    "tier": "legendary",
    "type": "one-time",
    "condition": {
      "type": "cumulative",
      "target": 1000,
      "unit": "km"
    },
    "rarity": null,
    "isHidden": true,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-run-008",
    "title": "야외 러너",
    "description": "야외로 태그된 러닝 세션을 5회 기록하세요.",
    "categoryId": "cat-running",
    "tier": "silver",
    "type": "one-time",
    "condition": {
      "type": "tag_count",
      "tag": "야외",
      "target": 5
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-bench-001",
    "title": "첫 벤치 프레스",
    "description": "첫 번째 벤치 프레스 세션을 기록하세요.",
    "categoryId": "cat-bench-press",
    "tier": "bronze",
    "type": "one-time",
    "condition": {
      "type": "action"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-bench-002",
    "title": "플레이트 클럽",
    "description": "단일 세션에서 벤치 프레스 100kg을 달성하세요.",
    "categoryId": "cat-bench-press",
    "tier": "gold",
    "type": "one-time",
    "condition": {
      "type": "single",
      "target": 100,
      "unit": "kg"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-bench-003",
    "title": "120kg 클럽",
    "description": "단일 세션에서 벤치 프레스 120kg을 달성하세요.",
    "categoryId": "cat-bench-press",
    "tier": "platinum",
    "type": "one-time",
    "condition": {
      "type": "single",
      "target": 120,
      "unit": "kg"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-bench-004",
    "title": "꾸준한 벤치 프레서",
    "description": "벤치 프레스 세션을 총 20회 기록하세요.",
    "categoryId": "cat-bench-press",
    "tier": "silver",
    "type": "one-time",
    "condition": {
      "type": "count",
      "target": 20
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-bench-005",
    "title": "첫 개인 신기록",
    "description": "개인신기록으로 태그된 벤치 프레스 세션을 한 번 이상 기록하세요.",
    "categoryId": "cat-bench-press",
    "tier": "silver",
    "type": "one-time",
    "condition": {
      "type": "tag_match",
      "tag": "개인신기록"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-squat-001",
    "title": "스쿼트 입문",
    "description": "첫 번째 스쿼트 세션을 기록하세요.",
    "categoryId": "cat-squat",
    "tier": "bronze",
    "type": "one-time",
    "condition": {
      "type": "action"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-squat-002",
    "title": "더블 플레이트",
    "description": "단일 세션에서 스쿼트 140kg을 달성하세요.",
    "categoryId": "cat-squat",
    "tier": "gold",
    "type": "one-time",
    "condition": {
      "type": "single",
      "target": 140,
      "unit": "kg"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-books-001",
    "title": "독서 입문",
    "description": "첫 번째 독서 세션을 기록하세요.",
    "categoryId": "cat-books",
    "tier": "bronze",
    "type": "one-time",
    "condition": {
      "type": "action"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-books-002",
    "title": "독서광",
    "description": "총 1,000페이지를 읽으세요.",
    "categoryId": "cat-books",
    "tier": "silver",
    "type": "one-time",
    "condition": {
      "type": "cumulative",
      "target": 1000,
      "unit": "페이지"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-books-003",
    "title": "논픽션 마니아",
    "description": "논픽션으로 태그된 독서 세션을 3회 기록하세요.",
    "categoryId": "cat-books",
    "tier": "silver",
    "type": "one-time",
    "condition": {
      "type": "tag_count",
      "tag": "논픽션",
      "target": 3
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-jp-001",
    "title": "하지메마시테",
    "description": "첫 번째 일본어 공부 세션을 기록하세요.",
    "categoryId": "cat-japanese",
    "tier": "bronze",
    "type": "one-time",
    "condition": {
      "type": "action"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-jp-002",
    "title": "30일 몰입",
    "description": "30일 연속으로 일본어를 공부하세요.",
    "categoryId": "cat-japanese",
    "tier": "platinum",
    "type": "one-time",
    "condition": {
      "type": "streak",
      "target": 30
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-jp-003",
    "title": "일본어 50세션",
    "description": "일본어 공부 세션을 50회 기록하세요.",
    "categoryId": "cat-japanese",
    "tier": "silver",
    "type": "one-time",
    "condition": {
      "type": "count",
      "target": 50
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-med-001",
    "title": "고요한 마음",
    "description": "첫 번째 명상 세션을 기록하세요.",
    "categoryId": "cat-meditation",
    "tier": "bronze",
    "type": "one-time",
    "condition": {
      "type": "action"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-med-002",
    "title": "내면의 평화",
    "description": "21일 연속으로 명상을 실천하세요.",
    "categoryId": "cat-meditation",
    "tier": "gold",
    "type": "one-time",
    "condition": {
      "type": "streak",
      "target": 21
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-med-003",
    "title": "초월",
    "description": "100일 연속으로 명상을 실천하세요.",
    "categoryId": "cat-meditation",
    "tier": "diamond",
    "type": "one-time",
    "condition": {
      "type": "streak",
      "target": 100
    },
    "rarity": null,
    "isHidden": true,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-med-004",
    "title": "깊은 명상 경험",
    "description": "깊은 집중으로 태그된 명상 세션을 한 번 이상 기록하세요.",
    "categoryId": "cat-meditation",
    "tier": "silver",
    "type": "one-time",
    "condition": {
      "type": "tag_match",
      "tag": "깊은"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-journal-001",
    "title": "친애하는 일기",
    "description": "첫 번째 일기를 작성하세요.",
    "categoryId": "cat-journaling",
    "tier": "bronze",
    "type": "one-time",
    "condition": {
      "type": "action"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-journal-002",
    "title": "성찰 습관",
    "description": "성찰로 태그된 일기 항목을 10개 기록하세요.",
    "categoryId": "cat-journaling",
    "tier": "silver",
    "type": "one-time",
    "condition": {
      "type": "tag_count",
      "tag": "성찰",
      "target": 10
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-travel-001",
    "title": "여권 도장",
    "description": "첫 번째 해외여행을 기록하세요.",
    "categoryId": "cat-international",
    "tier": "gold",
    "type": "one-time",
    "condition": {
      "type": "action"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-travel-002",
    "title": "세계 여행자",
    "description": "해외여행을 5회 기록하세요.",
    "categoryId": "cat-international",
    "tier": "platinum",
    "type": "one-time",
    "condition": {
      "type": "count",
      "target": 5
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-travel-003",
    "title": "한강의 기적",
    "description": "지정한 한강 교량 21곳을 각각 기록하세요.",
    "categoryId": "cat-domestic",
    "tier": "platinum",
    "type": "one-time",
    "condition": {
      "type": "tag_set_complete",
      "tags": [
        "일산대교",
        "마곡대교",
        "가양대교",
        "성산대교",
        "양화대교",
        "당산철교",
        "서강대교",
        "마포대교",
        "원효대교",
        "한강대교",
        "동작대교",
        "반포대교",
        "한남대교",
        "동호대교",
        "성수대교",
        "청담대교",
        "잠실대교",
        "올림픽대교",
        "천호대교",
        "광진교",
        "암사대교"
      ]
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-write-001",
    "title": "첫 번째 초고",
    "description": "첫 번째 글쓰기 세션을 기록하세요.",
    "categoryId": "cat-writing",
    "tier": "bronze",
    "type": "one-time",
    "condition": {
      "type": "action"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-write-002",
    "title": "나노라이모 정신",
    "description": "총 50,000 단어를 작성하세요.",
    "categoryId": "cat-writing",
    "tier": "gold",
    "type": "one-time",
    "condition": {
      "type": "cumulative",
      "target": 50000,
      "unit": "단어"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-hydration-001",
    "title": "3L 달성",
    "description": "하루 수분 섭취량 3L 이상을 한 번 기록하세요.",
    "categoryId": "cat-hydration",
    "tier": "bronze",
    "type": "one-time",
    "condition": {
      "type": "single",
      "target": 3,
      "unit": "L"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-cycling-001",
    "title": "첫 페달",
    "description": "첫 번째 사이클링 세션을 기록하세요.",
    "categoryId": "cat-cycling",
    "tier": "bronze",
    "type": "one-time",
    "condition": {
      "type": "action"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-cycling-002",
    "title": "100km 라이더",
    "description": "단일 세션에서 100km를 사이클링하세요.",
    "categoryId": "cat-cycling",
    "tier": "diamond",
    "type": "one-time",
    "condition": {
      "type": "single",
      "target": 100,
      "unit": "km"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-career-001",
    "title": "레벨 업",
    "description": "커리어 이정표를 기록하세요.",
    "categoryId": "cat-career",
    "tier": "gold",
    "type": "one-time",
    "condition": {
      "type": "action"
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-meta-001",
    "title": "피트니스 입문 완성",
    "description": "러닝 2개와 벤치 프레스·스쿼트·사이클링 입문 업적을 모두 획득하세요.",
    "categoryId": "cat-fitness",
    "tier": "gold",
    "type": "meta",
    "condition": {
      "type": "meta_list",
      "achievementIds": [
        "ach-run-001",
        "ach-run-002",
        "ach-bench-001",
        "ach-squat-001",
        "ach-cycling-001"
      ]
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-meta-002",
    "title": "트리플 위협",
    "description": "\"도로의 전사\", \"마라톤 도전자\", \"연속 달리기\" 업적을 모두 획득하세요.",
    "categoryId": "cat-running",
    "tier": "platinum",
    "type": "meta",
    "condition": {
      "type": "meta_list",
      "achievementIds": [
        "ach-run-002",
        "ach-run-003",
        "ach-run-005"
      ]
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  },
  {
    "id": "ach-meta-003",
    "title": "마음 챙김 마스터",
    "description": "현재 정의된 명상 업적 4개를 모두 달성하세요.",
    "categoryId": "cat-meditation",
    "tier": "diamond",
    "type": "meta",
    "condition": {
      "type": "meta_list",
      "achievementIds": [
        "ach-med-001",
        "ach-med-002",
        "ach-med-003",
        "ach-med-004"
      ]
    },
    "rarity": null,
    "isHidden": false,
    "isEarned": false,
    "earnedAt": null,
    "progress": 0
  }
]
