import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, spacing } from '../tokens.js';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {icon ? <View style={{ marginBottom: spacing.md }}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action ? <View style={{ marginTop: spacing.md }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  title: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  description: {
    fontSize: fontSizes.sm + 1,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 340,
  },
});
