import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'ShubhMilan Admin',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">ShubhMilan · Admin</div>
            <nav>
              <a href="/">Dashboard</a>
              <a href="/users">Users</a>
              <a href="/verifications">Verifications</a>
              <a href="/reports">Reports</a>
              <a href="/plans">Plans</a>
              <a href="/content">Content</a>
              <a href="/transactions">Transactions</a>
              <a href="/audit">Audit log</a>
              <a href="/settings">Settings</a>
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
