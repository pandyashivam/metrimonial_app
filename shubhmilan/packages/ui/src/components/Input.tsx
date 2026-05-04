import React, { forwardRef, useEffect, useState } from 'react';
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
 * Web: renders a real native `<input>` (or `<textarea>` for multiline) directly.
 *      Bypasses react-native-web's TextInput layer, which has known focus-loss
 *      issues with state updates. The wrap is a normal View; focus styling
 *      uses CSS :focus-within via an injected stylesheet.
 *
 * Native: standard RN TextInput with a useState-driven focus ring.
 *
 * Tap target is 52px tall to satisfy WCAG 2.5.5 and feel premium under thumb.
 */

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, required, leftIcon, rightSlot, style, editable = true, ...rest },
  ref,
) {
  const showError = !!error;
  const isWeb = Platform.OS === 'web';

  // Native-only: focus state for the burgundy ring. Web uses CSS :focus-within.
  const [focusedNative, setFocusedNative] = useState(false);

  useEffect(() => {
    if (isWeb) ensureWebFocusRingStyle();
  }, [isWeb]);

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
        {...(isWeb ? { dataSet: { shubhmilanInput: showError ? 'error' : 'normal' } } : {})}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        {isWeb ? (
          <WebInput
            innerRef={ref as unknown as React.Ref<HTMLInputElement | HTMLTextAreaElement>}
            editable={editable}
            hasLeftIcon={!!leftIcon}
            {...rest}
          />
        ) : (
          <TextInput
            ref={ref}
            editable={editable}
            placeholderTextColor={colors.textSubtle}
            selectionColor={colors.primary}
            style={[styles.input, leftIcon ? null : styles.inputPaddedLeft, style]}
            {...rest}
            onFocus={(e) => {
              setFocusedNative(true);
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocusedNative(false);
              rest.onBlur?.(e);
            }}
          />
        )}
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
 * Web-only renderer that emits a real `<input>` (or `<textarea>` for multiline).
 *
 * Translates the subset of TextInput props we use into HTML attributes. We do
 * this via React.createElement so we don't need to convince TypeScript that
 * raw HTML JSX tags exist in a React Native environment.
 */
interface WebInputProps extends Omit<TextInputProps, 'style'> {
  innerRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement>;
  hasLeftIcon: boolean;
}

function WebInput({
  innerRef,
  editable = true,
  hasLeftIcon,
  value,
  defaultValue,
  onChangeText,
  onChange,
  onFocus,
  onBlur,
  onSubmitEditing,
  onKeyPress,
  placeholder,
  secureTextEntry,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  inputMode,
  keyboardType,
  maxLength,
  multiline,
  numberOfLines,
  returnKeyType,
}: WebInputProps) {
  const inputType = secureTextEntry ? 'password' : inputModeToInputType(inputMode, keyboardType);
  const autoCompleteHtml = autoCompleteToHtml(autoComplete);
  const autoCapHtml = autoCapToHtml(autoCapitalize);
  const enterKey = returnKeyTypeToEnterKey(returnKeyType);

  const baseStyle: React.CSSProperties = {
    flex: 1,
    border: 0,
    outline: 'none',
    background: 'transparent',
    color: colors.ink,
    fontSize: fontSizes.md,
    fontFamily: 'inherit',
    padding: '14px 12px',
    paddingLeft: hasLeftIcon ? 4 : 12,
    minWidth: 0,
    width: '100%',
  };

  const sharedProps = {
    ref: innerRef as never,
    value: value as string | undefined,
    defaultValue: defaultValue as string | undefined,
    placeholder,
    disabled: !editable,
    autoComplete: autoCompleteHtml,
    autoCapitalize: autoCapHtml,
    autoCorrect: autoCorrect === false ? 'off' : undefined,
    spellCheck: autoCorrect === false ? false : undefined,
    maxLength,
    enterKeyHint: enterKey,
    onChange: (e: { target: { value: string } }) => {
      onChangeText?.(e.target.value);
      // RN-style synthetic event isn't available here; we only fire the simple
      // onChangeText path which is what every caller actually uses.
      void onChange;
    },
    onFocus: onFocus as unknown as (e: unknown) => void,
    onBlur: onBlur as unknown as (e: unknown) => void,
    onKeyDown: (e: { key: string; target: { value?: string } }) => {
      if (e.key === 'Enter' && !multiline) {
        onSubmitEditing?.({ nativeEvent: { text: e.target.value ?? '' } } as never);
      }
      onKeyPress?.({ nativeEvent: { key: e.key } } as never);
    },
    style: baseStyle,
  } as const;

  if (multiline) {
    return React.createElement('textarea', {
      ...sharedProps,
      rows: numberOfLines ?? 4,
      style: { ...baseStyle, resize: 'vertical' as const, minHeight: 96 },
    });
  }
  return React.createElement('input', { ...sharedProps, type: inputType });
}

function inputModeToInputType(
  inputMode?: TextInputProps['inputMode'],
  keyboardType?: TextInputProps['keyboardType'],
): string {
  if (inputMode === 'email') return 'email';
  if (inputMode === 'tel' || keyboardType === 'phone-pad') return 'tel';
  if (inputMode === 'url') return 'url';
  if (inputMode === 'numeric' || keyboardType === 'numeric' || keyboardType === 'number-pad') return 'text';
  if (inputMode === 'decimal') return 'text';
  if (inputMode === 'search') return 'search';
  return 'text';
}

function autoCompleteToHtml(autoComplete?: TextInputProps['autoComplete']): string | undefined {
  if (!autoComplete) return undefined;
  // Most RN values map 1:1 to HTML autocomplete tokens.
  const map: Record<string, string> = {
    off: 'off',
    name: 'name',
    'given-name': 'given-name',
    'family-name': 'family-name',
    email: 'email',
    tel: 'tel',
    'street-address': 'street-address',
    postal: 'postal-code',
    'postal-code': 'postal-code',
    country: 'country',
    username: 'username',
    password: 'current-password',
    'current-password': 'current-password',
    'new-password': 'new-password',
    'one-time-code': 'one-time-code',
    'cc-number': 'cc-number',
    'cc-csc': 'cc-csc',
    'cc-exp': 'cc-exp',
    'cc-name': 'cc-name',
  };
  return map[autoComplete] ?? autoComplete;
}

function autoCapToHtml(autoCapitalize?: TextInputProps['autoCapitalize']): string | undefined {
  if (!autoCapitalize) return undefined;
  if (autoCapitalize === 'characters') return 'characters';
  if (autoCapitalize === 'words') return 'words';
  if (autoCapitalize === 'sentences') return 'sentences';
  if (autoCapitalize === 'none') return 'off';
  return undefined;
}

function returnKeyTypeToEnterKey(t?: TextInputProps['returnKeyType']): string | undefined {
  if (!t) return undefined;
  const map: Record<string, string> = {
    done: 'done',
    go: 'go',
    next: 'next',
    search: 'search',
    send: 'send',
  };
  return map[t];
}

/**
 * PasswordInput — text field with show/hide eye toggle.
 *
 * The eye sits in the rightSlot of the underlying Input so it inherits all the
 * focus / error styling. We use a "Show / Hide" text label rather than an icon
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

interface WebElement {
  id: string;
  appendChild: (child: WebElement) => void;
}
interface WebDocument {
  head: WebElement;
  getElementById: (id: string) => WebElement | null;
  createElement: (tag: string) => WebElement;
  createTextNode: (text: string) => WebElement;
}

function ensureWebFocusRingStyle(): void {
  const doc = (globalThis as unknown as { document?: WebDocument }).document;
  if (!doc) return;
  if (doc.getElementById(STYLE_ID)) return;
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
  const tag = doc.createElement('style');
  tag.id = STYLE_ID;
  tag.appendChild(doc.createTextNode(css));
  doc.head.appendChild(tag);
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
