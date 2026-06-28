import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Canvas, Rect } from '@shopify/react-native-skia';
import { Feather } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';
import { COLORS, SHELL } from '../../constants/colors';
import { Page } from '../../types/diary';

const SIDEBAR_W = 180;
const THUMB_W = 100;
const THUMB_H = Math.round(THUMB_W * (4 / 3));

export { SIDEBAR_W };

function PageThumb({ page, coverColor, isActive }: { page: Page; coverColor: string; isActive: boolean }) {
  return (
    <View style={[styles.thumbWrap, isActive && styles.thumbWrapActive]}>
      <Canvas style={{ width: THUMB_W, height: THUMB_H }}>
        <Rect x={0} y={0} width={THUMB_W} height={THUMB_H} color={coverColor} />
      </Canvas>
    </View>
  );
}

interface Props {
  title: string;
  onAddPage: () => void;
}

export default function PageSidebar({ title, onAddPage }: Props) {
  const { pages, currentPageIndex, coverColor, setCurrentPageIndex } = useCanvasStore();

  return (
    <View style={styles.sidebar}>
      {/* 헤더 */}
      <View style={styles.sideHeader}>
        <Text style={styles.sideCaption}>필사 노트</Text>
        <Text style={styles.sideTitle} numberOfLines={1}>{title || '제목 없음'}</Text>
        <Text style={styles.sideMeta}>{pages.length}페이지</Text>
      </View>

      <View style={styles.divider} />

      {/* 페이지 목록 */}
      <FlatList
        data={pages}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.thumbList}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => setCurrentPageIndex(index)}
            activeOpacity={0.8}
            style={styles.thumbItem}
          >
            <PageThumb page={item} coverColor={coverColor} isActive={index === currentPageIndex} />
            <Text style={[styles.thumbLabel, index === currentPageIndex && styles.thumbLabelActive]}>
              {index + 1}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* 페이지 추가 */}
      <TouchableOpacity style={styles.addPageBtn} onPress={onAddPage} activeOpacity={0.7}>
        <Feather name="plus" size={18} color={COLORS.primary} />
        <Text style={styles.addPageText}>페이지 추가</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: SHELL.border,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sideHeader: {
    paddingHorizontal: 14,
    gap: 2,
    paddingBottom: 12,
  },
  sideCaption: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textLight,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sideTitle: {
    fontSize: 16,
    fontFamily: 'NanumMyeongjo_700Bold',
    color: COLORS.text,
  },
  sideMeta: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: SHELL.border,
    marginHorizontal: 14,
    marginBottom: 12,
  },
  thumbList: {
    paddingHorizontal: 14,
    gap: 12,
    flexGrow: 1,
  },
  thumbItem: {
    alignItems: 'center',
    gap: 6,
  },
  thumbWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrapActive: {
    borderColor: SHELL.sage,
  },
  thumbLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  thumbLabelActive: {
    color: SHELL.sage,
    fontWeight: '700',
  },
  addPageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 14,
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: SHELL.border,
    borderStyle: 'dashed',
  },
  addPageText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
