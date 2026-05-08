import { colors, fonts, fontSizes, spacing } from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '../../src/api';

interface Story {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
}

export default function SuccessStories() {
  const stories = useQuery({
    queryKey: ['public-success-stories', 'all'],
    queryFn: () => api.content.list('SUCCESS_STORY' as never),
  });
  const items = (stories.data as Story[] | undefined) ?? [];

  return (
    <View style={styles.page}>
      <View style={styles.frame}>
        <Text style={styles.kicker}>Real couples</Text>
        <Text style={styles.title}>Stories from members who said yes.</Text>
        <Text style={styles.intro}>
          Curated, opt-in only. Every story is shared with both partners' permission. Browse a few
          and you'll see what we mean by "marriage platform" instead of "dating app".
        </Text>

        {stories.isLoading ? (
          <Text style={styles.loading}>Loading stories…</Text>
        ) : items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>The first stories are coming soon</Text>
            <Text style={styles.emptyBody}>
              We publish member stories regularly. Sign up and we'll let you know when new ones land.
            </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable style={styles.signupBtn}>
                <Text style={styles.signupBtnText}>Get started</Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((s) => (
              <Link key={s.id} href={`/success-stories/${s.slug}` as never} asChild>
                <Pressable
                  style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [styles.card, hovered ? styles.cardHover : null]}
                >
                  <Text style={styles.date}>
                    {s.publishedAt ? new Date(s.publishedAt).toLocaleDateString() : ''}
                  </Text>
                  <Text style={styles.cardTitle}>{s.title}</Text>
                  {s.excerpt ? <Text style={styles.excerpt}>{s.excerpt}</Text> : null}
                  <Text style={styles.read}>Read story →</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const SERIF = Platform.OS === 'web' ? `${fonts.display}, Georgia, serif` : fonts.display;

const styles = StyleSheet.create({
  page: { paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  frame: { width: '100%', maxWidth: 980, alignSelf: 'center' },
  kicker: {
    color: colors.accentDark,
    fontWeight: '700',
    letterSpacing: 1.6,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '700',
    color: colors.ink,
    fontFamily: SERIF,
    marginTop: spacing.xs,
    letterSpacing: -0.3,
  },
  intro: {
    color: colors.textMuted,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * 1.5,
    marginTop: spacing.md,
    maxWidth: 640,
    marginBottom: spacing.xl,
  },
  loading: { color: colors.textMuted, fontSize: fontSizes.md, marginTop: spacing.lg },
  list: { gap: spacing.md, flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    flexBasis: 320,
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 16,
    padding: spacing.lg,
    gap: 8,
    ...(Platform.OS === 'web' ? ({ transition: 'border-color 150ms ease' } as never) : {}),
  },
  cardHover: { borderColor: colors.borderStrong },
  date: { color: colors.textSubtle, fontSize: fontSizes.xs, letterSpacing: 0.6, textTransform: 'uppercase' },
  cardTitle: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, fontFamily: SERIF },
  excerpt: { color: colors.textMuted, fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.5 },
  read: { color: colors.primary, fontSize: fontSizes.sm, fontWeight: '700', marginTop: spacing.xs },

  emptyCard: {
    marginTop: spacing.xl,
    alignSelf: 'center',
    maxWidth: 540,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.xl,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, fontFamily: SERIF },
  emptyBody: { color: colors.textMuted, fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.55 },
  signupBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  signupBtnText: { color: '#FFFFFF', fontSize: fontSizes.sm, fontWeight: '700', letterSpacing: 0.2 },
});
