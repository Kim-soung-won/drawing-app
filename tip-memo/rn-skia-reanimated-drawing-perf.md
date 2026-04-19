# React Native Skia + Reanimated 드로잉 성능 최적화

> 적용 프로젝트: pub-diary  
> 적용일: 2026-04-11  
> 효과: 필기 응답성 체감 개선 (프레임 드랍 감소)

---

## 문제

손글씨 드로잉 앱에서 펜을 움직일 때 줄이 그어지는 속도가 느리고, 지우개 커서 이동도 뚝뚝 끊기는 현상.

---

## 원인 분석

### 기존 구조

```
사용자 제스처 (UI 스레드)
  → runOnJS(handleUpdate)(x, y)       ← 매 포인트마다 JS 브릿지 통과
    → setLivePath(buildPath(...))      ← React 상태 업데이트
      → React 리렌더                  ← 완성된 스트로크 포함 전체 재렌더
        → Skia 재렌더                  ← 모든 Path 재계산
```

**병목 3가지:**
1. `runOnJS` — 매 포인트마다 UI 스레드 → JS 스레드 브릿지 호출
2. `setState` — 브릿지 완료 후 React 리렌더 트리거 (비동기 지연)
3. 완성된 스트로크 paths 재계산 — strokes 변경 없는데도 매 렌더마다 재실행

---

## 해결 방법

### 핵심 원리

React Native Skia는 Reanimated의 `SharedValue<SkPath>`를 `<Path path={sharedValue}>` 에 직접 바인딩할 수 있다.  
SharedValue가 변경될 때 Skia는 **React 리렌더 없이** UI 스레드에서 직접 캔버스를 갱신한다.

```
사용자 제스처 (UI 스레드)
  → liveCoords.value = [...coords, x, y]   ← worklet 내에서 직접 업데이트, 브릿지 없음
    → useDerivedValue 자동 트리거           ← UI 스레드에서 Skia path 빌드
      → Skia 재렌더 (live path만)           ← React 관여 없음
```

**`runOnJS`는 stroke 종료 시 1회만** (저장 목적):
```
.onEnd() → runOnJS(saveStroke)(coords)     ← stroke당 1회
```

### 구현 패턴

```tsx
// 1. 좌표를 SharedValue로 관리
const liveCoords = useSharedValue<number[]>([]);
const drawingActive = useSharedValue(false);

// 2. UI 스레드에서 Skia path 빌드 (worklet)
const livePath = useDerivedValue(() => {
  'worklet';
  const coords = liveCoords.value;
  const n = Math.floor(coords.length / 2);
  const path = Skia.Path.Make();
  if (n === 0) return path;

  path.moveTo(coords[0], coords[1]);
  for (let i = 1; i < n - 1; i++) {
    const mx = (coords[i * 2] + coords[i * 2 + 2]) / 2;
    const my = (coords[i * 2 + 1] + coords[i * 2 + 3]) / 2;
    path.quadTo(coords[i * 2], coords[i * 2 + 1], mx, my);
  }
  if (n >= 2) path.lineTo(coords[(n - 1) * 2], coords[(n - 1) * 2 + 1]);
  return path;
});

// 3. Gesture — runOnJS 없이 worklet에서 직접 업데이트
const pan = Gesture.Pan()
  .onBegin((e) => {
    'worklet';
    drawingActive.value = true;
    liveCoords.value = [e.x, e.y];
  })
  .onUpdate((e) => {
    'worklet';
    if (!drawingActive.value) return;
    liveCoords.value = [...liveCoords.value, e.x, e.y]; // 새 배열 → useDerivedValue 트리거
  })
  .onEnd(() => {
    'worklet';
    if (!drawingActive.value) return;
    const coords = liveCoords.value;
    liveCoords.value = [];
    drawingActive.value = false;
    runOnJS(saveStroke)(coords); // stroke당 1회만
  });

// 4. Canvas에서 SharedValue 직접 바인딩
<Path
  path={livePath}           // SharedValue<SkPath> — React 리렌더 없이 갱신
  color={penColor}
  style="stroke"
  strokeWidth={penWidth}
  strokeCap="round"
  strokeJoin="round"
/>
```

### 추가 최적화

#### 완성된 스트로크 paths 캐싱

```tsx
// strokes 배열이 바뀔 때만 paths 재계산
const completedPaths = useMemo(
  () => currentPage.strokes.map((stroke) => ({
    id: stroke.id,
    path: buildPathFromPoints(stroke.points), // 이미 완성된 path는 재계산 불필요
    color: stroke.color,
    width: stroke.width,
    isEraser: stroke.tool === 'eraser',
  })),
  [currentPage.strokes],
);
```

#### 호버 커서도 SharedValue로

```tsx
const hoverX = useSharedValue(-9999);
const hoverY = useSharedValue(-9999);

const hoverRectX = useDerivedValue(() => hoverX.value - eraserWidth / 2);
const hoverRectY = useDerivedValue(() => hoverY.value - eraserWidth / 2);

// Hover gesture worklet에서 직접 업데이트
.onUpdate((e) => {
  'worklet';
  hoverX.value = e.x;
  hoverY.value = e.y;
})

// Canvas에서 바인딩
<Rect x={hoverRectX} y={hoverRectY} width={eraserWidth} height={eraserWidth} ... />
```

#### 지우개 오프스크린 레이어 조건부 사용

```tsx
// 지우개 stroke가 없을 때는 불필요한 오프스크린 버퍼 생성 안 함
const needsLayer = completedPaths.some((p) => p.isEraser) || tool === 'eraser';

<Group layer={needsLayer}>
  {completedPaths.map(...)}
  <Path path={livePath} ... />
</Group>
```

---

## 주의사항

### `liveCoords.value = [...liveCoords.value, x, y]` 의 복잡도

매 포인트마다 새 배열을 생성하므로 O(n) per point = O(n²) total.  
일반적인 stroke (수십~수백 포인트)에서는 문제없음.  
매우 긴 stroke(수천 포인트)가 필요하다면 청크 단위로 관리하는 방식 검토 필요.

### `Skia.Path.Make()`는 worklet에서 동작함

`@shopify/react-native-skia`의 `Skia` 네임스페이스는 Reanimated worklet에서 사용 가능.  
`useDerivedValue` 내부에서 `Skia.Path.Make()` 호출이 정상 동작함.

### `saveStroke` 클로저 의존성

`saveStroke`가 `tool`, `penColor` 등 React 상태를 클로저로 캡처하기 때문에  
`useMemo([saveStroke])`로 gesture를 재생성해야 최신 tool/color가 반영됨.  
tool 전환 시 gesture 재생성이 발생하지만 빈도가 낮아 문제없음.

---

## 관련 라이브러리 버전

| 라이브러리 | 버전 |
|-----------|------|
| @shopify/react-native-skia | 2.4.18 |
| react-native-reanimated | 4.2.1 |
| react-native-gesture-handler | ~2.30.0 |
