'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';
import {
  Banner,
  Chip,
  EmptyState,
  PageHeader,
  Skeleton,
  inputStyle,
} from '../../lib/ui';

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
      const res = (await api.admin.transactions(status ? { status } : {})) as { items: Tx[] };
      setItems(res.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load transactions.');
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
      <PageHeader
        kicker="Payments"
        title="Transactions"
        subtitle="Local subscription ledger — webhooks write rows on payment events. Cross-reference with the Razorpay dashboard for upstream state."
      />
      {err ? <Banner>{err}</Banner> : null}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '0 0 16px', flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, color: 'var(--muted)' }}>Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ ...inputStyle, width: 'auto', padding: '8px 12px' }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || 'All'}</option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--muted)' }}>
          Active revenue:{' '}
          <strong style={{ color: 'var(--ink)' }}>
            ₹{(totalRevenue / 100).toLocaleString('en-IN')}
          </strong>
        </div>
      </div>

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
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7}><Skeleton height={14} style={{ margin: '6px 0' }} /></td></tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 0 }}>
                  <EmptyState
                    title="No transactions"
                    description={status ? `No ${status.toLowerCase()} transactions yet.` : 'Subscriptions will appear here once they start.'}
                  />
                </td>
              </tr>
            ) : (
              items.map((t) => (
                <tr key={t.id}>
                  <td>{t.user?.email ?? t.userId}</td>
                  <td style={{ fontWeight: 600 }}>{t.plan?.name ?? t.planId}</td>
                  <td><Chip label={t.status} tone={statusTone(t.status)} /></td>
                  <td>₹{((t.plan?.priceInr ?? 0) / 100).toLocaleString('en-IN')}</td>
                  <td>{new Date(t.startsAt).toLocaleDateString()}</td>
                  <td>{new Date(t.endsAt).toLocaleDateString()}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>
                    {t.razorpayPaymentId ?? t.razorpayOrderId ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function statusTone(s: Tx['status']): 'success' | 'warn' | 'neutral' | 'danger' {
  if (s === 'ACTIVE') return 'success';
  if (s === 'PENDING') return 'warn';
  if (s === 'FAILED') return 'danger';
  return 'neutral';
}
