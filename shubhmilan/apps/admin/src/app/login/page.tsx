'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { api, tokenProvider } from '../../lib/api';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('support@tenderfy.org');
  const [password, setPassword] = useState('Admin#12345');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.auth.login({ identifier: email, password });
      if (res.user.role !== 'ADMIN' && res.user.role !== 'SUPERADMIN') {
        tokenProvider.clearTokens();
        throw new Error('Not an admin account');
      }
      tokenProvider.setTokens(res.tokens);
      router.replace('/');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
      <form onSubmit={submit} className="card" style={{ width: 360, padding: 28 }}>
        <h2 style={{ marginTop: 0 }}>Admin sign in</h2>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginTop: 12 }}>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: 10, border: '1px solid #d8d8df', borderRadius: 8, marginTop: 4 }}
          type="email"
        />
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginTop: 12 }}>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: 10, border: '1px solid #d8d8df', borderRadius: 8, marginTop: 4 }}
          type="password"
        />
        {err && <p style={{ color: '#c0392b', fontWeight: 600, marginTop: 12 }}>{err}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 18,
            width: '100%',
            padding: 12,
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
