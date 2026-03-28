import React, { useCallback, useState, useRef } from 'react';
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
import { useCanvasStore } from '../src/stores/canvasStore';
import { useDiaryStore } from '../src/stores/diaryStore';
import { DiaryEntry, DrawingData } from '../src/types/diary';
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

  const { strokes, redoStack, clear } = useCanvasStore();
  const { entries, saveEntry } = useDiaryStore();

  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<TextInput | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');

  const handleEditTitle = useCallback(() => {
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 100);
  }, []);

  const handleTitleSubmit = useCallback(() => {
    setIsEditingTitle(false);
    if (title.trim() === '') setTitle(DEFAULT_TITLE);
  }, [title]);

  const handleSave = useCallback(async () => {
    if (strokes.length === 0) {
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
          backgroundColor: CANVAS.backgroundColor,
        },
        strokes,
      };

      let finalTitle = title.trim();
      if (finalTitle === DEFAULT_TITLE || finalTitle === '') {
        const existingTitles = entries.map((e) => e.title);
        finalTitle = generateAutoTitle(now, existingTitles);
      }

      const entry: DiaryEntry = {
        id,
        title: finalTitle,
        createdAt: editId ? now : now,
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
  }, [strokes, editId, title, entries, saveEntry]);

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
          headerStyle: { backgroundColor: COLORS.surface },
          gestureEnabled: false,
        }}
      />
      <View style={styles.container}>
        <Toast visible={toastVisible} message={toastMessage} type={toastType} />
        <DrawingCanvas />
        <Toolbar
          onSave={handleSave}
          canUndo={strokes.length > 0}
          canRedo={redoStack.length > 0}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
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
    maxWidth: 220,
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
    maxWidth: 250,
  },
});
