import { FontAwesome6 } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import {
  Button,
  ProfileCard,
  SwipeableCard,
  colors,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { useAuth } from '../../src/auth-store';
import { filterSnapshot, toDiscoveryQuery, useFilters } from '../../src/filter-store';
import { haptics } from '../../src/haptics';

export default function Home() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const filters = useFilters();
  const snapshot = filterSnapshot(filters);
  const [mode, setMode] = useState<'grid' | 'deck'>('grid');
  const [deckIdx, setDeckIdx] = useState(0);

  const profiles = useQuery({
    queryKey: ['discovery', snapshot],
    queryFn: () => api.profiles.list({ ...toDiscoveryQuery(filters), limit: 20 }),
  });

  const interest = useMutation({
    mutationFn: (toProfileId: string) => api.interests.send(toProfileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entitlements'] }),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greet}>Namaste</Text>
          <Text style={styles.name}>{user?.email ?? 'Welcome'}</Text>
        </View>
        <Pressable
          onPress={() => setMode(mode === 'grid' ? 'deck' : 'grid')}
          style={styles.filterBtn}
          accessibilityLabel={mode === 'grid' ? 'Switch to deck view' : 'Switch to grid view'}
        >
          <FontAwesome6 name={mode === 'grid' ? 'layer-group' : 'grip'} color={colors.primary} size={16} />
          <Text style={styles.filterText}>{mode === 'grid' ? 'Deck' : 'Grid'}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/filters')}
          style={styles.filterBtn}
          accessibilityLabel="Filters"
        >
          <FontAwesome6 name="sliders" color={colors.primary} size={16} />
          <Text style={styles.filterText}>Filters</Text>
          {snapshot !== '{}' && <View style={styles.filterDot} />}
        </Pressable>
      </View>

      {profiles.isError ? (
        <View style={{ padding: spacing.lg }}>
          <Text style={styles.error}>
            {(profiles.error as { message?: string })?.message ?? 'Could not load profiles'}
          </Text>
          {(profiles.error as { code?: string })?.code === 'PLAN_REQUIRED' && (
            <Button
              title="Upgrade to Silver"
              onPress={() => router.push('/premium')}
              style={{ marginTop: spacing.md }}
              block
            />
          )}
        </View>
      ) : null}

      {mode === 'deck' ? (
        (() => {
          const items = profiles.data?.items ?? [];
          const current = items[deckIdx];
          if (!current && !profiles.isLoading) {
            return (
              <View style={styles.deckEmpty}>
                <Text style={styles.empty}>
                  {deckIdx > 0 ? "You're all caught up ✨" : 'No profiles yet. Loosen your filters.'}
                </Text>
                {deckIdx > 0 && (
                  <Button title="Restart deck" onPress={() => setDeckIdx(0)} block />
                )}
              </View>
            );
          }
          if (!current) return null;
          return (
            <View style={styles.deckWrap}>
              <SwipeableCard
                profile={current}
                onPress={(id) => router.push(`/profile/${id}`)}
                onSwipeRight={(id) => {
                  haptics.success();
                  interest.mutate(id);
                  setDeckIdx((i) => i + 1);
                }}
                onSwipeLeft={() => {
                  haptics.light();
                  setDeckIdx((i) => i + 1);
                }}
              />
            </View>
          );
        })()
      ) : (
        <FlashList
          data={profiles.data?.items ?? []}
          keyExtractor={(p) => p.id}
          numColumns={2}
          estimatedItemSize={340}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={profiles.isRefetching}
              onRefresh={() => void profiles.refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item, index }) => (
            <View
              style={{
                flex: 1,
                paddingLeft: index % 2 === 0 ? 0 : spacing.xs,
                paddingRight: index % 2 === 0 ? spacing.xs : 0,
                paddingBottom: spacing.md,
              }}
            >
              <ProfileCard profile={item} onPress={(id) => router.push(`/profile/${id}`)} />
            </View>
          )}
          ListEmptyComponent={
            !profiles.isLoading && !profiles.isError ? (
              <Text style={styles.empty}>No profiles yet. Try loosening your filters.</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  greet: { color: colors.textMuted, fontSize: fontSizes.sm },
  name: { color: colors.ink, fontSize: fontSizes.xl, fontWeight: '800' },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  filterText: { color: colors.primary, fontSize: fontSizes.sm, fontWeight: '700' },
  filterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  deckWrap: { flex: 1, padding: spacing.lg },
  deckEmpty: { padding: spacing.xxl, gap: spacing.lg, alignItems: 'center' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  error: { color: colors.danger, fontWeight: '600' },
});
