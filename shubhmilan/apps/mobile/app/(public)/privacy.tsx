import { Text, View } from 'react-native';

import { MarketingPage, proseStyles as ps } from '../../src/MarketingPage';

export default function Privacy() {
  return (
    <MarketingPage
      kicker="Legal"
      title="Privacy policy"
      intro="A matrimonial profile is intimate. We treat it that way. This is a plain-language summary; the long-form legal text is at the end."
    >
      <Text style={ps.h2}>What we collect</Text>
      <View style={ps.list}>
        <Text style={ps.li}>Account: email, phone, password hash.</Text>
        <Text style={ps.li}>Profile: the fields you enter, photos you upload, family + horoscope details.</Text>
        <Text style={ps.li}>Activity: who you viewed, who you sent interests to, who matched.</Text>
        <Text style={ps.li}>Device: type, OS, push token (only if you opt into notifications).</Text>
        <Text style={ps.li}>Verification: documents you submit for KYC (selfie, video, ID), encrypted at rest.</Text>
      </View>

      <Text style={ps.h2}>What we don't sell</Text>
      <Text style={ps.p}>
        Anything. Your data is not for sale to advertisers, data brokers, or third parties. It is
        used inside ShubhMilan to make matches and run the platform. Period.
      </Text>

      <Text style={ps.h2}>Encryption</Text>
      <Text style={ps.p}>
        Sensitive PII (full name, date of birth, full address, KYC documents) is encrypted at rest
        with AES-256. Chat messages are end-to-end encrypted with Curve25519 keys generated on your
        device — we cannot read them. Refresh tokens are stored as SHA-256 hashes only.
      </Text>

      <Text style={ps.h2}>Who can see your profile</Text>
      <View style={ps.list}>
        <Text style={ps.li}>Photos: per-photo privacy — Public, Members-only, or Request-only.</Text>
        <Text style={ps.li}>Profile sections: visible to verified members by default. Customisable.</Text>
        <Text style={ps.li}>Phone + email: never shown publicly. Used only for OTP and our outreach.</Text>
      </View>

      <Text style={ps.h2}>Data retention</Text>
      <Text style={ps.p}>
        Active profiles: kept while the account is active. Deleted accounts: profile data erased
        within 30 days; encrypted backups age out within 90 days. KYC documents are deleted within
        12 months whether or not the account remains active.
      </Text>

      <Text style={ps.h2}>Your rights</Text>
      <View style={ps.list}>
        <Text style={ps.li}>Export your data — download everything we have on you in one ZIP.</Text>
        <Text style={ps.li}>Correct inaccuracies — edit any field at any time.</Text>
        <Text style={ps.li}>Delete your account — irreversible, takes effect within 30 days.</Text>
        <Text style={ps.li}>Withdraw consent — turn off notifications, hide your profile, opt out of analytics.</Text>
      </View>

      <Text style={ps.h2}>Contact</Text>
      <Text style={ps.p}>
        Email{' '}
        <Text style={{ fontWeight: '700' }}>privacy@shubhmilan.com</Text>
        {' '}for any privacy request. We reply within one business day. Grievance officer details are
        published on our /grievance page (coming soon).
      </Text>

      <Text style={ps.h2}>Updates</Text>
      <Text style={ps.p}>
        Material changes to this policy are emailed to all active users at least 30 days before they
        take effect. We don't make changes retroactively.
      </Text>
    </MarketingPage>
  );
}
