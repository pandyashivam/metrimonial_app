import { ProfileCard, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { useAuth } from '../../src/auth-store';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const profiles = useQuery({
    queryKey: ['discovery'],
    queryFn: () => api.profiles.list({ limit: 20 }),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.greet}>Namaste</Text>
        <Text style={styles.name}>{user?.email ?? 'Welcome'}</Text>
      </View>
      <FlatList
        data={profiles.data?.items ?? []}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={{ gap: spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={profiles.isRefetching}
            onRefresh={() => void profiles.refetch()}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <ProfileCard profile={item} onPress={(id) => router.push(`/profile/${id}`)} />
          </View>
        )}
        ListEmptyComponent={
          !profiles.isLoading ? (
            <Text style={styles.empty}>No profiles yet. Try loosening your filters.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, gap: 2 },
  greet: { color: colors.textMuted, fontSize: fontSizes.sm },
  name: { color: colors.ink, fontSize: fontSizes.xl, fontWeight: '800' },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
});
