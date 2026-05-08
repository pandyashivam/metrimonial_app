import { Text, View } from 'react-native';

import { MarketingPage, proseStyles as ps } from '../../src/MarketingPage';

export default function Terms() {
  return (
    <MarketingPage
      kicker="Legal"
      title="Terms of service"
      intro="Plain language. We don't bury the important parts."
    >
      <Text style={ps.h2}>Eligibility</Text>
      <Text style={ps.p}>
        You must be 18 or older and legally able to marry under the laws applicable to you. If
        you're already married, you may not use ShubhMilan unless your status is "Awaiting Divorce"
        and you disclose that openly on your profile.
      </Text>

      <Text style={ps.h2}>What you may not do</Text>
      <View style={ps.list}>
        <Text style={ps.li}>Impersonate someone else, in any way.</Text>
        <Text style={ps.li}>Upload photos that are not of you, or that depict children.</Text>
        <Text style={ps.li}>Solicit money, gifts, donations, or transfers from other members.</Text>
        <Text style={ps.li}>Run any kind of scam, romance scheme, or commercial pitch.</Text>
        <Text style={ps.li}>Scrape, copy, or republish ShubhMilan profiles.</Text>
        <Text style={ps.li}>Harass, threaten, or attempt to dox another member.</Text>
      </View>
      <Text style={ps.p}>
        Violations result in immediate account termination, network-wide IP/device bans, and where
        applicable, referral to law enforcement.
      </Text>

      <Text style={ps.h2}>Subscriptions and refunds</Text>
      <Text style={ps.p}>
        Premium plans (Silver, Gold, Platinum) are non-recurring by default — you pay once for the
        listed duration. We honour full refunds within 7 days if you've used fewer than 5
        plan-gated features. After 7 days, refunds are case-by-case at our discretion.
      </Text>

      <Text style={ps.h2}>Background check refunds</Text>
      <Text style={ps.p}>
        If we are unable to complete a paid background check (incomplete records, jurisdiction
        restrictions, etc.) we refund the full amount within 14 days. The refund is unconditional —
        you don't need to ask.
      </Text>

      <Text style={ps.h2}>Liability</Text>
      <Text style={ps.p}>
        ShubhMilan facilitates introductions. We don't vet personalities, predict compatibility
        beyond stated criteria, or guarantee outcomes. Members are responsible for their own due
        diligence. Where Indian consumer protection law applies, our liability is capped at fees
        you have paid us in the trailing 12 months.
      </Text>

      <Text style={ps.h2}>Disputes</Text>
      <Text style={ps.p}>
        Indian law applies. Mumbai courts have jurisdiction. We strongly prefer to resolve every
        dispute via support@shubhmilan.com first — it's faster, free, and usually sufficient.
      </Text>

      <Text style={ps.h2}>Changes</Text>
      <Text style={ps.p}>
        We notify all active users by email at least 30 days before material changes. Continued use
        after the effective date constitutes acceptance.
      </Text>
    </MarketingPage>
  );
}
