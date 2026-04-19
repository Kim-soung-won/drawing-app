import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { PageTemplate } from '../../types/diary';
import { COVER_COLORS, PAGE_TEMPLATES } from '../../constants/diary';
import { COLORS } from '../../constants/colors';

interface Props {
  visible: boolean;
  mode: 'new' | 'add';
  initialCoverColor?: string;
  initialTemplate?: PageTemplate;
  onConfirm: (coverColor: string, template: PageTemplate) => void;
  onCancel?: () => void;
}

// 미리보기 컴포넌트 - 각 템플릿의 시각적 패턴을 보여줌
function TemplatePreview({
  template,
  bgColor,
}: {
  template: PageTemplate;
  bgColor: string;
}) {
  const lines = [];

  if (template === 'lined') {
    for (let i = 0; i < 5; i++) {
      lines.push(
        <View
          key={i}
          style={[previewStyles.hLine, { top: 12 + i * 11 }]}
        />,
      );
    }
  } else if (template === 'grid') {
    for (let i = 0; i < 5; i++) {
      lines.push(
        <View key={`h${i}`} style={[previewStyles.hLine, { top: 12 + i * 11 }]} />,
      );
    }
    for (let i = 0; i < 4; i++) {
      lines.push(
        <View key={`v${i}`} style={[previewStyles.vLine, { left: 14 + i * 14 }]} />,
      );
    }
  } else if (template === 'dotted') {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        lines.push(
          <View
            key={`${r}-${c}`}
            style={[previewStyles.dot, { top: 10 + r * 14, left: 10 + c * 14 }]}
          />,
        );
      }
    }
  }

  return (
    <View style={[previewStyles.container, { backgroundColor: bgColor }]}>
      {lines}
    </View>
  );
}

export default function TemplateSelectDialog({
  visible,
  mode,
  initialCoverColor,
  initialTemplate,
  onConfirm,
  onCancel,
}: Props) {
  const [selectedCover, setSelectedCover] = useState(
    initialCoverColor ?? COVER_COLORS[0].color,
  );
  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate>(
    initialTemplate ?? 'blank',
  );

  const bgColor = mode === 'new' ? selectedCover : (initialCoverColor ?? COVER_COLORS[0].color);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {mode === 'new' ? '새 일기 시작' : '페이지 추가'}
          </Text>

          {/* 표지 색상 선택 (새 일기 시작 시에만) */}
          {mode === 'new' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>표지 색상</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.coverRow}
              >
                {COVER_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedCover(c.color)}
                    style={styles.coverBtnWrapper}
                  >
                    <View
                      style={[
                        styles.coverBtn,
                        { backgroundColor: c.color },
                        selectedCover === c.color && styles.coverBtnSelected,
                      ]}
                    />
                    <Text style={styles.coverLabel}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 페이지 양식 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>페이지 양식</Text>
            <View style={styles.templateGrid}>
              {PAGE_TEMPLATES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setSelectedTemplate(t.id)}
                  style={[
                    styles.templateBtn,
                    selectedTemplate === t.id && styles.templateBtnSelected,
                  ]}
                >
                  <TemplatePreview template={t.id} bgColor={bgColor} />
                  <Text
                    style={[
                      styles.templateLabel,
                      selectedTemplate === t.id && styles.templateLabelSelected,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 버튼 */}
          <View style={styles.buttonRow}>
            {onCancel && (
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.confirmBtn, onCancel ? styles.confirmBtnFlex : styles.confirmBtnFull]}
              onPress={() => onConfirm(selectedCover, selectedTemplate)}
            >
              <Text style={styles.confirmBtnText}>
                {mode === 'new' ? '시작하기' : '추가하기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const previewStyles = StyleSheet.create({
  container: {
    width: 62,
    height: 78,
    borderRadius: 4,
    overflow: 'hidden',
  },
  hLine: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  vLine: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 420,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  coverRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 2,
  },
  coverBtnWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  coverBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  coverBtnSelected: {
    borderColor: COLORS.accent,
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  coverLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  templateBtn: {
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: COLORS.card,
  },
  templateBtnSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
  templateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  templateLabelSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  confirmBtnFlex: {
    flex: 2,
  },
  confirmBtnFull: {
    flex: 1,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
