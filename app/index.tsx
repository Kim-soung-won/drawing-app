import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useDiaryStore } from '../src/stores/diaryStore';
import NoteCard from '../src/components/diary/NoteCard';
import CollectionSidebar from '../src/components/shell/CollectionSidebar';
import { useOrientation } from '../src/hooks/useOrientation';
import { COLORS, SHELL } from '../src/constants/colors';
import { RAIL_W } from '../src/components/shell/Rail';

const SIDEBAR_W = 220;
const GRID_GAP = 16;
const GRID_H_PAD = 20;

export default function HomeScreen() {
  const router = useRouter();
  const { isPortrait, width } = useOrientation();
  const { entries, isLoading, deleteEntry } = useDiaryStore();
  const [filter, setFilter] = useState<'all' | 'write'>('all');

  const numColumns = isPortrait ? 2 : 4;

  const sidebarW = isPortrait ? 0 : SIDEBAR_W;
  const availableW = width - RAIL_W - sidebarW - GRID_H_PAD * 2;
  const cardWidth = Math.floor((availableW - GRID_GAP * (numColumns - 1)) / numColumns);

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      '삭제',
      `"${title || '제목 없음'}"을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => deleteEntry(id) },
      ],
    );
  };

  // 빈 카드 패딩 (그리드 마지막 줄 정렬용)
  const paddedEntries = useMemo(() => {
    const rem = entries.length % numColumns;
    if (rem === 0) return entries;
    return [...entries, ...Array(numColumns - rem).fill(null)];
  }, [entries, numColumns]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 컬렉션 사이드바 (가로 모드) */}
      {!isPortrait && (
        <CollectionSidebar selectedFilter={filter} onSelectFilter={setFilter} />
      )}

      {/* 메인 영역 */}
      <View style={styles.main}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>전체 노트</Text>
            <Text style={styles.headerSub}>{entries.length}개의 노트</Text>
          </View>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push('/write')}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={18} color={COLORS.background} />
            <Text style={styles.newBtnText}>새 노트</Text>
          </TouchableOpacity>
        </View>

        {/* 그리드 */}
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✎</Text>
            <Text style={styles.emptyTitle}>아직 작성한 글이 없어요</Text>
            <Text style={styles.emptySubtitle}>오른쪽 위 버튼으로 첫 글을 써보세요</Text>
          </View>
        ) : (
          <FlatList
            key={numColumns}
            data={paddedEntries}
            keyExtractor={(item, i) => item?.id ?? `empty-${i}`}
            numColumns={numColumns}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              if (!item) return <View style={{ width: cardWidth }} />;
              return (
                <NoteCard
                  entry={item}
                  cardWidth={cardWidth}
                  onPress={() => router.push(`/view/${item.id}`)}
                  onLongPress={() => handleDelete(item.id, item.title)}
                />
              );
            }}
          />
        )}
      </View>

      {/* 세로 모드 FAB */}
      {isPortrait && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/write')}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={28} color={COLORS.background} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: SHELL.work,
  },
  main: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_H_PAD,
    paddingTop: 28,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: SHELL.border,
    backgroundColor: COLORS.surface,
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'NanumMyeongjo_800ExtraBold',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 11,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  newBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.background,
  },
  grid: {
    padding: GRID_H_PAD,
    gap: GRID_GAP,
  },
  row: {
    gap: GRID_GAP,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    color: COLORS.textLight,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
