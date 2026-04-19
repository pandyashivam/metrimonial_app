'use client';
import type { Plan } from '@shubhmilan/types';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);

  async function load() {
    const res = await api.payments.plans();
    setPlans(res);
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Plans</h1>
      <p style={{ color: 'var(--muted)' }}>Subscription plans exposed on the mobile + web surfaces.</p>
      <div className="grid grid-4" style={{ marginTop: 20 }}>
        {plans.map((p) => (
          <div key={p.id} className="card">
            <h3 style={{ margin: 0 }}>{p.name}</h3>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', margin: '8px 0' }}>
              {p.priceInr === 0 ? 'Free' : `₹${Math.round(p.priceInr / 100)}`}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>{p.durationDays} days</p>
            <ul style={{ paddingLeft: 18, fontSize: 13 }}>
              {(p.features as unknown as string[]).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <span
              style={{
                background: p.active ? '#e6f5ee' : '#fbecea',
                color: p.active ? '#1e8a5f' : '#c0392b',
                padding: '3px 10px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {p.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
