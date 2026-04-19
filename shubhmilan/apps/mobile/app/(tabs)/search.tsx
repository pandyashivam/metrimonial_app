import { FontAwesome6 } from '@expo/vector-icons';
import {
  Button,
  Card,
  EmptyState,
  Input,
  ProfileCard,
  colors,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { filterSnapshot, toDiscoveryQuery, useFilters } from '../../src/filter-store';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.h1}>Search</Text>
        <Text style={styles.sub}>Filter + search. Advanced filters require Silver+.</Text>
      </View>
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        <Input
          value={text}
          onChangeText={setText}
          placeholder="City or keyword"
          leftIcon={<FontAwesome6 name="magnifying-glass" size={14} color={colors.textMuted} />}
        />
        <Button title="Open filters" variant="outline" onPress={() => router.push('/filters')} />
      </View>

      {profiles.isError ? (
        <Card style={{ margin: spacing.lg }}>
          <Text style={{ color: colors.danger, fontWeight: '600' }}>
            {(profiles.error as { message?: string })?.message ?? 'Search failed'}
          </Text>
        </Card>
      ) : null}

      <FlatList
        data={profiles.data?.items ?? []}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxxl }}
        columnWrapperStyle={{ gap: spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <ProfileCard profile={item} onPress={(id) => router.push(`/profile/${id}`)} />
          </View>
        )}
        ListEmptyComponent={
          !profiles.isLoading && !profiles.isError ? (
            <EmptyState title="No results" description="Try different filters or a different city." />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, gap: 2 },
  h1: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.ink },
  sub: { color: colors.textMuted },
});
