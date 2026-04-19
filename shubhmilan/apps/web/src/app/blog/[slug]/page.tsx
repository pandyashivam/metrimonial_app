import { notFound } from 'next/navigation';

interface Post {
  title: string;
  body: string;
  publishedAt: string;
  author: string;
}

const POSTS: Record<string, Post> = {
  'kundli-explained': {
    title: 'Ashtakoot explained — what each Guna means',
    body:
      'Varna (1 point) — varna compatibility. Vashya (2) — mutual control. Tara (3) — birth-star alignment. Yoni (4) — sexual compatibility. Graha Maitri (5) — friendship of ruling planets. Gana (6) — nature alignment. Bhakoot (7) — moon-sign compatibility. Nadi (8) — genetic/health compatibility. Together they sum to 36; scoring at least 18 is considered acceptable, and scores above 24 are excellent.',
    publishedAt: '2026-03-01',
    author: 'ShubhMilan Team',
  },
  'encrypted-by-default': {
    title: 'Why every ShubhMilan conversation is end-to-end encrypted',
    body:
      "Your chat messages don't belong to us. We use Curve25519 (nacl.box) to derive a shared secret between you and your match; that secret encrypts each message with an XSalsa20-Poly1305 AEAD. Ciphertext lives on our servers; we can't read it. What we can see — message timestamps and the fact that two parties communicated — is available to moderators only in response to a valid report. Private by default, safe by design.",
    publishedAt: '2026-04-01',
    author: 'ShubhMilan Engineering',
  },
};

export function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = POSTS[params.slug];
  if (!post) return { title: 'Not found' };
  return {
    title: post.title,
    description: post.body.slice(0, 160),
    openGraph: { title: post.title, type: 'article' },
  };
}

export default function Post({ params }: { params: { slug: string } }) {
  const post = POSTS[params.slug];
  if (!post) return notFound();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shubhmilan.com';
  const json = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { '@type': 'Organization', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'ShubhMilan',
      logo: { '@type': 'ImageObject', url: `${site}/logo.png` },
    },
    mainEntityOfPage: `${site}/blog/${params.slug}`,
    description: post.body.slice(0, 160),
  };
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
      />
      <main className="container section">
        <p style={{ color: 'var(--muted)' }}>
          {new Date(post.publishedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}{' '}
          · {post.author}
        </p>
        <h1>{post.title}</h1>
        <p style={{ fontSize: 18, lineHeight: 1.8 }}>{post.body}</p>
      </main>
    </>
  );
}
