import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Shell } from '../lib/Shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShubhMilan Admin',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
