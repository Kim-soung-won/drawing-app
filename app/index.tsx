import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useDiaryStore } from '../src/stores/diaryStore';
import DiaryCard from '../src/components/diary/DiaryCard';
import { COLORS } from '../src/constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { entries, isLoading, deleteEntry } = useDiaryStore();

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      '삭제',
      `"${title || '제목 없음'}"을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => deleteEntry(id),
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Pub Diary',
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: '700',
            color: COLORS.primary,
          },
        }}
      />
      <View style={styles.container}>
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✎</Text>
            <Text style={styles.emptyTitle}>아직 작성한 글이 없어요</Text>
            <Text style={styles.emptySubtitle}>
              아래 버튼을 눌러 첫 글을 써보세요
            </Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DiaryCard
                entry={item}
                onPress={() => router.push(`/view/${item.id}`)}
                onLongPress={() => handleDelete(item.id, item.title)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/write')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyIcon: {
    fontSize: 48,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  list: {
    paddingTop: 12,
    paddingBottom: 100,
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
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: COLORS.white,
    lineHeight: 34,
  },
});
