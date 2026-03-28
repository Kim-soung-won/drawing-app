import React, { useRef, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Path, Skia, SkPath, Rect } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import StylusSupportModule from '../../../modules/stylus-support';
import { useCanvasStore } from '../../stores/canvasStore';
import { Point, Stroke } from '../../types/diary';
import { COLORS } from '../../constants/colors';

let strokeCounter = 0;

// RNGH pointerType: 0 = finger, 1 = stylus
const POINTER_TYPE_STYLUS = 1;

// 디바이스가 스타일러스를 지원하면 손가락 터치 차단
let HAS_STYLUS = false;
try {
  HAS_STYLUS = StylusSupportModule.hasStylusSupport();
  console.log('[StylusSupport] hasStylusSupport:', HAS_STYLUS);
} catch (e) {
  console.warn('[StylusSupport] module failed:', e);
}

export default function DrawingCanvas() {
  const {
    strokes,
    tool,
    penColor,
    penWidth,
    eraserWidth,
    addStroke,
  } = useCanvasStore();

  const currentPoints = useRef<Point[]>([]);
  const [livePath, setLivePath] = useState<SkPath | null>(null);
  const drawingActiveRef = useRef(false);

  // S Pen 호버 커서 (지우개 모드에서만 표시)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const buildPath = useCallback((points: Point[]): SkPath => {
    const path = Skia.Path.Make();
    if (points.length === 0) return path;

    path.moveTo(points[0].x, points[0].y);

    if (points.length < 3) {
      if (points.length === 2) {
        path.lineTo(points[1].x, points[1].y);
      }
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
  }, []);

  const handleBegin = useCallback((x: number, y: number, pointerType: number) => {
    // 스타일러스 지원 기기면 펜(1)만 허용, 손가락(0) 차단
    if (HAS_STYLUS && pointerType !== POINTER_TYPE_STYLUS) return;

    drawingActiveRef.current = true;
    currentPoints.current = [
      { x, y, pressure: 0.5, timestamp: Date.now() },
    ];
    setLivePath(buildPath(currentPoints.current));
  }, [buildPath]);

  const handleUpdate = useCallback((x: number, y: number) => {
    if (!drawingActiveRef.current) return;

    currentPoints.current.push({
      x, y, pressure: 0.5, timestamp: Date.now(),
    });
    setLivePath(buildPath(currentPoints.current));
  }, [buildPath]);

  const handleEnd = useCallback(() => {
    if (!drawingActiveRef.current) return;

    if (currentPoints.current.length > 0) {
      const stroke: Stroke = {
        id: `stroke-${Date.now()}-${++strokeCounter}`,
        points: [...currentPoints.current],
        color: tool === 'eraser' ? COLORS.canvas : penColor,
        width: tool === 'eraser' ? eraserWidth : penWidth,
        tool,
      };
      addStroke(stroke);
      currentPoints.current = [];
    }
    drawingActiveRef.current = false;
    setLivePath(null);
  }, [tool, penColor, penWidth, addStroke]);

  const handleHoverMove = useCallback((x: number, y: number) => {
    setHoverPos({ x, y });
  }, []);

  const handleHoverEnd = useCallback(() => {
    setHoverPos(null);
  }, []);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .minDistance(0)
      .onBegin((e: any) => {
        'worklet';
        runOnJS(handleBegin)(e.x, e.y, e.pointerType ?? 0);
      })
      .onUpdate((e) => {
        'worklet';
        runOnJS(handleUpdate)(e.x, e.y);
      })
      .onEnd(() => {
        'worklet';
        runOnJS(handleEnd)();
      });

    if (!HAS_STYLUS) return pan;

    const hover = Gesture.Hover()
      .onBegin((e: any) => {
        'worklet';
        runOnJS(handleHoverMove)(e.x, e.y);
      })
      .onUpdate((e: any) => {
        'worklet';
        runOnJS(handleHoverMove)(e.x, e.y);
      })
      .onEnd(() => {
        'worklet';
        runOnJS(handleHoverEnd)();
      });

    return Gesture.Simultaneous(pan, hover);
  }, [handleBegin, handleUpdate, handleEnd, handleHoverMove, handleHoverEnd]);

  const liveColor = tool === 'eraser' ? COLORS.canvas : penColor;
  const liveWidth = tool === 'eraser' ? eraserWidth : penWidth;

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        <Canvas style={styles.canvas}>
          {strokes.map((stroke) => (
            <Path
              key={stroke.id}
              path={buildPath(stroke.points)}
              color={stroke.color}
              style="stroke"
              strokeWidth={stroke.width}
              strokeCap="round"
              strokeJoin="round"
            />
          ))}
          {livePath && (
            <Path
              path={livePath}
              color={liveColor}
              style="stroke"
              strokeWidth={liveWidth}
              strokeCap="round"
              strokeJoin="round"
            />
          )}
          {hoverPos && tool === 'eraser' && (
            <Rect
              x={hoverPos.x - eraserWidth / 2}
              y={hoverPos.y - eraserWidth / 2}
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
