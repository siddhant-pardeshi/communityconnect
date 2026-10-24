import { useState } from 'react';
import {
  useStore, me, submitBallot, finalizeDecision, respondPlan, setMeetupNote, conflictsForEvent,
} from '../lib/store';
import { scoreDecision, FORMULA_VERSION } from '@cc/core';
import { fmtEventTime, priceLabel, eventIcs, toLocalInput, timeAgo } from '@cc/core';
import { download } from '../lib/dom';
import { Avatar, Btn, Card, Chip, EmptyState, Field, SectionHead, showToast, Bar } from '../components/ui';
import { Link, navigate } from '../router';
import type { Attendance } from '@cc/core';

const ATT_LABEL: Record<Attendance, string> = { can: 'Can attend', maybe: 'Maybe', cannot: 'Cannot' };

export default function DecisionDetail({ decisionId }: { decisionId: string }) {
  const s = useStore();
  const user = me(s);
  const d = s.decisions[decisionId];
  const [responses, setResponses] = useState<Record<string, Attendance>>({});
  const [favorite, setFavorite] = useState<string | undefined>(undefined);
  const [ack, setAck] = useState<Set<string>>(new Set());
  const [finalizeChoice, setFinalizeChoice] = useState('');
  const [override, setOverride] = useState('');
  const [note, setNote] = useState(d?.plan?.meetupNote ?? '');

  if (!d) return <EmptyState title="Decision not found" body="It may belong to a circle you are not part of." action={<Link to="/app/circles" className="btn btn-primary">My circles</Link>} />;
  const circle = s.circles[d.circleId];
  if (!user || !circle || !circle.memberIds.includes(user.id)) {
    return <EmptyState title="Private decision" body="Decision Rooms live inside circles. Ask a member for an invite." action={<Link to="/app/circles" className="btn btn-primary">My circles</Link>} />;
  }

  const isOwner = circle.ownerId === user.id;
  const eligible = d.eligibleVoters.includes(user.id);
  const myBallot = d.ballots.find((b) => b.userId === user.id);
  const deadline = new Date(d.deadlineUtc).getTime();
  const isOpen = d.status === 'open' && deadline > Date.now();
  const showResults = d.status !== 'open' || d.liveResults;
  const eligibleNow = d.eligibleVoters.filter((v) => circle.memberIds.includes(v));
  const scored = scoreDecision(d, eligibleNow);
  const plan = d.plan;
  const confirmedCount = plan ? Object.values(plan.confirmations).filter((v) => v === 'confirmed').length : 0;

  // Initialize ballot editor from my existing ballot.
  const editResponses = myBallot?.responses ?? responses;
  const editFavorite = myBallot?.favorite ?? favorite;

  const setAtt = (eventId: string, a: Attendance | null) => {
    if (myBallot && isOpen) {
      // editing an existing ballot: submit overwrites
      const next = { ...myBallot.responses };
      if (a === null) delete next[eventId]; else next[eventId] = a;
      setResponses(next);
      const b = { responses: next, favorite: myBallot.favorite, acknowledgedClashes: myBallot.acknowledgedClashes ?? [] };
      const res = submitBallot(d.id, b.responses, b.favorite, b.acknowledgedClashes);
      if (!res.ok) showToast(res.error!, 'err');
      return;
    }
    setResponses((r) => {
      const next = { ...r };
      if (a === null) delete next[eventId]; else next[eventId] = a;
      return next;
    });
  };

  const submit = () => {
    const clashUnacked = d.candidateIds.some((cid) => conflictsForEvent(s, cid).length > 0 && !ack.has(cid) && ['can', 'maybe'].includes(editResponses[cid] ?? ''));
    if (clashUnacked) { showToast('Acknowledge the clash warning (or change your answer) before submitting.', 'err'); return; }
    const res = submitBallot(d.id, editResponses, editFavorite, [...ack]);
    if (res.ok) showToast('Ballot saved — edit freely until the deadline.');
    else showToast(res.error ?? 'Could not submit', 'err');
  };

  const doFinalize = () => {
    const res = finalizeDecision(d.id, finalizeChoice || undefined, override);
    if (res.ok) showToast('Plan created — awaiting confirmations.');
    else showToast(res.error ?? 'Could not finalize', 'err');
  };

  return (
    <div className="stack">
      <div>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="small muted" style={{ margin: 0 }}><Link to={`/app/circles/${circle.id}`}>⭕ {circle.name}</Link></p>
            <h1 style={{ fontSize: 'clamp(24px,3.2vw,32px)' }}>{d.title}</h1>
            {d.prompt && <p className="muted" style={{ maxWidth: '64ch' }}>{d.prompt}</p>}
            <div className="row">
              <span className={`status-pill st-${d.status}`}>{d.status}</span>
              <Chip tone={isOpen ? 'accent' : 'outline'}>
                {isOpen ? `⏳ closes ${new Date(d.deadlineUtc).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : `closed ${timeAgo(deadline)}`}
              </Chip>
              <Chip tone="outline">{d.ballots.length}/{d.eligibleVoters.length} responded</Chip>
              {d.liveResults && d.status === 'open' && <Chip tone="caution">live results on</Chip>}
            </div>
          </div>
          {isOwner && d.status === 'open' && (
            <p className="small muted" style={{ maxWidth: 220 }}>
              Voting closes automatically at the deadline. Finalize after it closes.
            </p>
          )}
        </div>
      </div>

      {/* ── ballot ── */}
      {isOpen && eligible && (
        <Card style={{ borderColor: 'var(--accent)' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Your ballot</h3>
            <p className="small muted" style={{ margin: 0 }}>Availability is <strong>not</strong> a commitment. Blank = no response, never “cannot”.</p>
          </div>
          <div className="stack" style={{ marginTop: 12 }}>
            {d.candidateIds.map((cid) => {
              const e = s.events[cid];
              if (!e) return null;
              const clashes = conflictsForEvent(s, cid);
              const att = editResponses[cid];
              return (
                <div key={cid} className="candidate" style={editFavorite === cid ? { borderColor: 'var(--accent)' } : undefined}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <strong>{e.title}</strong>
                      <p className="small muted" style={{ margin: '2px 0 0' }}>
                        {fmtEventTime(e.startUtc, e.endUtc, e.tz)} · {priceLabel(e)} · {e.mode === 'online' ? 'Online' : e.venue ?? e.city}
                      </p>
                    </div>
                    {['can', 'maybe'].includes(att ?? '') && (
                      <Btn size="sm" variant={editFavorite === cid ? 'primary' : 'outline'} onClick={() => {
                        const fav = editFavorite === cid ? undefined : cid;
                        setFavorite(fav);
                        if (myBallot && isOpen) submitBallot(d.id, myBallot.responses, fav, myBallot.acknowledgedClashes ?? []);
                      }}>
                        {editFavorite === cid ? '★ Your favorite' : '☆ Favorite'}
                      </Btn>
                    )}
                  </div>
                  <div className="att-btns" role="group" aria-label={`Attendance for ${e.title}`}>
                    {(['can', 'maybe', 'cannot'] as Attendance[]).map((a) => (
                      <button key={a} type="button" className={att === a ? `on-${a}` : ''} aria-pressed={att === a}
                        onClick={() => setAtt(cid, att === a ? null : a)}>
                        {ATT_LABEL[a]}
                      </button>
                    ))}
                  </div>
                  {clashes.length > 0 && ['can', 'maybe'].includes(att ?? '') && (
                    <div className="banner banner-caution" style={{ margin: 0 }}>
                      ⚔️ Starts within another commitment: <strong>{clashes[0].title}</strong>.
                      <label className="check-row" style={{ marginTop: 6 }}>
                        <input type="checkbox" checked={ack.has(cid)} onChange={(e2) => {
                          const n = new Set(ack);
                          if (e2.target.checked) n.add(cid); else n.delete(cid);
                          setAck(n);
                        }} />
                        <span className="small">I understand — I may arrive late / leave early.</span>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <Btn onClick={submit}>{myBallot ? 'Update ballot' : 'Submit ballot'}</Btn>
            <span className="small muted">Editable until the deadline. Only aggregated counts are ever visible to others.</span>
          </div>
        </Card>
      )}

      {/* ── results ── */}
      {showResults && (
        <>
          <SectionHead
            title="Results"
            sub={`Score = 100 × (0.65·can + 0.15·maybe + 0.20·favorite) / ${scored.eligibleCount} (roster size). Disclosed, not magic.`}
          />
          <Card>
            <div className="scorebox stack" style={{ gap: 12 }}>
              {scored.ranked.map((r) => {
                const e = s.events[r.eventId];
                const isTop = scored.top?.eventId === r.eventId;
                return (
                  <div key={r.eventId}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <strong>{isTop ? '🏆 ' : ''}{e?.title ?? r.eventId}</strong>
                      <span className="mono-num">{r.score}</span>
                    </div>
                    <Bar value={r.score} max={100} />
                    <p className="small muted" style={{ margin: '4px 0 0' }}>
                      ✅ {r.can} can · 🤔 {r.maybe} maybe · ❌ {r.cannot} cannot · ★ {r.favorite} favorite
                      {isTop && !scored.tie ? ' — recommended' : ''}{scored.tie && r.score === scored.ranked[0].score ? ' — tied' : ''}
                    </p>
                  </div>
                );
              })}
            </div>
            <hr className="divider" />
            <div className="row">
              <Chip tone={scored.quorumMet ? 'positive' : 'caution'}>
                {scored.quorumMet ? `Quorum met: ${scored.respondedCount}/${scored.eligibleCount}` : `Not enough responses: ${scored.respondedCount}/${scored.eligibleCount} (needs ${Math.ceil((d.quorumPct / 100) * d.eligibleVoters.length)})`}
              </Chip>
              <Chip tone="outline">formula {FORMULA_VERSION.split(':')[0]}</Chip>
            </div>
            {scored.warnings.map((w, i) => <p key={i} className="small muted" style={{ marginTop: 8 }}>ℹ️ {w}</p>)}
          </Card>

          {/* finalize (owner, closed) */}
          {isOwner && d.status === 'closed' && !d.plan && (
            <Card style={{ borderColor: 'var(--accent)' }}>
              <h3>Finalize the plan</h3>
              <p className="small muted">
                {scored.top && !scored.tie
                  ? `Recommended: ${s.events[scored.top.eventId]?.title}. You can choose another option, but an override needs a visible reason.`
                  : 'No clear winner — pick one, or record a labeled organizer override with a reason.'}
              </p>
              <Field label="Chosen event">
                <select value={finalizeChoice} onChange={(e) => setFinalizeChoice(e.target.value)} aria-label="Chosen event">
                  <option value="">Select…</option>
                  {d.candidateIds.map((cid) => <option key={cid} value={cid}>{s.events[cid]?.title}</option>)}
                </select>
              </Field>
              <Field label="Override reason (only needed for overrides)" hint="Shown to the circle next to the result.">
                <input type="text" value={override} onChange={(e) => setOverride(e.target.value)} placeholder="e.g. Organizers could only host Saturday — choosing e_runchai despite the tie." />
              </Field>
              <Btn onClick={doFinalize}>Finalize → create plan</Btn>
            </Card>
          )}
        </>
      )}

      {/* ── plan ── */}
      {plan && (
        <>
          <SectionHead title="The plan" />
          <Card>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>{s.events[plan.eventId]?.title}</h3>
              <span className={`status-pill st-${plan.status}`}>
                {plan.status === 'awaiting' ? 'awaiting confirmations' : plan.status === 'review_needed' ? 'review needed' : plan.status}
              </span>
            </div>
            <p className="small muted" style={{ margin: '6px 0 12px' }}>
              {s.events[plan.eventId] && fmtEventTime(s.events[plan.eventId].startUtc, s.events[plan.eventId].endUtc, s.events[plan.eventId].tz)}
            </p>
            {d.result?.overrideReason && <div className="banner banner-info">Organizer override: {d.result.overrideReason}</div>}
            {d.result?.warnings.slice(0, 1).map((w, i) => <p key={i} className="small muted">ℹ️ {w}</p>)}

            {eligible && ['awaiting', 'review_needed'].includes(plan.status) && (
              <div className="row" style={{ margin: '10px 0' }}>
                <Btn onClick={() => { respondPlan(d.id, 'confirmed'); showToast('Confirmed — see you there 👋'); }}>✅ I can attend</Btn>
                <Btn variant="outline" onClick={() => { respondPlan(d.id, 'declined'); showToast('Noted — thanks for telling the circle.'); }}>Can’t make it</Btn>
              </div>
            )}
            {eligible && plan.status === 'review_needed' && (
              <div className="banner banner-caution">Event details changed after the plan was made. Please re-confirm.</div>
            )}

            <p className="small"><strong>Confirmations:</strong> {confirmedCount} of {eligibleNow.length} eligible · “Confirmed group plan” requires 2+ independent confirmations.</p>
            <div className="row" style={{ margin: '8px 0' }}>
              {d.eligibleVoters.map((v) => {
                const u = s.users[v];
                const state = plan.confirmations[v];
                return u ? (
                  <span key={v} className="row" style={{ gap: 6 }}>
                    <Avatar name={u.name} hue={u.avatarHue} size={26} />
                    <span className="small">{u.name.split(' ')[0]}{state ? (state === 'confirmed' ? ' ✅' : ' ➖') : ' ⏳'}</span>
                  </span>
                ) : null;
              })}
            </div>
            <hr className="divider" />
            <Field label="Meetup note" hint="Where/how the group finds each other. Never share private addresses here.">
              <div className="row">
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Main entrance, 09:50, look for the sage tote bag" style={{ flex: 1, minWidth: 220 }} />
                <Btn size="sm" variant="outline" onClick={() => { setMeetupNote(d.id, note); showToast('Meetup note shared with the plan.'); }}>Save note</Btn>
              </div>
            </Field>
            <div className="row">
              {s.events[plan.eventId]?.sourceUrl && (
                <a className="btn btn-primary" href={s.events[plan.eventId].sourceUrl} target="_blank" rel="noreferrer">Register on organizer’s site ↗</a>
              )}
              <Btn variant="ghost" onClick={() => { const e = s.events[plan.eventId]; if (e) { download(`${e.title.replace(/[^a-z0-9]+/gi, '-')}.ics`, eventIcs(e, window.location.href), 'text/calendar'); showToast('Calendar file downloaded.'); } }}>📅 .ics</Btn>
              <Link to={`/app/events/${plan.eventId}`} className="btn btn-ghost">Event details</Link>
            </div>
            <p className="small muted" style={{ marginTop: 10 }}>
              A CommunityConnect plan is not a ticket. Confirming here never registers you externally — always
              complete registration on the organizer’s site if required.
            </p>
          </Card>
        </>
      )}

      {d.status === 'closed' && !d.plan && !isOwner && (
        <Card><p className="muted">Voting has closed. {isOwner ? '' : `The circle owner (${s.users[circle.ownerId]?.name ?? 'owner'}) will finalize the plan.`}</p></Card>
      )}

      {d.status === 'canceled' && <div className="banner banner-danger">This decision was canceled.</div>}
    </div>
  );
}
