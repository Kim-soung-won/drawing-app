# Pub Diary — CLAUDE.md

손글씨 일기/에세이 앱. 태블릿 + S펜 환경을 타깃으로 하며, 손글씨 특유의 감성과 아날로그적 따뜻함을 디지털로 구현한다.

---

## 기술 스택

| 영역 | 선택 | 비고 |
|------|------|------|
| 프레임워크 | React Native + Expo SDK 55 | TypeScript |
| 드로잉 | @shopify/react-native-skia 2.4.18 | Skia 기반 고성능 2D |
| 제스처 | react-native-gesture-handler ~2.30 | Gesture.Pan / Gesture.Hover |
| 저장소 | expo-sqlite + expo-file-system | 클래스 기반 신규 API (`File`, `Directory`, `Paths`) |
| 상태 관리 | Zustand ^5.0 | canvasStore / diaryStore |
| 네비게이션 | Expo Router ~55.0 | 파일 기반 라우팅 |

---

## 프로젝트 구조

```
app/                          # Expo Router 화면
├── _layout.tsx               # 루트 레이아웃 (Stack Navigator)
├── index.tsx                 # Home — 글 목록 + FAB
├── write.tsx                 # Write — 캔버스 필기 화면
└── view/[id].tsx             # View — 글 열람 (동적 라우트)

src/
├── components/
│   ├── canvas/
│   │   ├── DrawingCanvas.tsx     # Skia 캔버스 + GestureDetector
│   │   ├── PageBackground.tsx    # 페이지 템플릿 배경 렌더링 (줄/모눈/점선)
│   │   └── Toolbar.tsx           # 필기 도구 툴바
│   ├── diary/
│   │   └── DiaryCard.tsx         # 글 목록 카드
│   └── ui/
│       ├── Toast.tsx             # 토스트 알림
│       └── TemplateSelectDialog.tsx  # 표지/페이지 양식 선택 Dialog
├── constants/
│   ├── canvas.ts             # CANVAS — 캔버스 크기, 펜/지우개 기본값
│   ├── colors.ts             # COLORS, PEN_COLORS — 서정적 컬러 팔레트
│   └── diary.ts              # COVER_COLORS, PAGE_TEMPLATES
├── repositories/
│   └── DiaryRepository.ts    # SQLite + FileSystem CRUD
├── stores/
│   ├── canvasStore.ts        # 멀티페이지 드로잉 상태, undo/redo
│   └── diaryStore.ts         # 일기 목록 CRUD 상태
└── types/
    └── diary.ts              # Point, Stroke, Page, PageTemplate, DrawingData, DiaryEntry

modules/
└── stylus-support/           # S펜 감지용 Expo 네이티브 모듈 (Kotlin)

docs/
├── APP_PLANNING.md           # 기획서
├── SOFTWARE_DESIGN.md        # 소프트웨어 설계서
└── alternatives/             # 기술 대안 비교 문서
```

---

## 데이터 모델

### DrawingData (JSON 파일로 저장)

```ts
{
  version: 1,
  canvas: { width: 1080, height: 1920, backgroundColor: string },
  coverColor: string,        // 표지/배경 색상 (HEX)
  pages: [                   // 멀티페이지
    {
      id: string,
      template: 'blank' | 'lined' | 'grid' | 'dotted',
      strokes: Stroke[],
      redoStack: Stroke[],   // 저장 시 항상 []
    }
  ]
}
```

**레거시 포맷 (구버전)**: `pages` 없이 최상위에 `strokes[]`만 있음. `loadFromDrawingData`가 자동 마이그레이션.

### SQLite — `diary` 테이블

```sql
id TEXT PRIMARY KEY, title TEXT,
created_at INTEGER, updated_at INTEGER,
drawing_path TEXT,  -- JSON 파일 경로 (expo-file-system URI)
thumbnail_path TEXT
```

### Stroke

```ts
{ id, points: Point[], color, width, tool: 'pen' | 'eraser' }
```

지우개 스트로크는 `color = coverColor` 로 덮어쓰는 방식 (별도 blend mode 없음).

---

## 핵심 설계 결정

### 캔버스 좌표계
- 논리 해상도: **1080 × 1920** (CANVAS.defaultWidth/Height)
- 렌더링 시 화면 너비에 맞게 비율 스케일링
- 모든 좌표/크기는 논리 픽셀 기준

### 필기 커브
- Quadratic Bezier (quadTo) 로 부드러운 곡선 렌더링
- 포인트 간 중간점을 control point로 사용

### S펜 처리
- `modules/stylus-support` 네이티브 모듈로 `hasStylusSupport()` 감지
- S펜 기기: `pointerType === 1` (stylus)만 필기 허용, 손가락(0) 차단
- 일반 기기: 모든 터치 허용
- `POINTER_TYPE_STYLUS = 1` (RNGH 기준)

### 멀티페이지
- `canvasStore`의 `pages[]` 배열 + `currentPageIndex`
- undo/redo는 페이지 단위 독립 (`Page.redoStack`)
- 페이지 이동: `‹ N/M ›` 네비게이션 바 (2페이지 이상일 때만 표시)

---

## 컬러 팔레트 (`src/constants/colors.ts`)

서정적·빈티지 톤. 새 UI 요소 추가 시 이 팔레트에서 선택.

- `COLORS.background` — 앱 전체 배경 `#FFF8F0`
- `COLORS.surface` — 헤더/툴바 배경 `#FFFDF9`
- `COLORS.primary` — 주요 액션 색상 (브라운) `#8B7355`
- `COLORS.accent` — 강조 (황갈색) `#D4A574`
- `COLORS.canvas` — 기본 캔버스 배경 `#FFFEF9`

---

## UI 확인 방법 (스크린샷)

**"화면을 보고", "화면 확인해줘", "어떻게 보여?", "UI 봐줘"** 등의 표현이 나오면 아래 명령으로 태블릿 화면을 직접 캡처해서 확인한다.

```bash
adb exec-out screencap -p > c:/dev/pub-diary/tmp_screen.png
```

그 다음 `tmp_screen.png` 를 Read 도구로 열어 이미지로 확인한다.
태블릿이 연결되어 있지 않거나 `unauthorized` 상태면 먼저 `adb devices` 로 연결 상태를 점검한다.

---

## 빌드 & 개발

```bash
# 개발 서버 시작 (Metro)
npx expo start

# Android 실기기 빌드 (USB 연결)
npx expo run:android

# TypeScript 타입 검사
npx tsc --noEmit
```

### Windows 한글 사용자명 우회
`android/local.properties`에 `tmpdir` 경로를 ASCII 경로로 지정해야 빌드 성공.
(자세한 내용: `memory/feedback_windows_korean_path.md`)

### USB 개발 시
태블릿 Wi-Fi 끄기 (Wi-Fi 연결 시 USB ADB 연결이 끊어지는 문제).

---

## 주요 작업 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-24 | 프로젝트 초기화, 기획/설계 문서 작성, 핵심 기능 프로토타입 구현 (캔버스, 툴바, 저장, 목록, 열람) |
| 2026-04-11 | 표지/페이지 양식 선택 Dialog, PageBackground (줄/모눈/점선), 멀티페이지 지원, 저장 포맷 `pages[]` 구조로 변경 |

---

## 다음 구현 예정

- 뷰어에서 페이지 양식 배경 표시 (현재는 배경색만 표시)
- 썸네일 생성 (첫 페이지 기준)
- 공유 기능 (Phase 3)
- OCR 텍스트 변환 (Phase 3)
