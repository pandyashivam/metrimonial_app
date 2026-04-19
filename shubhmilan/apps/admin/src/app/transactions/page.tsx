'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';

interface Tx {
  id: string;
  userId: string;
  planId: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'FAILED';
  startsAt: string;
  endsAt: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  plan?: { name: string; priceInr: number };
  user?: { id: string; email: string };
}

const STATUSES = ['', 'PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'FAILED'] as const;

export default function Transactions() {
  const [items, setItems] = useState<Tx[]>([]);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = (await api.admin.transactions(
        status ? { status } : {},
      )) as { items: Tx[] };
      setItems(res.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const totalRevenue = items
    .filter((t) => t.status === 'ACTIVE')
    .reduce((s, t) => s + (t.plan?.priceInr ?? 0), 0);

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Transactions</h1>
      <p style={{ color: 'var(--muted)' }}>
        Local subscription ledger — webhooks write rows on <code>payment.captured</code> /
        <code>payment.failed</code>. Cross-reference with Razorpay dashboard for upstream state.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '20px 0' }}>
        <label style={{ fontSize: 13, color: 'var(--muted)' }}>Status:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: 8, border: '1px solid #d8d8df', borderRadius: 8 }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s || 'All'}
            </option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto', fontWeight: 700 }}>
          Active revenue: ₹{(totalRevenue / 100).toLocaleString('en-IN')}
        </div>
      </div>

      {err && <p style={{ color: '#c0392b' }}>{err}</p>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Starts</th>
              <th>Ends</th>
              <th>Razorpay ref</th>
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
            {!loading &&
              items.map((t) => (
                <tr key={t.id}>
                  <td>{t.user?.email ?? t.userId}</td>
                  <td>{t.plan?.name ?? t.planId}</td>
                  <td>
                    <span style={statusChip(t.status)}>{t.status}</span>
                  </td>
                  <td>₹{((t.plan?.priceInr ?? 0) / 100).toLocaleString('en-IN')}</td>
                  <td>{new Date(t.startsAt).toLocaleDateString()}</td>
                  <td>{new Date(t.endsAt).toLocaleDateString()}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {t.razorpayPaymentId ?? t.razorpayOrderId ?? '—'}
                  </td>
                </tr>
              ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                  No transactions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function statusChip(s: Tx['status']) {
  const map = {
    ACTIVE: { bg: '#e6f5ee', fg: '#1e8a5f' },
    PENDING: { bg: '#fff6e0', fg: '#b57a00' },
    EXPIRED: { bg: '#f2f2f5', fg: '#6e6e78' },
    CANCELLED: { bg: '#f2f2f5', fg: '#6e6e78' },
    FAILED: { bg: '#fbecea', fg: '#c0392b' },
  }[s];
  return {
    padding: '3px 8px',
    borderRadius: 10,
    background: map.bg,
    color: map.fg,
    fontSize: 12,
    fontWeight: 700,
  } as const;
}
