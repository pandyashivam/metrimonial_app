import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return [
    { url: base, priority: 1 },
    { url: `${base}/how-it-works`, priority: 0.8 },
    { url: `${base}/safety`, priority: 0.8 },
    { url: `${base}/pricing`, priority: 0.8 },
  ];
}
