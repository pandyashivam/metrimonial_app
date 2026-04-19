export default function Settings() {
  return (
    <>
      <h1 style={{ marginTop: 0 }}>Settings</h1>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Feature flags (env)</h3>
        <p style={{ color: 'var(--muted)' }}>
          Flags are driven by env vars. To change: edit <code>.env</code> on the API host and
          restart. Today&apos;s knobs:
        </p>
        <ul style={{ lineHeight: 2 }}>
          <li>
            <code>OPENAI_API_KEY</code> — when set, AI re-ranking, aboutMe polishing, and trait
            suggestions become available.
          </li>
          <li>
            <code>RAZORPAY_KEY_ID</code> / <code>RAZORPAY_KEY_SECRET</code> — enables real payments;
            dev mode synthesizes orders without keys.
          </li>
          <li>
            <code>R2_ENDPOINT</code> — Cloudflare R2 in prod, MinIO locally.
          </li>
        </ul>
      </div>
    </>
  );
}
