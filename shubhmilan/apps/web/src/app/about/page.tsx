export const metadata = { title: 'About us' };

export default function About() {
  return (
    <main className="container section">
      <h1>About ShubhMilan</h1>
      <p>
        ShubhMilan is built for Indian families who are tired of bait-and-switch matrimony sites.
        We believe the basics — creating a profile, discovering matches, starting a conversation —
        should be free forever. Premium helps us fund verification, moderation, and product
        improvements, but is never a gate.
      </p>
      <h2>What we stand for</h2>
      <ul style={{ lineHeight: 2 }}>
        <li>Verified profiles, not photo props.</li>
        <li>Respect, privacy, and end-to-end encrypted conversations.</li>
        <li>Compatibility that blends Indian traditions (Kundli) with modern signals (AI).</li>
        <li>A team that answers grievances, not a ticketing black hole.</li>
      </ul>
    </main>
  );
}
