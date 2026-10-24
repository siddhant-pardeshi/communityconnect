import { useStore, me, respondBuddy } from '../lib/store';
import { fmtEventTime } from '../lib/util';
import { INTENT_LABELS } from '../lib/types';
import { Avatar, Btn, Card, Chip, EmptyState, SectionHead, showToast } from '../components/ui';
import { Link, navigate } from '../router';

const SUPPORT_INTENTS = ['open_to_work', 'seeking_referral', 'between_roles'] as const;

export default function Support() {
  const s = useStore();
  const user = me(s);
  if (!user) return null;

  const helpers = Object.values(s.users).filter((u) =>
    u.id !== user.id && !u.deleted && u.privacy.directoryOptIn && (u.intents.includes('hiring') || u.intents.includes('seeking_feedback')));
  const seeking = Object.values(s.users).filter((u) =>
    u.id !== user.id && !u.deleted && u.privacy.directoryOptIn && SUPPORT_INTENTS.some((i) => u.intents.includes(i)));
  const openBuddies = s.buddyRequests.filter((b) => {
    if (b.status !== 'pending' || b.toUserId !== null || b.fromUserId === user.id) return false;
    const ev = s.events[b.eventId];
    return ev && new Date(ev.endUtc).getTime() > Date.now();
  });
  const forMe = s.buddyRequests.filter((b) => b.status === 'pending' && b.toUserId === user.id);

  return (
    <div style={{ maxWidth: 800 }} className="stack">
      <SectionHead
        title="Support hub"
        sub="Communities run on small honest asks. Opt in, ask well, and give back when you can — nothing here is automated outreach."
      />

      {forMe.length > 0 && (
        <Card style={{ borderColor: 'var(--accent)' }}>
          <h3>🫂 Buddy requests for you</h3>
          {forMe.map((b) => {
            const from = s.users[b.fromUserId];
            const ev = s.events[b.eventId];
            if (!from || !ev) return null;
            return (
              <div key={b.id} className="list-row">
                <Avatar name={from.name} hue={from.avatarHue} />
                <div style={{ flex: 1 }}>
                  <strong>{from.name}</strong> <span className="small muted">· {ev.title}</span>
                  <p className="small" style={{ margin: '2px 0 0' }}>“{b.note}”</p>
                </div>
                <div className="row">
                  <Btn size="sm" onClick={() => { respondBuddy(b.id, true); showToast('Buddy matched 🤝'); }}>Accept</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => respondBuddy(b.id, false)}>Decline</Btn>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <Card>
        <h3>Open buddy board</h3>
        <p className="small muted">People who explicitly asked for company at an upcoming event. Accepting pairs you up — both sides can cancel privately, no explanations owed.</p>
        {openBuddies.length === 0 ? (
          <p className="muted small">No open requests right now. Post one from any event page (“🤝 Find a buddy”).</p>
        ) : (
          openBuddies.map((b) => {
            const from = s.users[b.fromUserId];
            const ev = s.events[b.eventId];
            if (!from || !ev) return null;
            return (
              <div key={b.id} className="list-row">
                <Avatar name={from.name} hue={from.avatarHue} />
                <div style={{ flex: 1 }}>
                  <strong>{from.name}</strong>
                  <p className="small muted" style={{ margin: '2px 0 0' }}>{ev.title} · {fmtEventTime(ev.startUtc, ev.endUtc, ev.tz)}</p>
                  <p className="small" style={{ margin: '2px 0 0' }}>“{b.note}”</p>
                </div>
                <Btn size="sm" variant="outline" onClick={() => navigate(`/app/events/${ev.id}`)}>View event</Btn>
              </div>
            );
          })
        )}
      </Card>

      <div className="grid-2">
        <Card>
          <h3>🎯 People offering help</h3>
          <p className="small muted">Self-declared chips: hiring, giving feedback, open to meeting.</p>
          {helpers.length === 0 ? <p className="muted small">Nobody yet — be the first helper.</p> : helpers.map((u) => (
            <div key={u.id} className="list-row">
              <Avatar name={u.name} hue={u.avatarHue} size={28} />
              <div style={{ flex: 1 }}>
                <Link to={`/app/people/${u.id}`} style={{ fontWeight: 700, color: 'inherit' }}>{u.name}</Link>
                <p className="small muted" style={{ margin: 0 }}>
                  {u.intents.filter((i) => i === 'hiring' || i === 'seeking_feedback').map((i) => INTENT_LABELS[i]).join(' · ')}
                  {u.privacy.showCompany && u.company ? ` · ${u.company}` : ''}
                </p>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <h3>🌱 People looking for a hand</h3>
          <p className="small muted">Job seekers, referral seekers, and people between roles who opted in.</p>
          {seeking.length === 0 ? <p className="muted small">No opt-ins visible right now.</p> : seeking.map((u) => (
            <div key={u.id} className="list-row">
              <Avatar name={u.name} hue={u.avatarHue} size={28} />
              <div style={{ flex: 1 }}>
                <Link to={`/app/people/${u.id}`} style={{ fontWeight: 700, color: 'inherit' }}>{u.name}</Link>
                <p className="small muted" style={{ margin: 0 }}>
                  {u.intents.filter((i) => (SUPPORT_INTENTS as readonly string[]).includes(i)).map((i) => INTENT_LABELS[i as typeof SUPPORT_INTENTS[number]]).join(' · ')}
                  {u.privacy.showCollege && u.college ? ` · 🎓 ${u.college}` : ''}
                </p>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card style={{ background: 'var(--surface-2)', border: 'none' }}>
        <h3>If you were laid off without warning</h3>
        <p className="small" style={{ marginBottom: 8 }}>
          Turn on <strong>“Between roles — open to support”</strong> in your profile. It quietly tells your circles
          and the directory that you welcome intros and leads. Three things that genuinely help:
        </p>
        <ol className="small" style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>Go to events anyway — the buddy board exists so you don’t have to walk in alone.</li>
          <li>Ask for specific help (“referrals to fintech PM roles”) rather than “any opportunities”.</li>
          <li>Use your <Link to="/app/card">networking card</Link> — one scan gives people a real way to follow up.</li>
        </ol>
        <div className="row" style={{ marginTop: 10 }}>
          <Link to="/app/profile/edit" className="btn btn-primary btn-sm">Set my intent chips</Link>
          <Link to="/app/referrals" className="btn btn-ghost btn-sm">Invite people who can help</Link>
        </div>
      </Card>
    </div>
  );
}
