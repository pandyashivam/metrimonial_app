import { FontAwesome6 } from '@expo/vector-icons';
import { Button, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppLock } from './app-lock';

/**
 * Full-screen lock shown when `useAppLock.locked` is true. We auto-trigger the biometric
 * prompt once on mount; if the user cancels, they can tap the button to retry.
 */
export function LockScreen() {
  const tryUnlock = useAppLock((s) => s.tryUnlock);

  useEffect(() => {
    void tryUnlock();
  }, [tryUnlock]);

  return (
    <View style={styles.wrap}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>ॐ</Text>
      </View>
      <Text style={styles.title}>ShubhMilan is locked</Text>
      <Text style={styles.sub}>Authenticate to continue.</Text>
      <Button
        title="Unlock"
        onPress={() => void tryUnlock()}
        leftIcon={<FontAwesome6 name="fingerprint" color="#fff" size={16} />}
        style={{ marginTop: spacing.lg }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  logoText: { fontSize: 46, color: colors.accent, fontWeight: '800' },
  title: { fontSize: fontSizes.xxl, color: '#fff', fontWeight: '800' },
  sub: { fontSize: fontSizes.md, color: colors.primary100, marginTop: 6 },
});
