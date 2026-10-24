import { useState } from 'react';
import { useStore, me, adminUpdateUser, adminSetRole, adminSetSuspended } from '../lib/store';
import type { Intent, Privacy, SiteRole } from '@cc/core';
import { INTENT_LABELS, isFounderTeam } from '@cc/core';
import { timeAgo } from '@cc/core';
import { Avatar, Btn, Card, Chip, EmptyState, Field, Modal, SectionHead, showToast } from '../components/ui';
import { Link } from '../router';

const ROLE_CHIP: Record<SiteRole, { tone: 'accent' | 'positive' | 'caution' | 'outline'; label: string }> = {
  founder: { tone: 'accent', label: '👑 Founder' },
  cofounder: { tone: 'positive', label: '⭐ Co-founder' },
  moderator: { tone: 'caution', label: '🛡️ Moderator' },
  member: { tone: 'outline', label: 'Member' },
};

export default function AdminConsole() {
  const s = useStore();
  const user = me(s);
  const [q, setQ] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<{ name: string; role: string; college: string; course: string; company: string; city: string; bio: string; background: string; intents: Intent[]; privacy: Privacy }>>({});

  if (!user) return null;
  if (!isFounderTeam(user)) {
    return (
      <EmptyState
        title="Founder console"
        body="Full administrative control belongs to the founder and up to two co-founders. Moderators have their own console for reports."
        action={<Link to="/app" className="btn btn-primary">Back to home</Link>}
      />
    );
  }

  const users = Object.values(s.users)
    .filter((u) => !u.deleted)
    .filter((u) => (q ? `${u.name} ${u.email} ${u.college ?? ''} ${u.company ?? ''}`.toLowerCase().includes(q.toLowerCase()) : true))
    .sort((a, b) => ['founder', 'cofounder', 'moderator', 'member'].indexOf(a.siteRole) - ['founder', 'cofounder', 'moderator', 'member'].indexOf(b.siteRole));

  const openEdit = (id: string) => {
    const u = s.users[id];
    setForm({
      name: u.name, role: u.role ?? '', college: u.college ?? '', course: u.course ?? '',
      company: u.company ?? '', city: u.city, bio: u.bio ?? '', background: u.background ?? '',
      intents: [...u.intents], privacy: { ...u.privacy },
    });
    setEditId(id);
  };

  const saveEdit = () => {
    if (!editId) return;
    const r = adminUpdateUser(editId, form);
    if (r.ok) { showToast('Account updated — change recorded in the audit log.'); setEditId(null); }
    else showToast(r.error!, 'err');
  };

  const doRole = (id: string, role: SiteRole) => {
    const r = adminSetRole(id, role);
    if (r.ok) showToast(`Role updated: ${role}`);
    else showToast(r.error!, 'err');
  };

  const doSuspend = (id: string, suspended: boolean) => {
    const r = adminSetSuspended(id, suspended);
    if (r.ok) showToast(suspended ? 'Account suspended.' : 'Suspension lifted.');
    else showToast(r.error!, 'err');
  };

  return (
    <div className="stack">
      <SectionHead
        title="👑 Founder console"
        sub={`Full administrative control — founder team: ${Object.values(s.users).filter((u) => isFounderTeam(u) && !u.deleted).map((u) => u.name.split(' ')[0]).join(', ')}. Every action is written to the audit log.`}
      />

      <Card>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Accounts</h3>
          <input type="search" placeholder="Search name, email, college…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search accounts" style={{ maxWidth: 280 }} />
        </div>
        <div>
          {users.map((u) => {
            const rc = ROLE_CHIP[u.siteRole];
            return (
              <div key={u.id} className="list-row">
                <Avatar name={u.name} hue={u.avatarHue} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <strong>{u.name}</strong> {u.suspended && <Chip tone="destructive">suspended</Chip>}
                  <p className="small muted" style={{ margin: 0 }}>
                    {u.email} · {u.role ?? '—'}{u.privacy.showCollege && u.college ? ` · 🎓 ${u.college}` : ''}{u.privacy.showCompany && u.company ? ` · 🏢 ${u.company}` : ''}
                  </p>
                </div>
                <Chip tone={rc.tone}>{rc.label}</Chip>
                <div className="row">
                  <Btn size="sm" variant="outline" onClick={() => openEdit(u.id)}>Edit</Btn>
                  {u.siteRole !== 'founder' && u.siteRole !== 'cofounder' && user.siteRole === 'founder' && (
                    <Btn size="sm" variant="ghost" onClick={() => doRole(u.id, 'cofounder')}>Make co-founder</Btn>
                  )}
                  {u.siteRole === 'cofounder' && user.siteRole === 'founder' && (
                    <Btn size="sm" variant="ghost" onClick={() => doRole(u.id, 'moderator')}>Demote to moderator</Btn>
                  )}
                  {u.siteRole !== 'moderator' && u.siteRole !== 'founder' && u.siteRole !== 'cofounder' && (
                    <Btn size="sm" variant="ghost" onClick={() => doRole(u.id, 'moderator')}>Make moderator</Btn>
                  )}
                  {(u.siteRole === 'moderator' || u.siteRole === 'cofounder') && (
                    <Btn size="sm" variant="ghost" onClick={() => doRole(u.id, 'member')}>Set member</Btn>
                  )}
                  {!isFounderTeam(u) && (
                    u.suspended
                      ? <Btn size="sm" variant="outline" onClick={() => doSuspend(u.id, false)}>Unsuspend</Btn>
                      : <Btn size="sm" variant="danger" onClick={() => doSuspend(u.id, true)}>Suspend</Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3>Audit log</h3>
        <p className="small muted">Append-only record of administrative actions — role changes, account edits, suspensions, moderation outcomes.</p>
        {s.audit.length === 0 ? (
          <p className="muted small">No administrative actions yet.</p>
        ) : s.audit.slice(0, 20).map((a) => (
          <div key={a.id} className="list-row">
            <Avatar name={s.users[a.actorId]?.name ?? '?'} hue={s.users[a.actorId]?.avatarHue ?? 0} size={26} />
            <div style={{ flex: 1 }}>
              <strong className="small">{s.users[a.actorId]?.name ?? 'Unknown'} → {s.users[a.targetId]?.name ?? a.targetId}</strong>
              <p className="small muted" style={{ margin: 0 }}>{a.action} · {a.detail}</p>
            </div>
            <span className="small muted">{timeAgo(a.at)}</span>
          </div>
        ))}
      </Card>

      <p className="small muted">
        With the server backend (v0.3), this console operates on every account in the database with server-enforced
        permissions. In this browser build it governs the accounts in your dataset.
      </p>

      <Modal open={!!editId} onClose={() => setEditId(null)} title={`Edit ${editId ? s.users[editId]?.name : ''}`} wide>
        <div className="form-grid">
          <Field label="Name"><input type="text" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Display role"><input type="text" value={form.role ?? ''} onChange={(e) => setForm({ ...form, role: e.target.value })} /></Field>
        </div>
        <div className="form-grid">
          <Field label="College"><input type="text" value={form.college ?? ''} onChange={(e) => setForm({ ...form, college: e.target.value })} /></Field>
          <Field label="Course"><input type="text" value={form.course ?? ''} onChange={(e) => setForm({ ...form, course: e.target.value })} /></Field>
        </div>
        <div className="form-grid">
          <Field label="Company"><input type="text" value={form.company ?? ''} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
          <Field label="City"><input type="text" value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
        </div>
        <Field label="Bio"><textarea value={form.bio ?? ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field>
        <Field label="Background"><textarea value={form.background ?? ''} onChange={(e) => setForm({ ...form, background: e.target.value })} /></Field>
        <Field label="Intent chips">
          <div className="checkbox-chips">
            {(Object.keys(INTENT_LABELS) as Intent[]).map((i) => (
              <Chip key={i} tone={form.intents?.includes(i) ? 'accent' : 'outline'} onClick={() => {
                const cur = new Set(form.intents ?? []);
                if (cur.has(i)) cur.delete(i); else cur.add(i);
                setForm({ ...form, intents: [...cur] });
              }}>{INTENT_LABELS[i]}</Chip>
            ))}
          </div>
        </Field>
        <Field label="Privacy overrides">
          {(['showCollege', 'showCompany', 'showBackground', 'showIntent', 'directoryOptIn'] as const).map((k) => (
            <div key={k} className="check-row">
              <input
                id={`adm-${k}`} type="checkbox"
                checked={form.privacy?.[k] ?? true}
                onChange={(e) => setForm({ ...form, privacy: { ...(form.privacy ?? {} as Privacy), [k]: e.target.checked } })}
              />
              <label htmlFor={`adm-${k}`} className="small">{k}</label>
            </div>
          ))}
        </Field>
        <div className="row">
          <Btn onClick={saveEdit}>Save changes</Btn>
          <span className="small muted">All changes are recorded in the audit log with your identity.</span>
        </div>
      </Modal>
    </div>
  );
}
