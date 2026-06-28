import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useDiaryStore } from '../../src/stores/diaryStore';
import { useCanvasStore } from '../../src/stores/canvasStore';
import { DiaryEntry, DrawingData, Page, Point } from '../../src/types/diary';
import { COLORS, SHELL } from '../../src/constants/colors';
import PageBackground from '../../src/components/canvas/PageBackground';

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

// 단일 페이지 뷰어 (미리보기 Canvas)
function PageViewer({ page, coverColor }: { page: Page; coverColor: string }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // 쓰기 화면과 동일한 비율: 전체 화면에서 헤더(56) + 툴바(90) 제외
  const canvasWidth = screenWidth - 32; // 좌우 padding 16씩
  const canvasHeight = screenHeight - 56 - 90;

  const w = canvasSize.width || canvasWidth;
  const h = canvasSize.height || canvasHeight;

  return (
    <View
      style={viewerStyles.container}
      onLayout={(e) =>
        setCanvasSize({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })
      }
    >
      <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
        <PageBackground template={page.template} color={coverColor} width={w} height={h} />
        {page.strokes.map((stroke) => (
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
  );
}

const viewerStyles = StyleSheet.create({
  container: {
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
});

export default function ViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, deleteEntry, loadDrawing } = useDiaryStore();
  const { loadFromDrawingData } = useCanvasStore();

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
      loadFromDrawingData(drawing);
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

  // 레거시 포맷(pages 없음) 대응
  const pages: Page[] =
    drawing.pages && drawing.pages.length > 0
      ? drawing.pages
      : [
          {
            id: 'page-legacy',
            template: 'blank',
            strokes: (drawing as any).strokes ?? [],
            redoStack: [],
          },
        ];

  const coverColor = drawing.coverColor ?? drawing.canvas.backgroundColor ?? COLORS.canvas;

  return (
    <>
      {/* 커스텀 헤더 */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.topBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="chevron-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{entry.title || '제목 없음'}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.headerBtn}>
            <Feather name="edit-2" size={18} color={COLORS.primary} />
            <Text style={styles.headerBtnText}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
            <Feather name="trash-2" size={18} color={COLORS.danger} />
            <Text style={[styles.headerBtnText, { color: COLORS.danger }]}>삭제</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {pages.map((page, idx) => (
          <View key={page.id} style={styles.pageWrapper}>
            {pages.length > 1 && (
              <Text style={styles.pageLabel}>{idx + 1} / {pages.length}</Text>
            )}
            <PageViewer page={page} coverColor={coverColor} />
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: SHELL.border,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'NanumMyeongjo_700Bold',
    color: COLORS.text,
  },
  container: {
    flex: 1,
    backgroundColor: SHELL.work,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SHELL.work,
  },
  notFound: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  pageWrapper: {
    gap: 8,
  },
  pageLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerBtnText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
