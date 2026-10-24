import { useState } from 'react';
import { useStore, me, myCircles, myOpenTasks, publicEvents, checkin, notificationsFor } from '../lib/store';
import { EventCard } from '../components/EventCard';
import { Btn, Card, Chip, EmptyState, SectionHead, showToast } from '../components/ui';
import { Link, navigate } from '../router';
import { fmtEventTime, timeAgo } from '@cc/core';
import { BADGES, levelOf } from '@cc/core';

export default function Dashboard() {
  const s = useStore();
  const user = me(s);
  if (!user) return null;
  const tasks = myOpenTasks(s);
  const circles = myCircles(s);
  const upcoming = publicEvents(s).slice(0, 3);
  const myRsvpEvents = s.rsvps.filter((r) => r.userId === user.id)
    .map((r) => s.events[r.eventId])
    .filter((e) => e && e.status === 'active' && new Date(e.endUtc).getTime() > Date.now())
    .sort((a, b) => +new Date(a.startUtc) - +new Date(b.startUtc));
  const level = levelOf(user.xp);
  const unread = notificationsFor(s, user.id).filter((n) => !n.read).length;
  const [checkinMsg, setCheckinMsg] = useState('');
  const checkedInToday = user.streak.lastDay === new Date().toISOString().slice(0, 10) ||
    (() => { try { return user.streak.lastDay === new Intl.DateTimeFormat('en-CA', { timeZone: user.timezone }).format(new Date()); } catch { return false; } })();

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 30 }}>Hey {user.name.split(' ')[0]} 👋</h1>
          <p className="muted" style={{ marginBottom: 4 }}>{level.name} · {user.xp} XP{user.boostUntil && user.boostUntil > Date.now() ? ' · ' : ''}</p>
          {user.boostUntil && user.boostUntil > Date.now() && <Chip tone="boost" title="Earned by inviting friends">🚀 Boosted until {new Date(user.boostUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Chip>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <Btn variant={checkedInToday ? 'outline' : 'primary'} onClick={() => { const r = checkin(); setCheckinMsg(r.message); showToast(r.message); }}>
            {checkedInToday ? <span className="flame">🔥 {user.streak.count}-day streak</span> : 'Daily check-in'}
          </Btn>
          {checkinMsg && <p className="small muted" style={{ marginTop: 6, maxWidth: 260 }}>{checkinMsg}</p>}
        </div>
      </div>

      {(tasks.decisions.length > 0 || tasks.plansAwaiting.length > 0 || tasks.connections > 0 || tasks.buddies > 0) && (
        <section aria-label="Your next actions" className="card" style={{ borderColor: 'var(--accent)' }}>
          <h3>Finish these 👇</h3>
          <div className="stack" style={{ gap: 8, marginTop: 10 }}>
            {tasks.decisions.map((d) => (
              <div key={d.id} className="list-row" style={{ padding: '8px 0' }}>
                <Chip tone="caution">vote</Chip>
                <span style={{ flex: 1 }}><Link to={`/app/decisions/${d.id}`}>{d.title}</Link> <span className="muted small">· closes {new Date(d.deadlineUtc).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span></span>
                <Btn size="sm" onClick={() => navigate(`/app/decisions/${d.id}`)}>Vote</Btn>
              </div>
            ))}
            {tasks.plansAwaiting.map((d) => (
              <div key={d.id} className="list-row" style={{ padding: '8px 0' }}>
                <Chip tone="accent">confirm</Chip>
                <span style={{ flex: 1 }}><Link to={`/app/decisions/${d.id}`}>{s.events[d.plan!.eventId]?.title ?? d.title}</Link> <span className="muted small">· {fmtEventTime(s.events[d.plan!.eventId].startUtc, s.events[d.plan!.eventId].endUtc, s.events[d.plan!.eventId].tz)}</span></span>
                <Btn size="sm" onClick={() => navigate(`/app/decisions/${d.id}`)}>Respond</Btn>
              </div>
            ))}
            {tasks.connections > 0 && (
              <div className="list-row" style={{ padding: '8px 0' }}>
                <Chip tone="positive">connect</Chip>
                <span style={{ flex: 1 }}>{tasks.connections} connection request{tasks.connections > 1 ? 's' : ''} waiting</span>
                <Btn size="sm" variant="outline" onClick={() => navigate('/app/people')}>Review</Btn>
              </div>
            )}
            {tasks.buddies > 0 && (
              <div className="list-row" style={{ padding: '8px 0' }}>
                <Chip tone="positive">buddy</Chip>
                <span style={{ flex: 1 }}>{tasks.buddies} buddy request{tasks.buddies > 1 ? 's' : ''} — nobody should have to walk in alone</span>
                <Btn size="sm" variant="outline" onClick={() => navigate('/app/support?tab=buddy')}>View</Btn>
              </div>
            )}
          </div>
        </section>
      )}

      {myRsvpEvents.length > 0 && (
        <>
          <SectionHead title="You’re attending" sub="Registration on the organizer’s site is separate — check each source." />
          <div className="event-grid">
            {myRsvpEvents.slice(0, 4).map((e) => <EventCard key={e.id} ev={e} compact />)}
          </div>
        </>
      )}

      <SectionHead title="Your circles" action={<Link to="/app/circles" className="btn btn-outline btn-sm">All circles</Link>} />
      {circles.length === 0 ? (
        <Card><EmptyState
          title="No circles yet"
          body="A circle is a small planning room — invite 2–6 friends and decide your first shared plan together."
          action={<Link to="/app/circles" className="btn btn-primary">Create a circle</Link>}
        /></Card>
      ) : (
        <div className="grid-2">
          {circles.map((c) => (
            <Card key={c.id} className="card-clickable" onClick={() => navigate(`/app/circles/${c.id}`)}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>{c.name}</h3>
                <Chip tone="outline">{c.memberIds.length} members</Chip>
              </div>
              <p className="muted small" style={{ marginBottom: 0 }}>{c.description}</p>
            </Card>
          ))}
        </div>
      )}

      <SectionHead title="Worth a look this week" sub="From the community — always check the source before registering." action={<Link to="/app/discover" className="btn btn-outline btn-sm">Discover all</Link>} />
      <div className="event-grid">
        {upcoming.map((e) => <EventCard key={e.id} ev={e} />)}
      </div>

      <div className="grid-2">
        <Card>
          <h3>🎁 Invite & both earn</h3>
          <p className="muted small">Share your code — when a friend joins you both get +75 XP and a 14-day profile boost.</p>
          <Link to="/app/referrals" className="btn btn-soft btn-sm">Get my invite link</Link>
        </Card>
        <Card>
          <h3>🪪 Your networking card</h3>
          <p className="muted small">
            A printable QR card with your links. {user.badges.length > 0 ? `Badges: ${user.badges.map((b) => BADGES[b]?.label ?? b).join(', ')}.` : 'Print it, carry it, scan and connect.'}
          </p>
          <Link to="/app/card" className="btn btn-soft btn-sm">Open my card</Link>
        </Card>
      </div>
    </div>
  );
}
