'use client';
import { useEffect, useState } from 'react';

import { api } from '../lib/api';

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
    let cancelled = false;
    api.admin
      .stats()
      .then((s) => {
        if (!cancelled) setStats(s as Stats);
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load stats.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards: Array<{ label: string; value: string }> = stats
    ? [
        { label: 'Total users', value: stats.totalUsers.toLocaleString() },
        { label: 'Signups (24h)', value: stats.signups24h.toLocaleString() },
        { label: 'Signups (30d)', value: stats.signupsMonth.toLocaleString() },
        { label: 'Active subscriptions', value: stats.activeSubs.toLocaleString() },
        { label: 'Open reports', value: stats.openReports.toLocaleString() },
        { label: 'Revenue (₹)', value: `₹${stats.revenueInr.toLocaleString()}` },
      ]
    : [];

  return (
    <>
      <header style={{ marginBottom: 24 }}>
        <p style={kickerStyle}>Overview</p>
        <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 700 }}>Dashboard</h1>
        <p style={subStyle}>At-a-glance metrics across the platform.</p>
      </header>
      {err ? (
        <div style={errorBannerStyle} role="alert">
          {err}
        </div>
      ) : null}
      <div className="grid grid-4" style={{ marginTop: 8 }}>
        {stats
          ? cards.map((c) => (
              <div key={c.label} className="card">
                <div className="kpi">{c.value}</div>
                <div className="kpi-label">{c.label}</div>
              </div>
            ))
          : Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </>
  );
}

function SkeletonCard() {
  return (
    <div className="card" style={{ minHeight: 110 }}>
      <div style={skeletonLineStyle({ width: '60%', height: 28 })} />
      <div style={{ ...skeletonLineStyle({ width: '40%', height: 12 }), marginTop: 12 }} />
    </div>
  );
}

const kickerStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.4,
  color: 'var(--muted)',
  textTransform: 'uppercase',
};

const subStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: 'var(--muted)',
  fontSize: 14,
};

const errorBannerStyle: React.CSSProperties = {
  padding: 12,
  background: '#f8e8e8',
  border: '1px solid #b83a3a',
  borderRadius: 10,
  color: '#b83a3a',
  fontWeight: 500,
  fontSize: 14,
  marginBottom: 18,
};

function skeletonLineStyle(args: { width: string; height: number }): React.CSSProperties {
  return {
    width: args.width,
    height: args.height,
    background: '#eae3dc',
    borderRadius: 6,
    animation: 'shubhmilanPulse 1.4s ease-in-out infinite',
  };
}
