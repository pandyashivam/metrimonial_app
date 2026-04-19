'use client';
import { useEffect, useState } from 'react';

import { api, tokenProvider } from '../lib/api';

interface Stats {
  totalUsers: number;
  signups24h: number;
  signupsMonth: number;
  activeSubs: number;
  openReports: number;
  revenueInr: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenProvider.getAccessToken()) {
      window.location.href = '/login';
      return;
    }
    api.admin
      .stats()
      .then((s) => setStats(s as Stats))
      .catch((e) => setErr(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  const cards = stats
    ? [
        { label: 'Total users', value: stats.totalUsers.toLocaleString() },
        { label: 'Signups (24h)', value: stats.signups24h.toLocaleString() },
        { label: 'Signups (30d)', value: stats.signupsMonth.toLocaleString() },
        { label: 'Active subscriptions', value: stats.activeSubs.toLocaleString() },
        { label: 'Open reports', value: stats.openReports.toLocaleString() },
        { label: 'Revenue (₹)', value: stats.revenueInr.toLocaleString() },
      ]
    : [];

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      {err && <p style={{ color: '#c0392b' }}>{err}</p>}
      <div className="grid grid-4" style={{ marginTop: 24 }}>
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div className="kpi">{c.value}</div>
            <div className="kpi-label">{c.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}
