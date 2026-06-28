import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Path, Skia, SkPath, Rect, Group } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, useDerivedValue } from 'react-native-reanimated';
import StylusSupportModule from '../../../modules/stylus-support';
import { useCanvasStore } from '../../stores/canvasStore';
import { Point, Stroke } from '../../types/diary';
import { COLORS } from '../../constants/colors';
import PageBackground from './PageBackground';

let strokeCounter = 0;

const POINTER_TYPE_STYLUS = 1;

let HAS_STYLUS = false;
try {
  HAS_STYLUS = StylusSupportModule.hasStylusSupport();
  console.log('[StylusSupport] hasStylusSupport:', HAS_STYLUS);
} catch (e) {
  console.warn('[StylusSupport] module failed:', e);
}

// 완성된 스트로크용 path 빌더 (JS 스레드)
function buildPathFromPoints(points: Point[]): SkPath {
  const path = Skia.Path.Make();
  if (points.length === 0) return path;
  path.moveTo(points[0].x, points[0].y);
  if (points.length < 3) {
    if (points.length === 2) path.lineTo(points[1].x, points[1].y);
    return path;
  }
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    path.quadTo(points[i].x, points[i].y, midX, midY);
  }
  const last = points[points.length - 1];
  path.lineTo(last.x, last.y);
  return path;
}

// live path 빌더 — worklet에서 실행 (UI 스레드)
function buildPathFromCoords(coords: number[]): SkPath {
  'worklet';
  const path = Skia.Path.Make();
  const n = Math.floor(coords.length / 2);
  if (n === 0) return path;
  path.moveTo(coords[0], coords[1]);
  if (n < 3) {
    if (n === 2) path.lineTo(coords[2], coords[3]);
    return path;
  }
  for (let i = 1; i < n - 1; i++) {
    const mx = (coords[i * 2] + coords[i * 2 + 2]) / 2;
    const my = (coords[i * 2 + 1] + coords[i * 2 + 3]) / 2;
    path.quadTo(coords[i * 2], coords[i * 2 + 1], mx, my);
  }
  path.lineTo(coords[(n - 1) * 2], coords[(n - 1) * 2 + 1]);
  return path;
}

export default function DrawingCanvas() {
  const {
    pages,
    currentPageIndex,
    coverColor,
    tool,
    penColor,
    penWidth,
    eraserWidth,
    addStroke,
    setCanvasSize,
  } = useCanvasStore();

  const currentPage = pages[currentPageIndex];

  const [canvasSize, setLocalCanvasSize] = useState({ width: 0, height: 0 });

  // UI 스레드에서 직접 업데이트되는 live 좌표 — JS 브릿지 없음
  const liveCoords = useSharedValue<number[]>([]);
  const drawingActive = useSharedValue(false);

  // S펜 호버 커서 위치
  const hoverX = useSharedValue(-9999);
  const hoverY = useSharedValue(-9999);

  // live path를 UI 스레드에서 빌드 — React 리렌더 없이 Skia 직접 갱신
  const livePath = useDerivedValue(() => {
    'worklet';
    return buildPathFromCoords(liveCoords.value);
  });

  const hoverRectX = useDerivedValue(() => {
    'worklet';
    return hoverX.value - eraserWidth / 2;
  });
  const hoverRectY = useDerivedValue(() => {
    'worklet';
    return hoverY.value - eraserWidth / 2;
  });

  // 완성된 스트로크 paths — strokes가 바뀔 때만 재계산
  const completedPaths = useMemo(
    () =>
      currentPage.strokes.map((stroke) => ({
        id: stroke.id,
        path: buildPathFromPoints(stroke.points),
        color: stroke.color,
        width: stroke.width,
        isEraser: stroke.tool === 'eraser',
      })),
    [currentPage.strokes],
  );

  // 스트로크 저장 — stroke 종료 시 1회만 호출
  const saveStroke = useCallback(
    (coords: number[]) => {
      if (coords.length < 2) return;
      const points: Point[] = [];
      for (let i = 0; i < coords.length; i += 2) {
        points.push({ x: coords[i], y: coords[i + 1], pressure: 0.5, timestamp: Date.now() });
      }
      const stroke: Stroke = {
        id: `stroke-${Date.now()}-${++strokeCounter}`,
        points,
        color: tool === 'eraser' ? coverColor : penColor,
        width: tool === 'eraser' ? eraserWidth : penWidth,
        tool,
      };
      addStroke(stroke);
    },
    [tool, coverColor, penColor, penWidth, eraserWidth, addStroke],
  );

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .minDistance(0)
      .onBegin((e: any) => {
        'worklet';
        if (HAS_STYLUS && (e.pointerType ?? 0) !== POINTER_TYPE_STYLUS) return;
        drawingActive.value = true;
        liveCoords.value = [e.x, e.y];
      })
      .onUpdate((e) => {
        'worklet';
        if (!drawingActive.value) return;
        liveCoords.value = [...liveCoords.value, e.x, e.y];
      })
      .onEnd(() => {
        'worklet';
        if (!drawingActive.value) return;
        const coords = liveCoords.value;
        liveCoords.value = [];
        drawingActive.value = false;
        runOnJS(saveStroke)(coords);
      });

    if (!HAS_STYLUS) return pan;

    const hover = Gesture.Hover()
      .onBegin((e: any) => {
        'worklet';
        hoverX.value = e.x;
        hoverY.value = e.y;
      })
      .onUpdate((e: any) => {
        'worklet';
        hoverX.value = e.x;
        hoverY.value = e.y;
      })
      .onEnd(() => {
        'worklet';
        hoverX.value = -9999;
        hoverY.value = -9999;
      });

    return Gesture.Simultaneous(pan, hover);
  }, [saveStroke]);

  // 지우개 스트로크가 있을 때만 오프스크린 레이어 사용
  const needsLayer = completedPaths.some((p) => p.isEraser) || tool === 'eraser';
  const liveBlendMode = tool === 'eraser' ? 'clear' : 'srcOver';
  const liveColor = tool === 'eraser' ? 'black' : penColor;
  const liveWidth = tool === 'eraser' ? eraserWidth : penWidth;

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.container}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setLocalCanvasSize({ width, height });
          setCanvasSize(width, height);
        }}
      >
        <Canvas style={styles.canvas}>
          {/* 레이어 1: 배경 — 항상 고정 */}
          <PageBackground
            template={currentPage.template}
            color={coverColor}
            width={canvasSize.width}
            height={canvasSize.height}
          />
          {/* 레이어 2: 잉크 — 지우개가 있을 때만 오프스크린 레이어 */}
          <Group layer={needsLayer}>
            {completedPaths.map((s) => (
              <Path
                key={s.id}
                path={s.path}
                color={s.color}
                blendMode={s.isEraser ? 'clear' : 'srcOver'}
                style="stroke"
                strokeWidth={s.width}
                strokeCap="round"
                strokeJoin="round"
              />
            ))}
            {/* live path — UI 스레드에서 직접 갱신, React 리렌더 없음 */}
            <Path
              path={livePath}
              color={liveColor}
              blendMode={liveBlendMode}
              style="stroke"
              strokeWidth={liveWidth}
              strokeCap="round"
              strokeJoin="round"
            />
          </Group>
          {/* 지우개 호버 커서 — UI 스레드에서 직접 갱신 */}
          {tool === 'eraser' && (
            <Rect
              x={hoverRectX}
              y={hoverRectY}
              width={eraserWidth}
              height={eraserWidth}
              color="rgba(0,0,0,0.3)"
              style="stroke"
              strokeWidth={1}
            />
          )}
        </Canvas>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  canvas: {
    flex: 1,
  },
});
