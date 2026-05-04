import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { colors, fontSizes, radii, spacing } from '../tokens.js';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  block?: boolean;
  style?: ViewStyle;
}

/**
 * Button — primary action element across the app.
 *
 * States: rest, hovered (web only), pressed, disabled, loading.
 * Disabled and loading both lock the button and dim it; loading also swaps
 * label for a spinner in the variant's text color.
 */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading,
  leftIcon,
  rightIcon,
  block,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const sizing = sizeStyles[size];
  const v = variants[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        baseStyle,
        sizing.container,
        v.container,
        block && { alignSelf: 'stretch' },
        hovered && !isDisabled ? v.hover : null,
        pressed && !isDisabled ? v.pressed : null,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color} />
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={styles.iconWrap}>{leftIcon}</View> : null}
          <Text style={[sizing.text, v.text]}>{title}</Text>
          {rightIcon ? <View style={styles.iconWrap}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const baseStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii.md,
  borderWidth: 1.5,
  borderColor: 'transparent',
  ...(Platform.OS === 'web'
    ? ({
        transition: 'background-color 150ms ease, border-color 150ms ease, transform 120ms ease, opacity 120ms ease',
        cursor: 'pointer',
        userSelect: 'none',
      } as never)
    : {}),
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconWrap: { justifyContent: 'center', alignItems: 'center' },
  disabled: {
    opacity: 0.5,
    ...(Platform.OS === 'web' ? ({ cursor: 'not-allowed' } as never) : {}),
  },
});

const sizeStyles = {
  sm: StyleSheet.create({
    container: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 },
    text: { fontSize: fontSizes.sm, fontWeight: '600' as const, letterSpacing: 0.2 },
  }),
  md: StyleSheet.create({
    container: { paddingVertical: 12, paddingHorizontal: 20, minHeight: 48 },
    text: { fontSize: fontSizes.md, fontWeight: '600' as const, letterSpacing: 0.2 },
  }),
  lg: StyleSheet.create({
    container: { paddingVertical: 15, paddingHorizontal: 28, minHeight: 56 },
    text: { fontSize: fontSizes.md + 1, fontWeight: '700' as const, letterSpacing: 0.3 },
  }),
};

const variants = {
  primary: {
    container: { backgroundColor: colors.primary, borderColor: colors.primary },
    text: { color: '#FFFFFF' },
    hover: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
    pressed: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark, opacity: 0.92 },
  },
  accent: {
    container: { backgroundColor: colors.accent, borderColor: colors.accent },
    text: { color: '#1A1718' },
    hover: { backgroundColor: colors.accentDark, borderColor: colors.accentDark },
    pressed: { backgroundColor: colors.accentDark, borderColor: colors.accentDark, opacity: 0.92 },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderColor: colors.borderStrong },
    text: { color: colors.ink },
    hover: { backgroundColor: colors.surfaceAlt, borderColor: colors.ink },
    pressed: { backgroundColor: colors.surfaceMuted, borderColor: colors.ink, opacity: 0.95 },
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderColor: 'transparent' },
    text: { color: colors.primary },
    hover: { backgroundColor: colors.primary50 },
    pressed: { backgroundColor: colors.primary100, opacity: 0.95 },
  },
  danger: {
    container: { backgroundColor: colors.danger, borderColor: colors.danger },
    text: { color: '#FFFFFF' },
    hover: { backgroundColor: '#9A2F2F', borderColor: '#9A2F2F' },
    pressed: { backgroundColor: '#9A2F2F', borderColor: '#9A2F2F', opacity: 0.92 },
  },
  success: {
    container: { backgroundColor: colors.success, borderColor: colors.success },
    text: { color: '#FFFFFF' },
    hover: { backgroundColor: '#256849', borderColor: '#256849' },
    pressed: { backgroundColor: '#256849', borderColor: '#256849', opacity: 0.92 },
  },
} as const;
