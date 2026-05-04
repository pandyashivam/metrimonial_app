import { FontAwesome6 } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import {
  Banner,
  Button,
  EmptyState,
  ProfileCard,
  Skeleton,
  SwipeableCard,
  colors,
  fontSizes,
  fonts,
  spacing,
} from '@shubhmilan/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { useAuth } from '../../src/auth-store';
import { filterSnapshot, toDiscoveryQuery, useFilters } from '../../src/filter-store';
import { haptics } from '../../src/haptics';

const COLUMN_MAX = 1080;

export default function Home() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const filters = useFilters();
  const snapshot = filterSnapshot(filters);
  const [mode, setMode] = useState<'grid' | 'deck'>('grid');
  const [deckIdx, setDeckIdx] = useState(0);
  const { width } = useWindowDimensions();
  const wide = Platform.OS === 'web' && width >= 1024;

  const profiles = useQuery({
    queryKey: ['discovery', snapshot],
    queryFn: () => api.profiles.list({ ...toDiscoveryQuery(filters), limit: 20 }),
  });

  const interest = useMutation({
    mutationFn: (toProfileId: string) => api.interests.send(toProfileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entitlements'] }),
  });

  const planRequired =
    profiles.isError && (profiles.error as { code?: string })?.code === 'PLAN_REQUIRED';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.column}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Namaste</Text>
            <Text style={styles.greeting}>
              {user?.email?.split('@')[0] ?? 'Welcome back'}
            </Text>
          </View>
          <Pressable
            onPress={() => setMode(mode === 'grid' ? 'deck' : 'grid')}
            style={styles.iconBtn}
            accessibilityLabel={mode === 'grid' ? 'Switch to deck view' : 'Switch to grid view'}
            hitSlop={4}
          >
            <FontAwesome6
              name={mode === 'grid' ? 'layer-group' : 'grip'}
              color={colors.primary}
              size={16}
            />
            <Text style={styles.iconBtnLabel}>{mode === 'grid' ? 'Deck' : 'Grid'}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/filters')}
            style={styles.iconBtn}
            accessibilityLabel="Filters"
            hitSlop={4}
          >
            <FontAwesome6 name="sliders" color={colors.primary} size={16} />
            <Text style={styles.iconBtnLabel}>Filters</Text>
            {snapshot !== '{}' ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>

        {profiles.isError ? (
          <View style={styles.errorWrap}>
            <Banner
              variant={planRequired ? 'info' : 'error'}
              title={planRequired ? 'Premium feature' : "We couldn't load profiles"}
            >
              {(profiles.error as { message?: string })?.message ??
                'Please try again in a moment.'}
            </Banner>
            {planRequired ? (
              <Button title="Upgrade to Silver" size="lg" onPress={() => router.push('/premium')} block />
            ) : (
              <Button title="Retry" variant="outline" size="lg" onPress={() => profiles.refetch()} block />
            )}
          </View>
        ) : null}

        {profiles.isLoading ? (
          <View style={styles.gridLoading}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ flex: 1, minWidth: '46%' }}>
                <Skeleton height={260} rounded={18} />
                <Skeleton height={18} width="60%" style={{ marginTop: 10 }} />
                <Skeleton height={14} width="80%" style={{ marginTop: 6 }} />
              </View>
            ))}
          </View>
        ) : mode === 'deck' ? (
          <DeckView
            items={profiles.data?.items ?? []}
            deckIdx={deckIdx}
            setDeckIdx={setDeckIdx}
            onPressProfile={(id) => router.push(`/profile/${id}`)}
            onLike={(id) => interest.mutate(id)}
          />
        ) : (
          <FlashList
            data={profiles.data?.items ?? []}
            keyExtractor={(p) => p.id}
            numColumns={wide ? 3 : 2}
            estimatedItemSize={340}
            contentContainerStyle={styles.list}
            refreshControl={
              Platform.OS === 'web' ? undefined : (
                <RefreshControl
                  refreshing={profiles.isRefetching}
                  onRefresh={() => void profiles.refetch()}
                  tintColor={colors.primary}
                />
              )
            }
            renderItem={({ item, index }) => {
              const cols = wide ? 3 : 2;
              const isFirst = index % cols === 0;
              const isLast = index % cols === cols - 1;
              return (
                <View
                  style={{
                    flex: 1,
                    paddingLeft: isFirst ? 0 : spacing.xs,
                    paddingRight: isLast ? 0 : spacing.xs,
                    paddingBottom: spacing.md,
                  }}
                >
                  <ProfileCard profile={item} onPress={(id) => router.push(`/profile/${id}`)} />
                </View>
              );
            }}
            ListEmptyComponent={
              !profiles.isError ? (
                <View style={styles.emptyWrap}>
                  <EmptyState
                    title="No profiles yet"
                    description="Try loosening your filters or check back tomorrow — we add new profiles every day."
                  />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function DeckView({
  items,
  deckIdx,
  setDeckIdx,
  onPressProfile,
  onLike,
}: {
  items: Array<Parameters<typeof SwipeableCard>[0]['profile']>;
  deckIdx: number;
  setDeckIdx: (n: number | ((i: number) => number)) => void;
  onPressProfile: (id: string) => void;
  onLike: (id: string) => void;
}) {
  const current = items[deckIdx];
  if (!current) {
    return (
      <View style={styles.deckEmpty}>
        <EmptyState
          title={deckIdx > 0 ? "You're all caught up" : 'No profiles to show'}
          description={
            deckIdx > 0
              ? 'Beautiful work. Take a break — fresh profiles arrive throughout the day.'
              : 'Try loosening your filters to see more people.'
          }
        />
        {deckIdx > 0 ? (
          <Button title="Restart deck" size="lg" onPress={() => setDeckIdx(0)} block />
        ) : null}
      </View>
    );
  }
  return (
    <View style={styles.deckWrap}>
      <SwipeableCard
        profile={current}
        onPress={onPressProfile}
        onSwipeRight={(id) => {
          haptics.success();
          onLike(id);
          setDeckIdx((i) => i + 1);
        }}
        onSwipeLeft={() => {
          haptics.light();
          setDeckIdx((i) => i + 1);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  column: { flex: 1, width: '100%', maxWidth: COLUMN_MAX, alignSelf: 'center' },
  header: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  kicker: {
    color: colors.accentDark,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  greeting: {
    color: colors.ink,
    fontSize: fontSizes.xl,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? `${fonts.display}, Georgia, serif` : fonts.display,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconBtnLabel: { color: colors.primary, fontSize: fontSizes.xs, fontWeight: '700' },
  filterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  errorWrap: { padding: spacing.lg, gap: spacing.md },
  gridLoading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  deckWrap: { flex: 1, padding: spacing.lg },
  deckEmpty: { padding: spacing.xl, gap: spacing.lg },
  emptyWrap: { padding: spacing.xl, paddingTop: spacing.xxl },
});

