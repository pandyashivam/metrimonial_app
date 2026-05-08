import { colors, fonts, fontSizes, spacing } from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '../../../src/api';

interface Story {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  publishedAt: string | null;
}

export default function StoryDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const story = useQuery({
    queryKey: ['public-story', slug],
    queryFn: () => api.content.get('SUCCESS_STORY' as never, slug!),
    enabled: !!slug,
  });
  const data = story.data as Story | undefined;

  return (
    <View style={styles.page}>
      <View style={styles.frame}>
        <Link href="/success-stories" asChild>
          <Pressable hitSlop={6}>
            <Text style={styles.back}>← All stories</Text>
          </Pressable>
        </Link>

        {story.isLoading ? (
          <Text style={styles.loading}>Loading story…</Text>
        ) : !data ? (
          <View style={styles.notFound}>
            <Text style={styles.title}>Story not found</Text>
            <Text style={styles.intro}>
              The story you're looking for is not available. It may have been removed or unpublished.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.kicker}>
              {data.publishedAt
                ? new Date(data.publishedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : ''}
            </Text>
            <Text style={styles.title}>{data.title}</Text>
            {data.excerpt ? <Text style={styles.intro}>{data.excerpt}</Text> : null}
            <View style={styles.body}>
              {/* Render plain paragraphs split by blank line. We don't pull in a markdown
                  parser yet — admin authors keep it simple for now. */}
              {data.body.split(/\n\n+/).map((para, i) => (
                <Text key={i} style={styles.para}>
                  {para}
                </Text>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const SERIF = Platform.OS === 'web' ? `${fonts.display}, Georgia, serif` : fonts.display;

const styles = StyleSheet.create({
  page: { paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  frame: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  back: { color: colors.primary, fontSize: fontSizes.sm, fontWeight: '600', marginBottom: spacing.xl },
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
  },
  body: { marginTop: spacing.xl, gap: spacing.md },
  para: { color: colors.text, fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.7 },
  loading: { color: colors.textMuted, fontSize: fontSizes.md, marginTop: spacing.lg },
  notFound: { marginTop: spacing.lg },
});
