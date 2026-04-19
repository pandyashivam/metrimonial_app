import React from 'react';
import { Modal as RNModal, Pressable, StyleSheet, Text, View, type ModalProps as RNModalProps } from 'react-native';

import { colors, fontSizes, radii, shadows, spacing } from '../tokens.js';

export interface ModalProps extends Omit<RNModalProps, 'children'> {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** When true, tapping the scrim closes the modal. Default: true. */
  dismissOnBackdrop?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  dismissOnBackdrop = true,
  animationType = 'fade',
  ...rest
}: ModalProps) {
  return (
    <RNModal
      visible={open}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      accessibilityViewIsModal
      {...rest}
    >
      <Pressable
        style={styles.scrim}
        onPress={dismissOnBackdrop ? onClose : undefined}
        accessibilityLabel="Close"
      >
        <Pressable onPress={() => null} style={styles.card}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <View>{children}</View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(12,12,18,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 440,
    ...shadows.lg,
  },
  title: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
});
