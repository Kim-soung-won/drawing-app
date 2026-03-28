import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated } from 'react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  type: 'info' | 'success' | 'error';
}

const BG_COLORS = {
  info: '#555555',
  success: '#2D7A3D',
  error: '#C75050',
} as const;

export default function Toast({ visible, message, type }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible && (opacity as any)._value === 0) return null;

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: BG_COLORS[type] }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 24,
    right: 24,
    zIndex: 100,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
