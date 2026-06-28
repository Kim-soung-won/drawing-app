import React, { useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';
import { COLORS, PEN_COLORS, SHELL } from '../../constants/colors';
import { CANVAS } from '../../constants/canvas';

interface ToolbarProps {
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function useRepeatPress(action: () => void, initialDelay = 400, repeatDelay = 100) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onPressIn = useCallback(() => {
    action();
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(action, repeatDelay);
    }, initialDelay);
  }, [action, initialDelay, repeatDelay]);

  const onPressOut = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
  }, []);

  return { onPressIn, onPressOut };
}

function Sep() {
  return <View style={styles.sep} />;
}

export default function Toolbar({ onSave, canUndo, canRedo }: ToolbarProps) {
  const {
    tool,
    penColor,
    penWidth,
    eraserWidth,
    setTool,
    setPenColor,
    setPenWidth,
    setEraserWidth,
    undo,
    redo,
    clearAll,
  } = useCanvasStore();

  const undoRepeat = useRepeatPress(undo);
  const redoRepeat = useRepeatPress(redo);

  return (
    <View style={styles.floating} pointerEvents="box-none">
      <View style={styles.capsule}>
        {/* 도구 선택 */}
        <TouchableOpacity
          style={[styles.toolBtn, tool === 'pen' && styles.toolBtnActive]}
          onPress={() => setTool('pen')}
        >
          <Feather name="edit-2" size={20} color={tool === 'pen' ? COLORS.primary : SHELL.iconOff} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, tool === 'eraser' && styles.toolBtnActive]}
          onPress={() => setTool('eraser')}
        >
          <Text style={[styles.emoji, tool === 'eraser' && { opacity: 1 }]}>🧹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={clearAll}>
          <Feather name="trash-2" size={18} color={SHELL.iconOff} />
        </TouchableOpacity>

        <Sep />

        {/* 펜 색상 */}
        {tool === 'pen' && PEN_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[styles.colorDot, { backgroundColor: color }, penColor === color && styles.colorDotActive]}
            onPress={() => setPenColor(color)}
          />
        ))}

        {/* 지우개 굵기 */}
        {tool === 'eraser' && CANVAS.eraser.widths.map((w) => (
          <TouchableOpacity
            key={w}
            style={[styles.widthBtn, eraserWidth === w && styles.widthBtnActive]}
            onPress={() => setEraserWidth(w)}
          >
            <View style={[styles.eraserDot, { width: Math.min(w * 0.5, 20), height: Math.min(w * 0.5, 20) }]} />
          </TouchableOpacity>
        ))}

        <Sep />

        {/* 굵기 (펜 모드) */}
        {tool === 'pen' && CANVAS.pen.widths.map((w) => (
          <TouchableOpacity
            key={w}
            style={[styles.widthBtn, penWidth === w && styles.widthBtnActive]}
            onPress={() => setPenWidth(w)}
          >
            <View style={[styles.penDot, { width: w * 3 + 4, height: w * 3 + 4, backgroundColor: penColor }]} />
          </TouchableOpacity>
        ))}

        <Sep />

        {/* Undo / Redo */}
        <TouchableOpacity
          style={[styles.toolBtn, !canUndo && styles.toolBtnDisabled]}
          onPressIn={canUndo ? undoRepeat.onPressIn : undefined}
          onPressOut={undoRepeat.onPressOut}
          disabled={!canUndo}
        >
          <Feather name="corner-up-left" size={20} color={canUndo ? COLORS.textSecondary : SHELL.iconOff} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, !canRedo && styles.toolBtnDisabled]}
          onPressIn={canRedo ? redoRepeat.onPressIn : undefined}
          onPressOut={redoRepeat.onPressOut}
          disabled={!canRedo}
        >
          <Feather name="corner-up-right" size={20} color={canRedo ? COLORS.textSecondary : SHELL.iconOff} />
        </TouchableOpacity>

        <Sep />

        {/* 저장 */}
        <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveBtnText}>저장</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,253,249,0.97)',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: SHELL.border,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 34,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    backgroundColor: SHELL.tint,
  },
  toolBtnDisabled: {
    opacity: 0.35,
  },
  emoji: {
    fontSize: 20,
    opacity: 0.6,
  },
  sep: {
    width: 1,
    height: 28,
    backgroundColor: SHELL.border,
    marginHorizontal: 4,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginHorizontal: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: COLORS.surface,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
    transform: [{ scale: 1.2 }],
    borderWidth: 2.5,
  },
  widthBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widthBtnActive: {
    backgroundColor: SHELL.tint,
  },
  penDot: {
    borderRadius: 50,
  },
  eraserDot: {
    borderRadius: 3,
    backgroundColor: COLORS.textLight,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    marginLeft: 4,
  },
  saveBtnText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '600',
  },
});
