import { Text } from 'react-native';

import { MarketingPage, proseStyles as ps } from '../../src/MarketingPage';

export default function About() {
  return (
    <MarketingPage
      kicker="About"
      title="ShubhMilan exists for marriages, not matches."
      intro="We started ShubhMilan because the matrimonial space had two problems: trust and time. Profiles you couldn't verify, and platforms that wasted your evenings. We're building the alternative."
    >
      <Text style={ps.h2}>Our promise</Text>
      <Text style={ps.p}>
        Every account is verified at signup — phone, email, optional Aadhaar, optional selfie match,
        optional video KYC, optional independent background check. Your trust score grows as you
        complete each step. Higher trust = more visibility.
      </Text>

      <Text style={ps.h2}>What we don't do</Text>
      <Text style={ps.p}>
        We don't sell your data. We don't sell paid bumps that move scammy profiles to the top. We
        don't make you pay to read messages you've already received. The basics will always be free,
        forever, for everyone.
      </Text>

      <Text style={ps.h2}>How we make money</Text>
      <Text style={ps.p}>
        Premium tiers (Silver, Gold, Platinum) unlock power features — unlimited interests,
        who-viewed-me, advanced filters, free background check on Platinum. They never gate access
        to the basics. You can match, talk, and marry without paying us a rupee.
      </Text>

      <Text style={ps.h2}>Built for Indian families</Text>
      <Text style={ps.p}>
        Real Ashtakoot Guna Milan compatibility. Caste, sub-caste, gotra, mother-tongue filters that
        actually work. AI re-ranking that respects family-context signals — not just demographics.
        Privacy controls per photo, per section, so families can review profiles together.
      </Text>
    </MarketingPage>
  );
}
