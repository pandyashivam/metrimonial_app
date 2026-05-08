/**
 * Tiny formatting helpers shared by every admin table. Kept in `lib/` rather
 * than inline so date columns stay visually consistent across users / content
 * / transactions / audit / verifications.
 */

const dtf = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const dateOnly = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

/** Date + time ("12 May 2026, 14:32") for activity timestamps. */
export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return dtf.format(d);
}

/** Date only ("12 May 2026") for less critical timestamps. */
export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return dateOnly.format(d);
}

/** "₹1,49,900 → ₹1,499" via paise-to-rupees division. */
export function formatPaiseAsRupees(paise: number | null | undefined): string {
  if (paise == null) return '—';
  const rupees = paise / 100;
  return rupees.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}
