import React, { forwardRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, fontSizes, radii, spacing } from '../tokens.js';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

/**
 * Input — primary text field for forms.
 *
 * Visual states: rest, focused (burgundy ring), error (red border), disabled.
 * Tap target is 52px tall to satisfy WCAG 2.5.5 and feel premium under thumb.
 * `mode='onBlur'` validation in callers means we only show error after the user
 * leaves the field — never during typing.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, required, leftIcon, rightSlot, style, editable = true, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const showError = !!error;

  const wrapStyle = [
    styles.wrap,
    focused && !showError && styles.wrapFocused,
    showError && styles.wrapError,
    !editable && styles.wrapDisabled,
  ];

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View style={wrapStyle}>
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          style={[styles.input, leftIcon ? null : styles.inputPaddedLeft, style]}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
      {showError ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

/**
 * PasswordInput — text field with show/hide eye toggle.
 *
 * The eye sits in the rightSlot of the underlying Input so it inherits all the
 * focus/error styling. We use unicode glyphs instead of an icon dep so the UI
 * package stays icon-library-free.
 */
export const PasswordInput = forwardRef<TextInput, Omit<InputProps, 'secureTextEntry' | 'rightSlot'>>(
  function PasswordInput(props, ref) {
    const [hidden, setHidden] = useState(true);
    return (
      <Input
        {...props}
        ref={ref}
        secureTextEntry={hidden}
        autoCapitalize="none"
        autoCorrect={false}
        rightSlot={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            style={({ pressed }) => [styles.eye, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.eyeText}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        }
      />
    );
  },
);

const FOCUS_OUTLINE = Platform.select({
  web: { outlineStyle: 'none' as const },
  default: undefined,
});

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  required: { color: colors.danger },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    minHeight: 52,
    ...(Platform.OS === 'web' ? { transition: 'border-color 150ms ease, box-shadow 150ms ease' as never } : {}),
  },
  wrapFocused: {
    borderColor: colors.primary,
    ...(Platform.OS === 'web'
      ? { boxShadow: `0 0 0 4px ${colors.primaryRing}` as never }
      : {
          shadowColor: colors.primary,
          shadowOpacity: 0.18,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
        }),
  },
  wrapError: {
    borderColor: colors.danger,
    ...(Platform.OS === 'web'
      ? { boxShadow: `0 0 0 4px ${colors.dangerRing}` as never }
      : {}),
  },
  wrapDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  leftIcon: {
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  rightSlot: {
    paddingRight: spacing.sm,
    paddingLeft: spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: spacing.md,
    fontSize: fontSizes.md,
    color: colors.ink,
    ...(FOCUS_OUTLINE ?? {}),
  },
  inputPaddedLeft: {
    paddingLeft: spacing.md,
  },
  hint: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: fontSizes.xs * 1.4,
  },
  error: {
    fontSize: fontSizes.xs,
    color: colors.danger,
    marginTop: 6,
    fontWeight: '500',
    lineHeight: fontSizes.xs * 1.4,
  },
  eye: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.xs,
  },
  eyeText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.3,
  },
});
