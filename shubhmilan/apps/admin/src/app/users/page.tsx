'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';

interface UserRow {
  id: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  createdAt: string;
  profile?: { fullName?: string; city?: string };
}

export default function Users() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = (await api.admin.users({ q: q || undefined, limit: 50 })) as { items: UserRow[] };
      setUsers(res.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'DELETED') {
    await api.admin.setUserStatus(id, status);
    load();
  }

  async function impersonate(user: UserRow) {
    const reason = prompt(
      `Impersonate ${user.email}?\n\nThis is logged to AdminLog. Brief reason:`,
      '',
    );
    if (reason === null) return;
    try {
      const res = await api.admin.impersonate(user.id, reason || undefined);
      // Stash the tokens in a separate pair of keys so an admin can come back to their
      // own session after the impersonation window closes.
      window.localStorage.setItem('shubhmilan.admin.impersonating', user.email);
      window.localStorage.setItem('shubhmilan.admin.impersonate.access', res.tokens.accessToken);
      window.localStorage.setItem('shubhmilan.admin.impersonate.refresh', res.tokens.refreshToken);
      alert(
        `Impersonation tokens issued for ${user.email}. Use them in a new browser profile — they're stored under shubhmilan.admin.impersonate.*`,
      );
    } catch (e) {
      alert('Impersonation failed: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Users</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, phone"
          style={{ flex: 1, padding: 10, border: '1px solid #d8d8df', borderRadius: 8 }}
        />
        <button onClick={load} className="kpi-label" style={{ padding: '10px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700 }}>
          Search
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                  Loading…
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.profile?.fullName ?? '—'}</td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td>{u.role}</td>
                <td>
                  <span style={{ padding: '3px 8px', borderRadius: 10, background: u.status === 'ACTIVE' ? '#e6f5ee' : '#fbecea', color: u.status === 'ACTIVE' ? '#1e8a5f' : '#c0392b', fontSize: 12, fontWeight: 700 }}>
                    {u.status}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {u.status !== 'SUSPENDED' && (
                    <button onClick={() => setStatus(u.id, 'SUSPENDED')} style={btn('warn')}>
                      Suspend
                    </button>
                  )}
                  {u.status !== 'ACTIVE' && (
                    <button onClick={() => setStatus(u.id, 'ACTIVE')} style={btn('ok')}>
                      Restore
                    </button>
                  )}
                  {u.role === 'USER' && (
                    <button onClick={() => impersonate(u)} style={btn('ok')}>
                      Impersonate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function btn(kind: 'ok' | 'warn' | 'danger') {
  const bg = kind === 'ok' ? '#1e8a5f' : kind === 'warn' ? '#b57a00' : '#c0392b';
  return {
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  } as const;
}
