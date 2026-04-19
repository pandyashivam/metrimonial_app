import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../tokens.js';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const dim = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image source={{ uri }} style={[styles.img, dim]} accessibilityLabel={name} />;
  }
  return (
    <View style={[styles.fallback, dim]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: colors.primary100 },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary100,
  },
  initial: { color: colors.primary, fontWeight: '700' },
});
