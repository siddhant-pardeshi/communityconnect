import { useState } from 'react';
import type { EventItem, UserAccount, VouchClaim } from '@cc/core';
import { VOUCH_CLAIMS } from '@cc/core';
import { fmtEventTime } from '@cc/core';
import { vouchUser, trustFor, useStore, me } from '../lib/store';
import { Avatar, Btn, Chip, Field, Modal, showToast } from './ui';

const CLAIM_LABEL: Record<VouchClaim, (u: UserAccount) => string | undefined> = {
  college: (u) => (u.college ? `🎓 ${u.college}` : undefined),
  company: (u) => (u.company ? `🏢 ${u.company}` : undefined),
  course: (u) => (u.course ? `📚 ${u.course}` : undefined),
};

/**
 * Vouch flow: pick the shared event, optionally give a heart, verify the
 * target's public claims you personally saw evidence for, and record conduct
 * signals. Vouches count for 14 days, then fade (rolling window).
 */
export function VouchModal({ target, shared, open, onClose }: { target: UserAccount; shared: EventItem[]; open: boolean; onClose: () => void }) {
  const [eventId, setEventId] = useState(shared[0]?.id ?? '');
  const [hearts, setHearts] = useState(true);
  const [claims, setClaims] = useState<Set<VouchClaim>>(new Set());
  const [conduct, setConduct] = useState<Set<'polite' | 'professional'>>(new Set());
  const [note, setNote] = useState('');

  if (!shared.length) return null;

  const toggle = <T,>(set: Set<T>, v: T): Set<T> => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v); else n.add(v);
    return n;
  };

  return (
    <Modal open={open} onClose={onClose} title={`Vouch for ${target.name.split(' ')[0]}`}>
      <p className="small muted">
        Vouches are your honest, first-hand signal from an event you both attended. They count for 14 days and
        then fade — everyone's record refreshes, so people can always grow. False vouching is a conduct violation.
      </p>

      <Field label="Which event did you attend together?" required>
        <select value={eventId} onChange={(e) => setEventId(e.target.value)} aria-label="Shared event">
          {shared.map((e) => (
            <option key={e.id} value={e.id}>{e.title} · {fmtEventTime(e.startUtc, e.endUtc, e.tz)}</option>
          ))}
        </select>
      </Field>

      <div className="check-row">
        <input id="v-hearts" type="checkbox" checked={hearts} onChange={(e) => setHearts(e.target.checked)} />
        <label htmlFor="v-hearts">❤️ Give a heart — they were great to meet</label>
      </div>

      {claimOptions(target).length > 0 && (
        <Field label="Verify their claims (tick only what you personally saw evidence of)">
          <div className="checkbox-chips">
            {claimOptions(target).map(({ key, label }) => (
              <Chip key={key} tone={claims.has(key) ? 'accent' : 'outline'} onClick={() => setClaims(toggle(claims, key))}>
                ✓ {label}
              </Chip>
            ))}
          </div>
          <span className="field-hint">Verified claims show on their profile as “peer-verified by event participants”.</span>
        </Field>
      )}

      <Field label="How was their conduct?">
        <div className="checkbox-chips">
          {(['polite', 'professional'] as const).map((c) => (
            <Chip key={c} tone={conduct.has(c) ? 'positive' : 'outline'} onClick={() => setConduct(toggle(conduct, c))}>
              {c === 'polite' ? 'Polite & respectful' : 'Professional'}
            </Chip>
          ))}
        </div>
        <span className="field-hint">Conduct concerns should be reported instead — moderators handle those privately.</span>
      </Field>

      <Field label="Private note (optional)" hint="Visible only to moderators if conduct is ever reviewed — never shown publicly.">
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Context that helps moderators if anything is ever questioned" />
      </Field>

      <Btn
        onClick={() => {
          const r = vouchUser(target.id, eventId, { hearts, claims: [...claims], conduct: [...conduct], note });
          if (r.ok) { showToast(`Vouched for ${target.name.split(' ')[0]} 🤝`); onClose(); }
          else showToast(r.error!, 'err');
        }}
      >
        Send vouch
      </Btn>
    </Modal>
  );
}

function claimOptions(u: UserAccount): { key: VouchClaim; label: string }[] {
  const out: { key: VouchClaim; label: string }[] = [];
  for (const key of VOUCH_CLAIMS) {
    const label = CLAIM_LABEL[key](u);
    if (label) out.push({ key, label });
  }
  return out;
}

/** Compact trust summary chip-row used on profiles. */
export function TrustChips({ userId }: { userId: string }) {
  const s = useStore();
  const u = s.users[userId];
  const viewer = me(s);
  if (!u) return null;
  const t = trustFor(s, userId);
  if (t.vouchCount === 0) {
    return (
      <p className="small muted">
        No vouches in the last {t.windowDays} days{viewer?.id === userId ? ' — attend an event and people can vouch for you.' : '.'}
      </p>
    );
  }
  return (
    <div className="agg">
      {t.hearts > 0 && <Chip tone="destructive"><span className="heart-pop">❤️ {t.hearts}</span></Chip>}
      {(['college', 'company', 'course'] as VouchClaim[]).map((k) => {
        const val = CLAIM_LABEL[k](u);
        if (!val || t.claims[k] === 0) return null;
        return <Chip key={k} tone="positive" title="Peer-verified by event participants">✓ {val} ×{t.claims[k]}</Chip>;
      })}
      {t.conductPolite > 0 && <Chip tone="accent">Polite · {t.conductPolite}</Chip>}
      {t.conductProfessional > 0 && <Chip tone="accent">Professional · {t.conductProfessional}</Chip>}
      <span className="small muted">rolling {t.windowDays} days</span>
    </div>
  );
}

export function VouchButton({ target, shared, size = 'sm' }: { target: UserAccount; shared: EventItem[]; size?: 'sm' | 'md' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn size={size} variant="soft" onClick={() => setOpen(true)}>🤝 Vouch</Btn>
      <VouchModal target={target} shared={shared} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function VouchCountAvatar({ name, hue, hearts }: { name: string; hue: number; hearts: number }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <Avatar name={name} hue={hue} />
      {hearts > 0 && (
        <span style={{
          position: 'absolute', bottom: -4, right: -6, fontSize: 10, fontWeight: 800,
          background: 'var(--surface)', color: 'var(--danger-fg)', border: '1px solid var(--border)',
          borderRadius: 999, padding: '1px 5px',
        }}>❤️{hearts}</span>
      )}
    </span>
  );
}
