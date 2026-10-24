import { useState } from 'react';
import { useStore, me, sendConnection, blockUser, submitReport, sendMessage, vouchTargets } from '../lib/store';
import { publicView, timeAgo } from '@cc/core';
import { INTENT_LABELS } from '@cc/core';
import { Avatar, Btn, Card, Chip, EmptyState, Field, Modal, showToast } from '../components/ui';
import { TrustChips, VouchButton } from '../components/Vouch';
import { Link } from '../router';
import { Wordmark } from '../components/Logo';
import { BADGES } from '@cc/core';

export default function PublicProfile({ userId }: { userId: string }) {
  const s = useStore();
  const viewer = me(s);
  const u = s.users[userId];
  const [reason, setReason] = useState('');
  const [connectOpen, setConnectOpen] = useState(false);
  const [msg, setMsg] = useState('');

  if (!u || u.deleted) {
    return <EmptyState title="Profile unavailable" body="This account doesn’t exist here, or it was deleted by its owner." action={<Link to="/" className="btn btn-primary">Go home</Link>} />;
  }
  const pv = publicView(u);
  const inApp = window.location.hash.startsWith('#/app');
  const rel = viewer && viewer.id !== u.id
    ? s.connections.find((c) => c.pairKey.includes(viewer.id) && c.pairKey.includes(u.id))
    : undefined;
  const accepted = rel?.status === 'accepted';
  const pairKey = viewer ? [viewer.id, u.id].sort().join('|') : '';
  const thread = accepted && viewer ? s.threads[pairKey] ?? [] : [];
  const shared = viewer ? vouchTargets(s, viewer.id, u.id) : [];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 60px' }}>
      {!inApp && (
        <p style={{ marginBottom: 20 }}><Link to="/"><Wordmark size={24} /></Link></p>
      )}
      <Card>
        <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
          <Avatar name={u.name} hue={u.avatarHue} size={64} />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 26, margin: 0 }}>{u.name} {u.pronouns && <span className="small muted">({u.pronouns})</span>}</h1>
            <p className="muted" style={{ margin: '2px 0 6px' }}>{pv.role ?? 'Community member'}{pv.city ? ` · ${pv.city}` : ''}</p>
            <div className="agg">
              {pv.college && <Chip tone="accent">🎓 {pv.college}</Chip>}
              {pv.company && <Chip tone="accent">🏢 {pv.company}</Chip>}
              {(u.privacy.showCompany && u.company) || (u.privacy.showCollege && u.college) ? null : <Chip tone="outline">🔒 background private</Chip>}
            </div>
          </div>
        </div>
        {pv.bio && <p style={{ marginTop: 14 }}>{pv.bio}</p>}
        {pv.background && <p className="small muted" style={{ marginTop: 6 }}>Background: {pv.background}</p>}
        {pv.intents.length > 0 && (
          <div className="agg" style={{ marginTop: 8 }}>
            {pv.intents.map((i) => <Chip key={i}>{INTENT_LABELS[i]}</Chip>)}
          </div>
        )}
        {u.badges.length > 0 && (
          <div className="agg" style={{ marginTop: 10 }}>
            {u.badges.map((b) => <Chip key={b} tone="positive" title={BADGES[b]?.how}>🏅 {BADGES[b]?.label ?? b}</Chip>)}
          </div>
        )}
        {u.links.length > 0 && (
          <div className="row" style={{ marginTop: 12 }}>
            {u.links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn btn-soft btn-sm">{l.label} ↗</a>)}
          </div>
        )}
        <hr className="divider" />
        {!viewer && (
          <p className="small muted">Log in to connect with {u.name.split(' ')[0]} — requests include a short reason and are always optional for them to accept. <Link to="/auth" className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}>Log in</Link></p>
        )}
        {viewer && viewer.id !== u.id && (
          <div className="row">
            {!rel && <Btn onClick={() => setConnectOpen(true)}>Connect</Btn>}
            {shared.length > 0 && <VouchButton target={u} shared={shared} size="md" />}
            {rel?.status === 'pending' && <Chip tone="caution">{rel.from === viewer.id ? 'Your request is pending' : 'They asked to connect — review it in People'}</Chip>}
            {accepted && <Chip tone="positive">Connected 🤝</Chip>}
            <Btn variant="ghost" onClick={() => { blockUser(u.id); showToast('Blocked. They can no longer send you requests or messages.'); }}>Block</Btn>
            <Btn variant="ghost" onClick={() => {
              const r = submitReport('user', u.id, 'other', `Reported from profile: ${u.name}`);
              if (r.ok) showToast('Report sent to moderators (confidential).');
            }}>Report</Btn>
          </div>
        )}
      </Card>

      <Card style={{ marginTop: 16 }}>
        <h3>Peer trust</h3>
        <p className="small muted">
          Rolling 14-day signals from people who attended events with {u.name.split(' ')[0]}: hearts, verified
          claims and conduct. The window refreshes, so everyone's record renews and conduct can always improve.
          Vouches require a shared event — no drive-by ratings.
        </p>
        <TrustChips userId={u.id} />
      </Card>

      {accepted && viewer && (
        <Card style={{ marginTop: 16 }}>
          <h3>Messages</h3>
          <div style={{ maxHeight: 260, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {thread.map((m) => (
              <div key={m.id} style={{ alignSelf: m.from === viewer.id ? 'flex-end' : 'flex-start', background: m.from === viewer.id ? 'var(--accent-soft)' : 'var(--surface-2)', padding: '8px 12px', borderRadius: 12, maxWidth: '80%' }}>
                <p className="small" style={{ margin: 0 }}>{m.text}</p>
                <p className="small muted" style={{ margin: 0, fontSize: 11 }}>{timeAgo(m.at)}</p>
              </div>
            ))}
            {thread.length === 0 && <p className="small muted">Say hi — mention how you found each other.</p>}
          </div>
          <form className="row" onSubmit={(e) => { e.preventDefault(); const r = sendMessage(pairKey, msg); if (r.ok) setMsg(''); else showToast(r.error!, 'err'); }}>
            <input type="text" style={{ flex: 1, minWidth: 180 }} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Write a message…" aria-label="Message" />
            <Btn type="submit">Send</Btn>
          </form>
        </Card>
      )}

      <Modal open={connectOpen} onClose={() => setConnectOpen(false)} title={`Connect with ${u.name.split(' ')[0]}`}>
        <Field label="Short reason" hint="Honest one-liners work best." required>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Saw you’re attending the placement workshop — I’m building a study group for DSA." />
        </Field>
        <Btn onClick={() => {
          const r = sendConnection(u.id, reason);
          if (r.ok) { showToast('Request sent 🤝'); setConnectOpen(false); }
          else showToast(r.error!, 'err');
        }}>Send request</Btn>
      </Modal>
    </div>
  );
}
