import React, { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../tokens.js';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, required, leftIcon, style, ...rest },
  ref,
) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
      )}
      <View style={[styles.wrap, error ? styles.wrapError : null]}>
        {leftIcon && <View style={{ marginLeft: spacing.sm }}>{leftIcon}</View>}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          {...rest}
        />
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 6,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d8d8df',
    borderRadius: radii.sm,
    backgroundColor: '#fff',
  },
  wrapError: { borderColor: colors.danger },
  input: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 13,
    fontSize: fontSizes.sm + 1,
    color: colors.ink,
  },
  hint: { fontSize: fontSizes.xs + 1, color: colors.textMuted, marginTop: 4 },
  error: { fontSize: fontSizes.xs + 1, color: colors.danger, marginTop: 4, fontWeight: '500' },
});
