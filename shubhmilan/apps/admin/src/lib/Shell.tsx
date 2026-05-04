'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { api, tokenProvider } from './api';

const NAV: Array<{ href: string; label: string }> = [
  { href: '/', label: 'Dashboard' },
  { href: '/users', label: 'Users' },
  { href: '/verifications', label: 'Verifications' },
  { href: '/reports', label: 'Reports' },
  { href: '/plans', label: 'Plans' },
  { href: '/content', label: 'Content' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/audit', label: 'Audit log' },
  { href: '/settings', label: 'Settings' },
];

const PUBLIC_ROUTES = new Set(['/login']);

/**
 * Top-level admin chrome. Centralises three concerns that used to be scattered:
 *   1. Auth-guard: redirect to /login before any private route renders. This
 *      replaces the per-page `useEffect` flash-then-redirect pattern.
 *   2. Layout chrome: sidebar + main column on private routes; bare on /login.
 *   3. Sign-out + user identification.
 */
export function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const isPublic = PUBLIC_ROUTES.has(pathname);

  const [authState, setAuthState] = useState<'checking' | 'allowed' | 'redirecting'>(
    isPublic ? 'allowed' : 'checking',
  );
  const [me, setMe] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    if (isPublic) {
      setAuthState('allowed');
      return;
    }
    const token = tokenProvider.getAccessToken();
    if (!token) {
      setAuthState('redirecting');
      router.replace('/login');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const user = await api.me.get();
        if (cancelled) return;
        if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
          tokenProvider.clearTokens();
          setAuthState('redirecting');
          router.replace('/login');
          return;
        }
        setMe({ email: user.email, role: user.role });
        setAuthState('allowed');
      } catch {
        if (cancelled) return;
        tokenProvider.clearTokens();
        setAuthState('redirecting');
        router.replace('/login');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, isPublic, router]);

  function signOut() {
    tokenProvider.clearTokens();
    router.replace('/login');
  }

  if (isPublic) return <>{children}</>;

  if (authState !== 'allowed') {
    return (
      <div style={loaderStyle}>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Checking your session…</div>
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">ShubhMilan · Admin</div>
        <nav>
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <a
                key={item.href}
                href={item.href}
                style={active ? { background: 'rgba(255,255,255,0.08)', color: '#fff' } : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {me ? (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: '#fff' }}>{me.email}</div>
              <div style={{ marginTop: 2 }}>{me.role}</div>
            </div>
          ) : null}
          <button type="button" onClick={signOut} style={signOutStyle}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

const loaderStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  background: 'var(--bg)',
};

const signOutStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'transparent',
  color: 'rgba(255,255,255,0.85)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
};
