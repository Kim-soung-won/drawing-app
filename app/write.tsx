import React, { useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  TextInput,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DrawingCanvas from '../src/components/canvas/DrawingCanvas';
import Toolbar from '../src/components/canvas/Toolbar';
import Toast from '../src/components/ui/Toast';
import TemplateSelectDialog from '../src/components/ui/TemplateSelectDialog';
import TemplateChips from '../src/components/canvas/TemplateChips';
import PageSidebar from '../src/components/canvas/PageSidebar';
import { useCanvasStore } from '../src/stores/canvasStore';
import { useDiaryStore } from '../src/stores/diaryStore';
import { useOrientation } from '../src/hooks/useOrientation';
import { DiaryEntry, DrawingData, PageTemplate } from '../src/types/diary';
import { CANVAS } from '../src/constants/canvas';
import { COLORS, SHELL } from '../src/constants/colors';
import { generateThumbnail } from '../src/utils/thumbnail';
import { DiaryRepository } from '../src/repositories/DiaryRepository';
import { useEffect } from 'react';

let saveCounter = 0;
function generateId(): string {
  return `diary-${Date.now()}-${++saveCounter}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_TITLE = '제목 없음';

function generateAutoTitle(now: number, existingTitles: string[]): string {
  const d = new Date(now);
  const base = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (!existingTitles.includes(base)) return base;
  let i = 1;
  while (existingTitles.includes(`${base} (${i})`)) i++;
  return `${base} (${i})`;
}

export default function WriteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id;
  const { isPortrait } = useOrientation();

  const {
    pages,
    currentPageIndex,
    coverColor,
    canvasWidth,
    canvasHeight,
    initNew,
    addPage,
    setCurrentPageIndex,
    loadFromDrawingData,
    setCurrentPageTemplate,
  } = useCanvasStore();

  const { entries, saveEntry } = useDiaryStore();

  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<TextInput | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showAddPageDialog, setShowAddPageDialog] = useState(false);

  useEffect(() => {
    if (!editId) setShowNewDialog(true);
  }, [editId]);

  const handleNewDialogConfirm = useCallback(
    (selectedCover: string, selectedTemplate: PageTemplate) => {
      initNew(selectedCover, selectedTemplate);
      setShowNewDialog(false);
    },
    [initNew],
  );

  const handleAddPageDialogConfirm = useCallback(
    (_: string, selectedTemplate: PageTemplate) => {
      addPage(selectedTemplate);
      setShowAddPageDialog(false);
    },
    [addPage],
  );

  const handleSave = useCallback(async () => {
    const totalStrokes = pages.reduce((sum, p) => sum + p.strokes.length, 0);
    if (totalStrokes === 0) {
      Alert.alert('알림', '글을 작성한 후 저장해주세요.');
      return;
    }

    setToastMessage('저장 중...');
    setToastType('info');
    setToastVisible(true);

    try {
      const now = Date.now();
      const id = editId || generateId();

      const drawingData: DrawingData = {
        version: CANVAS.drawing.version,
        canvas: {
          width: canvasWidth || CANVAS.defaultWidth,
          height: canvasHeight || CANVAS.defaultHeight,
          backgroundColor: coverColor,
        },
        coverColor,
        pages: pages.map((p) => ({
          id: p.id,
          template: p.template,
          strokes: p.strokes,
          redoStack: [],
        })),
      };

      let finalTitle = title.trim();
      if (finalTitle === DEFAULT_TITLE || finalTitle === '') {
        const existingTitles = entries.map((e) => e.title);
        finalTitle = generateAutoTitle(now, existingTitles);
      }

      let thumbnailPath: string | null = null;
      try {
        const base64 = generateThumbnail(drawingData);
        if (base64) thumbnailPath = DiaryRepository.saveThumbnail(id, base64);
      } catch {}

      const entry: DiaryEntry = {
        id,
        title: finalTitle,
        createdAt: now,
        updatedAt: now,
        drawingPath: '',
        thumbnailPath,
      };

      await saveEntry(entry, drawingData);

      setToastMessage('저장을 완료했습니다!');
      setToastType('success');
      setTimeout(() => setToastVisible(false), 2000);
    } catch {
      setToastMessage('저장에 실패했습니다.');
      setToastType('error');
      setTimeout(() => setToastVisible(false), 2500);
    }
  }, [pages, coverColor, editId, title, entries, saveEntry, canvasWidth, canvasHeight]);

  const currentPage = pages[currentPageIndex];
  const canUndo = currentPage?.strokes.length > 0;
  const canRedo = currentPage?.redoStack.length > 0;

  return (
    <View style={styles.screen}>
      {/* 상단 바 */}
      <View style={styles.topbar}>
        {/* 뒤로 */}
        <TouchableOpacity style={styles.topBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="chevron-left" size={24} color={COLORS.text} />
        </TouchableOpacity>

        {/* 제목 */}
        {isEditingTitle ? (
          <TextInput
            ref={titleInputRef}
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            onBlur={() => {
              setIsEditingTitle(false);
              if (title.trim() === '') setTitle(DEFAULT_TITLE);
            }}
            onSubmitEditing={() => {
              setIsEditingTitle(false);
              if (title.trim() === '') setTitle(DEFAULT_TITLE);
            }}
            selectTextOnFocus
            maxLength={50}
            returnKeyType="done"
            autoFocus
          />
        ) : (
          <TouchableOpacity
            style={styles.titleRow}
            onPress={() => {
              setIsEditingTitle(true);
              setTimeout(() => titleInputRef.current?.focus(), 80);
            }}
          >
            <Text
              style={[styles.titleText, title === DEFAULT_TITLE && styles.titlePlaceholder]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Feather name="edit-2" size={13} color={COLORS.textLight} />
          </TouchableOpacity>
        )}

        {/* 템플릿 칩 */}
        <TemplateChips
          current={currentPage?.template ?? 'blank'}
          onChange={setCurrentPageTemplate}
        />

        {/* 페이지 추가 */}
        <TouchableOpacity
          style={styles.topBtn}
          onPress={() => setShowAddPageDialog(true)}
          activeOpacity={0.7}
        >
          <Feather name="file-plus" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* 컨텐츠 영역 */}
      <View style={styles.content}>
        {/* 페이지 사이드바 (가로 모드) */}
        {!isPortrait && (
          <PageSidebar title={title} onAddPage={() => setShowAddPageDialog(true)} />
        )}

        {/* 캔버스 영역 */}
        <View style={styles.canvasArea}>
          <Toast visible={toastVisible} message={toastMessage} type={toastType} />
          <DrawingCanvas />

          {/* 세로 모드 페이지 네비 */}
          {pages.length > 1 && (
            <View style={styles.pageNav}>
              <TouchableOpacity
                style={[styles.pageNavBtn, currentPageIndex === 0 && styles.pageNavBtnDisabled]}
                onPress={() => currentPageIndex > 0 && setCurrentPageIndex(currentPageIndex - 1)}
                disabled={currentPageIndex === 0}
              >
                <Text style={[styles.pageNavArrow, currentPageIndex === 0 && { color: COLORS.textLight }]}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.pageIndicator}>{currentPageIndex + 1} / {pages.length}</Text>
              <TouchableOpacity
                style={[styles.pageNavBtn, currentPageIndex === pages.length - 1 && styles.pageNavBtnDisabled]}
                onPress={() => currentPageIndex < pages.length - 1 && setCurrentPageIndex(currentPageIndex + 1)}
                disabled={currentPageIndex === pages.length - 1}
              >
                <Text style={[styles.pageNavArrow, currentPageIndex === pages.length - 1 && { color: COLORS.textLight }]}>›</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 플로팅 툴바 */}
          <Toolbar onSave={handleSave} canUndo={canUndo} canRedo={canRedo} />
        </View>
      </View>

      {/* 다이얼로그 */}
      <TemplateSelectDialog
        visible={showNewDialog}
        mode="new"
        onConfirm={handleNewDialogConfirm}
      />
      <TemplateSelectDialog
        visible={showAddPageDialog}
        mode="add"
        initialCoverColor={coverColor}
        onConfirm={handleAddPageDialogConfirm}
        onCancel={() => setShowAddPageDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SHELL.work,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: SHELL.border,
    flexWrap: 'nowrap',
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 60,
  },
  titleText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'NanumMyeongjo_700Bold',
    color: COLORS.text,
  },
  titlePlaceholder: {
    color: COLORS.textLight,
  },
  titleInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'NanumMyeongjo_700Bold',
    color: COLORS.text,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.accent,
    paddingVertical: 2,
    paddingHorizontal: 4,
    minWidth: 80,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  canvasArea: {
    flex: 1,
    position: 'relative',
  },
  pageNav: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,253,249,0.92)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SHELL.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pageNavBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNavBtnDisabled: {
    opacity: 0.3,
  },
  pageNavArrow: {
    fontSize: 20,
    color: COLORS.primary,
    lineHeight: 24,
  },
  pageIndicator: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    minWidth: 40,
    textAlign: 'center',
  },
});
