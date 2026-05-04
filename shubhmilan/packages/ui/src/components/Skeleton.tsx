import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type ViewStyle,
} from 'react-native';

import { colors, radii, spacing } from '../tokens.js';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
  style?: ViewStyle;
}

/**
 * Skeleton — pulsing placeholder used while data loads. Beats raw "Loading…"
 * text every time. Composes well: stack a few in a `<SkeletonGroup>`-style
 * layout to mimic the shape of the content being awaited.
 */
export function Skeleton({ width = '100%', height = 16, rounded = 6, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 720, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 720, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: rounded,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Stock list-row skeleton — title + two short body lines. Useful for messages
 * lists, search results, etc.
 */
export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton width={48} height={48} rounded={24} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton height={14} width="55%" />
        <Skeleton height={12} width="80%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surfaceMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
});
