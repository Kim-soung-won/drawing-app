# app/ — CLAUDE.md

Expo Router 파일 기반 라우팅. 각 파일이 화면 하나에 대응한다.

---

## 화면 목록

| 파일 | 라우트 | 역할 |
|------|--------|------|
| `_layout.tsx` | `/` | Stack Navigator 설정. `diaryStore.init()` 앱 시작 시 호출. |
| `index.tsx` | `/` | Home — 글 목록 (FlatList) + FAB |
| `write.tsx` | `/write` | Write — 캔버스 필기 화면 |
| `view/[id].tsx` | `/view/:id` | View — 글 열람, 수정/삭제 |

---

## write.tsx

글쓰기 화면. 가장 복잡한 화면.

**초기화 흐름:**
1. `editId` 없으면(신규) → `TemplateSelectDialog` 표시 (mode='new')
2. Dialog에서 확인 → `canvasStore.initNew(coverColor, template)` 호출
3. `editId` 있으면(수정) → `view/[id].tsx`에서 `loadFromDrawingData` 후 진입

**저장 시 DrawingData 구성:**
```ts
{
  version: CANVAS.drawing.version,
  canvas: { width, height, backgroundColor: coverColor },
  coverColor,
  pages: pages.map(p => ({ id, template, strokes, redoStack: [] }))
}
```

**페이지 네비게이션 바:** `pages.length > 1`일 때만 표시. `‹`, `›` 버튼으로 `currentPageIndex` 변경.

**헤더:** 제목 인라인 편집 (`HeaderTitle`), 우측에 `+ 페이지` 버튼.

---

## view/[id].tsx

**편집 진입:** `loadFromDrawingData(drawing)` 호출 후 `/write?id=...` 푸시.

**멀티페이지:** `drawing.pages`가 있으면 전체 페이지 세로 스크롤로 렌더링. 레거시 포맷(`strokes[]` 최상위)은 단일 페이지로 처리.

**레거시 포맷 대응:**
```ts
const pages = drawing.pages?.length > 0
  ? drawing.pages
  : [{ id: 'page-legacy', template: 'blank', strokes: drawing.strokes ?? [], redoStack: [] }];
```

**coverColor 대응:**
```ts
const coverColor = drawing.coverColor ?? drawing.canvas.backgroundColor ?? COLORS.canvas;
```

---

## 화면 전환 패턴

```ts
router.push('/write')          // 신규 글쓰기
router.push(`/write?id=${id}`) // 수정 (view에서 canvasStore 로드 후 이동)
router.push(`/view/${id}`)     // 열람
router.back()                  // 뒤로
```

Stack Navigator이므로 `gestureEnabled: false`는 write 화면에만 설정 (뒤로 가기 실수 방지).
