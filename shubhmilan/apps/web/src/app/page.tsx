import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid var(--line)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Link href="/" style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: 22 }}>
          ShubhMilan
        </Link>
        <nav style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/safety">Safety</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login" className="btn btn-primary" style={{ color: '#fff' }}>
            Sign in
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div>
          <span
            style={{
              display: 'inline-flex',
              padding: '7px 18px',
              borderRadius: 30,
              background: 'rgba(255,255,255,.14)',
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 20,
              border: '1px solid rgba(255,255,255,.2)',
            }}
          >
            Trusted by Indian families · Verified & free forever
          </span>
          <h1>Find the one, the right way.</h1>
          <p>
            Verified profiles. AI-powered matches. Ashtakoot kundli compatibility. No hidden
            paywalls. Built for Indian families.
          </p>
          <div className="cta">
            <Link href="/signup" className="btn btn-primary" style={{ background: '#fff', color: 'var(--primary)' }}>
              Create your free profile
            </Link>
            <Link href="/how-it-works" className="btn btn-outline">
              Learn more
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: 40 }}>Why ShubhMilan</h2>
          <div className="grid grid-3">
            <div className="card">
              <h3>6-step verification</h3>
              <p>Email, phone, Aadhaar, selfie match, video KYC, and optional background checks.</p>
            </div>
            <div className="card">
              <h3>AI matchmaking</h3>
              <p>Ranked by religion, mother tongue, values, hobbies, education, and kundli.</p>
            </div>
            <div className="card">
              <h3>Free forever</h3>
              <p>Create a profile, browse, and chat with mutual interests — without a paywall.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#fff', borderTop: '1px solid var(--line)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Ready to start?</h2>
          <p style={{ color: 'var(--muted)', maxWidth: 520, margin: '0 auto 28px' }}>
            Join thousands of families across India finding the right match, safely and respectfully.
          </p>
          <Link href="/signup" className="btn btn-primary">
            Create a free profile
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          <div>
            <h4>ShubhMilan</h4>
            <p style={{ fontSize: 13, opacity: 0.75 }}>Trusted Indian matrimony, built from the ground up.</p>
          </div>
          <div>
            <h4>Product</h4>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/safety">Safety</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/grievance">Grievance</Link>
          </div>
          <div>
            <h4>Legal</h4>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
