import {
  Avatar,
  Card,
  EmptyState,
  ScreenHeader,
  SkeletonRow,
  colors,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';

const COLUMN_MAX = 720;

export default function Messages() {
  const router = useRouter();
  const convos = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.chat.conversations(),
    refetchInterval: 15_000,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.column}>
        <View style={styles.headerWrap}>
          <ScreenHeader
            kicker="🔒 End-to-end encrypted"
            title="Messages"
            subtitle="Conversations are private. Even ShubhMilan can't read what you send."
          />
        </View>
        {convos.isLoading ? (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </View>
        ) : (
          <FlatList
            data={convos.data ?? []}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/chat/${item.id}`)}
                style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                  hovered ? { opacity: 0.96 } : null,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <Card>
                  <View style={styles.row}>
                    <Avatar name={item.peerName} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.peer}>{item.peerName}</Text>
                      <Text style={styles.ts}>
                        {item.lastMessageAt
                          ? new Date(item.lastMessageAt).toLocaleString()
                          : 'No messages yet'}
                      </Text>
                    </View>
                    {item.unreadCount > 0 ? (
                      <View style={styles.unread}>
                        <Text style={styles.unreadText}>{item.unreadCount}</Text>
                      </View>
                    ) : null}
                  </View>
                </Card>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <EmptyState
                  title="No messages yet"
                  description="When someone accepts your interest you'll be able to start a private encrypted chat from here."
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
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  peer: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink },
  ts: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  unread: {
    backgroundColor: colors.primary,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: { color: '#fff', fontSize: fontSizes.xs, fontWeight: '800' },
  emptyWrap: { padding: spacing.xl, paddingTop: spacing.xxl },
});
