import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, shadows, spacing } from '../tokens.js';

/**
 * Lightweight toast system. One `<ToastProvider>` high in the tree, then any descendant
 * calls `useToast().show({...})`. Toasts stack at the bottom, auto-dismiss in 3s.
 */

type Tone = 'neutral' | 'success' | 'warn' | 'danger' | 'info';

export interface ToastPayload {
  id?: string;
  title?: string;
  message: string;
  tone?: Tone;
  durationMs?: number;
}

interface Ctx {
  show: (t: Omit<ToastPayload, 'id'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<Ctx | null>(null);

export function useToast(): Ctx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `t${idCounter}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastPayload[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const show = useCallback<Ctx['show']>(
    (t) => {
      const id = nextId();
      setItems((prev) => [...prev, { ...t, id }]);
      const timeout = t.durationMs ?? 3000;
      setTimeout(() => dismiss(id), timeout);
      return id;
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <View pointerEvents="box-none" style={styles.stack}>
        {items.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast }: { toast: ToastPayload }) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [fade]);
  const tone = toast.tone ?? 'neutral';
  const bg = toneColors[tone].bg;
  const fg = toneColors[tone].fg;
  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.toast, { backgroundColor: bg, borderColor: fg, opacity: fade }]}
    >
      {toast.title ? <Text style={[styles.title, { color: fg }]}>{toast.title}</Text> : null}
      <Text style={[styles.message, { color: fg }]}>{toast.message}</Text>
    </Animated.View>
  );
}

const toneColors: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: '#1a1a22', fg: '#ffffff' },
  success: { bg: colors.success50, fg: colors.success },
  warn: { bg: colors.warn50, fg: colors.warn },
  danger: { bg: colors.danger50, fg: colors.danger },
  info: { bg: colors.info50, fg: colors.info },
};

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.sm,
  },
  toast: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    maxWidth: 420,
    minWidth: 240,
    ...shadows.lg,
  },
  title: { fontSize: fontSizes.sm, fontWeight: '700', marginBottom: 2 },
  message: { fontSize: fontSizes.sm + 1 },
});
