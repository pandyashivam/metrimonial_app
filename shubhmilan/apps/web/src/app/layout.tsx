import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shubhmilan.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ShubhMilan — Trusted Matrimony, Free for Everyone',
    template: '%s · ShubhMilan',
  },
  description:
    'Find your life partner with verified profiles, AI-powered matching, and free-forever basics. India&apos;s most trusted matrimony platform.',
  openGraph: {
    title: 'ShubhMilan — Trusted Matrimony',
    description: 'Verified profiles. AI matches. Kundli compatibility. Free for everyone.',
    type: 'website',
    siteName: 'ShubhMilan',
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image' },
  alternates: {
    canonical: SITE_URL,
    // Hreflang scaffolding for future locale rollout. Each locale should have its own
    // subpath (/hi, /gu, /ta, /te) once the translated pages ship; x-default points at
    // the English root today.
    languages: {
      'en-IN': SITE_URL,
      'x-default': SITE_URL,
    },
  },
};

// Organization schema applies site-wide. Page-specific schemas (BlogPosting, FAQPage,
// BreadcrumbList) are attached in the individual route files.
const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ShubhMilan',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [
    'https://twitter.com/shubhmilan',
    'https://www.instagram.com/shubhmilan',
    'https://www.linkedin.com/company/shubhmilan',
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      email: 'support@tenderfy.org',
      contactType: 'customer support',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
  ],
};

const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ShubhMilan',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
