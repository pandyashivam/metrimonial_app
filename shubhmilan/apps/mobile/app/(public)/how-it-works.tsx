import { Text } from 'react-native';

import { MarketingPage, proseStyles as ps } from '../../src/MarketingPage';

export default function HowItWorks() {
  return (
    <MarketingPage
      kicker="How it works"
      title="From signup to a serious conversation."
      intro="Move at your pace. We're a marriage platform, not a dating app — there's no swipe streak, no urgency, no algorithmic pressure."
    >
      <Text style={ps.h2}>1. Create a verified profile</Text>
      <Text style={ps.p}>
        Sign up with your phone and email — both are verified instantly via OTP. Add your photo, your
        basics (DOB, religion, community, profession), your family details, and your horoscope if
        you have one. Six short steps, about five minutes total.
      </Text>

      <Text style={ps.h2}>2. Tell us what matters</Text>
      <Text style={ps.p}>
        Set partner preferences — age, religion, community, location, lifestyle, education, kundli
        compatibility. Be as broad or as specific as you like. You can change them any time.
      </Text>

      <Text style={ps.h2}>3. Browse considered matches</Text>
      <Text style={ps.p}>
        See profiles ranked by AI compatibility plus traditional Ashtakoot scoring. Each match shows
        the why — kundli compatibility, mutual filters, lifestyle signals. Open the kundli view to
        see the full eight-koota Guna Milan breakdown.
      </Text>

      <Text style={ps.h2}>4. Send an interest, kindly</Text>
      <Text style={ps.p}>
        When you find someone you like, send an interest. Free members can send 5 interests a month;
        Premium tiers raise or remove that cap. The other side can accept, decline, or simply leave it.
      </Text>

      <Text style={ps.h2}>5. Chat, end-to-end encrypted</Text>
      <Text style={ps.p}>
        When the other side accepts, you can chat — every message is end-to-end encrypted. Even
        ShubhMilan's servers can't read what you send. Photos go through the same encrypted channel.
      </Text>

      <Text style={ps.h2}>6. Decide, together with your family</Text>
      <Text style={ps.p}>
        We don't push you toward anything. Take days, take weeks. Share profiles with your family
        privately. When you're ready, take it offline. That's the goal.
      </Text>
    </MarketingPage>
  );
}
