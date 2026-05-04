'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';
import {
  Banner,
  Button,
  Chip,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Pagination,
  Skeleton,
  inputStyle,
} from '../../lib/ui';

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

const PAGE_SIZE = 25;

export default function Content() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState<Kind | ''>('');
  const [status, setStatus] = useState<Status | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Partial<Row> | null>(null);

  async function load(targetPage: number) {
    setLoading(true);
    setError(null);
    try {
      const r = (await api.admin.contentList({
        kind: kind || undefined,
        status: status || undefined,
        limit: PAGE_SIZE,
        offset: (targetPage - 1) * PAGE_SIZE,
      })) as { items: Row[]; total: number };
      setRows(r.items);
      setTotal(r.total ?? 0);
      setPage(targetPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load content.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, status]);

  async function save() {
    if (!editor) return;
    setError(null);
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
          setError('Kind, slug, title, and body are required.');
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
      await load(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    }
  }

  async function del(row: Row) {
    if (!window.confirm(`Delete "${row.title}"? This can't be undone.`)) return;
    try {
      await api.admin.contentDelete(row.id);
      await load(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    }
  }

  return (
    <>
      <PageHeader
        kicker="Marketing"
        title="Content"
        subtitle="Success stories, blog posts, and events. Publishing instantly affects every surface."
        actions={
          <Button
            onClick={() =>
              setEditor({
                kind: 'BLOG_POST',
                status: 'DRAFT',
                slug: '',
                title: '',
                body: '',
                excerpt: '',
              })
            }
          >
            + New
          </Button>
        }
      />
      {error ? <Banner>{error}</Banner> : null}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={kind} onChange={(e) => setKind(e.target.value as Kind | '')} style={selectStyle}>
          <option value="">All kinds</option>
          {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
            <option key={k} value={k}>{KIND_LABELS[k]}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as Status | '')} style={selectStyle}>
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
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={6}><Skeleton height={14} style={{ margin: '6px 0' }} /></td></tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 0 }}>
                  <EmptyState
                    title="No content yet"
                    description="Click + New to create the first piece."
                  />
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{KIND_LABELS[r.kind]}</td>
                  <td style={{ fontWeight: 600 }}>{r.title}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>{r.slug}</td>
                  <td>
                    <Chip
                      label={r.status}
                      tone={r.status === 'PUBLISHED' ? 'success' : r.status === 'DRAFT' ? 'warn' : 'neutral'}
                    />
                  </td>
                  <td>{new Date(r.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button size="sm" variant="outline" onClick={() => setEditor(r)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => del(r)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 ? (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => load(p)} />
      ) : null}

      <Modal
        open={!!editor}
        onClose={() => setEditor(null)}
        title={editor?.id ? `Edit "${editor.title ?? ''}"` : 'New content'}
        width={680}
      >
        {editor ? (
          <>
            <Field label="Kind" required>
              <select
                value={editor.kind ?? 'BLOG_POST'}
                onChange={(e) => setEditor({ ...editor, kind: e.target.value as Kind })}
                style={inputStyle}
              >
                {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
                  <option key={k} value={k}>{KIND_LABELS[k]}</option>
                ))}
              </select>
            </Field>
            <Field label="Slug (URL)" required hint="Lowercase, hyphens only">
              <input
                value={editor.slug ?? ''}
                onChange={(e) => setEditor({ ...editor, slug: e.target.value })}
                placeholder="lowercase-with-hyphens"
                style={inputStyle}
              />
            </Field>
            <Field label="Title" required>
              <input
                value={editor.title ?? ''}
                onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Excerpt" hint="One- or two-sentence preview">
              <textarea
                value={editor.excerpt ?? ''}
                onChange={(e) => setEditor({ ...editor, excerpt: e.target.value })}
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </Field>
            <Field label="Body" required hint="Markdown supported">
              <textarea
                value={editor.body ?? ''}
                onChange={(e) => setEditor({ ...editor, body: e.target.value })}
                rows={10}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
              />
            </Field>
            <Field label="Status">
              <select
                value={editor.status ?? 'DRAFT'}
                onChange={(e) => setEditor({ ...editor, status: e.target.value as Status })}
                style={inputStyle}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button variant="outline" onClick={() => setEditor(null)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </>
        ) : null}
      </Modal>
    </>
  );
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  width: 'auto',
  padding: '9px 12px',
};
