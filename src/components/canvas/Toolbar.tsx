import React, { useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useCanvasStore } from '../../stores/canvasStore';
import { COLORS, PEN_COLORS } from '../../constants/colors';
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
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Tool selector */}
        <View style={styles.group}>
          <TouchableOpacity
            style={[styles.toolBtn, tool === 'pen' && styles.toolBtnActive]}
            onPress={() => setTool('pen')}
          >
            <Text style={[styles.toolIcon, tool === 'pen' && styles.toolIconActive]}>
              ✏️
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolBtn, tool === 'eraser' && styles.toolBtnActive]}
            onPress={() => setTool('eraser')}
          >
            <Text style={[styles.toolIcon, tool === 'eraser' && styles.toolIconActive]}>
              🧹
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={clearAll}
          >
            <Text style={styles.toolIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {/* Pen / Eraser widths */}
        <View style={styles.group}>
          {tool === 'pen'
            ? CANVAS.pen.widths.map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[
                    styles.widthBtn,
                    penWidth === w && styles.widthBtnActive,
                  ]}
                  onPress={() => setPenWidth(w)}
                >
                  <View
                    style={[
                      styles.widthDot,
                      {
                        width: w * 3 + 4,
                        height: w * 3 + 4,
                        backgroundColor: penColor,
                      },
                    ]}
                  />
                </TouchableOpacity>
              ))
            : CANVAS.eraser.widths.map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[
                    styles.widthBtn,
                    eraserWidth === w && styles.eraserWidthBtnActive,
                  ]}
                  onPress={() => setEraserWidth(w)}
                >
                  <View
                    style={[
                      styles.eraserPreview,
                      {
                        width: Math.min(w * 0.7, 26),
                        height: Math.min(w * 0.7, 26),
                      },
                    ]}
                  />
                </TouchableOpacity>
              ))}
        </View>

        {/* Undo / Redo with long press repeat */}
        <View style={styles.group}>
          <TouchableOpacity
            style={[styles.actionBtn, !canUndo && styles.actionBtnDisabled]}
            onPressIn={canUndo ? undoRepeat.onPressIn : undefined}
            onPressOut={undoRepeat.onPressOut}
            disabled={!canUndo}
          >
            <Text style={[styles.actionIcon, !canUndo && styles.actionIconDisabled]}>
              ↩
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, !canRedo && styles.actionBtnDisabled]}
            onPressIn={canRedo ? redoRepeat.onPressIn : undefined}
            onPressOut={redoRepeat.onPressOut}
            disabled={!canRedo}
          >
            <Text style={[styles.actionIcon, !canRedo && styles.actionIconDisabled]}>
              ↪
            </Text>
          </TouchableOpacity>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveBtnText}>저장</Text>
        </TouchableOpacity>
      </View>

      {/* Color palette - always rendered for fixed height, invisible when eraser */}
      <View style={[styles.colorRow, tool !== 'pen' && { opacity: 0 }]}>
        {PEN_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorBtn,
              { backgroundColor: color },
              penColor === color && styles.colorBtnActive,
            ]}
            onPress={() => setPenColor(color)}
            disabled={tool !== 'pen'}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  toolBtnActive: {
    backgroundColor: COLORS.primary,
  },
  toolIcon: {
    fontSize: 18,
    color: COLORS.text,
  },
  toolIconActive: {
    color: COLORS.white,
  },
  widthBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  widthBtnActive: {
    backgroundColor: COLORS.accentLight,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  eraserWidthBtnActive: {
    backgroundColor: '#f0e0e0',
    borderWidth: 1.5,
    borderColor: '#c48080',
  },
  eraserPreview: {
    borderRadius: 2,
    backgroundColor: '#999',
  },
  widthDot: {
    borderRadius: 50,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionIcon: {
    fontSize: 20,
    color: COLORS.text,
  },
  actionIconDisabled: {
    color: COLORS.textLight,
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  colorBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorBtnActive: {
    borderColor: COLORS.accent,
    borderWidth: 2.5,
    transform: [{ scale: 1.15 }],
  },
});
