import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  TextInput,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import DrawingCanvas from '../src/components/canvas/DrawingCanvas';
import Toolbar from '../src/components/canvas/Toolbar';
import Toast from '../src/components/ui/Toast';
import TemplateSelectDialog from '../src/components/ui/TemplateSelectDialog';
import { useCanvasStore } from '../src/stores/canvasStore';
import { useDiaryStore } from '../src/stores/diaryStore';
import { DiaryEntry, DrawingData, PageTemplate } from '../src/types/diary';
import { CANVAS } from '../src/constants/canvas';
import { COLORS } from '../src/constants/colors';

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

function HeaderTitle({
  title,
  isEditing,
  onChangeText,
  onPressEdit,
  onSubmit,
  inputRef,
}: {
  title: string;
  isEditing: boolean;
  onChangeText: (t: string) => void;
  onPressEdit: () => void;
  onSubmit: () => void;
  inputRef: React.RefObject<TextInput | null>;
}) {
  if (isEditing) {
    return (
      <TextInput
        ref={inputRef}
        style={styles.titleInput}
        value={title}
        onChangeText={onChangeText}
        onBlur={onSubmit}
        onSubmitEditing={onSubmit}
        selectTextOnFocus
        maxLength={50}
        returnKeyType="done"
      />
    );
  }

  return (
    <TouchableOpacity style={styles.titleRow} onPress={onPressEdit}>
      <Text
        style={[
          styles.titleText,
          title === DEFAULT_TITLE && styles.titleTextPlaceholder,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text style={styles.editIcon}>✏️</Text>
    </TouchableOpacity>
  );
}

export default function WriteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id;

  const {
    pages,
    currentPageIndex,
    coverColor,
    initNew,
    addPage,
    setCurrentPageIndex,
    loadFromDrawingData,
    reset,
  } = useCanvasStore();

  const { entries, saveEntry } = useDiaryStore();

  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<TextInput | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');

  // 새 일기 시작 Dialog
  const [showNewDialog, setShowNewDialog] = useState(false);
  // 페이지 추가 Dialog
  const [showAddPageDialog, setShowAddPageDialog] = useState(false);

  // 기존 일기 편집이 아닌 신규일 때 Dialog 표출
  useEffect(() => {
    if (!editId) {
      setShowNewDialog(true);
    }
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

  const handleEditTitle = useCallback(() => {
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 100);
  }, []);

  const handleTitleSubmit = useCallback(() => {
    setIsEditingTitle(false);
    if (title.trim() === '') setTitle(DEFAULT_TITLE);
  }, [title]);

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
          width: CANVAS.defaultWidth,
          height: CANVAS.defaultHeight,
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

      const entry: DiaryEntry = {
        id,
        title: finalTitle,
        createdAt: now,
        updatedAt: now,
        drawingPath: '',
        thumbnailPath: null,
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
  }, [pages, coverColor, editId, title, entries, saveEntry]);

  const currentPage = pages[currentPageIndex];
  const canUndo = currentPage?.strokes.length > 0;
  const canRedo = currentPage?.redoStack.length > 0;

  const hasPrev = currentPageIndex > 0;
  const hasNext = currentPageIndex < pages.length - 1;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <HeaderTitle
              title={title}
              isEditing={isEditingTitle}
              onChangeText={setTitle}
              onPressEdit={handleEditTitle}
              onSubmit={handleTitleSubmit}
              inputRef={titleInputRef}
            />
          ),
          headerRight: () => (
            <TouchableOpacity
              style={styles.addPageBtn}
              onPress={() => setShowAddPageDialog(true)}
            >
              <Text style={styles.addPageBtnText}>+ 페이지</Text>
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: COLORS.surface },
          gestureEnabled: false,
        }}
      />
      <View style={styles.container}>
        <Toast visible={toastVisible} message={toastMessage} type={toastType} />
        <DrawingCanvas />

        {/* 페이지 네비게이션 바 */}
        {pages.length > 1 && (
          <View style={styles.pageNav}>
            <TouchableOpacity
              style={[styles.pageNavBtn, !hasPrev && styles.pageNavBtnDisabled]}
              onPress={() => hasPrev && setCurrentPageIndex(currentPageIndex - 1)}
              disabled={!hasPrev}
            >
              <Text style={[styles.pageNavArrow, !hasPrev && styles.pageNavArrowDisabled]}>
                ‹
              </Text>
            </TouchableOpacity>

            <Text style={styles.pageIndicator}>
              {currentPageIndex + 1} / {pages.length}
            </Text>

            <TouchableOpacity
              style={[styles.pageNavBtn, !hasNext && styles.pageNavBtnDisabled]}
              onPress={() => hasNext && setCurrentPageIndex(currentPageIndex + 1)}
              disabled={!hasNext}
            >
              <Text style={[styles.pageNavArrow, !hasNext && styles.pageNavArrowDisabled]}>
                ›
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Toolbar
          onSave={handleSave}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </View>

      {/* 새 일기 시작 Dialog */}
      <TemplateSelectDialog
        visible={showNewDialog}
        mode="new"
        onConfirm={handleNewDialogConfirm}
      />

      {/* 페이지 추가 Dialog */}
      <TemplateSelectDialog
        visible={showAddPageDialog}
        mode="add"
        initialCoverColor={coverColor}
        onConfirm={handleAddPageDialogConfirm}
        onCancel={() => setShowAddPageDialog(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  addPageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  addPageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  pageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: 16,
  },
  pageNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  pageNavBtnDisabled: {
    opacity: 0.3,
  },
  pageNavArrow: {
    fontSize: 22,
    color: COLORS.primary,
    lineHeight: 28,
  },
  pageNavArrowDisabled: {
    color: COLORS.textLight,
  },
  pageIndicator: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    minWidth: 50,
    textAlign: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    maxWidth: 180,
  },
  titleTextPlaceholder: {
    color: COLORS.textLight,
  },
  editIcon: {
    fontSize: 14,
  },
  titleInput: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.accent,
    paddingVertical: 2,
    paddingHorizontal: 4,
    minWidth: 150,
    maxWidth: 200,
  },
});
