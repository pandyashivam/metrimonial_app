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
 * On web we deliberately avoid React-state-driven focus styling: react-native-web
 * 0.19 has a known issue where calling `setState` synchronously inside `onFocus`
 * triggers a re-render that interrupts the browser's focus settle, causing the
 * input to immediately blur. The focus ring is therefore drawn purely by CSS via
 * the `:focus-within` pseudo-class on a `<style>` block we inject once. On native
 * the `setFocused` state still drives the ring through the standard RN style
 * pathway — there's no DOM, so no blur loop.
 *
 * Tap target is 52px tall to satisfy WCAG 2.5.5 and feel premium under thumb.
 * `mode='onBlur'` validation in callers means we only show error after the user
 * leaves the field — never during typing.
 */

ensureWebFocusRingStyle();

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, required, leftIcon, rightSlot, style, editable = true, ...rest },
  ref,
) {
  // Native-only: track focus in state so the wrap can show the ring.
  // On web the wrap's `:focus-within` rule does this without a re-render.
  const [focusedNative, setFocusedNative] = useState(false);
  const showError = !!error;
  const isWeb = Platform.OS === 'web';

  const wrapStyle = [
    styles.wrap,
    !isWeb && focusedNative && !showError ? styles.wrapFocusedNative : null,
    showError ? styles.wrapError : null,
    !editable ? styles.wrapDisabled : null,
  ];

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View
        style={wrapStyle}
        // Used by the injected web stylesheet to apply :focus-within styling
        // without forcing a React re-render.
        {...(isWeb ? { dataSet: { shubhmilanInput: showError ? 'error' : 'normal' } } : {})}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          style={[styles.input, leftIcon ? null : styles.inputPaddedLeft, style]}
          {...rest}
          onFocus={(e) => {
            if (!isWeb) setFocusedNative(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            if (!isWeb) setFocusedNative(false);
            rest.onBlur?.(e);
          }}
        />
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
      {showError ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
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
 * focus/error styling. We use a text "Show / Hide" label instead of an icon dep
 * so the UI package stays icon-library-free.
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

// ---------- Web focus-ring stylesheet ----------

const STYLE_ID = 'shubhmilan-input-focus-ring';

/**
 * Inject a single `<style>` block on the web that paints the focus ring via
 * `:focus-within` instead of through React state. Idempotent — running multiple
 * times is a no-op.
 */
function ensureWebFocusRingStyle(): void {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const css = `
    [data-shubhmilan-input="normal"]:focus-within {
      border-color: ${colors.primary} !important;
      box-shadow: 0 0 0 4px ${colors.primaryRing};
    }
    [data-shubhmilan-input="error"]:focus-within {
      box-shadow: 0 0 0 4px ${colors.dangerRing};
    }
    [data-shubhmilan-input] input,
    [data-shubhmilan-input] textarea {
      outline: none !important;
    }
  `;
  const tag = document.createElement('style');
  tag.id = STYLE_ID;
  tag.appendChild(document.createTextNode(css));
  document.head.appendChild(tag);
}

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
    ...(Platform.OS === 'web'
      ? ({ transition: 'border-color 150ms ease, box-shadow 150ms ease' } as never)
      : {}),
  },
  wrapFocusedNative: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  wrapError: {
    borderColor: colors.danger,
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
  errorText: {
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
