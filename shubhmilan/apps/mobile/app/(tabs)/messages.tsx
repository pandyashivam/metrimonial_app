import { Card, EmptyState, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';

export default function Messages() {
  const convos = useQuery({ queryKey: ['conversations'], queryFn: () => api.chat.conversations() });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <FlatList
        data={convos.data ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.peer}>{item.peerName}</Text>
            <Text style={styles.ts}>
              {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleString() : 'No messages yet'}
            </Text>
          </Card>
        )}
        ListEmptyComponent={
          !convos.isLoading ? (
            <EmptyState
              title="No messages yet"
              description="Send an interest and accept one back to start chatting."
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
  peer: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink },
  ts: { fontSize: fontSizes.xs + 1, color: colors.textMuted, marginTop: 2 },
});
