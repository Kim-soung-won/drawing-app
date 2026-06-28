import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHELL } from '../../constants/colors';
import { useDiaryStore } from '../../stores/diaryStore';

interface Props {
  selectedFilter: 'all' | 'write';
  onSelectFilter: (f: 'all' | 'write') => void;
}

export default function CollectionSidebar({ selectedFilter, onSelectFilter }: Props) {
  const entries = useDiaryStore((s) => s.entries);

  const collections = [
    { key: 'all' as const, icon: 'layers' as const, label: '전체 노트', count: entries.length },
    { key: 'write' as const, icon: 'edit-2' as const, label: '필사', count: entries.length },
  ];

  return (
    <View style={styles.sidebar}>
      {/* 워드마크 */}
      <View style={styles.wordmark}>
        <Text style={styles.wordmarkTitle}>필담</Text>
        <Text style={styles.wordmarkSub}>pildam · 筆談</Text>
      </View>

      <View style={styles.divider} />

      {/* 컬렉션 */}
      <Text style={styles.sectionLabel}>컬렉션</Text>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        {collections.map((c) => {
          const active = selectedFilter === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => onSelectFilter(c.key)}
              activeOpacity={0.7}
            >
              <Feather name={c.icon} size={16} color={active ? COLORS.primaryDark : COLORS.textSecondary} />
              <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{c.label}</Text>
              <Text style={[styles.itemCount, active && styles.itemCountActive]}>{c.count}</Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.divider} />

        {/* 태그 섹션 */}
        <Text style={styles.sectionLabel}>태그</Text>
        {['시', '캘리그라피', '일기'].map((tag) => (
          <TouchableOpacity key={tag} style={styles.tagChip} activeOpacity={0.7}>
            <Text style={styles.tagText}># {tag}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: SHELL.border,
    paddingTop: 20,
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  wordmark: {
    paddingBottom: 12,
    gap: 2,
  },
  wordmarkTitle: {
    fontSize: 23,
    fontFamily: 'NanumMyeongjo_800ExtraBold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  wordmarkSub: {
    fontSize: 11,
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: SHELL.border,
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textLight,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 4,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 2,
  },
  itemActive: {
    backgroundColor: 'rgba(139,115,85,0.12)',
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  itemLabelActive: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  itemCount: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  itemCountActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
