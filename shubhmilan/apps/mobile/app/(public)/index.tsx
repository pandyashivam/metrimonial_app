import { Button, Card, colors, fonts, fontSizes, spacing } from '@shubhmilan/ui';
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

const VALUE_PROPS = [
  {
    title: 'Verified profiles only',
    body: 'Every profile clears email + phone verification before you ever see them. Premium tiers add ID, selfie match, video KYC, and background checks.',
  },
  {
    title: 'AI-powered match scoring',
    body: 'We rank potential matches against your preferences, lifestyle, and partner-criteria signals — not just demographics. The reasons are always shown.',
  },
  {
    title: 'Real Ashtakoot kundli',
    body: 'Eight koota Guna Milan compatibility — Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi — calculated server-side. Not a gimmick.',
  },
  {
    title: 'Free forever, no paywalls',
    body: "You will never have to pay to find a partner. Premium tiers unlock power features (unlimited interests, who-viewed-me, advanced filters) — they don't gate the basics.",
  },
];

const HOW_STEPS = [
  {
    n: '01',
    heading: 'Create a verified profile',
    body: 'Sign up with your phone, complete the six onboarding steps, and add a photo. We verify your phone and email instantly.',
  },
  {
    n: '02',
    heading: 'Tell us what matters',
    body: 'Religion, community, profession, location, lifestyle, kundli — set partner preferences as broad or specific as you like.',
  },
  {
    n: '03',
    heading: 'Browse considered matches',
    body: 'See profiles ranked by AI compatibility plus traditional Ashtakoot scoring. Send an interest, shortlist, or open a kundli view.',
  },
  {
    n: '04',
    heading: 'Chat once both sides accept',
    body: 'When the other side accepts your interest, you can chat — every message is end-to-end encrypted. Even ShubhMilan can\'t read it.',
  },
];

export default function Landing() {
  const stories = useQuery({
    queryKey: ['public-success-stories'],
    queryFn: () => api.content.list('SUCCESS_STORY' as never),
  });

  return (
    <View>
      <Hero />
      <ValueProps />
      <HowItWorks />
      <Stories items={(stories.data as Story[] | undefined) ?? []} loading={stories.isLoading} />
      <CallToAction />
    </View>
  );
}

function Hero() {
  return (
    <View style={styles.hero}>
      <View style={styles.heroFrame}>
        <Text style={styles.kicker}>Trusted matrimony · Built for Indian families</Text>
        <Text style={styles.heroTitle}>
          Find the one,{'\n'}the right way.
        </Text>
        <Text style={styles.heroSub}>
          Verified profiles. Considered matches. Real kundli compatibility. No hidden paywalls. Built
          for families, free forever.
        </Text>
        <View style={styles.heroCtas}>
          <Link href="/(auth)/signup" asChild>
            <Button title="Create your free profile" size="lg" />
          </Link>
          <Link href="/(auth)/login" asChild>
            <Button title="I already have an account" variant="ghost" size="lg" />
          </Link>
        </View>
        <View style={styles.proofRow}>
          <ProofItem label="Verified" value="ID + Selfie + Video" />
          <View style={styles.proofDivider} />
          <ProofItem label="Privacy" value="You control" />
          <View style={styles.proofDivider} />
          <ProofItem label="Match" value="Ashtakoot + AI" />
        </View>
      </View>
    </View>
  );
}

function ProofItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={styles.proofLabel}>{label}</Text>
      <Text style={styles.proofValue}>{value}</Text>
    </View>
  );
}

function ValueProps() {
  return (
    <Section
      kicker="Why ShubhMilan"
      title="Made for families. Built for trust."
      sub="Four ideas guide everything we ship."
    >
      <View style={styles.gridFour}>
        {VALUE_PROPS.map((v) => (
          <Card key={v.title} style={{ flexBasis: 260, flexGrow: 1 } as never}>
            <Text style={styles.cardTitle}>{v.title}</Text>
            <Text style={styles.cardBody}>{v.body}</Text>
          </Card>
        ))}
      </View>
    </Section>
  );
}

function HowItWorks() {
  return (
    <Section
      kicker="How it works"
      title="Four steps from signup to a serious conversation."
      sub="Move at your pace. We're not a dating app — we're a marriage platform."
    >
      <View style={styles.steps}>
        {HOW_STEPS.map((s) => (
          <View key={s.n} style={styles.step}>
            <Text style={styles.stepN}>{s.n}</Text>
            <Text style={styles.cardTitle}>{s.heading}</Text>
            <Text style={styles.cardBody}>{s.body}</Text>
          </View>
        ))}
      </View>
    </Section>
  );
}

function Stories({ items, loading }: { items: Story[]; loading: boolean }) {
  return (
    <Section
      kicker="Real couples"
      title="Stories from members who said yes."
      sub="Curated, opt-in only — every story is shared with both partners' permission."
    >
      {loading ? (
        <Text style={styles.cardBody}>Loading stories…</Text>
      ) : items.length === 0 ? (
        <Card style={{ alignSelf: 'center', maxWidth: 540 } as never}>
          <Text style={styles.cardTitle}>The first stories are coming soon</Text>
          <Text style={styles.cardBody}>
            We publish member stories regularly. Subscribe by signing up and we'll let you know when
            new ones land.
          </Text>
        </Card>
      ) : (
        <View style={styles.gridThree}>
          {items.slice(0, 3).map((s) => (
            <Link key={s.id} href={`/success-stories?slug=${s.slug}` as never} asChild>
              <Pressable style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [styles.storyCard, hovered ? styles.storyCardHover : null]}>
                <Text style={styles.storyDate}>
                  {s.publishedAt ? new Date(s.publishedAt).toLocaleDateString() : ''}
                </Text>
                <Text style={styles.storyTitle}>{s.title}</Text>
                {s.excerpt ? <Text style={styles.storyExcerpt}>{s.excerpt}</Text> : null}
                <Text style={styles.storyRead}>Read story →</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
      <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
        <Link href="/success-stories" asChild>
          <Button title="View all stories" variant="outline" size="md" />
        </Link>
      </View>
    </Section>
  );
}

function CallToAction() {
  return (
    <View style={styles.cta}>
      <View style={styles.ctaFrame}>
        <Text style={styles.ctaKicker}>Ready when you are</Text>
        <Text style={styles.ctaTitle}>Your profile takes about five minutes.</Text>
        <Text style={styles.ctaSub}>
          Free forever. No credit card. Privacy controls per-photo and per-section.
        </Text>
        <View style={styles.ctaButtons}>
          <Link href="/(auth)/signup" asChild>
            <Button title="Get started" size="lg" />
          </Link>
          <Link href="/how-it-works" asChild>
            <Button title="Learn more" variant="outline" size="lg" />
          </Link>
        </View>
      </View>
    </View>
  );
}

function Section({
  kicker,
  title,
  sub,
  children,
}: {
  kicker: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionFrame}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
        <View style={{ marginTop: spacing.xl }}>{children}</View>
      </View>
    </View>
  );
}

const SERIF = Platform.OS === 'web' ? `${fonts.display}, Georgia, serif` : fonts.display;

const styles = StyleSheet.create({
  // ----- Hero
  hero: {
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  heroFrame: { width: '100%', maxWidth: 980, alignSelf: 'center' },
  kicker: {
    color: colors.accentDark,
    fontWeight: '700',
    letterSpacing: 1.6,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 64,
    lineHeight: 70,
    fontWeight: '700',
    color: colors.ink,
    fontFamily: SERIF,
    marginTop: spacing.sm,
    letterSpacing: -0.5,
  },
  heroSub: {
    color: colors.textMuted,
    fontSize: 19,
    lineHeight: 30,
    marginTop: spacing.lg,
    maxWidth: 640,
  },
  heroCtas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
  proofRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.lg,
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    maxWidth: 720,
  },
  proofLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  proofValue: { fontSize: fontSizes.md, color: colors.ink, fontWeight: '600' },
  proofDivider: { width: 1, backgroundColor: colors.border },

  // ----- Section
  section: { paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  sectionFrame: { width: '100%', maxWidth: 1180, alignSelf: 'center' },
  sectionTitle: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700',
    color: colors.ink,
    fontFamily: SERIF,
    marginTop: spacing.xs,
    maxWidth: 720,
    letterSpacing: -0.3,
  },
  sectionSub: {
    color: colors.textMuted,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * 1.5,
    marginTop: spacing.sm,
    maxWidth: 640,
  },

  cardTitle: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  cardBody: { color: colors.textMuted, fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.55 },

  gridFour: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridThree: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },

  // ----- Steps
  steps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  step: {
    flexBasis: 240,
    flexGrow: 1,
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  stepN: {
    color: colors.accentDark,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  // ----- Story card
  storyCard: {
    flexBasis: 320,
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    gap: 8,
    ...(Platform.OS === 'web' ? ({ transition: 'border-color 150ms ease, transform 120ms ease' } as never) : {}),
  },
  storyCardHover: { borderColor: colors.borderStrong },
  storyDate: { color: colors.textSubtle, fontSize: fontSizes.xs, letterSpacing: 0.6, textTransform: 'uppercase' },
  storyTitle: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, fontFamily: SERIF, lineHeight: fontSizes.xl * 1.2 },
  storyExcerpt: { color: colors.textMuted, fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.5 },
  storyRead: { color: colors.primary, fontSize: fontSizes.sm, fontWeight: '700', marginTop: spacing.xs },

  // ----- CTA
  cta: {
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
  },
  ctaFrame: { width: '100%', maxWidth: 760, alignSelf: 'center', alignItems: 'center' },
  ctaKicker: {
    color: colors.accentLight,
    fontWeight: '700',
    letterSpacing: 1.6,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  ctaTitle: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: SERIF,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  ctaSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * 1.5,
    marginTop: spacing.sm,
    textAlign: 'center',
    maxWidth: 540,
  },
  ctaButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
});
