export const metadata = { title: 'Privacy Policy' };

export default function Privacy() {
  return (
    <main className="container section">
      <h1>Privacy Policy</h1>
      <p>Effective date: 2026-04-19. Your privacy is not for sale.</p>

      <h2>What we collect</h2>
      <ul style={{ lineHeight: 2 }}>
        <li>Profile data you submit (name, DOB, preferences, photos).</li>
        <li>
          Identity proof (Aadhaar last-4, selfie, video KYC) — stored encrypted, used only for
          verification. Aadhaar last-4 is encrypted with AES-256-GCM before being written to disk.
        </li>
        <li>Usage events (searches, interests, logins) to improve matching and catch abuse.</li>
      </ul>

      <h2>End-to-end encryption</h2>
      <p>
        Chat messages are encrypted on your device with your recipient&apos;s public key and our
        server stores only opaque ciphertext. We cannot read your messages even if we wanted to.
        Moderation relies on metadata and user reports, never on reading plaintext.
      </p>

      <h2>Who we share with</h2>
      <p>
        Payment processors (Razorpay) receive the minimum required order info. KYC providers
        (Digio / HyperVerge) receive the data needed to verify identity. We never sell data to
        advertisers or brokers.
      </p>

      <h2>Your rights</h2>
      <p>
        You can download, correct, or delete your data anytime. Write to{' '}
        <a href="mailto:support@tenderfy.org">support@tenderfy.org</a>.
      </p>
    </main>
  );
}
