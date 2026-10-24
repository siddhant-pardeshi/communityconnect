import { useState } from 'react';
import { useStore, me, myCircles, createCircle, joinByInvite } from '../lib/store';
import { Avatar, Btn, Card, EmptyState, Field, Modal, SectionHead, showToast } from '../components/ui';
import { Link, navigate } from '../router';
import { timeAgo } from '@cc/core';

export default function Circles() {
  const s = useStore();
  const user = me(s);
  const circles = myCircles(s);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const activityFor = (circleId: string) => s.activity.filter((a) => a.circleId === circleId).slice(0, 2);

  return (
    <div>
      <SectionHead
        title="Circles"
        sub="A circle is a small planning room: your people, your candidate events, your decisions. Private by default."
        action={<Btn onClick={() => setOpen(true)}>+ New circle</Btn>}
      />

      <Card style={{ marginBottom: 20, background: 'var(--accent-soft)', border: 'none' }}>
        <div className="row">
          <div style={{ flex: 1, minWidth: 220 }}>
            <h3 style={{ marginBottom: 4 }}>Got an invite code?</h3>
            <p className="small" style={{ margin: 0, color: 'var(--accent-hover)' }}>Join a friend’s circle — deciding together is the whole point.</p>
          </div>
          <form className="row" onSubmit={(e) => { e.preventDefault(); const r = joinByInviteAction(); if (r) setJoinCode(''); }}>
            <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="XXXX-0000" aria-label="Invite code" style={{ maxWidth: 160 }} />
            <Btn type="submit" size="sm">Join</Btn>
          </form>
        </div>
      </Card>

      {circles.length === 0 ? (
        <Card>
          <EmptyState
            title="No circles yet"
            body="Create one and invite 2–6 friends with a revocable code. You’ll get a Decision Room where competing event links become one confirmed plan."
            action={<Btn onClick={() => setOpen(true)}>Create your first circle</Btn>}
          />
        </Card>
      ) : (
        <div className="grid-2">
          {circles.map((c) => {
            const openDecisions = Object.values(s.decisions).filter((d) => d.circleId === c.id && d.status === 'open');
            return (
              <Card key={c.id} className="card-clickable" onClick={() => navigate(`/app/circles/${c.id}`)}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0 }}>{c.name}</h3>
                  {openDecisions.length > 0 && <Chip2 n={openDecisions.length} />}
                </div>
                <p className="muted small">{c.description}</p>
                <div className="row" style={{ marginBottom: 8 }}>
                  {c.memberIds.slice(0, 5).map((m) => s.users[m] && <Avatar key={m} name={s.users[m].name} hue={s.users[m].avatarHue} size={26} />)}
                  <span className="small muted">{c.memberIds.length} members</span>
                </div>
                {activityFor(c.id).map((a) => (
                  <p key={a.id} className="small muted" style={{ margin: '2px 0' }}>
                    <strong>{s.users[a.actorId]?.name.split(' ')[0] ?? 'Someone'}</strong> {a.text} <span>· {timeAgo(a.at)}</span>
                  </p>
                ))}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create a circle">
        <Field label="Circle name" required>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunday Football Crew" />
        </Field>
        <Field label="What is this circle for?">
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="We pick one good event per weekend and actually show up together." />
        </Field>
        <Btn onClick={() => {
          const r = createCircle(name, desc);
          if (r.ok && r.circleId) { showToast('Circle created — share the invite code 👌'); setOpen(false); setName(''); setDesc(''); navigate(`/app/circles/${r.circleId}`); }
          else showToast(r.error ?? 'Could not create', 'err');
        }}>Create circle</Btn>
        <p className="small muted" style={{ marginTop: 10 }}>
          You’ll be the owner: you can rotate the invite code any time to revoke old links. <Link to="#/conduct">Conduct rules</Link> apply.
        </p>
      </Modal>
    </div>
  );

  function Chip2({ n }: { n: number }) {
    return <span className="chip chip-caution">{n} open vote{n > 1 ? 's' : ''}</span>;
  }

  function joinByInviteAction(): boolean {
    const r = joinByInvite(joinCode);
    if (r.ok && r.circleId) { showToast('Joined the circle 👋'); navigate(`/app/circles/${r.circleId}`); return true; }
    showToast(r.error ?? 'Could not join', 'err');
    return false;
  }
}
