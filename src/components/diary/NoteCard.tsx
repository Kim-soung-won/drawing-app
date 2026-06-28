import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { DiaryEntry } from '../../types/diary';
import { COLORS, SHELL } from '../../constants/colors';

interface Props {
  entry: DiaryEntry;
  cardWidth: number;
  onPress: () => void;
  onLongPress: () => void;
}

function formatMeta(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export default function NoteCard({ entry, cardWidth, onPress, onLongPress }: Props) {
  const cardHeight = Math.round(cardWidth * (4 / 3));

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth, height: cardHeight }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
    >
      {/* 썸네일 or 커버 */}
      <View style={styles.thumbArea}>
        {entry.thumbnailPath ? (
          <Image
            key={String(entry.updatedAt)}
            source={{ uri: entry.thumbnailPath }}
            style={styles.thumbImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbIcon}>✎</Text>
          </View>
        )}
      </View>

      {/* 메타 */}
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>
          {entry.title || '제목 없음'}
        </Text>
        <Text style={styles.metaText}>필사 · {formatMeta(entry.updatedAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    backgroundColor: COLORS.canvas,
    borderWidth: 1,
    borderColor: SHELL.border,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  thumbArea: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SHELL.work,
  },
  thumbIcon: {
    fontSize: 36,
    color: COLORS.textLight,
  },
  meta: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: SHELL.border,
    backgroundColor: COLORS.surface,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textLight,
  },
});
