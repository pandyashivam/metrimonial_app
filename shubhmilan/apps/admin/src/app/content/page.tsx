'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';

type Kind = 'SUCCESS_STORY' | 'BLOG_POST' | 'EVENT';
type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface Row {
  id: string;
  kind: Kind;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  status: Status;
  publishedAt: string | null;
  updatedAt: string;
}

const KIND_LABELS: Record<Kind, string> = {
  SUCCESS_STORY: 'Success story',
  BLOG_POST: 'Blog post',
  EVENT: 'Event',
};

export default function Content() {
  const [rows, setRows] = useState<Row[]>([]);
  const [kind, setKind] = useState<Kind | ''>('');
  const [status, setStatus] = useState<Status | ''>('');
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<Partial<Row> | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = (await api.admin.contentList(kind || undefined, status || undefined)) as Row[];
      setRows(r);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, status]);

  async function save() {
    if (!editor) return;
    try {
      if (editor.id) {
        await api.admin.contentUpdate(editor.id, {
          kind: editor.kind,
          slug: editor.slug,
          title: editor.title,
          excerpt: editor.excerpt,
          body: editor.body,
          status: editor.status,
        });
      } else {
        if (!editor.kind || !editor.slug || !editor.title || !editor.body) {
          alert('Kind, slug, title, body are required');
          return;
        }
        await api.admin.contentCreate({
          kind: editor.kind,
          slug: editor.slug,
          title: editor.title,
          excerpt: editor.excerpt ?? null,
          body: editor.body,
          status: editor.status ?? 'DRAFT',
        });
      }
      setEditor(null);
      await load();
    } catch (e) {
      alert('Save failed: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function del(row: Row) {
    if (!confirm(`Delete "${row.title}"? This can't be undone.`)) return;
    await api.admin.contentDelete(row.id);
    await load();
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ marginTop: 0, flex: 1 }}>Content</h1>
        <button
          onClick={() =>
            setEditor({ kind: 'BLOG_POST', status: 'DRAFT', slug: '', title: '', body: '', excerpt: '' })
          }
          style={primaryBtn}
        >
          + New
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <select value={kind} onChange={(e) => setKind(e.target.value as Kind | '')} style={select}>
          <option value="">All kinds</option>
          {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as Status | '')} style={select}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Kind</th>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
                  Loading…
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{KIND_LABELS[r.kind]}</td>
                <td>{r.title}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.slug}</td>
                <td>
                  <span style={statusChip(r.status)}>{r.status}</span>
                </td>
                <td>{new Date(r.updatedAt).toLocaleDateString()}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditor(r)} style={smallBtn('ok')}>
                    Edit
                  </button>
                  <button onClick={() => del(r)} style={smallBtn('danger')}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
                  No content. Click + New to create the first piece.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editor && (
        <div style={scrim} onClick={() => setEditor(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{editor.id ? 'Edit' : 'New'} content</h2>
            <Field label="Kind">
              <select
                value={editor.kind ?? 'BLOG_POST'}
                onChange={(e) => setEditor({ ...editor, kind: e.target.value as Kind })}
                style={input}
              >
                {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Slug (URL)">
              <input
                value={editor.slug ?? ''}
                onChange={(e) => setEditor({ ...editor, slug: e.target.value })}
                placeholder="lowercase-with-hyphens"
                style={input}
              />
            </Field>
            <Field label="Title">
              <input
                value={editor.title ?? ''}
                onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                style={input}
              />
            </Field>
            <Field label="Excerpt">
              <textarea
                value={editor.excerpt ?? ''}
                onChange={(e) => setEditor({ ...editor, excerpt: e.target.value })}
                rows={2}
                style={{ ...input, resize: 'vertical' }}
              />
            </Field>
            <Field label="Body (Markdown supported)">
              <textarea
                value={editor.body ?? ''}
                onChange={(e) => setEditor({ ...editor, body: e.target.value })}
                rows={10}
                style={{ ...input, resize: 'vertical', fontFamily: 'monospace' }}
              />
            </Field>
            <Field label="Status">
              <select
                value={editor.status ?? 'DRAFT'}
                onChange={(e) => setEditor({ ...editor, status: e.target.value as Status })}
                style={input}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={save} style={primaryBtn}>
                Save
              </button>
              <button onClick={() => setEditor(null)} style={{ ...primaryBtn, background: '#f2f2f5', color: '#1a1a1a' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}

const input = {
  width: '100%',
  padding: 10,
  border: '1px solid #d8d8df',
  borderRadius: 8,
  fontSize: 14,
} as const;

const select = { ...input, width: 'auto', padding: 8 };

const primaryBtn = {
  padding: '10px 18px',
  background: 'var(--primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontWeight: 700,
  cursor: 'pointer',
} as const;

function smallBtn(kind: 'ok' | 'danger') {
  return {
    padding: '4px 10px',
    background: kind === 'danger' ? '#c0392b' : '#1e8a5f',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  } as const;
}

function statusChip(s: Status) {
  const map = {
    PUBLISHED: { bg: '#e6f5ee', fg: '#1e8a5f' },
    DRAFT: { bg: '#fff6e0', fg: '#b57a00' },
    ARCHIVED: { bg: '#f2f2f5', fg: '#6e6e78' },
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

const scrim = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(12,12,18,0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
} as const;

const modal = {
  background: '#fff',
  borderRadius: 16,
  padding: 28,
  maxWidth: 640,
  width: '90%',
  maxHeight: '90vh',
  overflow: 'auto',
} as const;
