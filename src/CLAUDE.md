# src/ — CLAUDE.md

앱의 모든 비즈니스 로직, 컴포넌트, 상태, 타입이 여기에 있다.

---

## 타입 (`types/diary.ts`)

```ts
Point      — { x, y, pressure, timestamp }
Stroke     — { id, points, color, width, tool }
PageTemplate — 'blank' | 'lined' | 'grid' | 'dotted'
Page       — { id, template, strokes[], redoStack[] }
DrawingData — { version, canvas, coverColor, pages[] }
DiaryEntry — { id, title, createdAt, updatedAt, drawingPath, thumbnailPath }
```

타입 변경 시 `DiaryRepository.ts`의 JSON 직렬화와 레거시 마이그레이션(`loadFromDrawingData`) 함께 확인.

---

## 상수 (`constants/`)

| 파일 | 내용 |
|------|------|
| `canvas.ts` | 논리 해상도 1080×1920, 펜/지우개 기본값 및 선택지 |
| `colors.ts` | 서정적 팔레트 `COLORS`, 펜 색상 `PEN_COLORS` |
| `diary.ts` | 표지 색상 `COVER_COLORS` (6가지), 페이지 양식 `PAGE_TEMPLATES` (4가지) |

UI에 새 색상을 추가할 때는 `colors.ts`의 팔레트에서만 선택한다. 하드코딩 금지.

---

## 스토어 (`stores/`)

### `canvasStore.ts` — 드로잉 상태

| 상태 | 설명 |
|------|------|
| `pages[]` | 모든 페이지 (각 페이지에 strokes, redoStack 포함) |
| `currentPageIndex` | 현재 편집 중인 페이지 인덱스 |
| `coverColor` | 표지/페이지 배경 HEX 색상 |
| `tool` | `'pen'` 또는 `'eraser'` |
| `penColor`, `penWidth` | 현재 펜 설정 |
| `eraserWidth` | 현재 지우개 폭 |

주요 액션:
- `initNew(coverColor, template)` — 신규 일기 시작 시 초기화
- `loadFromDrawingData(data)` — 기존 일기 불러오기 (레거시 포맷 자동 마이그레이션)
- `addPage(template)` — 페이지 추가 후 자동으로 해당 페이지로 이동
- `addStroke(stroke)` — 현재 페이지에 스트로크 추가 (redoStack 클리어)
- `undo()` / `redo()` — 현재 페이지 단위로 동작
- `clearAll()` — 현재 페이지 스트로크 전체 undo 스택으로 이동

### `diaryStore.ts` — 일기 목록 CRUD

`DiaryRepository`를 감싸는 얇은 래퍼. 상태: `entries[]`, `isLoading`.

---

## 컴포넌트 (`components/`)

### canvas/DrawingCanvas.tsx
- `useCanvasStore`에서 `pages[currentPageIndex]`, `coverColor`, 도구 설정 읽음
- S펜 지원 기기: `pointerType === 1`만 필기 처리, 손가락 차단
- `PageBackground` 로 템플릿 배경 렌더링
- 지우개 색상 = `coverColor` (배경색으로 덮어쓰기 방식)
- 라이브 경로(`livePath`)는 별도 상태로 관리해 그리는 중 실시간 렌더링

### canvas/PageBackground.tsx
- Skia `Path`로 템플릿 패턴 렌더링 (성능을 위해 단일 Path로 모든 선/점 처리)
- 논리 픽셀 기준 간격: `LINE_SPACING = 60`, 여백: `MARGIN = 40`
- `useMemo`로 template 변경 시에만 Path 재생성

### canvas/Toolbar.tsx
- `useCanvasStore`에서 직접 도구 상태를 읽고 쓴다 (props로 전달 안 함)
- `onSave`, `canUndo`, `canRedo` 만 props로 받음
- 롱프레스 연속 실행: `useRepeatPress` 커스텀 훅 (초기 400ms, 이후 100ms 간격)

### ui/TemplateSelectDialog.tsx
- `mode='new'`: 표지 색상 + 페이지 양식 선택 (신규 일기)
- `mode='add'`: 페이지 양식만 선택 (페이지 추가)
- `onCancel` 없으면 취소 버튼 미표시 (신규 일기 시작 시)
- 미리보기: React Native View로 줄/모눈/점선 패턴 시각화

### diary/DiaryCard.tsx
- 글 목록 카드. 썸네일 없으면 날짜/제목만 표시.

### ui/Toast.tsx
- `visible`, `message`, `type('info'|'success'|'error')` props

---

## 저장소 (`repositories/DiaryRepository.ts`)

- `init()` — DB 생성 + 디렉토리 확보. `_layout.tsx`에서 앱 시작 시 호출.
- `save(entry, drawingData)` — JSON 파일 쓰기 + SQLite INSERT OR REPLACE
- `loadDrawing(drawingPath)` — 파일 읽기 → JSON 파싱 (`DrawingData` 반환)
- 파일 경로: `[Paths.document]/drawings/{id}.json`

`expo-file-system` 신구 API 혼용 금지. 클래스 기반 API (`File`, `Directory`, `Paths`)만 사용.
