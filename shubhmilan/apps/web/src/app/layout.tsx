import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
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
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
