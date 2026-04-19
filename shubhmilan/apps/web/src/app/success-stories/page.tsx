import Link from 'next/link';

export const metadata = { title: 'Success Stories' };

const STORIES = [
  {
    slug: 'priya-arjun',
    names: 'Priya & Arjun',
    city: 'Jaipur → Hyderabad',
    summary:
      'Priya and Arjun matched in February and tied the knot in Jaipur in November. They love how Kundli + AI scoring gave them confidence to meet offline.',
  },
  {
    slug: 'sneha-rohan',
    names: 'Sneha & Rohan',
    city: 'Pune → Delhi',
    summary:
      'A Maharashtrian-Punjabi match made through mutual-interest chat. Verified trust scores and careful conversation led them to a traditional wedding.',
  },
];

export default function SuccessStories() {
  return (
    <main className="container section">
      <h1>Success stories</h1>
      <p>Real couples who met on ShubhMilan. Profile names used with consent.</p>
      <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {STORIES.map((s) => (
          <Link key={s.slug} href={`/success-stories/${s.slug}`} className="card">
            <h3>{s.names}</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>{s.city}</p>
            <p>{s.summary}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
