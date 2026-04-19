import { Button, Card, EmptyState, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';

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
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });
      if (res.canceled || !res.assets.length) return;
      const asset = res.assets[0]!;
      // Compress to max width 1600 + 80% quality before upload; protects bandwidth + storage.
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1600 } }],
        { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
      );
      const blob = await (await fetch(manipulated.uri)).blob();
      await api.me.uploadPhoto(blob);
      await qc.invalidateQueries({ queryKey: ['my-photos'] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 5 of 6</Text>
        <Text style={styles.title}>Photos</Text>
        <Text style={styles.sub}>Add at least one photo to start getting matches. Set privacy per photo.</Text>
      </View>

      <FlatList
        data={photos.data ?? []}
        keyExtractor={(p) => p.id}
        numColumns={3}
        columnWrapperStyle={{ gap: spacing.sm }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        renderItem={({ item }) => (
          <Card style={{ flex: 1, padding: 0 }} padded={false}>
            <Image source={{ uri: item.url }} style={styles.photo} />
            <View style={{ padding: 8, gap: 6 }}>
              {!item.isPrimary && (
                <Pressable onPress={() => setPrimary.mutate(item.id)}>
                  <Text style={styles.action}>Set primary</Text>
                </Pressable>
              )}
              <Pressable onPress={() => del.mutate(item.id)}>
                <Text style={[styles.action, { color: colors.danger }]}>Delete</Text>
              </Pressable>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          !photos.isLoading ? (
            <EmptyState title="No photos yet" description="Add one to boost match quality." />
          ) : null
        }
      />

      <View style={styles.footer}>
        <Button title={busy ? 'Uploading…' : 'Upload photo'} onPress={pickAndUpload} loading={busy} block />
        <Button
          title="Next: Verify identity"
          variant="outline"
          onPress={() => router.push('/(onboarding)/verify')}
          block
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg },
  step: { color: colors.primary, fontWeight: '700', letterSpacing: 1, fontSize: fontSizes.xs + 1, textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 4 },
  sub: { color: colors.textMuted, marginTop: 6 },
  photo: { width: '100%', aspectRatio: 1, backgroundColor: colors.primary100 },
  action: { fontSize: fontSizes.xs + 1, color: colors.primary, fontWeight: '700' },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
});
