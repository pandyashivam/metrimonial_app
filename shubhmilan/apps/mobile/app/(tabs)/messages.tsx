import { Avatar, Card, EmptyState, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';

export default function Messages() {
  const router = useRouter();
  const convos = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.chat.conversations(),
    refetchInterval: 15_000,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.sub}>🔒 End-to-end encrypted</Text>
      </View>
      <FlatList
        data={convos.data ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/chat/${item.id}`)}
            style={({ pressed }) => (pressed ? { opacity: 0.8 } : undefined)}
          >
            <Card>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <Avatar name={item.peerName} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.peer}>{item.peerName}</Text>
                  <Text style={styles.ts}>
                    {item.lastMessageAt
                      ? new Date(item.lastMessageAt).toLocaleString()
                      : 'No messages yet'}
                  </Text>
                </View>
                {item.unreadCount > 0 && (
                  <View style={styles.unread}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          !convos.isLoading ? (
            <EmptyState
              title="No messages yet"
              description="Send an interest and accept one back to start an encrypted conversation."
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, gap: 2 },
  title: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.ink },
  sub: { color: colors.primary, fontWeight: '600', fontSize: fontSizes.xs + 1 },
  peer: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink },
  ts: { fontSize: fontSizes.xs + 1, color: colors.textMuted, marginTop: 2 },
  unread: {
    backgroundColor: colors.primary,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 20,
  },
  unreadText: { color: '#fff', fontSize: fontSizes.xs + 1, fontWeight: '800' },
});
