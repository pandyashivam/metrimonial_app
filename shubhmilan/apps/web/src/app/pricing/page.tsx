export const metadata = { title: 'Pricing' };

const PLANS = [
  { name: 'Free Forever', price: '₹0', features: ['Create profile', 'Browse profiles', '5 interests / month', 'Basic chat'] },
  { name: 'Silver', price: '₹999 / 3mo', features: ['Unlimited interests', 'See who viewed you', 'Priority listing'] },
  { name: 'Gold', price: '₹1999 / 6mo', features: ['Verified badge', 'Direct contact details', 'Relationship manager'] },
  { name: 'Platinum', price: '₹2999 / 12mo', features: ['Top highlight', 'Horoscope report', 'Wedding planner'] },
];

export default function Pricing() {
  return (
    <main className="container section">
      <h1 style={{ textAlign: 'center' }}>Pricing</h1>
      <p style={{ textAlign: 'center', color: 'var(--muted)', maxWidth: 560, margin: '0 auto 32px' }}>
        Everyone gets a genuinely free tier. Upgrade only if you want more.
      </p>
      <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {PLANS.map((p) => (
          <div key={p.name} className="card">
            <h3>{p.name}</h3>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', margin: '8px 0' }}>{p.price}</p>
            <ul style={{ paddingLeft: 18, color: 'var(--text)' }}>
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
