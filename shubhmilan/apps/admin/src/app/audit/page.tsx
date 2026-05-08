'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { Banner, Chip, EmptyState, PageHeader, Skeleton } from '../../lib/ui';

interface LogEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  meta: unknown;
  createdAt: string;
  admin: { id: string; email: string };
}

export default function Audit() {
  const [rows, setRows] = useState<LogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.admin
      .logs()
      .then((r) => setRows(r as LogEntry[]))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load audit log.'));
  }, []);

  return (
    <>
      <PageHeader
        kicker="Compliance"
        title="Audit log"
        subtitle="Every admin action is recorded here. Read-only."
      />
      {error ? <Banner>{error}</Banner> : null}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
              <th>Meta</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5}><Skeleton height={14} style={{ margin: '6px 0' }} /></td></tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 0 }}>
                  <EmptyState title="No admin activity yet" description="Once admins act, the trail shows up here." />
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatDateTime(r.createdAt)}</td>
                  <td>{r.admin?.email ?? '—'}</td>
                  <td><Chip label={r.action} tone="primary" /></td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>
                    {r.targetType} {r.targetId}
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'monospace', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.meta ? JSON.stringify(r.meta) : ''}
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
