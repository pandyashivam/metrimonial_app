import React from 'react';
import { KeyboardAvoidingView, Platform, type ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Extra offset above the keyboard (e.g. for a header). Defaults to 0. */
  keyboardVerticalOffset?: number;
}

/**
 * KeyboardSafe — cross-platform replacement for `KeyboardAvoidingView`.
 *
 * iOS: `padding` (the only behavior that works correctly).
 * Android: `undefined` — Android handles this natively via `windowSoftInputMode`,
 *          and using `padding` here causes double-shifting.
 * Web: `padding` — without this, tall forms can hide the active input under the
 *      on-screen keyboard on tablets / Chromebooks.
 *
 * Use this anywhere we previously wrote `KeyboardAvoidingView behavior={...}`.
 */
export function KeyboardSafe({ children, style, keyboardVerticalOffset = 0 }: Props) {
  const behavior =
    Platform.OS === 'ios' || Platform.OS === 'web' ? 'padding' : undefined;
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
