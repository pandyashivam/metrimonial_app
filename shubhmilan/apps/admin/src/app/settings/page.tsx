'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';
import {
  Banner,
  Button,
  Field,
  PageHeader,
  Skeleton,
  inputStyle,
  textareaStyle,
} from '../../lib/ui';

interface Maintenance {
  enabled: boolean;
  message: string;
  allowUserIds?: string[];
}

const ENV_FLAGS: Array<{ vars: string[]; description: string }> = [
  { vars: ['GEMINI_API_KEY'], description: 'AI re-ranking, aboutMe polishing, trait suggestions.' },
  {
    vars: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'],
    description: 'Real payments. Without these, dev mode synthesises orders.',
  },
  { vars: ['AWS_S3_ACCESS_KEY_ID', 'AWS_S3_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'], description: 'Photo + chat media storage.' },
  { vars: ['MSG91_AUTH_KEY', 'TWILIO_ACCOUNT_SID'], description: 'SMS provider chain — at least one for real OTPs.' },
  { vars: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'], description: 'Transactional email (verification, OTP, receipts).' },
  { vars: ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'], description: 'Web Push (browser notifications).' },
  { vars: ['DIGIO_CLIENT_ID', 'HYPERVERGE_APP_ID'], description: 'Aadhaar / KYC providers.' },
];

export default function Settings() {
  const [maint, setMaint] = useState<Maintenance | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api.admin
      .getMaintenance()
      .then((m) => setMaint(m as Maintenance))
      .catch((e) => setErr(e instanceof Error ? e.message : 'Could not load settings.'));
  }, []);

  async function save() {
    if (!maint) return;
    setSaving(true);
    setErr(null);
    setNotice(null);
    try {
      const updated = await api.admin.setMaintenance({
        enabled: maint.enabled,
        message: maint.message,
        allowUserIds: maint.allowUserIds,
      });
      setMaint(updated as Maintenance);
      setNotice('Saved.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker="Configuration"
        title="Settings"
        subtitle="Runtime kill switches and a quick reference to deploy-time environment flags."
      />
      {err ? <Banner>{err}</Banner> : null}
      {notice ? <Banner variant="success">{notice}</Banner> : null}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Maintenance mode</h3>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          Site-wide kill switch. When enabled, every non-admin request returns 503. Auth, admin
          endpoints, and webhooks are always allowed through so you can disable the flag after
          flipping it.
        </p>
        {!maint ? (
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            <Skeleton height={20} width="40%" />
            <Skeleton height={70} />
            <Skeleton height={70} />
          </div>
        ) : (
          <>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontWeight: 600,
                marginTop: 14,
                marginBottom: 16,
              }}
            >
              <input
                type="checkbox"
                checked={maint.enabled}
                onChange={(e) => setMaint({ ...maint, enabled: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              {maint.enabled ? 'Enabled — users see 503' : 'Disabled — requests flow normally'}
            </label>
            <Field label="Public message" hint="Shown to users hitting any route while maintenance is on">
              <textarea
                value={maint.message}
                onChange={(e) => setMaint({ ...maint, message: e.target.value })}
                rows={3}
                style={textareaStyle}
              />
            </Field>
            <Field label="Bypass user IDs" hint="One per line. These users can reach the API even with maintenance on.">
              <textarea
                value={(maint.allowUserIds ?? []).join('\n')}
                onChange={(e) =>
                  setMaint({
                    ...maint,
                    allowUserIds: e.target.value
                      .split(/\n+/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                rows={3}
                placeholder="usr_xxx"
                style={{ ...textareaStyle, fontFamily: 'monospace', fontSize: 13 }}
              />
            </Field>
            <Button onClick={save} loading={saving}>Save</Button>
          </>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Environment-driven flags</h3>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          Set in <code>server/api/.env</code>. Take effect on the next API restart. Each block is
          optional; the related feature gracefully no-ops without the keys.
        </p>
        <ul style={{ paddingLeft: 18, marginTop: 14, lineHeight: 1.7 }}>
          {ENV_FLAGS.map((f) => (
            <li key={f.vars.join(',')} style={{ fontSize: 14, marginBottom: 6 }}>
              {f.vars.map((v, i) => (
                <span key={v}>
                  <code style={codeStyle}>{v}</code>
                  {i < f.vars.length - 1 ? ' / ' : null}
                </span>
              ))}
              {' — '}
              <span style={{ color: 'var(--muted)' }}>{f.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

const codeStyle: React.CSSProperties = {
  background: 'var(--surface-alt)',
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: 12,
  fontFamily: 'monospace',
  color: 'var(--ink)',
};
