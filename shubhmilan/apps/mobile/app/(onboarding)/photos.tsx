import {
  Button,
  Card,
  EmptyState,
  ScreenHeader,
  colors,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { pickImage } from '../../src/photo-picker';

const COLUMN_MAX = 540;

/**
 * Photos screen uses a FlatList for grid rendering rather than the standard
 * PageFrame ScrollView; we apply the same visual rules (cream bg + max-width
 * column on web) ourselves via the FlatList container.
 */
export default function Photos() {
  const router = useRouter();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const photos = useQuery({ queryKey: ['my-photos'], queryFn: () => api.me.photos() });
  const del = useMutation({
    mutationFn: (id: string) => api.me.deletePhoto(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-photos'] }),
  });
  const setPrimary = useMutation({
    mutationFn: (id: string) => api.me.setPrimaryPhoto(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-photos'] }),
  });

  async function pickAndUpload() {
    setBusy(true);
    try {
      const picked = await pickImage();
      if (!picked) return;
      await api.me.uploadPhoto(picked.blob);
      await qc.invalidateQueries({ queryKey: ['my-photos'] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.column}>
        <View style={styles.header}>
          <ScreenHeader
            kicker="Step 5 of 6"
            title="Photos"
            subtitle="Add at least one photo to start getting matches. You can mark any photo private later."
          />
        </View>
        <FlatList
          data={photos.data ?? []}
          keyExtractor={(p) => p.id}
          numColumns={3}
          columnWrapperStyle={{ gap: spacing.sm }}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm }}
          renderItem={({ item }) => (
            <Card style={{ flex: 1, padding: 0 }} padded={false}>
              <Image source={{ uri: item.url }} style={styles.photo} />
              <View style={{ padding: 10, gap: 6 }}>
                {!item.isPrimary ? (
                  <Pressable onPress={() => setPrimary.mutate(item.id)} hitSlop={6}>
                    <Text style={styles.action}>Set primary</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.primaryFlag}>Primary</Text>
                )}
                <Pressable onPress={() => del.mutate(item.id)} hitSlop={6}>
                  <Text style={[styles.action, { color: colors.danger }]}>Delete</Text>
                </Pressable>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            !photos.isLoading ? (
              <View style={styles.emptyWrap}>
                <EmptyState
                  title="No photos yet"
                  description="Profiles with at least one photo get up to 5× more interest. Add yours to get started."
                />
              </View>
            ) : null
          }
        />
        <View style={styles.footer}>
          <Button
            title={busy ? 'Uploading…' : 'Upload photo'}
            size="lg"
            onPress={pickAndUpload}
            loading={busy}
            block
          />
          <Button
            title="Next: Verify identity"
            variant="outline"
            size="lg"
            onPress={() => router.push('/(onboarding)/verify')}
            block
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: COLUMN_MAX,
    alignSelf: 'center',
  },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  photo: { width: '100%', aspectRatio: 1, backgroundColor: colors.primary100 },
  action: { fontSize: fontSizes.xs, color: colors.primary, fontWeight: '700' },
  primaryFlag: {
    fontSize: fontSizes.xs,
    color: colors.success,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  emptyWrap: { paddingTop: spacing.xl, paddingHorizontal: spacing.lg },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
