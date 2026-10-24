import { useState } from 'react';
import { useStore, me, sendConnection, respondConnection, blockUser, sendMessage, isBlocked } from '../lib/store';
import { backgroundChips } from '../lib/util';
import { INTENT_LABELS, type Intent } from '../lib/types';
import { Avatar, Btn, Card, Chip, EmptyState, Field, Modal, SectionHead, showToast } from '../components/ui';
import { Link, navigate } from '../router';
import { timeAgo } from '../lib/util';

export default function People() {
  const s = useStore();
  const user = me(s);
  const [q, setQ] = useState('');
  const [intent, setIntent] = useState<Intent | ''>('');
  const [connectTo, setConnectTo] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [threadWith, setThreadWith] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  if (!user) return null;

  const directory = Object.values(s.users)
    .filter((u) => u.id !== user.id && !u.deleted && u.privacy.directoryOptIn && !isBlocked(s, user.id, u.id))
    .filter((u) => (q ? `${u.name} ${u.role ?? ''} ${u.college ?? ''} ${u.company ?? ''}`.toLowerCase().includes(q.toLowerCase()) : true))
    .filter((u) => (intent ? u.intents.includes(intent) : true))
    .sort((a, b) => (b.boostUntil ?? 0) - (a.boostUntil ?? 0));

  const incoming = s.connections.filter((c) => c.to === user.id && c.status === 'pending');
  const myConnections = s.connections.filter((c) => c.status === 'accepted' && c.pairKey.includes(user.id));
  const sentPending = s.connections.filter((c) => c.from === user.id && c.status === 'pending');

  const pendingRequestFor = (uid: string) =>
    s.connections.find((c) => c.pairKey.includes(uid) && c.pairKey.includes(user.id) && (c.status === 'pending' || c.status === 'accepted'));

  return (
    <div>
      <SectionHead
        title="People"
        sub="Opt-in directory. Backgrounds appear only when each person allows them — and intent chips are self-declared, never verified credentials."
      />

      {incoming.length > 0 && (
        <Card style={{ borderColor: 'var(--accent)', marginBottom: 18 }}>
          <h3>Connection requests</h3>
          {incoming.map((c) => {
            const u = s.users[c.from];
            if (!u) return null;
            return (
              <div key={c.id} className="list-row">
                <Avatar name={u.name} hue={u.avatarHue} />
                <div style={{ flex: 1 }}>
                  <strong>{u.name}</strong> <span className="small muted">· {timeAgo(c.createdAt)}</span>
                  <p className="small" style={{ margin: '2px 0 0' }}>“{c.reason}”</p>
                </div>
                <div className="row">
                  <Btn size="sm" onClick={() => { respondConnection(c.id, true); showToast('Connected 🤝'); }}>Accept</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => respondConnection(c.id, false)}>Decline</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => { blockUser(u.id); respondConnection(c.id, false); showToast('Blocked — they can no longer contact you.'); }}>Block</Btn>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {myConnections.length > 0 && (
        <Card style={{ marginBottom: 18 }}>
          <h3>Your connections</h3>
          {myConnections.map((c) => {
            const otherId = c.pairKey.split('|').find((x) => x !== user.id)!;
            const u = s.users[otherId];
            if (!u) return null;
            const thread = s.threads[c.pairKey] ?? [];
            return (
              <div key={c.id} className="list-row">
                <Avatar name={u.name} hue={u.avatarHue} />
                <div style={{ flex: 1 }}>
                  <strong>{u.name}</strong>
                  <span className="small muted"> · connected {timeAgo(c.respondedAt ?? c.createdAt)}</span>
                  {thread.length > 0 && <p className="small muted" style={{ margin: '2px 0 0' }}>Last message {timeAgo(thread[thread.length - 1].at)}</p>}
                </div>
                <Btn size="sm" variant="outline" onClick={() => setThreadWith(otherId)}>Message</Btn>
              </div>
            );
          })}
        </Card>
      )}

      <div className="filters">
        <input type="search" placeholder="Search by name, role, college, company…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search people" style={{ minWidth: 240 }} />
        <select value={intent} onChange={(e) => setIntent(e.target.value as Intent | '')} aria-label="Filter by intent">
          <option value="">All intents</option>
          <option value="open_to_work">{INTENT_LABELS.open_to_work}</option>
          <option value="seeking_referral">{INTENT_LABELS.seeking_referral}</option>
          <option value="between_roles">{INTENT_LABELS.between_roles}</option>
          <option value="hiring">{INTENT_LABELS.hiring}</option>
          <option value="open_to_meet">{INTENT_LABELS.open_to_meet}</option>
          <option value="building">{INTENT_LABELS.building}</option>
        </select>
      </div>

      {directory.length === 0 ? (
        <Card><EmptyState title="Nobody matches" body="Try different filters — or invite friends with your referral code so your circle shows up here." action={<Link to="/app/referrals" className="btn btn-primary">Invite friends</Link>} /></Card>
      ) : (
        <div className="event-grid">
          {directory.map((u) => {
            const bg = backgroundChips(u);
            const rel = pendingRequestFor(u.id);
            return (
              <Card key={u.id}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="row" style={{ gap: 10 }}>
                    <Avatar name={u.name} hue={u.avatarHue} size={42} />
                    <div>
                      <strong>{u.name}</strong>
                      {u.boostUntil && u.boostUntil > Date.now() && <> <Chip tone="boost" title="Boosted for inviting friends">🚀 boosted</Chip></>}
                      <p className="small muted" style={{ margin: 0 }}>{u.role ?? 'Member'}{u.city ? ` · ${u.city}` : ''}</p>
                    </div>
                  </div>
                </div>
                {u.bio && <p className="small" style={{ margin: '8px 0' }}>{u.bio}</p>}
                <div className="agg">
                  {bg.college && <Chip tone="accent">🎓 {bg.college}</Chip>}
                  {bg.company && <Chip tone="accent">🏢 {bg.company}</Chip>}
                </div>
                <div className="agg" style={{ marginTop: 6 }}>
                  {u.privacy.showIntent && u.intents.slice(0, 3).map((i) => <Chip key={i}>{INTENT_LABELS[i]}</Chip>)}
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  {rel?.status === 'accepted' ? (
                    <Btn size="sm" variant="soft" onClick={() => setThreadWith(u.id)}>Message</Btn>
                  ) : rel?.status === 'pending' ? (
                    <Chip tone="caution">{rel.from === user.id ? 'Request sent' : 'They asked to connect'}</Chip>
                  ) : (
                    <Btn size="sm" onClick={() => { setConnectTo(u.id); setReason(''); }}>Connect</Btn>
                  )}
                  <Link to={`/app/people/${u.id}`} className="btn btn-ghost btn-sm">Profile</Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {sentPending.length > 0 && (
        <p className="small muted" style={{ marginTop: 16 }}>
          {sentPending.length} sent request{sentPending.length > 1 ? 's' : ''} awaiting a response. Requests expire quietly — no pressure either way.
        </p>
      )}

      <Modal open={!!connectTo} onClose={() => setConnectTo(null)} title={`Connect with ${connectTo ? s.users[connectTo]?.name : ''}`}>
        <Field label="Short reason" hint="Shared context doubles acceptance. One honest line is plenty." required>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. We’re both going to Design Systems Meetup — would love to swap notes on token pipelines." />
        </Field>
        <Btn onClick={() => {
          if (!connectTo) return;
          const r = sendConnection(connectTo, reason);
          if (r.ok) { showToast('Request sent 🤝'); setConnectTo(null); }
          else showToast(r.error!, 'err');
        }}>Send request</Btn>
        <p className="small muted" style={{ marginTop: 10 }}>One pending request per pair, cooldown after declines. No mass DMs, ever.</p>
      </Modal>

      <Modal open={!!threadWith} onClose={() => { setThreadWith(null); setMsg(''); }} title={`Messages — ${threadWith ? s.users[threadWith]?.name : ''}`}>
        {threadWith && (
          <>
            <div style={{ maxHeight: 300, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {(s.threads[`${[user.id, threadWith].sort().join('|')}`] ?? []).map((m) => (
                <div key={m.id} style={{ alignSelf: m.from === user.id ? 'flex-end' : 'flex-start', background: m.from === user.id ? 'var(--accent-soft)' : 'var(--surface-2)', padding: '8px 12px', borderRadius: 12, maxWidth: '80%' }}>
                  <p className="small" style={{ margin: 0 }}>{m.text}</p>
                  <p className="small muted" style={{ margin: 0, fontSize: 11 }}>{timeAgo(m.at)}</p>
                </div>
              ))}
              {(s.threads[`${[user.id, threadWith].sort().join('|')}`] ?? []).length === 0 && (
                <p className="small muted">No messages yet. Say hi — mention where you met.</p>
              )}
            </div>
            <form className="row" onSubmit={(e) => { e.preventDefault(); if (!threadWith) return; const r = sendMessage(`${[user.id, threadWith].sort().join('|')}`, msg); if (r.ok) setMsg(''); else showToast(r.error!, 'err'); }}>
              <input type="text" style={{ flex: 1, minWidth: 180 }} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Write a message…" aria-label="Message" />
              <Btn type="submit">Send</Btn>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}
