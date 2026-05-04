'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api, tokenProvider } from '../../lib/api';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If we already have a session, send the user straight to the dashboard so
  // /login isn't a dead-end after refresh.
  useEffect(() => {
    if (tokenProvider.getAccessToken()) router.replace('/');
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.auth.login({ identifier: email.trim(), password });
      if (res.user.role !== 'ADMIN' && res.user.role !== 'SUPERADMIN') {
        tokenProvider.clearTokens();
        throw new Error('This account is not an admin.');
      }
      tokenProvider.setTokens(res.tokens);
      router.replace('/');
    } catch (e) {
      setErr(e instanceof Error ? e.message : "We couldn't sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <form onSubmit={submit} className="card" style={cardStyle}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.4, color: 'var(--accent, #9e7f3f)', textTransform: 'uppercase' }}>
            ShubhMilan
          </div>
          <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700 }}>Admin sign in</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>
            Use your admin or superadmin account.
          </p>
        </div>
        <Field
          label="Email or phone"
          type="email"
          autoComplete="username"
          value={email}
          onChange={setEmail}
          required
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          required
        />
        {err ? (
          <div style={errorBannerStyle} role="alert">
            {err}
          </div>
        ) : null}
        <button type="submit" disabled={loading || !email || !password} style={submitButtonStyle(loading)}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  type,
  autoComplete,
  value,
  onChange,
  required,
}: {
  label: string;
  type: 'email' | 'password';
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label style={{ display: 'block', marginTop: 14 }}>
      <span style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
        {label}
        {required ? <span style={{ color: '#c0392b' }}> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        style={inputStyle}
      />
    </label>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  background: 'var(--bg)',
  padding: 24,
};

const cardStyle: React.CSSProperties = {
  width: 380,
  maxWidth: '100%',
  padding: 28,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  border: '1.5px solid #d8d8df',
  borderRadius: 10,
  fontSize: 15,
  outline: 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
};

const errorBannerStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 12,
  background: '#f8e8e8',
  border: '1px solid #b83a3a',
  borderRadius: 10,
  color: '#b83a3a',
  fontWeight: 500,
  fontSize: 14,
};

const submitButtonStyle = (loading: boolean): React.CSSProperties => ({
  marginTop: 18,
  width: '100%',
  padding: 13,
  background: 'var(--primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 15,
  cursor: loading ? 'wait' : 'pointer',
  opacity: loading ? 0.85 : 1,
  transition: 'opacity 150ms ease',
});
