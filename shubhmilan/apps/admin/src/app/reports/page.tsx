'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';

interface Report {
  id: string;
  reason: string;
  detail: string | null;
  status: string;
  createdAt: string;
  reporter: { id: string; fullName: string };
  reported: { id: string; fullName: string };
}

export default function Reports() {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = (await api.admin.reports()) as Report[];
      setItems(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(id: string, status: 'RESOLVED' | 'DISMISSED') {
    await api.admin.resolveReport(id, status);
    load();
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Reports</h1>
      <p style={{ color: 'var(--muted)' }}>Moderation queue — open reports only.</p>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Reporter</th>
              <th>Reported</th>
              <th>Reason</th>
              <th>Detail</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                  Loading…
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id}>
                <td>{r.reporter.fullName}</td>
                <td>{r.reported.fullName}</td>
                <td>{r.reason}</td>
                <td style={{ color: 'var(--muted)', maxWidth: 360 }}>{r.detail}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => resolve(r.id, 'RESOLVED')}
                    style={{ background: '#1e8a5f', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => resolve(r.id, 'DISMISSED')}
                    style={{ background: '#6e6e78', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Dismiss
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
