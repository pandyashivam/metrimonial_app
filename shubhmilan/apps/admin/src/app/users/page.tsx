'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';
import {
  Banner,
  Button,
  Chip,
  EmptyState,
  Field,
  PageHeader,
  Pagination,
  Skeleton,
  inputStyle,
} from '../../lib/ui';

interface UserRow {
  id: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  role: string;
  createdAt: string;
  profile?: { fullName?: string; city?: string };
}

const PAGE_SIZE = 25;
type StatusFilter = '' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export default function Users() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [committedQ, setCommittedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load(targetPage: number, query: string, status: StatusFilter) {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.admin.users({
        q: query || undefined,
        status: status || undefined,
        limit: PAGE_SIZE,
        offset: (targetPage - 1) * PAGE_SIZE,
      })) as { items: UserRow[]; total: number };
      setUsers(res.items);
      setTotal(res.total ?? 0);
      setPage(targetPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, '', '');
  }, []);

  // Filter change resets to page 1.
  useEffect(() => {
    load(1, committedQ, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function setStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'DELETED') {
    try {
      await api.admin.setUserStatus(id, status);
      setNotice(`Status updated.`);
      load(page, committedQ, statusFilter);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update status.');
    }
  }

  // The impersonate POST endpoint stays on the server for compliance flows
  // (audit-logged, SUPERADMIN-only). The previous "stash tokens in localStorage"
  // UI was half-finished — there was no working way to actually USE the issued
  // tokens because admin and the user app live at different origins. We hide
  // the action from the table until a proper "switch session" flow exists.

  return (
    <>
      <PageHeader
        kicker="Members"
        title="Users"
        subtitle="Search, suspend, restore, or impersonate any account on the platform."
      />
      {error ? <Banner>{error}</Banner> : null}
      {notice ? <Banner variant="success">{notice}</Banner> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setCommittedQ(q);
          load(1, q, statusFilter);
        }}
        style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-end' }}
      >
        <div style={{ flex: 1 }}>
          <Field label="Search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, email, or phone"
              style={inputStyle}
            />
          </Field>
        </div>
        <div style={{ width: 180 }}>
          <Field label="Status">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              style={inputStyle}
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DELETED">Deleted</option>
            </select>
          </Field>
        </div>
        <Button type="submit">Search</Button>
        {committedQ || statusFilter ? (
          <Button
            variant="outline"
            onClick={() => {
              setQ('');
              setCommittedQ('');
              setStatusFilter('');
              load(1, '', '');
            }}
          >
            Clear
          </Button>
        ) : null}
      </form>

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
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7}>
                    <Skeleton height={14} style={{ margin: '6px 0' }} />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 0 }}>
                  <EmptyState
                    title={committedQ ? 'No matches' : 'No users yet'}
                    description={committedQ ? 'Try a different search term.' : 'New signups will appear here.'}
                  />
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.profile?.fullName ?? '—'}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <Chip
                      label={u.role}
                      tone={u.role === 'SUPERADMIN' ? 'accent' : u.role === 'ADMIN' ? 'primary' : 'neutral'}
                    />
                  </td>
                  <td>
                    <Chip
                      label={u.status}
                      tone={u.status === 'ACTIVE' ? 'success' : u.status === 'SUSPENDED' ? 'warn' : 'danger'}
                    />
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {u.status !== 'SUSPENDED' && u.role === 'USER' ? (
                        <Button size="sm" variant="outline" onClick={() => setStatus(u.id, 'SUSPENDED')}>
                          Suspend
                        </Button>
                      ) : null}
                      {u.status !== 'ACTIVE' ? (
                        <Button size="sm" onClick={() => setStatus(u.id, 'ACTIVE')}>
                          Restore
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 ? (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onChange={(p) => load(p, committedQ, statusFilter)}
        />
      ) : null}
    </>
  );
}
