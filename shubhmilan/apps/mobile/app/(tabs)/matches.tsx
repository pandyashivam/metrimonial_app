import {
  AIScoreBadge,
  Avatar,
  Banner,
  Button,
  Card,
  Chip,
  EmptyState,
  ScreenHeader,
  Skeleton,
  colors,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { haptics } from '../../src/haptics';

const COLUMN_MAX = 720;

type Tab = 'ai' | 'received' | 'sent';

interface Interest {
  id: string;
  status: 'SENT' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';
  note?: string | null;
  createdAt: string;
  fromProfile?: { id: string; fullName: string; city: string };
  toProfile?: { id: string; fullName: string; city: string };
}

export default function Matches() {
  const [tab, setTab] = useState<Tab>('ai');
  const router = useRouter();
  const qc = useQueryClient();

  const matches = useQuery({
    queryKey: ['matches', 'ai'],
    queryFn: () => api.matches.ai(),
    enabled: tab === 'ai',
  });
  const received = useQuery({
    queryKey: ['interests', 'received'],
    queryFn: () => api.interests.received(),
    enabled: tab === 'received',
  });
  const sent = useQuery({
    queryKey: ['interests', 'sent'],
    queryFn: () => api.interests.sent(),
    enabled: tab === 'sent',
  });

  const respond = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'ACCEPT' | 'DECLINE' | 'WITHDRAW' }) =>
      api.interests.respond(id, action),
    onMutate: () => haptics.medium(),
    onSuccess: () => {
      haptics.success();
      qc.invalidateQueries({ queryKey: ['interests'] });
    },
    onError: () => haptics.error(),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.column}>
        <View style={styles.headerWrap}>
          <ScreenHeader
            kicker="For you"
            title="Matches & interests"
            subtitle="AI-ranked picks plus the interests you've sent and received."
          />
          <View style={styles.tabBar}>
            <TabButton label="AI matches" active={tab === 'ai'} onPress={() => setTab('ai')} />
            <TabButton label="Received" active={tab === 'received'} onPress={() => setTab('received')} />
            <TabButton label="Sent" active={tab === 'sent'} onPress={() => setTab('sent')} />
          </View>
        </View>

        {tab === 'ai' ? (
          <AIMatchesList query={matches} onPress={(id) => router.push(`/profile/${id}`)} />
        ) : tab === 'received' ? (
          <InterestsList
            data={received.data as Interest[] | undefined}
            isLoading={received.isLoading}
            isError={received.isError}
            kind="received"
            onPressProfile={(id) => router.push(`/profile/${id}`)}
            onAccept={(id) => respond.mutate({ id, action: 'ACCEPT' })}
            onDecline={(id) => respond.mutate({ id, action: 'DECLINE' })}
            actionPending={respond.isPending}
          />
        ) : (
          <InterestsList
            data={sent.data as Interest[] | undefined}
            isLoading={sent.isLoading}
            isError={sent.isError}
            kind="sent"
            onPressProfile={(id) => router.push(`/profile/${id}`)}
            onWithdraw={(id) => respond.mutate({ id, action: 'WITHDRAW' })}
            actionPending={respond.isPending}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        active ? styles.tabActive : null,
        pressed ? { opacity: 0.85 } : null,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>{label}</Text>
    </Pressable>
  );
}

function AIMatchesList({
  query,
  onPress,
}: {
  query: ReturnType<typeof useQuery<Awaited<ReturnType<typeof api.matches.ai>>>>;
  onPress: (id: string) => void;
}) {
  if (query.isLoading) {
    return (
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
    );
  }
  return (
    <FlatList
      data={query.data ?? []}
      keyExtractor={(m) => m.profileId}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      renderItem={({ item }) => (
        <Pressable onPress={() => onPress(item.profileId)}>
          <Card>
            <View style={{ gap: spacing.sm }}>
              <AIScoreBadge score={item.score} />
              <View style={{ gap: 6 }}>
                {item.reasons.slice(0, 3).map((r, i) => (
                  <Text key={i} style={styles.reason}>· {r.text}</Text>
                ))}
              </View>
            </View>
          </Card>
        </Pressable>
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
  );
}

function InterestsList({
  data,
  isLoading,
  isError,
  kind,
  onPressProfile,
  onAccept,
  onDecline,
  onWithdraw,
  actionPending,
}: {
  data: Interest[] | undefined;
  isLoading: boolean;
  isError: boolean;
  kind: 'received' | 'sent';
  onPressProfile: (id: string) => void;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onWithdraw?: (id: string) => void;
  actionPending: boolean;
}) {
  if (isLoading) {
    return (
      <View style={styles.loading}>
        {[0, 1, 2].map((i) => (
          <Card key={i} style={{ marginBottom: spacing.md }}>
            <Skeleton height={48} width={48} rounded={24} />
            <Skeleton height={14} width="55%" style={{ marginTop: 10 }} />
            <Skeleton height={12} width="80%" style={{ marginTop: 6 }} />
          </Card>
        ))}
      </View>
    );
  }
  if (isError) {
    return (
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Banner>We couldn't load this list. Pull down to retry, or check back in a moment.</Banner>
      </View>
    );
  }
  const items = data ?? [];
  if (items.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState
          title={kind === 'received' ? 'No interests yet' : "You haven't sent any yet"}
          description={
            kind === 'received'
              ? "When someone sends you an interest you'll see it here. We'll also send a notification."
              : 'Browse profiles and tap "Send interest" — they\'ll show up here so you can track responses.'
          }
        />
      </View>
    );
  }
  return (
    <FlatList
      data={items}
      keyExtractor={(it) => it.id}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      renderItem={({ item }) => {
        const peer = kind === 'received' ? item.fromProfile : item.toProfile;
        return (
          <Pressable onPress={() => peer && onPressProfile(peer.id)}>
            <Card>
              <View style={styles.intRow}>
                <Avatar name={peer?.fullName ?? '?'} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.intName}>{peer?.fullName ?? 'Someone'}</Text>
                  <Text style={styles.intMeta}>
                    {peer?.city ?? ''}{peer?.city ? ' · ' : ''}
                    <Text style={{ color: colors.textSubtle }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </Text>
                  {item.note ? <Text style={styles.intNote}>"{item.note}"</Text> : null}
                </View>
                <View style={styles.intStatus}>
                  <Chip label={item.status} tone={statusTone(item.status)} />
                </View>
              </View>
              {kind === 'received' && item.status === 'SENT' ? (
                <View style={styles.intActions}>
                  <Button
                    title="Accept"
                    size="sm"
                    onPress={() => onAccept?.(item.id)}
                    loading={actionPending}
                  />
                  <Button
                    title="Decline"
                    size="sm"
                    variant="outline"
                    onPress={() => onDecline?.(item.id)}
                    loading={actionPending}
                  />
                </View>
              ) : null}
              {kind === 'sent' && item.status === 'SENT' ? (
                <View style={styles.intActions}>
                  <Button
                    title="Withdraw"
                    size="sm"
                    variant="outline"
                    onPress={() => onWithdraw?.(item.id)}
                    loading={actionPending}
                  />
                </View>
              ) : null}
            </Card>
          </Pressable>
        );
      }}
    />
  );
}

function statusTone(s: Interest['status']): 'success' | 'warn' | 'neutral' | 'danger' {
  if (s === 'ACCEPTED') return 'success';
  if (s === 'SENT') return 'warn';
  if (s === 'DECLINED') return 'danger';
  return 'neutral';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  column: { flex: 1, width: '100%', maxWidth: COLUMN_MAX, alignSelf: 'center' },
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  loading: { paddingHorizontal: spacing.lg },
  emptyWrap: { padding: spacing.xl, paddingTop: spacing.xxl },
  reason: { color: colors.text, fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.4 },

  tabBar: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabLabel: { color: colors.text, fontSize: fontSizes.sm, fontWeight: '600' },
  tabLabelActive: { color: '#FFFFFF' },

  intRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  intName: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink },
  intMeta: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  intNote: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: fontSizes.sm * 1.4,
  },
  intStatus: { alignItems: 'flex-end' },
  intActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
