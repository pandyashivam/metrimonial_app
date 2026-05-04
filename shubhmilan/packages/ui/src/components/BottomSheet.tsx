import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal as RNModal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
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
 * Adaptive surface for actions, filters, and confirmations.
 *
 *   • Phone / narrow web (< 768px): drag-to-dismiss bottom sheet.
 *   • Wide web (≥ 768px): centered dialog card. Drag handle and pan-responder
 *     are inert in this mode — no thumb to drag with on a desktop, and a sheet
 *     anchored to the bottom of a 1440px viewport just looks lost.
 *
 * The contract (`open`, `onClose`, `children`) is identical across modes so
 * callers don't need to branch.
 */
export function BottomSheet({
  open,
  onClose,
  children,
  maxHeight = 0.85,
  dismissOnBackdrop = true,
}: BottomSheetProps) {
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 768;

  const screenH = Dimensions.get('window').height;
  const translate = useRef(new Animated.Value(desktop ? 0 : screenH)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (desktop) {
      Animated.timing(fade, {
        toValue: open ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translate, {
        toValue: open ? 0 : screenH,
        duration: 240,
        useNativeDriver: true,
      }).start();
    }
  }, [open, screenH, translate, fade, desktop]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => !desktop && Math.abs(g.dy) > 8,
      onPanResponderMove: (_, g) => {
        if (!desktop && g.dy > 0) translate.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (desktop) return;
        if (g.dy > 120) {
          Animated.timing(translate, {
            toValue: screenH,
            duration: 180,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(translate, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  if (desktop) {
    return (
      <RNModal visible={open} transparent animationType="none" onRequestClose={onClose}>
        <Animated.View style={[styles.scrim, { opacity: fade }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissOnBackdrop ? onClose : undefined}
            accessibilityLabel="Close dialog"
          />
        </Animated.View>
        <View style={[styles.dialogWrap, { pointerEvents: 'box-none' }]}>
          <Animated.View
            style={[
              styles.dialog,
              { opacity: fade, transform: [{ scale: fade.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] },
            ]}
          >
            {children}
          </Animated.View>
        </View>
      </RNModal>
    );
  }

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
          { maxHeight: screenH * maxHeight, transform: [{ translateY: translate }] },
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
  dialogWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...shadows.lg,
  },
});
