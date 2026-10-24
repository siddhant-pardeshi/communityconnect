import { useSyncExternalStore, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { hueColor } from '@cc/core';

// ─── toasts ──────────────────────────────────────────────────────────────────
interface Toast { id: number; msg: string; tone: 'ok' | 'err' }
let toasts: Toast[] = [];
const toastSubs = new Set<() => void>();
let toastId = 0;

export function showToast(msg: string, tone: 'ok' | 'err' = 'ok') {
  const t = { id: ++toastId, msg, tone };
  toasts = [...toasts, t];
  toastSubs.forEach((f) => f());
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    toastSubs.forEach((f) => f());
  }, 3600);
}

export function Toasts() {
  const list = useSyncExternalStore(
    (cb) => { toastSubs.add(cb); return () => toastSubs.delete(cb); },
    () => toasts
  );
  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast ${t.tone === 'err' ? 'toast-err' : ''}`}>{t.msg}</div>
      ))}
    </div>
  );
}

// ─── primitives ──────────────────────────────────────────────────────────────
export function Avatar({ name, hue, size = 36 }: { name: string; hue: number; size?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, background: hueColor(hue), }}
      aria-hidden="true"
    >
      {initials || '·'}
    </span>
  );
}

export function Chip({ children, tone = 'default', title, onClick }: { children: ReactNode; tone?: 'default' | 'accent' | 'positive' | 'caution' | 'destructive' | 'outline' | 'boost'; title?: string; onClick?: () => void }) {
  return <span className={`chip chip-${tone}`} title={title} onClick={onClick} role={onClick ? 'button' : undefined}>{children}</span>;
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'soft' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md';
}

export function Btn({ variant = 'primary', size = 'md', className = '', ...rest }: BtnProps) {
  return <button className={`btn btn-${variant} btn-${size} ${className}`} {...rest} />;
}

export function Field({ label, hint, children, required }: { label: string; hint?: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="field">
      <span className="field-label">{label}{required && <span aria-hidden="true"> *</span>}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Card({ children, className = '', onClick, style }: { children: ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <div className={`card ${onClick ? 'card-clickable' : ''} ${className}`} onClick={onClick} style={style}>
      {children}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <svg viewBox="0 0 120 60" width="140" height="70" aria-hidden="true" className="empty-art">
        <path d="M15 45 C 35 20, 50 20, 58 32" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <path d="M105 45 C 85 20, 70 20, 62 32" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <circle cx="12" cy="48" r="5" fill="var(--coral)" />
        <circle cx="108" cy="48" r="5" fill="var(--saffron)" />
        <circle cx="60" cy="34" r="7" fill="none" stroke="var(--ink)" strokeWidth="2" strokeDasharray="3 4" />
      </svg>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Spinner() {
  return <span className="spinner" aria-label="Loading" role="status" />;
}

export function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="bar" role="img" aria-label={`${Math.round(pct)}%`}>
      <div className="bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
