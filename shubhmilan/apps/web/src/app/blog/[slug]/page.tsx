import { notFound } from 'next/navigation';

interface Post {
  title: string;
  body: string;
}

const POSTS: Record<string, Post> = {
  'kundli-explained': {
    title: 'Ashtakoot explained — what each Guna means',
    body:
      'Varna (1 point) — varna compatibility. Vashya (2) — mutual control. Tara (3) — birth-star alignment. Yoni (4) — sexual compatibility. Graha Maitri (5) — friendship of ruling planets. Gana (6) — nature alignment. Bhakoot (7) — moon-sign compatibility. Nadi (8) — genetic/health compatibility. Together they sum to 36; scoring at least 18 is considered acceptable, and scores above 24 are excellent.',
  },
  'encrypted-by-default': {
    title: 'Why every ShubhMilan conversation is end-to-end encrypted',
    body:
      "Your chat messages don't belong to us. We use Curve25519 (nacl.box) to derive a shared secret between you and your match; that secret encrypts each message with an XSalsa20-Poly1305 AEAD. Ciphertext lives on our servers; we can't read it. What we can see — message timestamps and the fact that two parties communicated — is available to moderators only in response to a valid report. Private by default, safe by design.",
  },
};

export function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export default function Post({ params }: { params: { slug: string } }) {
  const post = POSTS[params.slug];
  if (!post) return notFound();
  return (
    <main className="container section">
      <h1>{post.title}</h1>
      <p style={{ fontSize: 18, lineHeight: 1.8 }}>{post.body}</p>
    </main>
  );
}
