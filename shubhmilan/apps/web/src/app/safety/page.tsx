export const metadata = { title: 'Safety & Trust' };

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does ShubhMilan verify profiles?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Every profile can progress through six verification tiers: email, phone, Aadhaar, selfie face-match, video KYC, and background check. Higher tiers show more trust signals to future matches.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are my chat messages private?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. All chat messages are end-to-end encrypted using Curve25519 + XSalsa20-Poly1305. The server stores only opaque ciphertext — we cannot read your conversations.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I report a suspicious profile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Open any profile or chat thread and tap Report. A human reviewer responds within 24 hours and all actions are captured in our audit log.',
      },
    },
    {
      '@type': 'Question',
      name: 'What data do you collect about me?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Only what you submit (profile data, photos) plus identity proofs stored encrypted at rest. We never sell data to advertisers or brokers. Full details in our Privacy Policy.',
      },
    },
  ],
};

export default function Safety() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <main className="container section">
        <h1>Safety & Trust</h1>
        <p>
          Every ShubhMilan profile can progress through six verification tiers: email, phone,
          Aadhaar, selfie face-match, video KYC, and background check. The higher the tier, the
          more trust signals future matches see.
        </p>
        <h2>Report anyone, anytime</h2>
        <p>
          Report suspicious profiles from within chat or from any profile page. A human reviewer
          responds within 24 hours.
        </p>
        <h2>Your privacy is not for sale</h2>
        <p>
          We never sell data. Photo privacy is configurable per-photo (public, members-only, or
          request). Chat messages are end-to-end encrypted — our servers cannot read them.
        </p>
      </main>
    </>
  );
}
