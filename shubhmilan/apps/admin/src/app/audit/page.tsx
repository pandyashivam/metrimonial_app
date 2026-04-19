'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';

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
  const [rows, setRows] = useState<LogEntry[]>([]);

  useEffect(() => {
    api.admin.logs().then((r) => setRows(r as LogEntry[]));
  }, []);

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Audit log</h1>
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
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>{r.admin?.email}</td>
                <td style={{ fontWeight: 700, fontSize: 12 }}>{r.action}</td>
                <td>
                  {r.targetType} {r.targetId}
                </td>
                <td style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'monospace' }}>
                  {r.meta ? JSON.stringify(r.meta) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
