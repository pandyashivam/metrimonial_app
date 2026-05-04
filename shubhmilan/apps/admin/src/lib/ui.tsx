'use client';

import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react';

/**
 * Small in-package UI library so admin pages stop hand-rolling the same
 * button / chip / banner / skeleton inline styles. Inline styles still flow
 * down through these components — no extra build step or CSS-in-JS — but the
 * surface every page imports is a single, consistent vocabulary.
 */

// ---------- PageHeader ----------

export function PageHeader({
  kicker,
  title,
  subtitle,
  actions,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header style={pageHeaderStyle}>
      <div>
        {kicker ? <p style={kickerStyle}>{kicker}</p> : null}
        <h1 style={titleStyle}>{title}</h1>
        {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div> : null}
    </header>
  );
}

// ---------- Button ----------

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  type = 'button',
  onClick,
  style,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const v = BUTTON_VARIANTS[variant];
  const s = BUTTON_SIZES[size];
  const isDisabled = !!disabled || !!loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...buttonBaseStyle,
        ...s,
        ...v,
        opacity: isDisabled ? 0.55 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {loading ? '…' : children}
    </button>
  );
}

const buttonBaseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  border: '1.5px solid transparent',
  borderRadius: 10,
  fontWeight: 600,
  letterSpacing: 0.2,
  transition: 'background-color 150ms ease, border-color 150ms ease, opacity 120ms ease',
  whiteSpace: 'nowrap',
};

const BUTTON_SIZES: Record<ButtonSize, CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 13, minHeight: 30 },
  md: { padding: '9px 16px', fontSize: 14, minHeight: 38 },
};

const BUTTON_VARIANTS: Record<ButtonVariant, CSSProperties> = {
  primary: { background: 'var(--primary)', borderColor: 'var(--primary)', color: '#fff' },
  outline: { background: 'transparent', borderColor: 'var(--line)', color: 'var(--ink)' },
  ghost: { background: 'transparent', borderColor: 'transparent', color: 'var(--primary)' },
  danger: { background: '#b83a3a', borderColor: '#b83a3a', color: '#fff' },
};

// ---------- Banner ----------

type BannerVariant = 'error' | 'success' | 'info' | 'warn';

export function Banner({
  children,
  variant = 'error',
  title,
  style,
}: {
  children: ReactNode;
  variant?: BannerVariant;
  title?: string;
  style?: CSSProperties;
}) {
  const v = BANNER_VARIANTS[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      style={{
        padding: 12,
        borderRadius: 10,
        border: `1px solid ${v.border}`,
        background: v.bg,
        color: v.fg,
        marginBottom: 16,
        ...style,
      }}
    >
      {title ? <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{title}</div> : null}
      <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

const BANNER_VARIANTS: Record<BannerVariant, { bg: string; border: string; fg: string }> = {
  error: { bg: '#f8e8e8', border: '#b83a3a', fg: '#b83a3a' },
  success: { bg: '#e6f1eb', border: '#2e7d5b', fg: '#2e7d5b' },
  info: { bg: '#e7f0fa', border: '#1e5fa8', fg: '#1e5fa8' },
  warn: { bg: '#fff5e0', border: '#b57a00', fg: '#7d5a08' },
};

// ---------- Chip ----------

type ChipTone = 'neutral' | 'primary' | 'accent' | 'success' | 'warn' | 'danger' | 'info';

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: ChipTone }) {
  const c = CHIP_TONES[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        border: `1px solid ${c.border}`,
        background: c.bg,
        color: c.fg,
        letterSpacing: 0.2,
      }}
    >
      {label}
    </span>
  );
}

const CHIP_TONES: Record<ChipTone, { bg: string; border: string; fg: string }> = {
  neutral: { bg: 'var(--surface-alt)', border: 'var(--line)', fg: 'var(--ink)' },
  primary: { bg: '#fbf1f4', border: '#e8b4c2', fg: 'var(--primary)' },
  accent: { bg: '#fbf6eb', border: '#e0c58d', fg: 'var(--accent-dark)' },
  success: { bg: '#e6f1eb', border: '#2e7d5b', fg: '#2e7d5b' },
  warn: { bg: '#fff5e0', border: '#b57a00', fg: '#7d5a08' },
  danger: { bg: '#f8e8e8', border: '#b83a3a', fg: '#b83a3a' },
  info: { bg: '#e7f0fa', border: '#1e5fa8', fg: '#1e5fa8' },
};

// ---------- Input + Field ----------

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
        {label}
        {required ? <span style={{ color: '#b83a3a' }}> *</span> : null}
      </span>
      {children}
      {error ? (
        <span style={{ display: 'block', color: '#b83a3a', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
          {error}
        </span>
      ) : hint ? (
        <span style={{ display: 'block', color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid var(--line)',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  background: 'var(--surface)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
};

export const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 96,
  resize: 'vertical',
  fontFamily: 'inherit',
};

// ---------- Skeleton ----------

export function Skeleton({
  width = '100%',
  height = 16,
  rounded = 6,
  style,
}: {
  width?: string | number;
  height?: number;
  rounded?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      style={{
        display: 'block',
        width,
        height,
        borderRadius: rounded,
        background: 'var(--surface-alt)',
        animation: 'shubhmilanPulse 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function SkeletonRow() {
  return (
    <tr>
      <td colSpan={99}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
          <Skeleton width={32} height={32} rounded={16} />
          <div style={{ flex: 1, display: 'grid', gap: 6 }}>
            <Skeleton width="55%" height={12} />
            <Skeleton width="80%" height={10} />
          </div>
        </div>
      </td>
    </tr>
  );
}

// ---------- Modal ----------

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // On open: capture the element that had focus, move focus into the dialog.
  // On close: restore focus to the previously-focused element. This is the
  // accessibility behaviour any keyboard-only user expects from a dialog.
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement)
      ? document.activeElement
      : null;
    const node = dialogRef.current;
    if (node) {
      const focusable = node.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (focusable ?? node).focus();
    }
    return () => {
      previousFocusRef.current?.focus();
    };
  }, [open]);

  // Escape closes; Tab cycles within the dialog (lightweight focus trap).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const node = dialogRef.current;
      if (!node) return;
      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('aria-hidden'));
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 23, 24, 0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          background: 'var(--surface)',
          borderRadius: 14,
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 60px rgba(26,23,24,0.25)',
          outline: 'none',
        }}
      >
        <header
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 id={titleId} style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 24,
              cursor: 'pointer',
              color: 'var(--muted)',
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </header>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

// ---------- Pagination ----------

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  return (
    <div
      style={{
        marginTop: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ color: 'var(--muted)', fontSize: 13 }}>
        Showing <strong style={{ color: 'var(--ink)' }}>{start}–{end}</strong> of{' '}
        <strong style={{ color: 'var(--ink)' }}>{total}</strong>
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <Button variant="outline" size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>
          ← Previous
        </Button>
        <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--muted)', padding: '0 8px' }}>
          Page {page} of {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

// ---------- EmptyState ----------

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div style={emptyStyle}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
      {description ? <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>{description}</div> : null}
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  );
}

const pageHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 24,
  flexWrap: 'wrap',
};

const kickerStyle: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.4,
  color: 'var(--muted)',
  textTransform: 'uppercase',
};

const titleStyle: CSSProperties = {
  margin: '4px 0 0',
  fontSize: 28,
  fontWeight: 700,
  color: 'var(--ink)',
  letterSpacing: -0.3,
};

const subtitleStyle: CSSProperties = {
  margin: '6px 0 0',
  color: 'var(--muted)',
  fontSize: 14,
  maxWidth: 640,
};

const emptyStyle: CSSProperties = {
  padding: '40px 24px',
  textAlign: 'center',
  background: 'var(--surface)',
  border: '1px dashed var(--line)',
  borderRadius: 14,
};
