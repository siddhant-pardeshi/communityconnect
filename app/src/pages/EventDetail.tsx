import { useState } from 'react';
import { useStore, me, attendeesOf, backgroundAgg, toggleRsvp, updateEvent, postEventComment, submitReport, postBuddyRequest, respondBuddy, cancelBuddy, conflictsForEvent } from '../lib/store';
import { fmtEventTime, priceLabel, timeAgo, toLocalInput, backgroundChips, publicView, eventIcs, download } from '../lib/util';
import { Avatar, Btn, Card, Chip, EmptyState, Field, Modal, SectionHead, showToast } from '../components/ui';
import { Link, navigate } from '../router';
import { INTENT_LABELS } from '../lib/types';

export default function EventDetail({ eventId }: { eventId: string }) {
  const s = useStore();
  const user = me(s);
  const ev = s.events[eventId];
  const [comment, setComment] = useState('');
  const [buddyOpen, setBuddyOpen] = useState(false);
  const [buddyNote, setBuddyNote] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDetail, setReportDetail] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState({ title: '', summary: '', startLocal: '', endLocal: '', price: 0, priceUnknown: false, sourceUrl: '' });

  if (!ev) {
    return <EmptyState title="Event not found" body="It may have been removed by moderators or deleted by its author." action={<Link to="/app/discover" className="btn btn-primary">Back to discover</Link>} />;
  }
  const circleOnly = ev.visibility === 'circle';
  const myCircleIds = user ? Object.values(s.circles).filter((c) => c.memberIds.includes(user.id)).map((c) => c.id) : [];
  if (circleOnly && (!user || (!myCircleIds.includes(ev.circleId ?? '') && user.siteRole !== 'moderator'))) {
    return <EmptyState title="This event is circle-private" body="Only members of the circle that added it can see it." action={<Link to="/app/discover" className="btn btn-primary">Back to discover</Link>} />;
  }
  if (ev.moderation === 'removed') {
    return <EmptyState title="Content removed" body="A moderator removed this listing after reviewing a report." action={<Link to="/app/discover" className="btn btn-primary">Back to discover</Link>} />;
  }

  const attendees = attendeesOf(s, ev.id);
  const agg = backgroundAgg(s, ev.id);
  const myRsvp = user ? s.rsvps.find((r) => r.eventId === ev.id && r.userId === user.id) : undefined;
  const conflicts = conflictsForEvent(s, ev.id);
  const comments = s.threads[`event:${ev.id}`] ?? [];
  const openBuddies = s.buddyRequests.filter((b) => b.eventId === ev.id && b.status === 'pending');
  const isOwner = user && ev.createdBy === user.id;
  const past = new Date(ev.endUtc).getTime() < Date.now();

  const openEdit = () => {
    setEdit({ title: ev.title, summary: ev.summary, startLocal: toLocalInput(ev.startUtc), endLocal: toLocalInput(ev.endUtc), price: ev.price ?? 0, priceUnknown: ev.price === null, sourceUrl: ev.sourceUrl ?? '' });
    setEditOpen(true);
  };

  const saveEdit = () => {
    const res = updateEvent(ev.id, {
      title: edit.title,
      summary: edit.summary,
      startLocal: new Date(edit.startLocal).toISOString(),
      endLocal: new Date(edit.endLocal).toISOString(),
      price: edit.priceUnknown ? null : edit.price,
      sourceUrl: edit.sourceUrl,
    });
    if (res.ok) { showToast('Event updated — affected plans were marked for review and participants notified.'); setEditOpen(false); }
    else showToast(res.error ?? 'Could not update', 'err');
  };

  return (
    <div className="stack">
      {ev.status === 'canceled' && <div className="banner banner-danger">⚠️ This event was canceled. Plans built on it were canceled too.</div>}
      {past && ev.status === 'active' && <div className="banner banner-caution">This event’s scheduled window has ended. Details remain for reference.</div>}
      {conflicts.length > 0 && (
        <div className="banner banner-caution">
          ⚔️ This overlaps your plan for <Link to={`/app/events/${conflicts[0].id}`}>{conflicts[0].title}</Link>. Check travel time before committing.
        </div>
      )}

      <div>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="row" style={{ marginBottom: 6 }}>
              {circleOnly && <Chip tone="outline">circle only</Chip>}
              {ev.tags.slice(0, 4).map((t) => <Chip key={t}>{t}</Chip>)}
            </div>
            <h1 style={{ fontSize: 'clamp(24px,3.4vw,34px)' }}>{ev.title}</h1>
            <p className="muted" style={{ maxWidth: '68ch' }}>{ev.summary}</p>
          </div>
          {isOwner && <Btn variant="outline" size="sm" onClick={openEdit}>Edit event</Btn>}
        </div>

        <Card style={{ marginTop: 12 }}>
          <div className="grid-2">
            <div>
              <p><strong>When</strong><br /><span className="mono-num">{fmtEventTime(ev.startUtc, ev.endUtc, ev.tz)}</span></p>
              <p><strong>Where</strong><br />{ev.mode === 'online' ? '💻 Online' : <>📍 {ev.venue ?? 'Venue TBA'}, {ev.city}</>}</p>
              <p><strong>Organizer</strong><br />{ev.organizer}</p>
              <p><strong>Price</strong><br />{priceLabel(ev)}</p>
              <p><strong>Accessibility</strong><br />{ev.accessibility ?? 'Not supplied by the poster — ask the organizer.'}</p>
            </div>
            <div>
              <p><strong>Source</strong><br />
                {ev.sourceUrl
                  ? <a href={ev.sourceUrl} target="_blank" rel="noreferrer">{ev.sourceProvider ?? 'Original listing'} ↗</a>
                  : <span className="muted">No source link — community-submitted. Verify before registering.</span>}
              </p>
              <p className="small muted">Posted {timeAgo(ev.createdAt)} · listing freshness depends on its poster.</p>
              <div className="stack" style={{ gap: 8, marginTop: 8 }}>
                {ev.sourceUrl && <a href={ev.sourceUrl} target="_blank" rel="noreferrer" className="btn btn-primary">Open registration ↗</a>}
                {user && !past && (
                  <>
                    <Btn variant={myRsvp?.status === 'planning' ? 'soft' : 'outline'} onClick={() => toggleRsvp(ev.id, 'planning')}>
                      {myRsvp?.status === 'planning' ? '✓ Planning to attend' : 'Planning to attend'}
                    </Btn>
                    <Btn variant={myRsvp?.status === 'registered' ? 'soft' : 'ghost'} onClick={() => toggleRsvp(ev.id, 'registered')}>
                      {myRsvp?.status === 'registered' ? '✓ I registered on the organizer’s site' : 'I registered on the organizer’s site'}
                    </Btn>
                  </>
                )}
                <Btn variant="ghost" onClick={() => { download(`${ev.title.replace(/[^a-z0-9]+/gi, '-')}.ics`, eventIcs(ev, window.location.href), 'text/calendar'); showToast('Calendar file downloaded — updates are not automatic.'); }}>
                  📅 Add to calendar (.ics)
                </Btn>
                {user && <Btn variant="ghost" onClick={() => { navigator.clipboard?.writeText(window.location.href); showToast('Link copied'); }}>🔗 Copy link</Btn>}
                {user && !isOwner && <Btn variant="ghost" onClick={() => setReportOpen(true)}>🚩 Report this event</Btn>}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <SectionHead title="Who’s in" sub={`Attendance intention only — not tickets. Backgrounds shown only when each person allows it.`} />
      <Card>
        {attendees.length === 0 ? (
          <p className="muted">Nobody has marked this yet. Be the first — it makes group planning easier.</p>
        ) : (
          <>
            <div className="agg" style={{ marginBottom: 12 }}>
              {Object.entries(agg.colleges).map(([c, n]) => <Chip key={c} tone="accent">🎓 {c} ×{n}</Chip>)}
              {Object.entries(agg.companies).map(([c, n]) => <Chip key={c} tone="accent">🏢 {c} ×{n}</Chip>)}
              {agg.hidden > 0 && <Chip tone="outline">🔒 {agg.hidden} keeping it private</Chip>}
            </div>
            <div>
              {attendees.map(({ user: u, status }) => {
                const bg = backgroundChips(u);
                const pv = publicView(u);
                return (
                  <div key={u.id} className="list-row">
                    <Avatar name={u.name} hue={u.avatarHue} />
                    <div style={{ flex: 1 }}>
                      <Link to={`/app/people/${u.id}`} style={{ fontWeight: 700, color: 'inherit' }}>{u.name}</Link>
                      <span className="small muted"> · {u.role ?? 'Member'}{bg.college ? ` · 🎓 ${bg.college}` : ''}{bg.company ? ` · 🏢 ${bg.company}` : ''}</span>
                      <div className="agg" style={{ marginTop: 4 }}>
                        {pv.intents.filter((i) => i !== 'open_to_meet').slice(0, 3).map((i) => <Chip key={i}>{INTENT_LABELS[i]}</Chip>)}
                      </div>
                    </div>
                    <Chip tone={status === 'plan_confirmed' ? 'positive' : status === 'registered' ? 'accent' : 'outline'}>
                      {status === 'plan_confirmed' ? 'plan confirmed' : status === 'registered' ? 'registered (self-reported)' : 'planning'}
                    </Chip>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <SectionHead title="Buddy board" sub="Opt-in only. Both sides must agree; cancel any time, no questions asked." action={<Btn size="sm" variant="outline" onClick={() => setBuddyOpen(true)}>🤝 Find a buddy</Btn>} />
      <Card>
        {openBuddies.length === 0 ? (
          <p className="muted small">No open buddy requests for this event. Attendees can post one — arriving with someone makes first events far easier.</p>
        ) : (
          openBuddies.map((b) => {
            const from = s.users[b.fromUserId];
            if (!from) return null;
            const mine = user && b.toUserId === user.id;
            return (
              <div key={b.id} className="list-row">
                <Avatar name={from.name} hue={from.avatarHue} />
                <div style={{ flex: 1 }}>
                  <strong>{from.name}</strong> <span className="small muted">· {backgroundChips(from).college ?? backgroundChips(from).company ?? from.city}</span>
                  <p className="small" style={{ margin: '4px 0 0' }}>“{b.note}”</p>
                </div>
                {mine ? (
                  <div className="row">
                    <Btn size="sm" onClick={() => { respondBuddy(b.id, true); showToast('Buddy matched 🤝 — coordinate in the discussion.'); }}>Accept</Btn>
                    <Btn size="sm" variant="ghost" onClick={() => respondBuddy(b.id, false)}>Decline</Btn>
                  </div>
                ) : user && b.fromUserId === user.id ? (
                  <Btn size="sm" variant="ghost" onClick={() => cancelBuddy(b.id)}>Withdraw</Btn>
                ) : user && (
                  <Link to={`/app/people/${from.id}`} className="btn btn-soft btn-sm">Ask to pair</Link>
                )}
              </div>
            );
          })
        )}
      </Card>

      <SectionHead title="Discussion" sub="Keep it useful and kind — the conduct policy applies. Report anything off." />
      <Card>
        {comments.length === 0 && <p className="muted small">No comments yet. Ask about the venue, travel, or who’s coming.</p>}
        {comments.map((m) => {
          const u = s.users[m.from];
          return (
            <div key={m.id} className="list-row">
              <Avatar name={u?.name ?? '?'} hue={u?.avatarHue ?? 0} size={30} />
              <div style={{ flex: 1 }}>
                <strong className="small">{u?.name ?? 'Deleted user'}</strong> <span className="small muted">· {timeAgo(m.at)}</span>
                <p style={{ margin: '2px 0 0' }} className="small">{m.text}</p>
              </div>
            </div>
          );
        })}
        {user && (
          <form
            className="row"
            style={{ marginTop: 12 }}
            onSubmit={(e) => { e.preventDefault(); const r = postEventComment(ev.id, comment); if (r.ok) setComment(''); else showToast(r.error!, 'err'); }}
          >
            <input type="text" style={{ flex: 1, minWidth: 200 }} placeholder="Add to the discussion…" value={comment} onChange={(e) => setComment(e.target.value)} aria-label="Add a comment" />
            <Btn type="submit">Post</Btn>
          </form>
        )}
      </Card>

      <Modal open={buddyOpen} onClose={() => setBuddyOpen(false)} title="Request company for this event">
        <p className="small muted">Your note is shown on the event’s buddy board. Both people must accept; either can cancel privately.</p>
        <Field label="Your note" required>
          <textarea value={buddyNote} onChange={(e) => setBuddyNote(e.target.value)} placeholder="e.g. First time at this meetup — would love to arrive together." />
        </Field>
        <Btn onClick={() => { const r = postBuddyRequest(ev.id, buddyNote, null); if (r.ok) { showToast('Posted on the buddy board 🤝'); setBuddyOpen(false); setBuddyNote(''); } else showToast(r.error!, 'err'); }}>
          Post to buddy board
        </Btn>
      </Modal>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report this event">
        <p className="small muted">Reports go to moderators. Your identity is never shared with the person you report.</p>
        <Field label="What’s wrong?">
          <select aria-label="Report reason" id="rep-reason" defaultValue="spam">
            <option value="spam">Spam or deceptive listing</option>
            <option value="wrong_details">Wrong details (time/venue/price)</option>
            <option value="fraud">Possible fraud</option>
            <option value="other">Something else</option>
          </select>
        </Field>
        <Field label="Details (optional)">
          <textarea value={reportDetail} onChange={(e) => setReportDetail(e.target.value)} />
        </Field>
        <Btn onClick={() => {
          const reason = (document.getElementById('rep-reason') as HTMLSelectElement).value;
          const r = submitReport('event', ev.id, reason, reportDetail);
          if (r.ok) { showToast('Report received — moderators will review it.'); setReportOpen(false); setReportDetail(''); }
        }}>Send report</Btn>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit event" wide>
        <p className="small muted">Material changes (time, title, cancellation) mark affected plans “review needed” and notify participants. Existing votes are never silently reinterpreted.</p>
        <Field label="Title"><input type="text" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
        <div className="form-grid">
          <Field label="Starts (your local time)"><input type="datetime-local" value={edit.startLocal} onChange={(e) => setEdit({ ...edit, startLocal: e.target.value })} /></Field>
          <Field label="Ends (your local time)"><input type="datetime-local" value={edit.endLocal} onChange={(e) => setEdit({ ...edit, endLocal: e.target.value })} /></Field>
        </div>
        <Field label="Summary"><textarea value={edit.summary} onChange={(e) => setEdit({ ...edit, summary: e.target.value })} /></Field>
        <Field label="Source URL"><input type="url" value={edit.sourceUrl} onChange={(e) => setEdit({ ...edit, sourceUrl: e.target.value })} /></Field>
        <div className="check-row">
          <input id="pu" type="checkbox" checked={edit.priceUnknown} onChange={(e) => setEdit({ ...edit, priceUnknown: e.target.checked })} />
          <label htmlFor="pu">Price unknown</label>
        </div>
        {!edit.priceUnknown && (
          <Field label="Price (₹)"><input type="number" min={0} value={edit.price} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} /></Field>
        )}
        <div className="row">
          <Btn onClick={saveEdit}>Save changes</Btn>
          {ev.status === 'active' && (
            <Btn variant="danger" onClick={() => { updateEvent(ev.id, { status: 'canceled' }); showToast('Event canceled — participants notified.'); setEditOpen(false); }}>Cancel event</Btn>
          )}
        </div>
      </Modal>
    </div>
  );
}
