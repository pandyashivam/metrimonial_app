import { Text, View } from 'react-native';

import { MarketingPage, proseStyles as ps } from '../../src/MarketingPage';

export default function Safety() {
  return (
    <MarketingPage
      kicker="Safety"
      title="Trust is non-negotiable."
      intro="A matrimonial profile carries weight. Here's how we keep ShubhMilan a place where the trust matches the stakes."
    >
      <Text style={ps.h2}>Six layers of verification</Text>
      <View style={ps.list}>
        <Text style={ps.li}>1. Phone — OTP at signup. Required.</Text>
        <Text style={ps.li}>2. Email — OTP at signup. Required.</Text>
        <Text style={ps.li}>3. Aadhaar — last-4 + name match via DigiLocker. Optional, +25 trust.</Text>
        <Text style={ps.li}>4. Selfie match — selfie compared to your primary photo. Optional, +15 trust.</Text>
        <Text style={ps.li}>5. Video KYC — short recorded prompt, reviewed by our team. Optional, +20 trust.</Text>
        <Text style={ps.li}>6. Background check — independent third-party, employment + address + criminal. Optional, +30 trust.</Text>
      </View>

      <Text style={ps.h2}>Trust score and tiers</Text>
      <Text style={ps.p}>
        Each completed step adds to your trust score (0–100). Three tiers: Basic (0–40), Verified
        (41–80), Premium Trust (81–100). Higher tiers get more visibility in search and matches —
        ahead of unverified profiles, never above genuine compatibility.
      </Text>

      <Text style={ps.h2}>End-to-end encrypted chat</Text>
      <Text style={ps.p}>
        Once an interest is accepted, all messages — text, photos, audio — are end-to-end encrypted
        with Curve25519 keys generated on your device. The server stores ciphertext only. We can't
        read your conversations even if we wanted to.
      </Text>

      <Text style={ps.h2}>You control your visibility</Text>
      <View style={ps.list}>
        <Text style={ps.li}>Per-photo privacy: Public, Members-only, or Request-only.</Text>
        <Text style={ps.li}>Block any profile in one tap; they can never see you again.</Text>
        <Text style={ps.li}>Hide your profile from search while you take a break.</Text>
        <Text style={ps.li}>Delete your account at any time — we erase everything within 30 days.</Text>
      </View>

      <Text style={ps.h2}>Reporting and moderation</Text>
      <Text style={ps.p}>
        Every profile has a report button. Reports are reviewed by our human moderation team within
        24 hours. Verified bad actors are removed immediately and the network is purged of their
        photos and messages. We don't tolerate harassment, scams, or impersonation.
      </Text>

      <Text style={ps.h2}>If something goes wrong</Text>
      <Text style={ps.p}>
        Email{' '}
        <Text style={{ fontWeight: '700' }}>support@shubhmilan.com</Text>
        {' '}— we read every message and reply within one business day. For urgent safety concerns,
        prefix the subject line with "URGENT".
      </Text>
    </MarketingPage>
  );
}
