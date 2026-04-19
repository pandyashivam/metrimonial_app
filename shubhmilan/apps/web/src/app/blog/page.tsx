import Link from 'next/link';

export const metadata = { title: 'Blog' };

const POSTS = [
  {
    slug: 'kundli-explained',
    title: 'Ashtakoot explained — what each Guna means',
    excerpt:
      'Varna to Nadi: a plain-English guide to the eight compatibility factors used in Indian matchmaking.',
  },
  {
    slug: 'encrypted-by-default',
    title: 'Why every ShubhMilan conversation is end-to-end encrypted',
    excerpt: 'A short, non-technical tour of how we protect your conversations — even from ourselves.',
  },
];

export default function Blog() {
  return (
    <main className="container section">
      <h1>Blog</h1>
      <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {POSTS.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="card">
            <h3>{p.title}</h3>
            <p>{p.excerpt}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
