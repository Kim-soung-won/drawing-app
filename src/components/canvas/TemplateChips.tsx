import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { PageTemplate } from '../../types/diary';
import { COLORS, SHELL } from '../../constants/colors';

const TEMPLATES: { key: PageTemplate; label: string }[] = [
  { key: 'blank', label: '무지' },
  { key: 'lined', label: '괘선' },
  { key: 'grid', label: '모눈' },
  { key: 'dotted', label: '도트' },
];

interface Props {
  current: PageTemplate;
  onChange: (t: PageTemplate) => void;
}

export default function TemplateChips({ current, onChange }: Props) {
  return (
    <View style={styles.row}>
      {TEMPLATES.map(({ key, label }) => {
        const active = current === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: SHELL.work,
    borderWidth: 1,
    borderColor: SHELL.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.background,
  },
});
