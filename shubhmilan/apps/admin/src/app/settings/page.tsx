'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';

interface Maintenance {
  enabled: boolean;
  message: string;
  allowUserIds?: string[];
}

export default function Settings() {
  const [maint, setMaint] = useState<Maintenance | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    api.admin
      .getMaintenance()
      .then((m) => setMaint(m as Maintenance))
      .catch((e) => setErr(e instanceof Error ? e.message : 'Load failed'));
  }, []);

  async function save() {
    if (!maint) return;
    setSaving(true);
    setErr(null);
    try {
      const updated = await api.admin.setMaintenance({
        enabled: maint.enabled,
        message: maint.message,
        allowUserIds: maint.allowUserIds,
      });
      setMaint(updated as Maintenance);
      setSavedAt(Date.now());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Settings</h1>

      {/* --- Maintenance mode --- */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Maintenance mode</h3>
        <p style={{ color: 'var(--muted)' }}>
          Site-wide kill switch. When enabled, every non-admin request returns 503. Auth,
          admin endpoints, and webhooks are always allowed through so you can disable the flag
          after flipping it.
        </p>
        {!maint && <p>Loading…</p>}
        {maint && (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={maint.enabled}
                onChange={(e) => setMaint({ ...maint, enabled: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              {maint.enabled ? 'Enabled — users see 503' : 'Disabled — requests flow normally'}
            </label>
            <label style={{ display: 'block', marginTop: 16 }}>
              <span style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                Public message
              </span>
              <textarea
                value={maint.message}
                onChange={(e) => setMaint({ ...maint, message: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #d8d8df',
                  borderRadius: 8,
                  resize: 'vertical',
                }}
              />
            </label>
            <label style={{ display: 'block', marginTop: 16 }}>
              <span style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                Bypass user IDs (one per line)
              </span>
              <textarea
                value={(maint.allowUserIds ?? []).join('\n')}
                onChange={(e) =>
                  setMaint({
                    ...maint,
                    allowUserIds: e.target.value.split(/\n+/).map((s) => s.trim()).filter(Boolean),
                  })
                }
                rows={3}
                placeholder="User IDs here can reach the API even with maintenance on"
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #d8d8df',
                  borderRadius: 8,
                  resize: 'vertical',
                  fontFamily: 'monospace',
                  fontSize: 13,
                }}
              />
            </label>
            <button onClick={save} disabled={saving} style={primaryBtn}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            {savedAt && (
              <span style={{ marginLeft: 12, color: '#1e8a5f', fontSize: 13 }}>
                Saved {new Date(savedAt).toLocaleTimeString()}
              </span>
            )}
            {err && <p style={{ color: '#c0392b', marginTop: 8 }}>{err}</p>}
          </>
        )}
      </div>

      {/* --- Env-driven flags --- */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Environment-driven flags</h3>
        <p style={{ color: 'var(--muted)' }}>
          These are set via env vars and require an API restart. Maintenance mode above is
          runtime-tunable; everything here is deploy-time.
        </p>
        <ul style={{ lineHeight: 2 }}>
          <li>
            <code>OPENAI_API_KEY</code> — when set, AI re-ranking, aboutMe polishing, and trait
            suggestions become available.
          </li>
          <li>
            <code>RAZORPAY_KEY_ID</code> / <code>RAZORPAY_KEY_SECRET</code> — enables real
            payments; dev mode synthesizes orders without keys.
          </li>
          <li>
            <code>R2_ENDPOINT</code> — Cloudflare R2 in prod, MinIO locally.
          </li>
          <li>
            <code>MSG91_AUTH_KEY</code> / <code>TWILIO_*</code> — SMS provider chain.
          </li>
          <li>
            <code>SMTP_*</code> — transactional email.
          </li>
          <li>
            <code>DIGIO_*</code> / <code>HYPERVERGE_*</code> — KYC providers.
          </li>
        </ul>
      </div>
    </>
  );
}

const primaryBtn = {
  marginTop: 20,
  padding: '10px 18px',
  background: 'var(--primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontWeight: 700,
  cursor: 'pointer',
} as const;
