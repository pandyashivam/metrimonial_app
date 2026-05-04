import {
  AIScoreBadge,
  Card,
  EmptyState,
  ScreenHeader,
  Skeleton,
  colors,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';

const COLUMN_MAX = 720;

export default function Matches() {
  const matches = useQuery({ queryKey: ['matches', 'ai'], queryFn: () => api.matches.ai() });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.column}>
        <View style={styles.headerWrap}>
          <ScreenHeader
            kicker="For you"
            title="AI matches"
            subtitle="Ranked by compatibility signals from your profile, preferences, and recent activity."
          />
        </View>
        {matches.isLoading ? (
          <View style={styles.loading}>
            {[0, 1, 2].map((i) => (
              <Card key={i} style={{ marginBottom: spacing.md }}>
                <Skeleton height={28} width="40%" />
                <Skeleton height={14} style={{ marginTop: 12 }} />
                <Skeleton height={14} width="80%" style={{ marginTop: 8 }} />
                <Skeleton height={14} width="65%" style={{ marginTop: 8 }} />
              </Card>
            ))}
          </View>
        ) : (
          <FlatList
            data={matches.data ?? []}
            keyExtractor={(m) => m.profileId}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item }) => (
              <Card>
                <View style={{ gap: spacing.sm }}>
                  <AIScoreBadge score={item.score} />
                  <View style={{ gap: 6 }}>
                    {item.reasons.slice(0, 3).map((r, i) => (
                      <Text key={i} style={styles.reason}>
                        · {r.text}
                      </Text>
                    ))}
                  </View>
                </View>
              </Card>
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <EmptyState
                  title="Complete your profile"
                  description="Fill in hobbies, preferences, and verify your email to unlock personalised AI matches."
                />
              </View>
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
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  loading: { paddingHorizontal: spacing.lg },
  emptyWrap: { padding: spacing.xl, paddingTop: spacing.xxl },
  reason: { color: colors.text, fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.4 },
});
