import { AIScoreBadge, Card, EmptyState, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';

export default function Matches() {
  const matches = useQuery({ queryKey: ['matches', 'ai'], queryFn: () => api.matches.ai() });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Matches</Text>
        <Text style={styles.sub}>Ranked by compatibility signals from your profile & preferences</Text>
      </View>
      <FlatList
        data={matches.data ?? []}
        keyExtractor={(m) => m.profileId}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        renderItem={({ item }) => (
          <Card>
            <View style={{ gap: spacing.sm }}>
              <AIScoreBadge score={item.score} />
              <View style={{ gap: 4 }}>
                {item.reasons.slice(0, 3).map((r, i) => (
                  <Text key={i} style={styles.reason}>· {r.text}</Text>
                ))}
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          !matches.isLoading ? (
            <EmptyState
              title="Complete your profile"
              description="Fill in hobbies, preferences, and verify email to unlock AI matches."
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg },
  title: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.ink },
  sub: { color: colors.textMuted, marginTop: 4 },
  reason: { color: colors.text, fontSize: fontSizes.sm + 1 },
});
