import { useState } from 'react';
import { useStore, me, postEvent, createDecision, rotateInviteCode, removeMember, leaveCircle } from '../lib/store';
import { publicEvents } from '../lib/store';
import { Avatar, Btn, Card, Chip, EmptyState, Field, Modal, SectionHead, showToast } from '../components/ui';
import { Link, navigate } from '../router';
import { fmtEventTime, timeAgo, toLocalInput } from '../lib/util';
import { EventCard } from '../components/EventCard';

export default function CircleDetail({ circleId }: { circleId: string }) {
  const s = useStore();
  const user = me(s);
  const c = s.circles[circleId];
  const [newDecision, setNewDecision] = useState(false);
  const [addEvent, setAddEvent] = useState(false);
  const [dTitle, setDTitle] = useState('');
  const [dPrompt, setDPrompt] = useState('');
  const [dDeadline, setDDeadline] = useState(() => toLocalInput(new Date(Date.now() + 48 * 3600000).toISOString()));
  const [dLive, setDLive] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [ef, setEf] = useState({ title: '', summary: '', organizer: user?.name ?? '', startLocal: '', endLocal: '', price: 0, priceUnknown: false, venue: '', sourceUrl: '' });

  if (!c) return <EmptyState title="Circle not found" body="It may have been deleted by its owner." action={<Link to="/app/circles" className="btn btn-primary">All circles</Link>} />;
  if (!user || !c.memberIds.includes(user.id)) {
    return <EmptyState title="Private circle" body="Circles are private planning rooms. Ask a member for an invite code." action={<Link to="/app/circles" className="btn btn-primary">My circles</Link>} />;
  }
  const isOwner = c.ownerId === user.id;
  const decisions = Object.values(s.decisions).filter((d) => d.circleId === c.id).sort((a, b) => b.createdAt - a.createdAt);
  const circleEvents = Object.values(s.events).filter((e) => e.circleId === c.id && e.status === 'active' && new Date(e.endUtc).getTime() > Date.now());

  const candidatePool = [...publicEvents(s), ...circleEvents].filter(
    (e, i, arr) => arr.findIndex((x) => x.id === e.id) === i
  );

  const submitDecision = () => {
    const res = createDecision({
      circleId: c.id, title: dTitle, prompt: dPrompt,
      candidateIds: [...picked], deadlineLocal: dDeadline, liveResults: dLive, quorumPct: 60,
    });
    if (res.ok && res.decisionId) {
      showToast('Decision opened — ballots are private until the deadline.');
      setNewDecision(false); setDTitle(''); setDPrompt(''); setPicked(new Set());
      navigate(`/app/decisions/${res.decisionId}`);
    } else showToast(res.error ?? 'Could not open decision', 'err');
  };

  const submitCircleEvent = () => {
    const res = postEvent({
      title: ef.title, summary: ef.summary, organizer: ef.organizer,
      mode: 'in_person', city: user?.city, venue: ef.venue,
      sourceUrl: ef.sourceUrl, sourceProvider: undefined,
      startLocal: ef.startLocal, endLocal: ef.endLocal, tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      price: ef.priceUnknown ? null : ef.price, currency: 'INR', tags: [],
      visibility: 'circle', circleId: c.id,
    });
    if (res.ok) { showToast('Circle event added'); setAddEvent(false); }
    else showToast(res.error ?? 'Could not add', 'err');
  };

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 30 }}>{c.name}</h1>
          <p className="muted" style={{ maxWidth: '60ch' }}>{c.description}</p>
          <div className="row">
            <Chip tone="outline">👑 {s.users[c.ownerId]?.name ?? 'Owner'} owns this circle</Chip>
            <Chip tone="outline">{c.memberIds.length} members</Chip>
          </div>
        </div>
        <div className="row">
          <Btn onClick={() => setNewDecision(true)}>🗳️ New decision</Btn>
          <Btn variant="outline" onClick={() => setAddEvent(true)}>+ Add circle event</Btn>
        </div>
      </div>

      <Card>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <strong>Invite code</strong> <span className="kbd" style={{ fontSize: 14 }}>{c.inviteCode}</span>
            <p className="small muted" style={{ margin: '4px 0 0' }}>Share it with people you trust. Joining is always their explicit choice.</p>
          </div>
          <div className="row">
            <Btn size="sm" variant="ghost" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}#/join/${c.inviteCode}`); showToast('Invite link copied'); }}>Copy invite link</Btn>
            {isOwner && <Btn size="sm" variant="outline" onClick={() => { rotateInviteCode(c.id); showToast('New code generated — old links no longer work.'); }}>Rotate code</Btn>}
          </div>
        </div>
      </Card>

      {decisions.length > 0 && (
        <>
          <SectionHead title="Decisions" sub="Open votes, finalized plans, and history." />
          <div className="stack" style={{ gap: 10 }}>
            {decisions.map((d) => (
              <Card key={d.id} className="card-clickable" onClick={() => navigate(`/app/decisions/${d.id}`)}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <strong>{d.title}</strong>
                    <p className="small muted" style={{ margin: '2px 0 0' }}>
                      {d.candidateIds.length} candidates · deadline {new Date(d.deadlineUtc).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`status-pill st-${d.status}`}>{d.status === 'finalized' ? d.plan?.status ?? 'finalized' : d.status}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <SectionHead title="Circle events" sub="Only visible to members — never in public search or previews." />
      {circleEvents.length === 0 ? (
        <Card><p className="muted">No circle-only events yet. Public events you bookmark stay in Discover; add a private one for plans you don’t want public.</p></Card>
      ) : (
        <div className="event-grid">{circleEvents.map((e) => <EventCard key={e.id} ev={e} compact />)}</div>
      )}

      <SectionHead title="Members" />
      <Card>
        {c.memberIds.map((m) => {
          const u = s.users[m];
          if (!u) return null;
          return (
            <div key={m} className="list-row">
              <Avatar name={u.name} hue={u.avatarHue} />
              <div style={{ flex: 1 }}>
                <Link to={`/app/people/${m}`} style={{ fontWeight: 700, color: 'inherit' }}>{u.name}</Link>
                <span className="small muted"> · {u.role ?? 'Member'}{u.privacy.showCollege && u.college ? ` · 🎓 ${u.college}` : ''}{u.privacy.showCompany && u.company ? ` · 🏢 ${u.company}` : ''}</span>
              </div>
              {m === c.ownerId && <Chip tone="accent">owner</Chip>}
              {isOwner && m !== user.id && (
                <Btn size="sm" variant="ghost" onClick={() => { removeMember(c.id, m); showToast('Member removed — their access ended immediately.'); }}>Remove</Btn>
              )}
            </div>
          );
        })}
        {!isOwner && (
          <div style={{ marginTop: 12 }}>
            <Btn size="sm" variant="ghost" onClick={() => { leaveCircle(c.id); showToast('You left the circle.'); navigate('/app/circles'); }}>Leave circle</Btn>
          </div>
        )}
      </Card>

      <SectionHead title="Activity" />
      <Card>
        {s.activity.filter((a) => a.circleId === c.id).slice(0, 10).map((a) => (
          <div key={a.id} className="list-row">
            <Avatar name={s.users[a.actorId]?.name ?? '?'} hue={s.users[a.actorId]?.avatarHue ?? 0} size={28} />
            <p className="small" style={{ margin: 0, flex: 1 }}><strong>{s.users[a.actorId]?.name ?? 'Someone'}</strong> {a.text} <span className="muted">· {timeAgo(a.at)}</span></p>
          </div>
        ))}
        {s.activity.filter((a) => a.circleId === c.id).length === 0 && <p className="muted small">Nothing yet — open a decision to get moving.</p>}
      </Card>

      <Modal open={newDecision} onClose={() => setNewDecision(false)} title="Open a Decision Room" wide>
        <Field label="What are you deciding?" required>
          <input type="text" value={dTitle} onChange={(e) => setDTitle(e.target.value)} placeholder="e.g. Which weekend plan?" />
        </Field>
        <Field label="Prompt for voters">
          <textarea value={dPrompt} onChange={(e) => setDPrompt(e.target.value)} placeholder="Vote honestly — availability is not a commitment." />
        </Field>
        <Field label={`Candidates (${picked.size} picked — 2 to 8)`} required>
          <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
            {candidatePool.map((e) => (
              <label key={e.id} className="check-row">
                <input
                  type="checkbox"
                  checked={picked.has(e.id)}
                  onChange={(ev2) => {
                    const next = new Set(picked);
                    if (next.has(e.id)) next.delete(e.id); else next.add(e.id);
                    setPicked(next);
                  }}
                />
                <span className="small"><strong>{e.title}</strong> · {fmtEventTime(e.startUtc, e.endUtc, e.tz)} · {e.visibility === 'circle' ? 'circle' : 'public'}</span>
              </label>
            ))}
          </div>
        </Field>
        <div className="form-grid">
          <Field label="Voting deadline (your local time)" hint="Server-enforced: late ballots are rejected even with a wrong device clock." required>
            <input type="datetime-local" value={dDeadline} onChange={(e) => setDDeadline(e.target.value)} />
          </Field>
          <Field label="Results">
            <span className="check-row" style={{ margin: 0 }}>
              <input id="dlive" type="checkbox" checked={dLive} onChange={(e) => setDLive(e.target.checked)} />
              <label htmlFor="dlive">Show aggregate results while voting (individual ballots stay private either way)</label>
            </span>
          </Field>
        </div>
        <p className="small muted">Quorum defaults to 60% of the roster (minimum 2). Roster is snapshotted when the vote opens.</p>
        <Btn onClick={submitDecision}>Open decision</Btn>
      </Modal>

      <Modal open={addEvent} onClose={() => setAddEvent(false)} title="Add a circle-only event" wide>
        <Field label="Title" required><input type="text" value={ef.title} onChange={(e) => setEf({ ...ef, title: e.target.value })} /></Field>
        <Field label="Summary" required><textarea value={ef.summary} onChange={(e) => setEf({ ...ef, summary: e.target.value })} /></Field>
        <div className="form-grid">
          <Field label="Starts (local)"><input type="datetime-local" value={ef.startLocal} onChange={(e) => setEf({ ...ef, startLocal: e.target.value })} /></Field>
          <Field label="Ends (local)"><input type="datetime-local" value={ef.endLocal} onChange={(e) => setEf({ ...ef, endLocal: e.target.value })} /></Field>
        </div>
        <div className="form-grid">
          <Field label="Venue"><input type="text" value={ef.venue} onChange={(e) => setEf({ ...ef, venue: e.target.value })} /></Field>
          <Field label="Source URL (optional)"><input type="url" value={ef.sourceUrl} onChange={(e) => setEf({ ...ef, sourceUrl: e.target.value })} /></Field>
        </div>
        <div className="check-row"><input id="epu" type="checkbox" checked={ef.priceUnknown} onChange={(e) => setEf({ ...ef, priceUnknown: e.target.checked })} /><label htmlFor="epu">Price unknown</label></div>
        {!ef.priceUnknown && <Field label="Price (₹)"><input type="number" min={0} value={ef.price} onChange={(e) => setEf({ ...ef, price: Number(e.target.value) })} /></Field>}
        <Btn onClick={submitCircleEvent}>Add to circle</Btn>
      </Modal>
    </div>
  );
}
