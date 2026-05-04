'use client';
import type { Plan } from '@shubhmilan/types';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';
import {
  Banner,
  Button,
  Chip,
  Field,
  Modal,
  PageHeader,
  Skeleton,
  inputStyle,
} from '../../lib/ui';

interface PlanForm {
  name: string;
  priceRupees: string;
  durationDays: string;
  features: string;
  active: boolean;
}

const EMPTY_FORM: PlanForm = {
  name: '',
  priceRupees: '0',
  durationDays: '30',
  features: '',
  active: true,
};

export default function Plans() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setError(null);
    try {
      const res = await api.payments.plans();
      setPlans(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load plans.');
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function togglePlan(p: Plan) {
    try {
      await api.admin.updatePlan(p.id, { active: !p.active });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not toggle plan.');
    }
  }

  return (
    <>
      <PageHeader
        kicker="Catalogue"
        title="Plans"
        subtitle="Subscription tiers exposed across mobile, web, and admin."
        actions={<Button onClick={() => setCreating(true)}>+ New plan</Button>}
      />
      {error ? <Banner>{error}</Banner> : null}
      <div className="grid grid-4">
        {plans === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card">
                <Skeleton height={20} width="50%" />
                <Skeleton height={32} width="60%" style={{ marginTop: 14 }} />
                <Skeleton height={12} width="35%" style={{ marginTop: 8 }} />
                <Skeleton height={12} style={{ marginTop: 18 }} />
                <Skeleton height={12} style={{ marginTop: 8 }} />
              </div>
            ))
          : plans.map((p) => (
              <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{p.name}</h3>
                  <Chip
                    label={p.active ? 'Active' : 'Inactive'}
                    tone={p.active ? 'success' : 'danger'}
                  />
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                  {p.priceInr === 0 ? 'Free' : `₹${Math.round(p.priceInr / 100)}`}
                </p>
                <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
                  {p.durationDays} days
                </p>
                <ul style={{ paddingLeft: 18, fontSize: 13, margin: '4px 0', color: 'var(--ink)' }}>
                  {(p.features as unknown as string[]).map((f) => (
                    <li key={f} style={{ marginBottom: 2 }}>{f}</li>
                  ))}
                </ul>
                <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => togglePlan(p)}>
                    {p.active ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            ))}
      </div>

      <PlanFormModal
        open={creating}
        title="Create plan"
        onClose={() => setCreating(false)}
        onSave={async (form) => {
          await api.admin.createPlan(formToPayload(form));
          setCreating(false);
          await load();
        }}
      />
      <PlanFormModal
        open={!!editing}
        title={`Edit "${editing?.name ?? ''}"`}
        initial={editing ? planToForm(editing) : undefined}
        onClose={() => setEditing(null)}
        onSave={async (form) => {
          if (!editing) return;
          await api.admin.updatePlan(editing.id, formToPayload(form));
          setEditing(null);
          await load();
        }}
      />
    </>
  );
}

function planToForm(p: Plan): PlanForm {
  return {
    name: p.name,
    priceRupees: String(Math.round(p.priceInr / 100)),
    durationDays: String(p.durationDays),
    features: (p.features as unknown as string[]).join('\n'),
    active: p.active,
  };
}

function formToPayload(form: PlanForm) {
  return {
    name: form.name.trim(),
    priceInr: Math.max(0, Math.round(Number(form.priceRupees) || 0)) * 100,
    durationDays: Math.max(1, Math.round(Number(form.durationDays) || 0)),
    features: form.features.split('\n').map((f) => f.trim()).filter(Boolean).slice(0, 20),
    active: form.active,
  };
}

function PlanFormModal({
  open,
  title,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  initial?: PlanForm;
  onClose: () => void;
  onSave: (form: PlanForm) => Promise<void>;
}) {
  const [form, setForm] = useState<PlanForm>(initial ?? EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initial ?? EMPTY_FORM);
      setErr(null);
    }
  }, [open, initial]);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      if (!form.name.trim()) throw new Error('Name is required.');
      const price = Number(form.priceRupees);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error('Price must be 0 or a positive number.');
      }
      const days = Number(form.durationDays);
      if (!Number.isInteger(days) || days < 1) {
        throw new Error('Duration must be a whole number of days, at least 1.');
      }
      await onSave(form);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {err ? <Banner>{err}</Banner> : null}
      <Field label="Name" required>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
          placeholder="e.g. Gold"
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Price (₹)" hint="0 for free plan">
          <input
            value={form.priceRupees}
            onChange={(e) => setForm({ ...form, priceRupees: e.target.value })}
            inputMode="numeric"
            style={inputStyle}
          />
        </Field>
        <Field label="Duration (days)" required>
          <input
            value={form.durationDays}
            onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
            inputMode="numeric"
            style={inputStyle}
          />
        </Field>
      </div>
      <Field label="Features" hint="One per line, up to 20">
        <textarea
          value={form.features}
          onChange={(e) => setForm({ ...form, features: e.target.value })}
          style={{ ...inputStyle, minHeight: 130, resize: 'vertical', fontFamily: 'inherit' }}
          placeholder={'Unlimited interests\nSee who viewed\nPriority support'}
        />
      </Field>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
        />
        <span style={{ fontSize: 14 }}>Visible to members</span>
      </label>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={busy}>Save plan</Button>
      </div>
    </Modal>
  );
}
