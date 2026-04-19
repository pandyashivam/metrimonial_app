import React from 'react';
import {
  ActivityIndicator,
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
  const s = styles[size];
  const v = variants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        base,
        s.container,
        v.container,
        block && { alignSelf: 'stretch' },
        pressed && { opacity: 0.85 },
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          {leftIcon}
          <Text style={[s.text, v.text]}>{title}</Text>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}

const base: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii.sm,
  borderWidth: 1,
  borderColor: 'transparent',
};

const styles = {
  sm: StyleSheet.create({
    container: { paddingVertical: 6, paddingHorizontal: 12 },
    text: { fontSize: fontSizes.xs + 1, fontWeight: '600' as const },
  }),
  md: StyleSheet.create({
    container: { paddingVertical: 10, paddingHorizontal: 18 },
    text: { fontSize: fontSizes.sm + 1, fontWeight: '600' as const },
  }),
  lg: StyleSheet.create({
    container: { paddingVertical: 13, paddingHorizontal: 26 },
    text: { fontSize: fontSizes.md, fontWeight: '700' as const },
  }),
};

const variants = {
  primary: {
    container: { backgroundColor: colors.primary, borderColor: colors.primary },
    text: { color: '#fff' },
  },
  accent: {
    container: { backgroundColor: colors.accent, borderColor: colors.accent },
    text: { color: '#fff' },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderColor: colors.primary },
    text: { color: colors.primary },
  },
  ghost: {
    container: { backgroundColor: '#f2f2f5', borderColor: '#eaeaf0' },
    text: { color: colors.text },
  },
  danger: {
    container: { backgroundColor: colors.danger, borderColor: colors.danger },
    text: { color: '#fff' },
  },
  success: {
    container: { backgroundColor: colors.success, borderColor: colors.success },
    text: { color: '#fff' },
  },
} as const;
