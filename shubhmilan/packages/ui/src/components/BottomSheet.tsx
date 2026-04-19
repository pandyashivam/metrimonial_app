import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal as RNModal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { colors, radii, shadows, spacing } from '../tokens.js';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Sheet max height as a fraction of screen height (0–1). Default: 0.85. */
  maxHeight?: number;
  dismissOnBackdrop?: boolean;
}

/**
 * Minimal bottom-sheet — drag-to-dismiss handle, scrim tap dismiss, spring-in/out. Good
 * enough for action menus, filters, and confirmation prompts without pulling in a heavier
 * dep like @gorhom/bottom-sheet.
 */
export function BottomSheet({
  open,
  onClose,
  children,
  maxHeight = 0.85,
  dismissOnBackdrop = true,
}: BottomSheetProps) {
  const screen = Dimensions.get('window').height;
  const translate = useRef(new Animated.Value(screen)).current;

  useEffect(() => {
    Animated.timing(translate, {
      toValue: open ? 0 : screen,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [open, screen, translate]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translate.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120) {
          Animated.timing(translate, {
            toValue: screen,
            duration: 180,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(translate, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  return (
    <RNModal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        style={styles.scrim}
        onPress={dismissOnBackdrop ? onClose : undefined}
        accessibilityLabel="Close sheet"
      />
      <Animated.View
        style={[
          styles.sheet,
          { maxHeight: screen * maxHeight, transform: [{ translateY: translate }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handle} />
        <View>{children}</View>
      </Animated.View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12,12,18,0.45)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
});
