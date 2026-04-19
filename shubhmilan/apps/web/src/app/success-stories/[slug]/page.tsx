import { notFound } from 'next/navigation';

interface Story {
  names: string;
  city: string;
  body: string;
}

const STORIES: Record<string, Story> = {
  'priya-arjun': {
    names: 'Priya & Arjun',
    city: 'Jaipur → Hyderabad',
    body:
      'We matched 96% on ShubhMilan — the Kundli compatibility was 30/36 which put our families at ease immediately. Within two weeks of accepting mutual interest, we were on our first video call. What set ShubhMilan apart for us was the lack of a paywall for early conversations — we could actually get to know each other before committing to anything.',
  },
  'sneha-rohan': {
    names: 'Sneha & Rohan',
    city: 'Pune → Delhi',
    body:
      'A Maharashtrian architect and a Punjabi finance manager — we met on ShubhMilan after Sneha\'s mother read about the 6-step verification tier and insisted we try it. Rohan already had PREMIUM trust; that meant a lot. Our Ashtakoot came out 28/36 and our conversation stretched late into the night, every night.',
  },
};

export function generateStaticParams() {
  return Object.keys(STORIES).map((slug) => ({ slug }));
}

export default function Story({ params }: { params: { slug: string } }) {
  const story = STORIES[params.slug];
  if (!story) return notFound();
  return (
    <main className="container section">
      <p style={{ color: 'var(--muted)' }}>{story.city}</p>
      <h1>{story.names}</h1>
      <p style={{ fontSize: 18, lineHeight: 1.75 }}>{story.body}</p>
    </main>
  );
}
