'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';
import {
  Banner,
  Button,
  Chip,
  EmptyState,
  PageHeader,
  Pagination,
  Skeleton,
} from '../../lib/ui';

interface Report {
  id: string;
  reason: string;
  detail: string | null;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  reporter: { id: string; fullName: string };
  reported: { id: string; fullName: string };
}

const PAGE_SIZE = 25;
type Filter = 'OPEN' | 'RESOLVED' | 'DISMISSED';

export default function Reports() {
  const [items, setItems] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>('OPEN');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(targetPage: number, status: Filter) {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.admin.reports({
        status,
        limit: PAGE_SIZE,
        offset: (targetPage - 1) * PAGE_SIZE,
      })) as { items: Report[]; total: number };
      setItems(res.items);
      setTotal(res.total ?? 0);
      setPage(targetPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function resolve(id: string, status: 'RESOLVED' | 'DISMISSED') {
    try {
      await api.admin.resolveReport(id, status);
      load(page, filter);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update report.');
    }
  }

  const tabs: Array<{ key: Filter; label: string }> = [
    { key: 'OPEN', label: 'Open' },
    { key: 'RESOLVED', label: 'Resolved' },
    { key: 'DISMISSED', label: 'Dismissed' },
  ];

  return (
    <>
      <PageHeader
        kicker="Moderation"
        title="Reports"
        subtitle="Review and resolve reports submitted by members."
      />
      {error ? <Banner>{error}</Banner> : null}

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {tabs.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={filter === t.key ? 'primary' : 'outline'}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Reporter</th>
              <th>Reported</th>
              <th>Reason</th>
              <th>Detail</th>
              <th>Submitted</th>
              <th style={{ width: 200 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6}>
                    <Skeleton height={14} style={{ margin: '6px 0' }} />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 0 }}>
                  <EmptyState
                    title={filter === 'OPEN' ? 'No open reports' : `No ${filter.toLowerCase()} reports`}
                    description={
                      filter === 'OPEN'
                        ? 'The moderation queue is clear. New reports will land here.'
                        : 'Switch tabs to see other report states.'
                    }
                  />
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.reporter?.fullName ?? '—'}</td>
                  <td style={{ fontWeight: 600 }}>{r.reported?.fullName ?? '—'}</td>
                  <td>
                    <Chip label={r.reason} tone="warn" />
                  </td>
                  <td style={{ color: 'var(--muted)', maxWidth: 320 }}>{r.detail ?? '—'}</td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                  <td>
                    {r.status === 'OPEN' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button size="sm" onClick={() => resolve(r.id, 'RESOLVED')}>
                          Resolve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => resolve(r.id, 'DISMISSED')}>
                          Dismiss
                        </Button>
                      </div>
                    ) : (
                      <Chip label={r.status} tone={r.status === 'RESOLVED' ? 'success' : 'neutral'} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 ? (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => load(p, filter)} />
      ) : null}
    </>
  );
}
