import { FontAwesome6 } from '@expo/vector-icons';
import {
  Banner,
  Button,
  EmptyState,
  Input,
  ProfileCard,
  ScreenHeader,
  Skeleton,
  colors,
  spacing,
} from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { filterSnapshot, toDiscoveryQuery, useFilters } from '../../src/filter-store';

const COLUMN_MAX = 1080;

function useDebounced<T>(value: T, ms = 300): T {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setOut(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return out;
}

export default function Search() {
  const router = useRouter();
  const filters = useFilters();
  const [text, setText] = useState('');
  const q = useDebounced(text);
  const { width } = useWindowDimensions();
  const wide = Platform.OS === 'web' && width >= 1024;
  const cols = wide ? 3 : 2;

  const queryObj = useMemo(
    () => ({ ...toDiscoveryQuery(filters), ...(q ? { city: q } : {}), limit: 30 }),
    [filters, q],
  );
  const snapshot = filterSnapshot(filters);
  const profiles = useQuery({
    queryKey: ['search', snapshot, q],
    queryFn: () => api.profiles.list(queryObj),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.column}>
        <View style={styles.headerWrap}>
          <ScreenHeader
            kicker="Discover"
            title="Find your match"
            subtitle="Search by city or keyword. Advanced filters require Silver and above."
          />
          <Input
            value={text}
            onChangeText={setText}
            placeholder="City or keyword"
            autoCapitalize="words"
            leftIcon={<FontAwesome6 name="magnifying-glass" size={14} color={colors.textMuted} />}
          />
          <Button title="Open filters" variant="outline" size="lg" onPress={() => router.push('/filters')} block />
        </View>

        {profiles.isError ? (
          <View style={styles.errorWrap}>
            <Banner>
              {(profiles.error as { message?: string })?.message ?? "We couldn't run that search. Try again."}
            </Banner>
          </View>
        ) : null}

        {profiles.isLoading ? (
          <View style={styles.loading}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ flex: 1, minWidth: '46%' }}>
                <Skeleton height={260} rounded={18} />
                <Skeleton height={16} width="60%" style={{ marginTop: 10 }} />
                <Skeleton height={12} width="80%" style={{ marginTop: 6 }} />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={profiles.data?.items ?? []}
            keyExtractor={(p) => p.id}
            numColumns={cols}
            key={cols}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
            columnWrapperStyle={{ gap: spacing.md }}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <ProfileCard profile={item} onPress={(id) => router.push(`/profile/${id}`)} />
              </View>
            )}
            ListEmptyComponent={
              !profiles.isError ? (
                <View style={styles.emptyWrap}>
                  <EmptyState
                    title="No results"
                    description="Try a different city or loosen your filters. Fresh profiles join every day."
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  column: { flex: 1, width: '100%', maxWidth: COLUMN_MAX, alignSelf: 'center' },
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.xs },
  errorWrap: { padding: spacing.lg },
  loading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  emptyWrap: { padding: spacing.xl, paddingTop: spacing.xxl },
});
