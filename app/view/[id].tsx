import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useDiaryStore } from '../../src/stores/diaryStore';
import { useCanvasStore } from '../../src/stores/canvasStore';
import { DiaryEntry, DrawingData, Point } from '../../src/types/diary';
import { COLORS } from '../../src/constants/colors';

function buildPath(points: Point[]) {
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
}

export default function ViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, deleteEntry, loadDrawing } = useDiaryStore();
  const { loadStrokes, clear } = useCanvasStore();

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [drawing, setDrawing] = useState<DrawingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const found = entries.find((e) => e.id === id);
    if (!found) {
      setIsLoading(false);
      return;
    }

    setEntry(found);
    const data = loadDrawing(found.drawingPath);
    setDrawing(data);
    setIsLoading(false);
  }, [id, entries]);

  const handleEdit = () => {
    if (drawing) {
      loadStrokes(drawing.strokes);
      router.push(`/write?id=${id}`);
    }
  };

  const handleDelete = () => {
    if (!entry) return;
    Alert.alert(
      '삭제',
      `"${entry.title || '제목 없음'}"을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await deleteEntry(entry.id);
            router.back();
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!entry || !drawing) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>글을 찾을 수 없습니다</Text>
      </View>
    );
  }

  const canvasWidth = drawing.canvas.width;
  const canvasHeight = drawing.canvas.height;

  return (
    <>
      <Stack.Screen
        options={{
          title: entry.title || '제목 없음',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleEdit} style={styles.headerBtn}>
                <Text style={styles.headerBtnText}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
                <Text style={[styles.headerBtnText, { color: COLORS.danger }]}>
                  삭제
                </Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        maximumZoomScale={3}
        minimumZoomScale={0.5}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.canvasContainer}>
          <Canvas
            style={{
              width: '100%',
              aspectRatio: canvasWidth / canvasHeight,
              backgroundColor: drawing.canvas.backgroundColor,
            }}
          >
            {drawing.strokes.map((stroke) => (
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
          </Canvas>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  notFound: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  canvasContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBtnText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
